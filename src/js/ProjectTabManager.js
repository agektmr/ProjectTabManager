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

  var projectsRootId = null,
      getFolder = function(root, title, callback) {
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
      },
      getCurrentTabs = function(callback) {
        chrome.windows.getCurrent({}, function(win) {
          chrome.tabs.query({windowId:win.id}, callback);
        });
      },
      createBookmark = function(projectId, tab, callback) {
        if (tab.url.match(/^chrome(|-devtools):\/\//i)) return null;
        if (tab.url.match(/^chrome-extension:\/\//i)) {
          if (tab.url.match(RegExp(chrome.i18n.getMessage('@@extension_id')+'\/lazy\.html'))) {
            var query = tab.url.replace(/.*\?(.*)$/, '$1');
            var params = {};
            var _params = query.split('&');
            _params.forEach(function(param) {
              var comb = param.split('=');
              if (comb.length == 2)
                params[comb[0]] = decodeURIComponent(comb[1]);
            });
            if (params.url) tab.url = params.url;
          }
        }
        callback = callback || function() { return null; };
        chrome.bookmarks.create({
          parentId: projectId,
          title: tab.title,
          url: tab.url
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
      var that = this;
      getFolder(localStorage.rootParentId, localStorage.rootName, function(root) {
        that.projects = root.children;
        if (typeof(callback) == 'function') callback(that.projects);
      });
    },
    getProjects: function() {
      return this.projects;
    },
    getProject: function(projectId, callback) {
      for (var i = 0; i < this.projects.length; i++) {
        if (projectId == this.projects[i].id) {
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
    addProject: function(name, callback) {
      getCurrentTabs(function(tabs) {
        chrome.bookmarks.create({
          parentId: projectsRootId,
          title: name || 'Untitled'
        }, function(newProject) {
          for (var i = 0; i < tabs.length; i++) {
            createBookmark(newProject.id, tabs[i]);
          }
          callback(newProject);
          cache.renew();
        });
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
    removeProject: function(projectId, callback) {
      getFolder(projectsRootId, ARCHIVE_FOLDER, function(archive) {
        if (archive) {
          chrome.bookmarks.move(projectId, {parentId: archive.id}, function(newProject) {
            callback(newProject);
            cache.renew();
          });
        }
      });
    }
  };
})();