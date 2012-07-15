/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eiji Kitamura (agektmr@chromium.org)
*/
'use strict';

var ProjectTabManager = (function() {
  var PASSIVE_FOLDER = config.hiddenFolderName,
      ARCHIVE_FOLDER = config.archiveFolderName,
      activeTab = null;
  localStorage.rootParentId = localStorage.rootParentId || '2';
  localStorage.rootName = localStorage.rootName || 'Project Tab Manager';

  chrome.tabs.onActivated.addListener(function(activeInfo) {
    activeTab = activeInfo.tabId || null;
  });

  var projectsRootId = null,
      getFolder = function(root, title, callback) {
        chrome.bookmarks.getSubTree(root, function(projects) {
          var done = false;
          projects[0].children.forEach(function(project) {
            if (title === project.title && done == false) {
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
        chrome.windows.getCurrent(function(win) {
          chrome.tabs.query({windowId:win.id}, callback);
        });
      },
      createBookmark = function(projectId, tab, callback) {
        if (tab.url.match(/^chrome:\/\//i)) return null;
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
        };
        callback = callback || function() {return null};
        chrome.bookmarks.create({
          parentId: projectId,
          title: tab.title,
          url: tab.url
        }, callback);
      };

  getFolder(localStorage.rootParentId, localStorage.rootName, function(root) {
    projectsRootId = root.id;
  });

  return {
    getRoot: function(callback) {
      getFolder(localStorage.rootParentId, localStorage.rootName, callback);
    },
    getCurrentTab: function() {
      return activeTab;
    },
    addBookmark: function(projectId, tab, callback) {
      createBookmark(projectId, tab, callback);
    },
    getBookmarks: function(projectId, callback) {
      getFolder(localStorage.rootParentId, localStorage.rootName, function(projects) {
        if (!projects.children) callback([]);
        for (var i = 0; i < projects.children.length; i++) {
          if (projects.children[i].id === projectId) {
            callback(projects.children[i].children);
            return;
          }
        };
      });
    },
    moveToHiddenFolder: function(projectId, bookmarkId, callback) {
      getFolder(projectId, PASSIVE_FOLDER, function(hidden) {
        if (hidden) {
          chrome.bookmarks.move(bookmarkId, {parentId: hidden.id}, callback);
        }
      });
    },
    moveFromHiddenFolder: function(projectId, bookmarkId, callback) {
      chrome.bookmarks.move(bookmarkId, {parentId: projectId}, callback);
    },
    removeBookmark: function(bookmarkId, callback) {
      chrome.bookmarks.remove(bookmarkId, callback);
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
        });
      });
    },
    getProject: function(projectId, callback) {
      getFolder(localStorage.rootParentId, localStorage.rootName, function(root) {
        for (var i = 0; i < root.children.length; i++) {
          if (projectId == root.children[i].id) {
            callback(root.children[i]);
            return;
          }
        }
      });
    },
    getProjectList: function(callback) {
      getFolder(localStorage.rootParentId, localStorage.rootName, function(root) {
        callback(root.children);
      });
    },
    removeProject: function(projectId, callback) {
      getFolder(projectsRootId, ARCHIVE_FOLDER, function(archive) {
        if (archive) {
          chrome.bookmarks.move(projectId, {parentId: archive.id}, callback);
        }
      });
    }
  };
})();