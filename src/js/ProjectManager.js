/*
Copyright 2015 Eiji Kitamura

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

const ProjectManager = (function() {
  'use strict';

  var config_ = null;

  /**
   * [normalizeBookmarks description]
   * @param  {Array} src [description]
   * @param  {Array} dst [description]
   * @return {[type]}     [description]
   */
  const normalizeBookmarks = function(src, dst) {
    src = src || [];
    dst = dst || [];
    for (let s of src) {
      if (s.url) {
        dst.push(s);
      } else if (s.children.length > 0) {
        // by recursively calling this function, append bookmarks to dst
        normalizeBookmarks(s.children, dst);
      }
    }
    return dst;
  };

  /**
   * [FieldEntity description]
   * @param {TabEntity}                         tab      [description]
   * @param {chrome.bookmarks.BookmarkTreeNode} bookmark [description]
   */
  class FieldEntity {
    constructor(tab, bookmark) {
      let url         = util.unlazify(tab && tab.url || bookmark.url);

      this.id         = bookmark && bookmark.id || undefined;
      this.tabId      = tab && tab.id || undefined;
      // this.index      = tab && tab.index || undefined; // TODO: what if index==0
      this.title      = tab && tab.title || bookmark && bookmark.title || '';
      this.url        = url;
      this.pinned     = tab && tab.pinned || false;
      this.favIconUrl = tab && tab.favIconUrl;
    }
  }

  /**
   * [ProjectEntity description]
   * @param {SessionEntity}                     session [description]
   * @param {chrome.bookmarks.BookmarkTreeNode} folder  [description]
   */
  class ProjectEntity {
    constructor(session, bookmark) {
      this.id           = (bookmark && bookmark.id) || (session && session.id) || '0';
      this.fields       = [];
      this.session      = session;
      this.bookmark     = bookmark;
      this.title        = (bookmark && bookmark.title) || (session && session.title) || chrome.i18n.getMessage('new_project');

      // Set project id on session only when both session and bookmaks are available
      if (this.session && this.bookmark) {
        this.session.setId(this.bookmark.id);
      }
      this.load(session && session.tabs || [], bookmark && bookmark.children || []);
    }

    /**
     * [open description]
     * @return {[type]}            [description]
     */
    open() {
      sessionManager.openingProject = this.id;
      this.setBadgeText();

      // If there's no fields, open an empty window
      if (this.fields.length === 0) {
        chrome.windows.create({
          focused: true
        });

      // If there's a session
      } else if (this.session) {

        if (this.session.winId) {
          // And it is already open
          chrome.windows.update(this.session.winId, {focused:true});
        } else {
          // If the session is not open yet
          this.session.openTabs();
        }

      // If there's no session, open from bookmark
      } else if (this.bookmark) {
        if (config_.debug) console.log('[ProjectEntity] Opening bookmarks', this.bookmark);

        let bookmarks = normalizeBookmarks(this.bookmark.children, []);

        // open first tab with window
        chrome.windows.create({
          url: bookmarks[0].url,
          focused: true
        }, win => {
          // open bookmarks in window
          bookmarks.forEach((bookmark, i) => {
            if (!bookmark || i === 0) return; // skip if undefined or first bookmark (since it's already open)
            if (bookmark.url === undefined) return; // skip if a folder
            let url = config_.lazyLoad ? bookmark.url : util.lazify(bookmark.url, bookmark.title);
            chrome.tabs.create({
              windowId: win.id,
              url:      url,
              active:   false
            });
          });
        });
      }
    }

    /**
     * Closes the project window
     * @return Promise returns promise object
     */
    close() {
      if (this.session.winId) {
        return chrome.windows.remove(this.session.winId);
      }
    }

    /**
     * Rename project
     */
    rename(name) {
      return new Promise(resolve => {
        name = name + '';
        if (name.length === 0) resolve();
        this.title = name + '';
        if (!this.bookmark) {
          bookmarkManager.addFolder(name).then(folder => {
            this.id       = folder.id;
            this.bookmark = folder;
            if (this.session) {
              this.session.setId(folder.id);
            }
            this.setBadgeText();
            resolve(folder);
          });
        } else {
          bookmarkManager.renameFolder(this.id, name)
          .then(folder => {
            this.setBadgeText();
            resolve(folder);
          });
        }
      });
    }

    /**
     * [load description]
     * @param  {Array}            tabs      Array of chrome.tabs.Tab
     * @param  {Array}            bookmarks Array of chrome.bookmarks.BookmarkTreeNode
     * @return {[type]}             [description]
     */
    load(tabs, bookmarks) {
      tabs = tabs || [];
      bookmarks = bookmarks || [];
      this.fields = [];
      let copy = normalizeBookmarks(bookmarks, []), j;

      // Loop through tabs
      for (let tab of tabs) {
        let bookmark = null;

        if (tab.url.match(util.CHROME_EXCEPTION_URL)) continue;

        // Loop through bookmarks to find matched one
        for (j = 0; j < copy.length; j++) {
          if (util.resembleUrls(tab.url, copy[j].url)) {
            bookmark = copy.splice(j--, 1)[0];
            break;
          }
        }
        this.fields.push(new FieldEntity(tab, bookmark));
      }

      for (let c of copy) {
        this.fields.push(new FieldEntity(undefined, c));
      }
    }

    /**
     * Adds bookmark of given tab id
     * @param {Integer}         tabId
     */
    addBookmark(tabId) {
      let mergeBookmark = bookmark => {
        return new Promise(resolve => {
          this.bookmark = bookmarkManager.getFolder(bookmark.parentId);
          this.load(this.session.tabs, this.bookmark.children);
          resolve(bookmark);
        });
      };

      let url = '', title = '';
      for (let field of this.fields) {
        if (field.tabId === tabId) {
          title = field.title;
          url   = field.url;
          break;
        }
      }
      if (url === '') {
        throw 'Unsync session. Adding bookmark failed because relevant tab counld\'t be found';
      }
      if (!this.bookmark) {
        bookmarkManager.addFolder(this.title).then(folder => {
          this.id       = folder.id;
          this.bookmark = folder;
          if (this.session) {
            this.session.setId(folder.id);
          }
          return bookmarkManager.addBookmark(this.id, title, url).then(mergeBookmark);
        });
      } else {
        return bookmarkManager.addBookmark(this.id, title, url).then(mergeBookmark);
      }
    }

    /**
     * Opens this bookmark folder's edit window
     */
    openBookmarkEditWindow() {
      bookmarkManager.openEditWindow(this.id);
    }

    /**
     * Removes bookmark of given bookmark id
     * @param {Integer}         bookmarkId
     */
    removeBookmark(bookmarkId) {
      return bookmarkManager.removeBookmark(bookmarkId);
    }

    /**
     * Associates a project with bookmark entity. Use when:
     * - creating new project from session
     * @param  {[type]} folder [description]
     * @return {[type]}        [description]
     */
    associateBookmark(folder) {
      this.id = folder.id; // Overwrite project id
      if (config_.debug) console.log('[ProjectEntity] associated bookmark', folder);
      this.bookmark = folder;
      this.session.setId(this.id); // Overwrite project id
      this.load(this.session.tabs, this.bookmark.children);
    }

    /**
     * Remove association of a project with bookmark entity. Use when:
     * - unlinking bookmark with a session
     * - abondoning a session from linked project
     */
    deassociateBookmark() {
      this.id = '-'+this.session.id;
      if (config_.debug) console.log('[ProjectEntity] deassociated bookmark', this.bookmark);
      this.bookmark = null;
      this.title = this.session.title;
      this.session.setId(this.id);
      this.load(this.session.tabs, undefined);
    }

    /**
     * Sets badge text
     * @param {String} winId Window Id
     */
    setBadgeText() {
      let text = this.title.substr(0, 4).trim() || '';
      if (config_.debug) console.log(`[ProjectEntiry] Badge set to "${text}"`, this);
      chrome.browserAction.setBadgeText({text: text});
    }
  }

  /**
   * [ProjectManager description]
   * @param {[type]} config [description]
   */
  class ProjectManager {
    constructor(config) {
      config_ = config;
      this.projects = [];

      chrome.windows.onFocusChanged.addListener(winId => {
        let project = this.getProjectFromWinId(winId);
        if (project) {
          project.setBadgeText();
        } else {
          chrome.browserAction.setBadgeText({text: ''});
        }
      });
    }

    /**
     * [saveNewProject description]
     * @param  {[type]} id    project id
     * @param  {[type]} title optional title
     * @return {[type]}       [description]
     */
    createProject(id, title) {
      return new Promise(resolve => {
        let project = this.getProjectFromId(id);

        if (!project || !project.session) {
          throw '[ProjectManager] Session not found when creating new project';
        }
        let session = project.session;
        title = title || session.title;

        bookmarkManager.addFolder(title).then(folder => {
          for (let tab of session.tabs) {
            let title = tab.title;
            let url   = tab.url;
            bookmarkManager.addBookmark(folder.id, title, url);
          }
          // Create new project
          let new_project = new ProjectEntity(session, folder);
          // Remove non-bound session project
          this.removeProject(id);
          // Add the new project to list
          this.projects.unshift(new_project);

          if (config_.debug) console.log('[ProjectManager] created new project', new_project);
          resolve(new_project);
        });
      });
    }

    /**
     * Gets Project of given project id
     * @param  {String} id
     * @return {ProjectEntity|undefined}
     */
    getProjectFromId(id) {
      for (let project of this.projects) {
        if (project.id === id) {
          return project;
        }
      }
      return undefined;
    }

    /**
     * Gets project of given window id
     * @param  {Integer} winId
     * @return {ProjectEntity|undefined}
     */
    getProjectFromWinId(winId) {
      for (let project of this.projects) {
        if (project.session && project.session.winId === winId) {
          return project;
        }
      }
      return undefined;
    }

    /**
     * Renames project of given project id
     * @param  {String} project id
     * @return void
     */
    renameProject(id, title) {
      return new Promise(resolve => {
        let project = this.getProjectFromId(id);
        if (project) {
          project.rename(title).then(resolve);
        } else {
          throw `Project ${id} not found`;
        }
      });
    }

    /**
     * Removes a project from bookmark
     * @param  {String}           id        [description]
     * @param  {requestCallback}  callback  [description]
     */
    removeProject(id) {
      for (let i = 0; i < this.projects.length; i++) {
        if (this.projects[i].id === id) {
          // Remove project from list first
          let project = this.projects.splice(i, 1)[0];
          // Then remove bookmark if exists (otherwise non-bound session)
          if (project.bookmark) {
            return bookmarkManager.archiveFolder(id)
            .then(() => {
              // Session might be non bound. Don't return promise directly.
              sessionManager.removeSessionFromProjectId(id);
              return Promise.resolve();
            }).then(() => {
              if (config_.debug) console.log('[ProjectManager] removed project %s from bookmark', id);
              return project;
            }).catch(() => {
              if (config_.debug) console.log('[ProjectManager] failed to remove project %s from bookmark', id);
              return project;
            });
          } else {
            // non-bound session should be removed from session list as well
            return sessionManager.removeSessionFromProjectId(id);
          }
        }
      }
    }

    /**
     * Removes session part of the project
     * @param  {String}           id       [description]
     * @param  {requestCallback}  callback [description]
     */
    removeSession(id) {
      let project = this.getProjectFromId(id);
      if (project.bookmark) {
        project.deassociateBookmark();
      }
      let sessionId = project.session.id;
      return sessionManager.removeSessionFromId(sessionId);
    }

    /**
     * [getActiveProject description]
     * @return {[type]} [description]
     */
    getActiveProject() {
      let winId = sessionManager.getCurrentWindowId();
      if (winId) {
        let project = this.getProjectFromWinId(winId);
        if (config_.debug) console.log('[SessionManager] Got active project', project);
        return project;
      }
      return undefined;
    }

    /**
     * [getCurrentWindowId description]
     * @return {[type]} [description]
     */
    getActiveWindowId(callback) {
      callback(sessionManager.getCurrentWindowId());
    }

    /**
     * [update description]
     * @return {[type]} [description]
     */
    update(force_reload, callback) {
      if (config_.debug) console.log('[ProjectManager] Starting to generate project list');
      this.projects = [];
      let session, project, i, j,
        sessions = sessionManager.getSessions().slice(0);

      bookmarkManager.getRoot(force_reload).then(bookmarks => {
        let boundId = [];

        // Append non-bound sessions first
        for (let session of sessions) {
          if (session.id && session.id.indexOf('-') === -1) {
            // This is bound session
            let found = false;
            // Look for bound bookmark
            for (let bookmark of bookmarks) {
              if (bookmark.id === session.id) {
                project = new ProjectEntity(session, bookmark);
                this.projects.push(project);
                boundId.push(bookmark.id);
                if (config_.debug) console.log('[ProjectManager] Project %s: %o created from session: %o and bookmark: %o', project.id, project, session, bookmark);
                found = true;
                break;
              }
            }
            if (found) {
              continue;
            }
          }

          // If session is not bound or matching bookmark was not found
          project = new ProjectEntity(session, null);
          this.projects.push(project);
          if (config_.debug) console.log('[ProjectManager] Project %s: %o created non-bound session: %o', project.id, project, session);
        }

        // Add rest of bookmarks
        for (let bookmark of bookmarks) {
          if (boundId.includes(bookmark.id)) continue;
          if (bookmark.title === config_.archiveFolderName) continue;
          project = new ProjectEntity(null, bookmark);
          this.projects.push(project);
          if (config_.debug) console.log('[ProjectManager] Project %s: %o created non-bound bookmark: %o', project.id, project, bookmark);
        }

        if (typeof callback === 'function') callback(this);
      });
    }

    /**
     * [openBookmarkEditWindow description]
     * @param  {String} bookmarkId
     */
    openBookmarkEditWindow(bookmarkId) {
      bookmarkManager.openEditWindow(bookmarkId);
    }

    /**
     * Sets badge text
     * @param {String} winId Window Id
     */
    setBadgeText(winId) {
      let project = this.getProjectFromWinId(winId);
      let text = '';
      if (project) {
        text = project.title.substr(0, 4).trim() || '';
      }
      if (config_.debug) console.log(`[ProjectManager] Badge set to "${project.title}"`, project);
      chrome.browserAction.setBadgeText({text: text});
    }

    /**
     * [getTimeTable description]
     * @param  {[type]}   date     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getTimeTable(date, callback) {
      sessionManager.getTimeTable(date, table => {
        table.forEach(session => {
          if (session.id) {
            let project = this.getProjectFromId(session.id);
            let _session = sessionManager.getSessionFromProjectId(session.id);
            session.title = project && project.title || _session && _session.title;
          } else {
            session.title = 'Unknown';
          }
        });
        callback(table);
      });
    }

    /**
     * [getSummary description]
     * @param  {[type]}   start    [description]
     * @param  {[type]}   end      [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getSummary(start, end, callback) {
      sessionManager.getSummary(start, end, summary => {
        for (let id in summary) {
          let title = 'Unknown';
          let project = this.getProjectFromId(id);
          if (project) {
            title = project.title;
          }
          summary[id].title = title;
        }
        callback(summary);
      });
    }
  }

  return ProjectManager;
})();
