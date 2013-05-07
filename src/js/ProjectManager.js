var ProjectManager = (function() {
  var config_ = null;

  /**
   * [normalizeBookmarks description]
   * @param  {Array} src [description]
   * @param  {Array} dst [description]
   * @return {[type]}     [description]
   */
  var normalizeBookmarks = function(src, dst) {
    if (dst === undefined) dst = [];
    for (var i = 0; i < src.length; i++) {
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
  var FieldEntity = function(tab, bookmark) {
    var url         = util.unlazify(tab && tab.url || bookmark.url),
        favIconUrl  = util.getFavIconUrl(tab && tab.favIconUrl, url);

    this.id         = bookmark && bookmark.id || undefined;
    this.tabId      = tab && tab.id || undefined;
    this.index      = tab && tab.index || undefined; // TODO: what if index==0
    this.title      = tab && tab.title || bookmark.title;
    this.url        = url;
    this.pinned     = tab && tab.pinned || false;
    this.favIconUrl = favIconUrl;
  };

  /**
   * [ProjectEntity description]
   * @param {SessionEntity}                     session [description]
   * @param {chrome.bookmarks.BookmarkTreeNode} folder  [description]
   */
  var ProjectEntity = function(session, bookmark, callback) {
    this.id           = bookmark && bookmark.id || '0';
    this.winId        = session && session.winId || null; // only set if window is open
    this.fields       = [];
    this.session      = session;
    this.bookmark     = bookmark;
    this.title        = bookmark && bookmark.title || chrome.i18n.getMessage('new_project');

    // Set project id on session only when both session and bookmaks are available
    if (this.session && this.bookmark) {
      this.session.setId(this.bookmark.id);
    }
    this.load(session && session.tabs || [], bookmark && bookmark.children || [], callback);
  };
  ProjectEntity.prototype = {
    /**
     * [open description]
     * @return {[type]}            [description]
     */
    open: function() {
      // If there's no fields, just return
      if (this.fields.length === 0) return;

      // If there's window already open, switch
      if (this.winId) {
        chrome.windows.update(this.winId, {focused:true});

      // If there's a session to re-open
      } else if (this.session) {
        if (config_.debug) console.log('[ProjectEntity] Opening a project from previous session', this.session);
        this.session.openTabs((function(win) {
          this.winId = win.id;
        }).bind(this));

      // If this is a new session
      } else if (this.bookmark) {
        if (config_.debug) console.log('[ProjectEntity] Opening a project from bookmarks', this.bookmark);

        var bookmarks = normalizeBookmarks(this.bookmark.children, []);

        // open first tab with window
        chrome.windows.create({
          url: bookmarks[0].url,
          focused: true
        }, (function(win) {
          sessionManager.createSession(win);

          // In case this is only 1 tab session
          if (bookmarks.length === 1) this.associateWindow(win.id);

          // open bookmarks in window
          bookmarks.forEach((function(bookmark, i) {
            if (!bookmark || i === 0) return; // skip if undefined or first bookmark (since it's already opened)
            if (bookmark.url === undefined) return; // skip if a folder
            var url = config_.lazyLoad ? bookmark.url : util.lazify(bookmark.url, bookmark.title);
            chrome.tabs.create({
              windowId: win.id,
              url:      url,
              active:   false
            }, (function(tab) {
              if (i === bookmarks.length-1) {
                this.associateWindow(win.id);
              }
            }).bind(this));
          }).bind(this));
        }).bind(this));
      }
    },

    /**
     * Removes bookmark and session entity from managers
     */
    remove: function(callback) {
      // If this is not a temporary project
      if (this.bookmark) {
      }
      if (typeof callback === 'function') callback();
    },

    /**
     * [load description]
     * @param  {Array}            tabs      Array of chrome.tabs.Tab
     * @param  {Array}            bookmarks Array of chrome.bookmarks.BookmarkTreeNode
     * @return {[type]}             [description]
     */
    load: function(tabs, bookmarks) {
      this.fields = [];
      var copy = normalizeBookmarks(bookmarks, []),
          j;

      // Loop through tabs
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
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
    },

    /**
     * Adds bookmark of given tab id
     * @param {Integer}         tabId
     * @param {requestCallback} callback
     */
    addBookmark: function(tabId, callback) {
      var url = '', title = '';
      for (var i = 0; i < this.fields.length; i++) {
        if (this.fields[i].tabId === tabId) {
          title = this.fields[i].title;
          url   = this.fields[i].url;
        }
      }
      if (url === '') {
        throw "Unsync session. Adding bookmark failed because relevant tab counld't be found";
      }
      bookmarkManager.addBookmark(this.id, title, url, callback);
    },

    /**
     * Opens this bookmark folder's edit window
     */
    openBookmarkEditWindow: function() {
      bookmarkManager.openEditWindow(this.id);
    },

    /**
     * Removes bookmark of given bookmark id
     * @param {Integer}         bookmarkId
     * @param {requestCallback} callback
     */
    removeBookmark: function(bookmarkId, callback) {
      bookmarkManager.removeBookmark(bookmarkId, callback);
    },

    /**
     * Associates a project with an window entity. Use when:
     * - opening a new project window
     * @param  {Integer} winId
     */
    // associateSession: function(session) {
    associateWindow: function(winId) {
      this.winId = winId;
      this.session = sessionManager.getSessionFromWinId(winId);
      this.session.setId(this.id);
      this.load(this.session.tabs, this.bookmark.children);
    },

    /**
     * Associates a project with bookmark entity. Use when:
     * - creating new project from session
     * @param  {[type]} folder [description]
     * @return {[type]}        [description]
     */
    associateBookmark: function(folder) {
      this.id = folder.id; // Overwrite project id
      this.bookmark = folder;
      this.session.setId(this.id); // Overwrite project id
      this.load(this.session.tabs, this.bookmark.children);
    },

    /**
     * [diassociateWindow description]
     * @return {[type]} [description]
     */
    // diassociateSession: function() {
    diassociateWindow: function() {
      this.winId = null;
      if (this.session) {
        this.session.unsetWinId();
        var tabs = this.session && this.session.tabs || undefined;
        var bookmarks = this.bookmark && this.bookmark.children || undefined;
        this.load(tabs, bookmarks);
      }
    }
  };

  /**
   * [ProjectManager description]
   * @param {[type]} config [description]
   */
  var ProjectManager = function(config) {
    config_ = config;
    this.projects = {};

    chrome.windows.onRemoved.addListener((function(windowId) {
      if (windowId === chrome.windows.WINDOW_ID_NONE) return;
      if (config_.debug) console.log('[ProjectManager] chrome.windows.onRemoved', windowId);
      var project = this.getProjectFromWinId(windowId);
      if (project) {
        project.diassociateWindow();
        if (config_.debug) console.log('[ProjectManager] unsetting window id from session', project);
      }
    }).bind(this));
  };
  ProjectManager.prototype = {
    /**
     * [saveNewProject description]
     * @param  {[type]} title [description]
     * @return {[type]}       [description]
     */
    createProject: function(title, callback) {
      var project = this.getProjectFromId('0');

      // If project is not found or session not attached
      if (!project || !project.session) {
        throw '[ProjectManager] Session not found when creating new project';
      }
      var session = project.session;

      // Create the project folder
      bookmarkManager.addFolder(title, (function(folder) {
        var count = 0;

        // Loop through session tabs to create bookmark
        for (var i = 0; i < session.tabs.length; i++) {
          var tab = session.tabs[i];

          // Just count up if this is a tab to ignore
          if (tab.url.match(util.CHROME_EXCEPTION_URL)) {
            count++;
            continue;
          }

          // Create bookmark
          bookmarkManager.addBookmark(folder.id, tab.title, util.unlazify(tab.url), (function() {

            // When all bookmarks are processed
            if (++count === session.tabs.length) {

              // update folder object to get bookmarks (otherwise not updated)
              folder = bookmarkManager.getFolder(folder.id);

              // Create new project
              var new_project = new ProjectEntity(session, folder);
              if (config_.debug) console.log('[ProjectManager] created new project', new_project);

              // Delete temporary project and replace with new one
              this.removeProject('0');
              this.projects[folder.id] = new_project;
              if (typeof callback === 'function') callback(new_project);
            }
          }).bind(this));
        }
      }).bind(this));
    },

    /**
     * Opens a window with a bookmarks of given project id
     * @param  {String} id
     */
    openProject: function(id) {
      this.projects[id].open();
    },

    /**
     * Gets Project of given project id
     * @param  {String} id
     * @return {ProjectEntity|undefined}
     */
    getProjectFromId: function(id) {
      return this.projects[id];
    },

    /**
     * Gets project of given window id
     * @param  {Integer} winId
     * @return {ProjectEntity|undefined}
     */
    getProjectFromWinId: function(winId) {
      for (var id in this.projects) {
        if (winId === this.projects[id].winId) {
          return this.projects[id];
        }
      }
      return undefined;
    },

    /**
     * Removes a project from bookmark
     * @param  {String}           id [description]
     * @param  {requestCallback}  callback  [description]
     */
    removeProject: function(id, callback) {
      var project = this.getProjectFromId(id);
      if (project.bookmark) {
        bookmarkManager.archiveFolder(project.id, (function() {
          delete this.projects[id];
          if (typeof callback === 'function') callback();
        }).bind(this));
      }

      // This is edge case but if there will be sessions with this project id, it will remain permanently.
      // So delete them all here
      while (true) {
        var session = sessionManager.getSessionFromProjectId(id);
        if (!session) break;
        session.unsetId();
      }
    },

    /**
     * [getActiveProject description]
     * @return {[type]} [description]
     */
    getActiveProject: function() {
      var winId = sessionManager.getCurrentWindowId();
      return this.getProjectFromWinId(winId);
    },

    /**
     * [getCurrentWindowId description]
     * @return {[type]} [description]
     */
    getActiveWindowId: function() {
      return sessionManager.getCurrentWindowId();
    },

    /**
     * [update description]
     * @return {[type]} [description]
     */
    update: function(force_reload, callback) {
      if (config_.debug) console.log('[ProjectManager] getting project list');
      var activeSession = sessionManager.getActiveSession();

      if (activeSession !== undefined) {
        if (activeSession.id === null) {
          if (config_.debug) console.log('[ProjectManager] creating empty project', activeSession);
          this.projects['0'] = new ProjectEntity(activeSession, undefined);
        } else if (this.projects['0']) {
          delete this.projects['0'];
        }
      }

      if (force_reload) {
        if (config_.debug) console.log('[ProjectManager] starting to generate project list');
        bookmarkManager.getRoot(true, (function(bookmarks) {
          // Loop through all sessions
          for (var i = 0; i < bookmarks.length; i++) {
            var found = false,
                bookmark = bookmarks[i];

            // Skip Archives folder
            if (bookmark.title === config_.archiveFolderName) continue;

            var session = sessionManager.getSessionFromProjectId(bookmark.id);
            this.projects[bookmark.id] = new ProjectEntity(session, bookmark);
            if (config_.debug) console.log('[ProjectManager] Project %s: %o created from session: %o and project: %o', bookmark.id, this.projects[bookmark.id], session, bookmark);
          }
          if (typeof callback === 'function') callback(this.projects);
        }).bind(this));
      } else {
        if (typeof callback === 'function') callback(this.projects);
      }
    },

    /**
     * [openBookmarkEditWindow description]
     * @param  {String} bookmarkId
     */
    openBookmarkEditWindow: function(bookmarkId) {
      bookmarkManager.openEditWindow(bookmarkId);
    },

    /**
     * [getTimeTable description]
     * @param  {[type]}   date     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getTimeTable: function(date, callback) {
      sessionManager.getTimeTable(date, (function(table) {
        table.forEach((function(session) {
          if (session.id) {
            var project = this.getProjectFromId(session.id);
            if (project) {
              session.title = project.title;
            }
          }
        }).bind(this));
        callback(table);
      }).bind(this));
    },

    /**
     * [getSummary description]
     * @param  {[type]}   start    [description]
     * @param  {[type]}   end      [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getSummary: function(start, end, callback) {
      sessionManager.getSummary(start, end, (function(summary) {
        for (var id in summary) {
          var title = 'Unknown';
          var project = this.getProjectFromId(id);
          if (project) {
            title = project.title;
          }
          summary[id].title = title;
        }
        callback(summary);
      }).bind(this));
    }
  };
  return ProjectManager;
})();
