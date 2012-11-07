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

var TabManager = (function() {
  var TabEntity = function(tab) {
    var url = util.unlazify(tab.url);
    var domain = url.replace(/^.*?\/\/(.*?)\/.*$/, "$1");
    this.id =         tab.id;
    this.index =      tab.index;
    this.title =      tab.title;
    this.url =        url;
    this.pinned =     tab.pinned || false;
    this.favIconUrl = tab.favIconUrl || 'http://www.google.com/s2/favicons?domain='+encodeURIComponent(domain);
  };

  var ProjectManager = function(win_id_or_project) {
    this.winId = null;
    this.tabs = {}; // tabId as key
    if (typeof win_id_or_project == 'object') {
      for (var id in win_id_or_project.tabs) {
        this.updateTab(win_id_or_project.tabs[id]);
      }
    } else {
      this.winId = win_id_or_project;
      chrome.tabs.getAllInWindow(parseInt(win_id_or_project), (function(tabs) {
        for (var id in tabs) {
          this.updateTab(tabs[id]);
        }
      }).bind(this));
    }
  };
  ProjectManager.prototype = {
    updateTab: function(tab) {
      if (this.tabs[tab.id]) {
        if (config.debug) console.log('removed tab', tab.id);
        delete this.tabs[tab.id];
      } else {
        for (var id in this.tabs) {
          if (this.tabs[id].url === util.unlazify(tab.url)) {
            if (config.debug) console.log('removed tab', id);
            delete this.tabs[id];
            break;
          }
        }
      }
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        if (config.debug) console.log('added tab', tab.id);
        this.tabs[tab.id] = new TabEntity(tab);
      }
    },
    removeTab: function(tabId) {
      if (this.tabs[tabId]) {
        delete this.tabs[tabId];
        return true;
      }
      return false;
    },
    openWindow: function(callback) {
      var tabs = [];
      for (var tabId in this.tabs) {
        /* if index is duplicating, just add another tab */
        var index = this.tabs[tabId].index;
        if (!tabs[index]) {
          tabs[index] = this.tabs[tabId];
        } else {
          tabs.push(this.tabs[tabId]);
        }
      }
      /* remove undefined index from array */
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i] === undefined) {
          tabs.splice(i, 1);
          i--;
        }
      }
      if (tabs.length === 0) return false;
      chrome.windows.create({
        url: tabs[0].url,
        focused: true
      }, (function(win) {
        callback(win.id);
        // open bookmarks in window
        for (var i = 1; i < tabs.length; i++) {
          var url = localStorage.lazyLoad == 'true' ? tabs[i].url : util.lazify(tabs[i]);
          chrome.tabs.create({
            windowId: win.id,
            index:    tabs[i].index,
            url:      url,
            pinned:   tabs[i].pinned,
            active:   false
          });
        }
      }).bind(this));
      return true;
    }
  };

  /***
   *  @param {Object} projects ProjectManager objects with projectId as a key. This object will be stored in chrome.storage.sync and synced under profile. Next time you open Chrome, assigned projects will be restored to each windows by guessing tab similarities.
   ***/
  var TabManager = function() {
    this.projects = {};
    chrome.storage.local.get((function(items) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        var projects = items['projects'] || {}; 
        for (var id in projects) {
          this.projects[id] = new ProjectManager(projects[id]);
        }
        if (config.debug) console.log('projects restored.', items['projects']);
      }
    }).bind(this));
    this.projectIds = {};

    var add = function(tab) {
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        var projectId = this.projectIds[tab.windowId];
        if (this.projects[projectId]) {
          if (config.debug) console.log('adding tab', tab);
          this.projects[projectId].updateTab(tab);
        }
      }
    };
    var remove = function(tabId, removeInfo) {
      if (removeInfo && removeInfo.isWindowClosing) {
        if (config.debug) console.log('not going to removeTab since this is closing window', tabId);
        return;
      }
      if (config.debug) console.log('removing tab', tabId, removeInfo);
      for (var projectId in this.projects) {
        if (this.projects[projectId].removeTab(tabId)) {
          if (config.debug) console.log('removed', tabId, 'from project', projectId);
          break;
        }
      }
      UpdateManager.sync();
    };
    var update = function(tabId, changeInfo, tab) {
      if (tab.status === 'complete') {
        var projectId = this.projectIds[tab.windowId];
        if (projectId) {
          if (config.debug) console.log('updating tab', tabId, changeInfo, tab);
          if (!this.projects[projectId]) {
            this.projects[projectId] = new ProjectManager(tab.windowId)
          } else {
            this.projects[projectId].updateTab(tab);
          }
        } else {
          add.call(this, tab);
        }
        UpdateManager.removeComplete(tabId);
      } else {
        UpdateManager.addLoading(tabId);
      }
    };
    chrome.tabs.onCreated.addListener(add.bind(this));
    chrome.tabs.onUpdated.addListener(update.bind(this));
    chrome.tabs.onRemoved.addListener(remove.bind(this));
    chrome.tabs.onAttached.addListener((function(tabId, attachInfo) {
      chrome.tabs.get(tabId, add.bind(this));
    }).bind(this));
    chrome.tabs.onDetached.addListener((function(tabId, detachInfo) {
      // TODO: this won't work
      chrome.tabs.get(tabId, remove.bind(this));
    }).bind(this));
    chrome.windows.onRemoved.addListener((function(windowId) {
      delete this.projectIds[windowId];
    }).bind(this));
  };
  TabManager.prototype = {
    getProject: function(projectId) {
      return this.projects[projectId] || {};
    },
    setProject: function(winId, project) {
      this.projectIds[winId] = project.id;
      if (this.projects[project.id]) {
        delete this.projects[project.id];
      }
      this.projects[project.id] = new ProjectManager(winId);
      UpdateManager.sync();
    },
    resetProject: function(winId) {
      delete this.projectIds[winId];
      UpdateManager.sync();
    },
    openProject: function(projectId) {
      for (var winId in this.projectIds) {
        if (this.projectIds[winId] == projectId) {
          chrome.windows.update(parseInt(winId), {focused:true});
          return true;
        }
      }
      if (this.projects[projectId]) {
        return this.projects[projectId].openWindow((function(winId) {
          this.projectIds[winId] = projectId;
        }).bind(this));
      }
      return false;
    },
    removeProject: function(projectId) {
      delete this.projects[projectId];
      UpdateManager.sync();
    },
    getCurrentProjectId: function(winId) {
      return this.projectIds[winId] || '0';
    },
    restorePreviousSession: function() {
      var projects = this.projects;
      chrome.windows.getAll({populate: true}, (function(windows) {
        Array.prototype.forEach.call(windows, (function(win) {
          for (var projectId in projects) {
            var similar = 0,
                count = 0;
            for (var i = 0; i < win.tabs.length; i++) {
              if (win.tabs[i].url.match(util.CHROME_EXCEPTION_URL)) continue;
              count++;
              for (var id in projects[projectId].tabs) {
                /* Check if tab url is similar TODO: doesn't have to be precise */
                if (projects[projectId].tabs[id].url === util.unlazify(win.tabs[i].url)) {
                  similar++;
                }
              }
            }
            if (config.debug) console.log(similar, 'similar tabs found on win.id:', win.id, 'and projectId:', projectId);
            if (similar !== 0 && (similar >= 3 || count === similar)) {
              if (config.debug) console.log('Project generated for', projectId);
              this.projects[projectId] = new ProjectManager(win.id);
              this.projectIds[win.id] = projectId;
              break;
            }
          }
        }).bind(this));
      }).bind(this));
    },
    export: function() {
      return {
        projects: this.projects
      };
    }
  };
  return new TabManager();
})();