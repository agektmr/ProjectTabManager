var ProjectManager = (function() {
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
    var url         = util.unlazify(tab && tab.url || bookmark.url);

    this.id         = bookmark && bookmark.id || undefined;
    this.tabId      = tab && tab.id || undefined;
    // this.index      = tab && tab.index || undefined; // TODO: what if index==0
    this.title      = tab && tab.title || bookmark.title;
    this.url        = url;
    this.pinned     = tab && tab.pinned || false;
    util.getFavicon(url, tab && tab.favIconUrl).then((function(entry) {
      this.favIconUrl = entry.blobUrl;
    }).bind(this));
  };

  /**
   * [ProjectEntity description]
   * @param {SessionEntity}                     session [description]
   * @param {chrome.bookmarks.BookmarkTreeNode} folder  [description]
   */
  var ProjectEntity = function(session, bookmark, callback) {
    this.id           = (bookmark && bookmark.id) || (session && session.id) || '0';
    this.fields       = [];
    this.session      = session;
    this.bookmark     = bookmark;
    this.title        = (bookmark && bookmark.title) || (session && session.title) || chrome.i18n.getMessage('new_project');

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

        var bookmarks = normalizeBookmarks(this.bookmark.children, []);

        // open first tab with window
        chrome.windows.create({
          url: bookmarks[0].url,
          focused: true
        }, (function(win) {
          // open bookmarks in window
          bookmarks.forEach((function(bookmark, i) {
            if (!bookmark || i === 0) return; // skip if undefined or first bookmark (since it's already open)
            if (bookmark.url === undefined) return; // skip if a folder
            var url = config_.lazyLoad ? bookmark.url : util.lazify(bookmark.url, bookmark.title);
            chrome.tabs.create({
              windowId: win.id,
              url:      url,
              active:   false
            });
          }).bind(this));
        }).bind(this));
      }
    },

    /**
     * Rename project
     */
    rename: function(name, callback) {
      name = name+'';
      if (name.length === 0) callback();
      this.title = name+'';
      if (this.session) {
        this.session.title = name;
      }
      if (!this.bookmark) {
        bookmarkManager.addFolder(name, (function(folder) {
          this.id       = folder.id;
          this.bookmark = folder;
          if (this.session) {
            this.session.setId(folder.id);
          }
          callback();
        }).bind(this));
      } else {
        bookmarkManager.renameFolder(this.id, name, callback);
      }
    },

    /**
     * Removes bookmark and session entity from managers
     */
    remove: function(callback) {
      // If this is not a temporary project
      if (this.bookmark) {
        // TODO?
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
      tabs = tabs || [];
      bookmarks = bookmarks || [];
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
      if (!this.bookmark) {
        bookmarkManager.addFolder(this.title, (function(folder) {
          this.id       = folder.id;
          this.bookmark = folder;
          if (this.session) {
            this.session.setId(folder.id);
          }
          bookmarkManager.addBookmark(this.id, title, url, callback);
        }).bind(this));
      } else {
        bookmarkManager.addBookmark(this.id, title, url, callback);
      }
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
    }
  };

  /**
   * [ProjectManager description]
   * @param {[type]} config [description]
   */
  var ProjectManager = function(config) {
    config_ = config;
    this.projects = [];
  };
  ProjectManager.prototype = {
    /**
     * [saveNewProject description]
     * @param  {[type]} id    project id
     * @param  {[type]} title optional title
     * @return {[type]}       [description]
     */
    createProject: function(id, title, callback) {
      var project = this.getProjectFromId(id);

      if (!project || !project.session) {
        throw '[ProjectManager] Session not found when creating new project';
      }
      var session = project.session;
      title = title || session.title;

      bookmarkManager.addFolder(title, (function(folder) {
        // Create new project
        var new_project = new ProjectEntity(session, folder);
        // Remove non-bound session project
        this.removeProject(id);
        // Add the new project to list
        this.projects.unshift(new_project);

        if (config_.debug) console.log('[ProjectManager] created new project', new_project);
        if (typeof callback === 'function') callback(new_project);
      }).bind(this));
    },

    /**
     * Gets Project of given project id
     * @param  {String} id
     * @return {ProjectEntity|undefined}
     */
    getProjectFromId: function(id) {
      for (var i = 0; i < this.projects.length; i++) {
        if (this.projects[i].id === id) {
          return this.projects[i];
        }
      }
      return undefined;
    },

    /**
     * Gets project of given window id
     * @param  {Integer} winId
     * @return {ProjectEntity|undefined}
     */
    getProjectFromWinId: function(winId) {
      var session = null;
      for (var i = 0; i < this.projects.length; i++) {
        session = this.projects[i].session;
        if (session && session.winId === winId) {
          return this.projects[i];
        }
      }
      return undefined;
    },

    /**
     * Renames project of given project id
     * @param  {String} project id
     * @return void
     */
    renameProject: function(id, title, callback) {
      var project = this.getProjectFromId(id);
      if (project) {
        project.rename(title, callback);
      } else {
        throw 'Project '+id+' not found';
      }
    },

    /**
     * Removes a project from bookmark
     * @param  {String}           id [description]
     * @param  {requestCallback}  callback  [description]
     */
    removeProject: function(id, callback) {
      for (var i = 0; i < this.projects.length; i++) {
        if (this.projects[i].id === id) {
          // Remove project from list first
          var project = this.projects.splice(i, 1)[0];
          // Then remove bookmark if exists (otherwise non-bound session)
          if (project.bookmark) {
            bookmarkManager.archiveFolder(id, (function() {
              if (typeof callback === 'function') callback(project);
            }).bind(this));
            if (config_.debug) console.log('[ProjectManager] removed project %s from bookmark', id);
          }
          // non-bound session should be removed from session list as well
          sessionManager.removeSessionFromProjectId(id);
        }
      }
    },

    /**
     * [getActiveProject description]
     * @return {[type]} [description]
     */
    getActiveProject: function() {
      var winId = sessionManager.getCurrentWindowId();
      if (winId) {
        var project = this.getProjectFromWinId(winId);
        if (config_.debug) console.log('[SessionManager] Got active project', project);
        return project;
      }
      return undefined;
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
      if (config_.debug) console.log('[ProjectManager] Starting to generate project list');
      this.projects = [];
      var session, project, i, j,
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
      bookmarkManager.getRoot(force_reload, (function(bookmarks) {
        // Loop through all sessions
        for (i = 0; i < bookmarks.length; i++) {
          var found = false,
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
          var project = new ProjectEntity(session, bookmark);
          this.projects.push(project);
          if (config_.debug) console.log('[ProjectManager] Project %s: %o created from session: %o and bookmark: %o', project.id, project, session, bookmark);
        }

        if (typeof callback === 'function') callback(this.projects);
      }).bind(this));
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
            var _session = sessionManager.getSessionFromProjectId(session.id);
            session.title = project && project.title || _session && _session.title;
          } else {
            session.title = 'Unknown';
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
