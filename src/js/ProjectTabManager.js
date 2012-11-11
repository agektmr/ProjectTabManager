/*
Copyright 2012 Eiji Kitamura

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eiji Kitamura (agektmr@gmail.com)
*/
'use strict';

var ProjectTabManager = (function() {
  var PASSIVE_FOLDER = config.hiddenFolderName,
      ARCHIVE_FOLDER = config.archiveFolderName,
      activeTab = null;
  localStorage.rootParentId = localStorage.rootParentId || config.defaultRootParentId;
  localStorage.rootName = localStorage.rootName || config.defaultRootName;
  localStorage.lazyLoad = localStorage.lazyLoad || '';

  chrome.tabs.onActivated.addListener(function(activeInfo) {
    activeTab = activeInfo.tabId || null;
  });

  var projectsRootId = null;
  var getFolder = function(root, title, callback) {
    chrome.bookmarks.getSubTree(root, function(projects) {
      var done = false;
      projects[0].children.forEach(function(project) {
        if (title === project.title && done === false) {
          callback(project);
          done = true;
        }
      });
      if (done) return;
      chrome.bookmarks.create({
        parentId: String(root),
        title:    title
      }, callback);
    });
  };
  var getCurrentTabs = function(callback) {
    chrome.windows.getCurrent({}, function(win) {
      chrome.tabs.query({windowId:win.id}, callback);
    });
  };
   var createBookmark = function(projectId, tab, callback) {
    if (tab.url.match(/^chrome(|-devtools):\/\//i)) return null;
    callback = callback || function() { return null; };
    chrome.bookmarks.create({
      parentId: projectId,
      title: tab.title,
      url: util.unlazify(tab.url)
    }, callback);
  };

  getFolder(localStorage.rootParentId, localStorage.rootName, function(root) {
    projectsRootId = root.id;
  });

  var Cache = function() {
    this.projects = [];
    this.renew();
  };
  Cache.prototype = {
    renew: function(callback) {
      getFolder(localStorage.rootParentId, localStorage.rootName, (function(root) {
        this.projects = root.children;
        chrome.contextMenus.removeAll();
        var parent = chrome.contextMenus.create({title: 'Projects'});
        for (var i = 0; i < this.projects.length; i++) {
          if (this.projects[i].title !== config.archiveFolderName) {
            chrome.contextMenus.create({
              title: this.projects[i].title,
              parentId: parent,
              onclick: (function(projectId) {
                return function() {
                  ProjectTabManager.openProject(projectId);
                }
              })(this.projects[i].id)
            });
          }
          var projectId = this.projects[i].id;
          if (config.debug) console.log('merging sessions into bookmarks', projectId, TabManager.getProject(projectId));
        }
        if (typeof(callback) == 'function') callback(this.projects);
      }).bind(this));
    },
    getProjects: function() {
      for (var i = 0; i < this.projects.length; i++) {
        var projectId = this.projects[i].id;
        if (TabManager.projects[projectId]) {
          this.projects[i].tabs = TabManager.getProject(projectId).tabs;
        }
      }
      return this.projects;
    },
    getProject: function(projectId, callback) {
      for (var i = 0; i < this.projects.length; i++) {
        if (projectId == this.projects[i].id) {
          this.projects[i].tabs = TabManager.getProject(projectId).tabs;
          callback(this.projects[i]);
          return;
        }
      }
    },
    getBookmarks: function(projectId, callback) {
      this.getProject(projectId, function(project) {
        callback(project ? project.children : []);
      });
    }
  };

  var cache = new Cache();

  return {
    getRoot: function(callback) {
      getFolder(localStorage.rootParentId, localStorage.rootName, callback);
    },
    getCurrentTab: function() {
      return activeTab;
    },
    addBookmark: function(projectId, tab, callback) {
      createBookmark(projectId, tab, function(newBookmark) {
        callback(newBookmark);
        cache.renew();
      });
    },
    getBookmarks: cache.getBookmarks.bind(cache),
    moveToHiddenFolder: function(projectId, bookmarkId, callback) {
      getFolder(projectId, PASSIVE_FOLDER, function(hidden) {
        if (hidden) {
          chrome.bookmarks.move(bookmarkId, {parentId: hidden.id}, callback);
          cache.renew();
        }
      });
    },
    moveFromHiddenFolder: function(projectId, bookmarkId, callback) {
      chrome.bookmarks.move(bookmarkId, {parentId: projectId}, function(newBookmark) {
        callback(newBookmark);
        cache.renew();
      });
    },
    removeBookmark: function(bookmarkId, callback) {
      chrome.bookmarks.remove(bookmarkId, function() {
        callback();
        cache.renew();
      });
    },
    addProject: function(name, tabs, callback) {
      chrome.bookmarks.create({
        parentId: projectsRootId,
        index: 0,
        title: name || 'Untitled'
      }, function(newProject) {
        for (var i = 0; i < tabs.length; i++) {
          createBookmark(newProject.id, tabs[i]);
        }
        callback(newProject);
        cache.renew();
      });
    },
    getProject: cache.getProject.bind(cache),
    getProjectList: function(callback) {
      var projects = cache.getProjects();
      if (projects.length > 0) {
        callback(projects);
      } else {
        cache.renew(callback);
      }
    },
    openProject: function(projectId) {
      /* Try to open existing session window */
      if (TabManager.openProject(projectId)) {
        return;
      }
      /* Otherwise, create a new window with project tabs */
      ProjectTabManager.getBookmarks(projectId, function(bookmarks) {
        // avoid folder for first bookmark
        for (var s = 0; s < bookmarks.length; s++) {
          if (bookmarks[s].url) break;
        }
        if (s == bookmarks.length) return;
        // open first bookmark
        chrome.windows.create({
          url:bookmarks[s].url || null,
          focused:true
        }, function(win) {
          // register window to window manager
          ProjectTabManager.getProject(projectId, function(project) {
            TabManager.setProject(win.id, project);
            windowHistory[win.id] = {};
            windowHistory[win.id].title = project.title;
          });
          // open bookmarks in window
          for (var i = s+1; i < bookmarks.length; i++) {
            // avoid folder
            if (bookmarks[i].children) continue;
            var url = localStorage.lazyLoad == 'true' ? bookmarks[i].url : util.lazify(bookmarks[i]);
            chrome.tabs.create({
              windowId:win.id,
              url:url,
              active:false
            });
          }
        });
      });
    },
    removeProject: function(projectId, callback) {
      getFolder(projectsRootId, ARCHIVE_FOLDER, function(archive) {
        if (archive) {
          chrome.bookmarks.move(projectId, {parentId: archive.id}, function(newProject) {
            TabManager.removeProject(projectId);
            callback(newProject);
            cache.renew();
          });
        }
      });
    }
  };
})();