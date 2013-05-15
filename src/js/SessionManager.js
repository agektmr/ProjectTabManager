var SessionManager = (function() {
  var config_ = null,
      db      = null;

  /**
   * [getWindowInfo description]
   * @param  {[type]}   winId    [description]
   * @param  {Function} callback [description]
   */
  var getWindowInfo = function(winId, callback) {
    if (winId === chrome.windows.WINDOW_ID_NONE) {
      callback(undefined);
    } else {
      chrome.windows.get(winId, {populate:true}, function(win) {
        if (chrome.runtime.lastError) {
          if (config_.debug) console.error('[SessionManager] window id of %d could not be obtained.'+
                                           '(Please ignore. This is unavoidable)', winId);
          callback(undefined);
          return;
        }
        if (win.type !== "normal") {
          callback(undefined);
        } else {
          callback(win);
        }
      });
    }
  }

  /**
   * Synchronize session status on chrome.storage
   */
  var UpdateManager = {
    queue: [],

    /**
     * [initialize description]
     * @return {[type]} [description]
     */
    restoreSessions: function(callback) {
      // restore projects from chrome.storage.local
      chrome.storage.local.get((function(items) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          throw '[UpdateManager] chrome.storage.local.get error'
        } else {
          var sessions = items['sessions'] || items['projects'] || []; // 'projects' is a transitional solution
          if (config_.debug) console.log('[UpdateManager] restoring sessions from storage.', sessions);
          callback(sessions);
        }
      }).bind(this));
    },

    /**
     * Synchronize project status to chrome.storage. Restores when on initialization.
     */
    storeSessions: function() {
      chrome.storage.local.set(sessionManager.export(), function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          if (config.debug) console.log('[UpdateManager] sessions stored.', sessionManager.sessions);
        }
      });
    },

    /**
     * Add sync status to queue so that synchronization only happens when all status is clear.
     * @param {chrome.tabs.Tab} tab
     */
    tabLoading: function(tab) {
      for (var i = 0; i < UpdateManager.queue.length; i++) {
        if (UpdateManager.queue[i].id === tab.id) {
          UpdateManager.queue[i] = tab;
          if (config.debug) console.log('[UpdateManager] tab %o loading. %d in total', tab, UpdateManager.queue.length);
          return;
        }
      }
      UpdateManager.queue.push(tab);
      if (config.debug) console.log('[UpdateManager] added tab %o. %d in total.', tab, UpdateManager.queue.length);
    },

    /**
     * Removes completed sync status and kick start synchronization when all queue's gone.
     * @param {chrome.tabs.Tab} tab
     */
    tabComplete: function(tab) {
      for (var i = 0; i < UpdateManager.queue.length; i++) {
        if (UpdateManager.queue[i].id === tab.id) {
          UpdateManager.queue.splice(i, 1);
          break;
        }
      }
      if (UpdateManager.queue.length === 0) {
        if (config.debug) console.log('[UpdateManager] Queue cleared. Storing session.');
        UpdateManager.storeSessions();
      } else {
        if (config.debug) console.log('[UpdateManager] tab %o sync completed. %o remaining', tab, UpdateManager.queue);
      }
    },
  };

  /**
   *  Tab entity which represents chrome.tabs.Tab
   *  @param {chrome.tabs.Tab} tab
   **/
  var TabEntity = function(tab) {
    var url =         util.unlazify(tab.url),
        domain =      url.replace(/^.*?\/\/(.*?)\/.*$/, "$1");

    this.id =         tab.id;
    this.index =      tab.index;
    this.title =      tab.title;
    this.url =        url;
    this.pinned =     tab.pinned || false;
    this.favIconUrl = tab.favIconUrl || 'http://www.google.com/s2/favicons?domain='+encodeURIComponent(domain);
  };

  /**
   * Window entity which represents chrome.windows.Window
   * @param {chrome.windows.Window} win
   */
  var SessionEntity = function(target) {
    // if target.focused is set, this is chrome.windows.Window object
    if (target.focused !== undefined) {
      this.id     = null;
      this.winId  = target.id;

    // otherwise, this is SessionEntity object recovering from previous session
    } else {
      this.id     = target.id;
      this.winId  = null;
    }

    this.tabs   = [];
    if (target.tabs) {
      for (var i = 0; i < target.tabs.length; i++) {
        this.addTab(target.tabs[i]);
      }
    }
    if (config_.debug) console.log('[SessionEntity] Created new session entity %o', this);
  };
  SessionEntity.prototype = {
    /**
     * Adds tab entity of given chrome.tabs.Tab
     * @param {chrome.tabs.Tab} tab
     */
    addTab: function(tab) {
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        // Create new tab entity
        this.tabs.push(new TabEntity(tab));
      }
    },

    /**
     * Gets tab entity of given tab id
     * @param  {Integer} tabId
     * @return {TabEntity|undefined}
     */
    getTab: function(tabId) {
      for (var i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].id === tabId) {
          return this.tabs[i];
        }
      }
      return undefined;
    },

    /**
     *  Update TabEntity
     *  @param {chrome.tabs.Tab} tab  Tab object to update
     */
    updateTab: function(tab) {
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        // Loop through all tabs and look for tab with similar url
        for (var i = 0; i < this.tabs.length; i++) {
          if (this.tabs[i].id === tab.id) {
            var new_tab = new TabEntity(tab);
            if (config_.debug) console.log('[SessionEntity] updating tab %o to %o', this.tabs[i], new_tab);
            delete this.tabs[i];
            this.tabs[i] = new_tab;
            return;
          }
        }
        this.addTab(tab);
      }
    },

    /**
     *  Removes TabEntity
     *  @param    {Integer} tabId   id of a tab to remove
     *  @returns  {Boolean}
     **/
    removeTab: function(tabId) {
      for (var i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].id === tabId) {
          if (config_.debug) console.log('[SessionEntity] removed tab %d from session %s', this.tabs[i].id, this.id);
          // Remove TabEntity
          this.tabs.splice(i, 1);
          // TODO: what if all tabs are removed by now?
          return true;
        }
      }
      return false;
    },

    /**
     * Gets Array of tab entities
     * @return {Array}  Array of TabEntities
     */
    getTabs: function() {
      return this.tabs;
    },

    /**
     * [openSession description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    openTabs: function(callback) {
      // open first tab with window
      chrome.windows.create({
        url: this.tabs[0].url,
        focused: true
      }, (function(win) {
        this.setWinId(win.id);
        this.tabs[0].id = win.tabs[0].id;
        callback(win);

        // open bookmarks in window
        this.tabs.forEach((function(tab, i) {
          if (!tab || i === 0) return; // skip if undefined or first tab (since it's already opened)
          var url = config_.lazyLoad ? tab.url : util.lazify(tab.url, tab.title, tab.favIconUrl);
          chrome.tabs.create({
            windowId: win.id,
            index:    tab.index,
            url:      url,
            pinned:   tab.pinned,
            active:   false
          }, (function(tab) {
            this.tabs[i].id = tab.id;
          }).bind(this));
        }).bind(this));
      }).bind(this));
    },

    /**
     * Sets project id of this session
     * @param {Integer} projectId  project id
     */
    setId: function(projectId) {
      this.id = projectId;
      if (config_.debug) console.log('[SessionEntity] assigned project id of', projectId, 'to session', this);
    },

    unsetId: function() {
      if (config_.debug) console.log('[SessionEntity] removed project id of', this.id, 'from session', this);
      this.id = null;
    },

    /**
     * [setWinId description]
     * @param {[type]} winId [description]
     */
    setWinId: function(winId) {
      this.winId = winId;
      if (config_.debug) console.log('[SessionEntity] assigned window id of', this.winId, 'to session', this);
    },

    /**
     * [unsetWinId description]
     * @return {[type]} [description]
     */
    unsetWinId: function() {
      if (config_.debug) console.log('[SessionEntity] removed window id of', this.winId, 'from session', this);
      this.winId = null;
    }
  };

  /**
   * [SessionManager description]
   */
  var SessionManager = function(config, callback) {
    config_         = config;
    db              = new idb(config);
    this.sessions   = [];
    this.activeInfo = {
      id:       null,
      start:    null,
      end:      null,
      tabId:    null,
      windowId: null
    };

    // set initial window id
    chrome.windows.getCurrent({populate:true}, (function(win) {
      // if (win.type === "normal" && win.id !== chrome.windows.WINDOW_ID_NONE) {
        this.activeInfo.tabId    = null;
        this.activeInfo.windowId = win.id;
      // }
    }).bind(this));

    // chrome.tabs.onCreated.addListener(this.oncreated.bind(this));
    chrome.tabs.onUpdated.addListener(this.onupdated.bind(this));
    chrome.tabs.onRemoved.addListener(this.onremoved.bind(this));
    chrome.tabs.onMoved.addListener(this.onmoved.bind(this));
    chrome.tabs.onReplaced.addListener(this.onreplaced.bind(this));
    chrome.tabs.onAttached.addListener(this.onattached.bind(this));
    chrome.tabs.onDetached.addListener(this.ondetached.bind(this));
    chrome.tabs.onActivated.addListener(this.onactivated.bind(this));

    chrome.windows.onFocusChanged.addListener(this.onfocuschanged.bind(this));

    // Recover and set up sessions
    this.recoverSessions(callback);
  };
  SessionManager.prototype = {
    /**
     * Adds Project
     * @param {chrome.tabs.Tab} tab - adds a tab to project
     */
    oncreated: function(tab) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onCreated', tab);
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        var session = this.getSessionFromWinId(tab.windowId);
        if (session) {
          session.updateTab(tab);
        } else {
          getWindowInfo(tab.windowId, (function(win) {
            this.createSession(win);
          }).bind(this));
        }
      }
    },

    /**
     * Updates tab info
     * @param  {Integer}          tabId       first argument of chrome.tabs.onUpdated.addListener
     * @param  {Object}           changeInfo  second argument of chrome.tabs.onUpdated.addListener
     * @param  {chrome.tabs.Tab}  tab         third argument of chrome.tabs.onUpdated.addListener
     */
    onupdated: function(tabId, changeInfo, tab) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onUpdated', tabId, changeInfo, tab);
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        if (tab.status === 'complete') {
          this.oncreated.call(this, tab);
          UpdateManager.tabComplete(tab);
        } else if (tab.status === 'loading') {
          UpdateManager.tabLoading(tab);
        }
      } else {
        var session = this.getSessionFromWinId(tab.windowId);
        if (session) session.removeTab(tabId);
        if (config_.debug) console.log('[SessionManager] removing a tab which transitioned to url starting with "chrome://"');
      }
    },

    /**
     * Removes a tab from project
     * @param  {Integer} tabId        first argument of chrome.tabs.onRemoved.addListener
     * @param  {Object} removeInfo    second argument of chrome.tabs.onRemoved.addListener
     */
    onremoved: function(tabId, removeInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onRemoved', tabId, removeInfo);
      if (removeInfo.isWindowClosing) {
        if (config_.debug) console.log('[SessionManager] skip removing this tab since window is closing', tabId);
      } else {
        var session = this.getSessionFromWinId(removeInfo.windowId);
        if (session) {
          session.removeTab(tabId);
          if (config_.debug) console.log('[SessionManager] removed tab of id %d from session %o', tabId, session);
          UpdateManager.storeSessions();
        } else {
          if (config_.debug) console.log('[SessionManager] removing tab was not being tracked', tabId);
        }
      }
    },

    /**
     * [onmoved description]
     * @param  {[type]} tabId    [description]
     * @param  {[type]} moveInfo [description]
     * @return {[type]}          [description]
     */
    onmoved: function(tabId, moveInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onMoved', tabId, moveInfo);
      var session = this.getSessionFromWinId(moveInfo.windowId);
      if (session) {
        // TODO: implement
        if (config_.debug) console.log('[SessionManager] moved tab from %d to %d', moveInfo.fromIndex, moveInfo.toIndex);
      }
    },

    /**
     * [onreplaced description]
     * @param  {[type]} addedTabId   [description]
     * @param  {[type]} removedTabId [description]
     * @return {[type]}              [description]
     */
    onreplaced: function(addedTabId, removedTabId) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onReplaced', addedTabId, removedTabId);
    },

    /**
     * [onattached description]
     * @param  {[type]} tabId      [description]
     * @param  {[type]} attachInfo [description]
     * @return {[type]}            [description]
     */
    onattached: function(tabId, attachInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onAttached', tabId, attachInfo);
      getWindowInfo(attachInfo.newWindowId, (function(win) {
        if (win === undefined) return;
        var session = this.getSessionFromWinId(attachInfo.newWindowId);
        // If this tab generates new window, it should be a new session
        if (!session) {
          session = new SessionEntity(win);
          this.sessions.push(session);
        }
        chrome.tabs.get(tabId, (function(tab) {
          session.addTab(tab);
          if (config_.debug) console.log('[SessionManager] added tab %d to window', tabId, attachInfo.newWindowId);
        }).bind(this));
      }).bind(this));
    },

    /**
     * [ondetached description]
     * @param  {[type]} tabId      [description]
     * @param  {[type]} detachInfo [description]
     * @return {[type]}            [description]
     */
    ondetached: function(tabId, detachInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onDetached', tabId, detachInfo);
      var old_session = this.getSessionFromWinId(detachInfo.oldWindowId);
      if (old_session) {
        old_session.removeTab(tabId);
        if (old_session.tabs.length === 0) {
          this.removeSessionFromWinId(old_session.winId);
        }
        if (config_.debug) console.log('[SessionManager] removed tab %d from window', tabId, detachInfo.oldWindowId);
      }
    },

    /**
     * [onactivated description]
     * @param  {[type]} activeInfo [description]
     * @return {[type]}            [description]
     */
    onactivated: function(activeInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onActivated', activeInfo);
      getWindowInfo(activeInfo.windowId, (function(win) {
        if (win === undefined) return;
        this.activeInfo.tabId    = activeInfo.tabId; // not used
        this.activeInfo.windowId = activeInfo.windowId;
      }).bind(this));
    },

    /**
     * [onfocuschanged description]
     * @param  {[type]} winId [description]
     * @return {[type]}       [description]
     */
    onfocuschanged: function(winId) {
      if (config_.debug) console.log('[SessionManager] chrome.window.onFocusChanged', winId);
      // Put in database only if active session exists
      if (this.activeInfo.start !== null) {
        this.activeInfo.end = (new Date()).getTime();
        db.put(db.SUMMARIES, this.activeInfo);
      }

      getWindowInfo(winId, (function(win) {
        // Focus changed to another window
        if (win !== undefined) {
          // Creates new activeInfo
          var session = this.getSessionFromWinId(win.id);
          if (session) {
            this.activeInfo.id        = session.id;
            this.activeInfo.start     = (new Date()).getTime();
            this.activeInfo.end       = null;
            this.activeInfo.windowId  = session.winId;

            // Put in database
            db.put(db.SUMMARIES, this.activeInfo);
          }

        // Focus changed to somewhere else
        } else {
          this.activeInfo.id        = null;
          this.activeInfo.start     = null;
          this.activeInfo.end       = null;
          this.activeInfo.windowId  = winId;
        }
      }).bind(this));
    },

    /**
     * [createSession description]
     * @param  {[type]} win [description]
     * @return {[type]}     [description]
     */
    createSession: function(win) {
      var session = new SessionEntity(win);
      this.sessions.push(session);
      if (config_.debug) console.log('[SessionManager] session created', win);
      return session;
    },

    /**
     * [removeSessionFromProjectId description]
     * @param  {[type]} projectId [description]
     * @return {[type]}           [description]
     */
    removeSessionFromProjectId: function(projectId) {
      for (var i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].id === projectId) {
          this.sessions.splice(i, 1);
          if (config_.debug) console.log('[SessionManager] removed session of project id:', projectId);
          UpdateManager.storeSessions();
          return true;
        }
      }
      return false;
    },

    /**
     * Removes session of given window id
     * @param   {String}    winId
     * @return  {Boolean}
     */
    removeSessionFromWinId: function(winId) {
      for (var i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].winId === winId) {
          this.sessions.splice(i, 1);
          if (config_.debug) console.log('[SessionManager] removed session of window id:', winId);
          UpdateManager.storeSessions();
          return true;
        }
      }
      return false;
    },

    /**
     * [getSession description]
     * @param  {Integer}                  projectId   project id of the session to get
     * @return {SessionEntity|undefined}
     */
    getSessionFromProjectId: function(projectId) {
      for (var i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].id === projectId) {
          return this.sessions[i];
        }
      }
      return undefined;
    },

    /**
     * [getSessionFromWinId description]
     * @param  {[type]} winId [description]
     * @return {[type]}       [description]
     */
    getSessionFromWinId: function(winId) {
      for (var i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].winId === winId) {
          return this.sessions[i];
        }
      }
      return undefined;
    },

    /**
     * [getActiveSession description]
     * @return {[type]} [description]
     */
    getActiveSession: function() {
      var winId = this.activeInfo.windowId || null;
      if (winId) {
        var session = this.getSessionFromWinId(winId);
        if (config_.debug) console.log('[SessionManager] Got active session', session);
        return session;
      }
      return undefined;
    },

    /**
     * [getCurrentWindowId description]
     * @return {[type]} [description]
     */
    getCurrentWindowId: function() {
      return this.activeInfo.windowId || null;
    },

    /**
     * Exports sessions
     * @return {Object}
     */
    export: function() {
      return {
        sessions: this.sessions
      };
    },

    /**
     * Restore session from last one by guessing
     */
    recoverSessions: function(callback) {
      UpdateManager.restoreSessions((function(prev_sessions) {
        chrome.windows.getAll({populate: true}, (function(windows) {
          // Loop through all open windows
          Array.prototype.forEach.call(windows, (function(win) {
            if (win.type !== "normal" || win.id === chrome.windows.WINDOW_ID_NONE) return;

            var session = this.createSession(win);

            // Loop through previous sessions to look for matching one
            for (var i = 0; i < prev_sessions.length; i++) {
              var similar = 0,
                  count = 0,
                  prev_session = prev_sessions[i];

              if (config_.debug) console.log('[SessionManager] ***** restoring session', prev_session);
              if (!prev_session.id) {
                // If there's no project id assigned to a session, no way to recover.
                continue;
              }

              // Loop through all tabs
              for (var j = 0; j < win.tabs.length; j++) {

                // skip chrome:// or chrome-devtools://
                if (win.tabs[j].url.match(util.CHROME_EXCEPTION_URL)) continue;
                count++;

                // Loop through all tabs in project
                for (var k = 0; k < prev_session.tabs.length; k++) {

                  // Check if tab url is similar
                  if (util.resembleUrls(prev_session.tabs[k].url, win.tabs[j].url)) {
                    similar++;
                  }
                }
              }
              if (config_.debug) console.log('[SessionManager] %d/%d similar tabs found on win.id: %d and project.id: %s', similar, count, win.id, prev_session.id);

              // similarity threshold is hardcoded as 3
              if (similar !== 0 && similar/count > 0.8) {
                // set project id to this session
                session.setId(prev_session.id);
                if (config_.debug) console.log('[SessionManager] created session based on previous session', session);
                prev_sessions.splice(i--, 1);
                break;
              }
            }
          }).bind(this));

          // Loop through previous sessions to create unopened sessions
          for (i = 0; i < prev_sessions.length; i++) {
            if (!prev_sessions[i].id) continue;
            this.createSession(prev_sessions[i]);
          }
          if (config_.debug) console.log('[SessionManager] re-assigned sessions to windows.', sessionManager.sessions);
          if (typeof callback === 'function') callback();
        }).bind(this));
      }).bind(this));
    },

    /**
     * [getSummary description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getTimeTable: function(date, callback) {
      var start     = util.getLocalMidnightTime(date);
      var next_day  = start + (60 * 60 * 24 * 1000);
      var end       = (new Date(next_day)).getTime();
      db.getRange(db.SUMMARIES, start, end, (function(table) {
        table.forEach(function(session, i) {
          // If end time not known
          if (session.end === null) {
            // If next session exists
            if (table[i+1]) {
              // Assign start time of next session as end time
              session.end = (new Date(table[i+1].start)).getTime();
              if (config_.debug) console.log('[SessionManager] Assigning session end time as start time of next one', session);
            // If next session doesn't exist, this is the last session
            } else {
              // Simply assign latest possible
              session.end = end > Date.now() ? Date.now() : end;
              if (config_.debug) console.log('[SessionManager] Assigning session end time as latest possible', session);
            }
          }
          table[i] = session;
        });
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
      var start     = (new Date(start)).getTime();
      var next_day  = (new Date(end)).getTime() + (60 * 60 * 24 * 1000);
      var end       = (new Date(next_day)).getTime();
      db.getRange(db.SUMMARIES, start, end, function(summary) {
        var _summary = {};
        summary.forEach(function(session, i) {
          var id = session.id;
          if (!_summary[id]) {
            _summary[id] = {
              duration: 0
            };
          }
          // If end time not known
          if (session.end === null) {
            // If next session exists
            if (summary[i+1]) {
              // Assign start time of next session as end time
              session.end = (new Date(summary[i+1].start)).getTime();
              if (config_.debug) console.log('[SessionManager] Assigning session end time as start time of next one', session);
            // If next session doesn't exist, this is the last session
            } else {
              // Simply remove that last session
              if (config_.debug) console.log('[SessionManager] Removing session since end time is not known', session);
              summary.splice(i, 1);
              return;
            }
          }
          _summary[id].duration += ~~((session.end - session.start) / 1000);
        });
        callback(_summary);
      });
    },

    deleteOldSummary: function() {
      var boundDateOffset = config_.summaryRemains;
      var today = new Date().toDateString();
      var boundDate = (new Date(today)).getTime() - boundDateOffset;
      db.deleteOlder(db.SUMMARIES, boundDate, function() {
        if (config_.debug) console.log('[SessionManager] Old summary record has been deleted in database.');
      });
    }
  };

  return SessionManager;
})();