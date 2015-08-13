var ProjectManager = (function() {
  'use strict'

  var config_ = null;

  /**
   * [normalizeBookmarks description]
   * @param  {Array} src [description]
   * @param  {Array} dst [description]
   * @return {[type]}     [description]
   */
  var normalizeBookmarks = function(src, dst) {
    src = src || [];
    dst = dst || [];
    for (let i = 0; i < src.length; i++) {
      if (src[i].url) {
        dst.push(src[i]);
      } else if (src[i].children.length > 0) {
        // by recursively calling this function, append bookmarks to dst
        normalizeBookmarks(src[i].children, dst);
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
      this.title      = tab && tab.title || bookmark.title;
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
     * Rename project
     */
    rename(name) {
      return new Promise((resolve, reject) => {
        name = name+'';
        if (name.length === 0) resolve();
        this.title = name+'';
        if (!this.bookmark) {
          bookmarkManager.addFolder(name).then(folder => {
            this.id       = folder.id;
            this.bookmark = folder;
            if (this.session) {
              this.session.setId(folder.id);
            }
            resolve();
          });
        } else {
          bookmarkManager.renameFolder(this.id, name).then(resolve);
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
      let copy = normalizeBookmarks(bookmarks, []),
          j;

      // Loop through tabs
      for (let i = 0; i < tabs.length; i++) {
        let tab = tabs[i],
            bookmark = null;

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
      for (j = 0; j < copy.length; j++) {
        this.fields.push(new FieldEntity(undefined, copy[j]));
      }
    }

    /**
     * Adds bookmark of given tab id
     * @param {Integer}         tabId
     */
    addBookmark(tabId) {
      let mergeBookmark = bookmark => {
        return new Promise((resolve, reject) => {
          this.bookmark = bookmarkManager.getFolder(bookmark.parentId);
          this.load(this.session.tabs, this.bookmark.children);
          resolve(bookmark);
        });
      };

      let url = '', title = '';
      for (let i = 0; i < this.fields.length; i++) {
        if (this.fields[i].tabId === tabId) {
          title = this.fields[i].title;
          url   = this.fields[i].url;
          break;
        }
      }
      if (url === '') {
        throw "Unsync session. Adding bookmark failed because relevant tab counld't be found";
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
  };

  /**
   * [ProjectManager description]
   * @param {[type]} config [description]
   */
  class ProjectManager {
    constructor(config) {
      config_ = config;
      this.projects = [];
    }

    /**
     * [saveNewProject description]
     * @param  {[type]} id    project id
     * @param  {[type]} title optional title
     * @return {[type]}       [description]
     */
    createProject(id, title) {
      return new Promise((resolve, reject) => {
        let project = this.getProjectFromId(id);

        if (!project || !project.session) {
          throw '[ProjectManager] Session not found when creating new project';
        }
        let session = project.session;
        title = title || session.title;

        bookmarkManager.addFolder(title).then(folder => {
          for (let i = 0; i < session.tabs.length; i++) {
            let title = session.tabs[i].title;
            let url   = session.tabs[i].url;
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
      for (let i = 0; i < this.projects.length; i++) {
        if (this.projects[i].id === id) {
          return this.projects[i];
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
      let session = null;
      for (let i = 0; i < this.projects.length; i++) {
        session = this.projects[i].session;
        if (session && session.winId === winId) {
          return this.projects[i];
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
      return new Promise((resolve, reject) => {
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
      return new Promise((resolve, reject) => {
        for (let i = 0; i < this.projects.length; i++) {
          if (this.projects[i].id === id) {
            // Remove project from list first
            let project = this.projects.splice(i, 1)[0];
            // Then remove bookmark if exists (otherwise non-bound session)
            if (project.bookmark) {
              bookmarkManager.archiveFolder(id).then(() => resolve(project));
              if (config_.debug) console.log('[ProjectManager] removed project %s from bookmark', id);
            } else {
              // non-bound session should be removed from session list as well
              sessionManager.removeSessionFromProjectId(id);
              resolve();
            }
          }
        }
      });
    }

    /**
     * Removes session part of the project
     * @param  {String}           id       [description]
     * @param  {requestCallback}  callback [description]
     */
    removeSession(id) {
      return new Promise((resolve, reject) => {
        for (let i = 0; i < this.projects.length; i++) {
          if (this.projects[i].id === id) {
            this.projects[i].deassociateBookmark();
            this.removeProject(this.projects[i].id).then(resolve);
            break;
          }
        }
      });
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
    getActiveWindowId() {
      return sessionManager.getCurrentWindowId();
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

      // Append non-bound sessions first
      for (i = 0; i < sessions.length; i++) {
        // Leave bound sessions
        if (sessions[i].id && sessions[i].id.indexOf('-') === -1) continue;
        session = sessions.splice(i--, 1)[0];
        project = new ProjectEntity(session, null);
        this.projects.push(project);
        if (config_.debug) console.log('[ProjectManager] Project %s: %o created non-bound session: %o', project.id, project, session);
      }
      bookmarkManager.getRoot(force_reload).then(bookmarks => {
        // Loop through all sessions
        for (i = 0; i < bookmarks.length; i++) {
          let found = false,
              bookmark = bookmarks[i];

          // Skip Archives folder
          if (bookmark.title === config_.archiveFolderName) continue;

          session = undefined;
          for (j = 0; j < sessions.length; j++) {
            if (sessions[j].id === bookmark.id) {
              session = sessions.splice(j, 1)[0];
              break;
            }
          }
          let project = new ProjectEntity(session, bookmark);
          this.projects.push(project);
          if (config_.debug) console.log('[ProjectManager] Project %s: %o created from session: %o and bookmark: %o', project.id, project, session, bookmark);
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
  };

  return ProjectManager;
})();
