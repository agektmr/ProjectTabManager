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


var SessionManager = (function() {
  'use strict'

  var config_ = null;

  /**
   * [getWindowInfo description]
   * @param  {Integer}   winId    [description]
   * @param  {Function} callback [description]
   */
  var getWindowInfo = function(winId) {
    return new Promise(function(resolve, reject) {
      if (winId === chrome.windows.WINDOW_ID_NONE) {
        resolve(undefined);
      } else {
        chrome.windows.get(winId, {populate:true}, function(win) {
          if (chrome.runtime.lastError) {
            if (config_.debug) `[SessionManager] window of id ${winId} not open`;
            resolve(undefined);
          }
          if (!win || win.type !== 'normal') {
            resolve(undefined);
          } else {
            resolve(win);
          }
        });
      }
    });
  };

  /**
   * Synchronize session status on chrome.storage
   */
  var UpdateManager = {
    queue: [],

    /**
     * [initialize description]
     */
    restoreSessions(callback) {
      // restore projects from chrome.storage.local
      chrome.storage.local.get(items => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          throw '[UpdateManager] chrome.storage.local.get error'
        } else {
          let sessions = items['sessions'] || items['projects'] || []; // 'projects' is a transitional solution
          if (config_.debug) console.log('[UpdateManager] restoring sessions from storage.', sessions);
          callback(sessions);
        }
      });
    },

    /**
     * Synchronize project status to chrome.storage. Restores when on initialization.
     */
    storeSessions() {
      chrome.storage.local.set(sessionManager.export(), () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          if (config_.debug) console.log('[UpdateManager] sessions stored.', sessionManager.sessions);
        }
      });
    },

    /**
     * Add sync status to queue so that synchronization only happens when all status is clear.
     * @param {chrome.tabs.Tab} tab
     */
    tabLoading(tab) {
      for (let i = 0; i < UpdateManager.queue.length; i++) {
        if (UpdateManager.queue[i].id === tab.id) {
          UpdateManager.queue[i] = tab;
          if (config_.debug) console.log('[UpdateManager] tab %o loading. %d in total', tab, UpdateManager.queue.length);
          return;
        }
      }
      UpdateManager.queue.push(tab);
      if (config_.debug) console.log('[UpdateManager] added tab %o. %d in total.', tab, UpdateManager.queue.length);
    },

    /**
     * Removes completed sync status and kick start synchronization when all queue's gone.
     * @param {chrome.tabs.Tab} tab
     */
    tabComplete(tab) {
      for (let i = 0; i < UpdateManager.queue.length; i++) {
        if (UpdateManager.queue[i].id === tab.id) {
          UpdateManager.queue.splice(i, 1);
          break;
        }
      }
      if (UpdateManager.queue.length === 0) {
        if (config_.debug) console.log('[UpdateManager] Queue cleared. Storing session.');
        UpdateManager.storeSessions();
      } else {
        if (config_.debug) console.log('[UpdateManager] tab %o sync completed. %o remaining', tab, UpdateManager.queue);
      }
    },
  };

  /**
   *  Tab entity which represents chrome.tabs.Tab
   *  @param {chrome.tabs.Tab} tab
   **/
  class TabEntity {
    constructor(tab) {
      let url =         util.unlazify(tab.url);

      this.id =         tab.id;
      this.title =      tab.title;
      this.url =        url;
      this.pinned =     tab.pinned || false;
      this.favIconUrl = tab.favIconUrl;
    }
  }

  /**
   * Window entity which represents chrome.windows.Window
   * @param {chrome.windows.Window} win
   */
  class SessionEntity {
    constructor(target) {
      // if target.focused is set, target is chrome.windows.Window object
      if (target.focused !== undefined) {
        this.id     = '-'+target.id; // project id for non-bound session can be anything as long as it's unique.
        this.winId  = target.id;
        this.title  = (new Date()).toLocaleString();

      // if project id is null, this is non-bound session (transitional solution)
      } else if (target.id === null) {
        this.id     = '-'+Math.floor(Math.random() * 100000);
        this.winId  = null;
        this.title  = (new Date()).toLocaleString();

      // otherwise, target is SessionEntity object recovering from previous session
      } else {
        this.id     = target.id;
        this.winId  = null;
        this.title  = target.title;
      }

      this.tabs   = [];
      if (target.tabs) {
        for (let i = 0; i < target.tabs.length; i++) {
          this.addTab(target.tabs[i]);
        }
      }
      if (config_.debug) console.log('[SessionEntity] Created new session entity %o based on %o', this, target);
    }

    /**
     * Rename session title
     * @param {String} name
     */
    rename(name) {
      this.title = name;
    }
    /**
     * Adds tab entity of given chrome.tabs.Tab
     * @param {chrome.tabs.Tab} tab
     */
    addTab(tab) {
      if (tab && !tab.url.match(util.CHROME_EXCEPTION_URL)) {
        // Create new tab entity
        this.tabs.push(new TabEntity(tab));
        this.sortTabs();
      }
    }

    /**
     * Gets tab entity of given tab id
     * @param  {Integer} tabId
     * @return {TabEntity|undefined}
     */
    getTab(tabId) {
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].id === tabId) {
          return this.tabs[i];
        }
      }
      return undefined;
    }

    /**
     *  Update TabEntity
     *  @param {chrome.tabs.Tab} tab  Tab object to update
     */
    updateTab(tab) {
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        // Find a tab with same id
        for (let i = 0; i < this.tabs.length; i++) {
          if (this.tabs[i].id === tab.id) {
            // TODO: better logic
            let new_tab = new TabEntity(tab);
            let old_tab = this.tabs.splice(i, 1, new_tab)[0];
            if (config_.debug) console.log('[SessionEntity] updating tab %o to %o', old_tab, new_tab);
            return;
          }
        }
        this.addTab(tab);
      }
    }

    /**
     *  Removes TabEntity
     *  @param    {Integer} tabId   id of a tab to remove
     *  @returns  {Boolean}
     **/
    removeTab(tabId) {
      for (let i = 0; i < this.tabs.length; i++) {
        if (this.tabs[i].id === tabId) {
          if (config_.debug) console.log('[SessionEntity] removed tab %d from session %s', this.tabs[i].id, this.id);
          // Remove TabEntity
          this.tabs.splice(i, 1);
          if (this.tabs.length > 0) {
            this.sortTabs();
          }
          return true;
        }
      }
      return false;
    }

    /**
     *  Sort TabEntity
     *  @returns  void
     **/
    sortTabs() {
      // Skip if there's no winId
      if (this.winId === null) return;

      // Sort tab order
      chrome.windows.get(this.winId, {populate:true}, win => {
        if (!win) return;
        let tmp = [];
        for (let i = 0; i < win.tabs.length; i++) {
          if (win.tabs[i].url.match(util.CHROME_EXCEPTION_URL)) continue;
          let tab = this.getTab(win.tabs[i].id);
          if (tab) {
            // tab.index = win.tabs[i].index;
            tmp.push(tab);
          }
        }
        // Isn't this leaking memory?
        this.tabs = tmp;
      });
      return;
    }

    /**
     * Gets Array of tab entities
     * @return {Array}  Array of TabEntities
     */
    getTabs() {
      return this.tabs;
    }

    /**
     * [openSession description]
     */
    openTabs() {
      if (config_.debug) console.log('[SessionEntity] Opening a session', this);
      // open first tab with window
      chrome.windows.create({
        url: this.tabs[0] && this.tabs[0].url || null,
        focused: true
      }, win => {
        this.tabs[0].id = win.tabs[0].id;

        // open bookmarks in window
        this.tabs.forEach((tab, i) => {
          if (!tab || i === 0) return; // skip if undefined or first tab (since it's already opened)
          let url = config_.lazyLoad ? tab.url : util.lazify(tab.url, tab.title, tab.favIconUrl);
          chrome.tabs.create({
            windowId: win.id,
            index:    i,
            url:      url,
            pinned:   tab.pinned,
            active:   false
          }, tab => {
            this.tabs[i].id = tab.id;
          });
        });
      });
    }

    /**
     * Sets project id of this session
     * @param {String} projectId  project id
     */
    setId(projectId) {
      this.id = projectId;
      if (config_.debug) console.log('[SessionEntity] Assigned project %s to session %o', projectId, this);
    }

    /**
     * Unsets project id of this session
     */
    unsetId() {
      if (config_.debug) console.log('[SessionEntity] Removed project %s from session %o', this.id, this);
      this.id = null;
    }

    /**
     * [setWinId description]
     * @param {Integer} winId
     */
    setWinId(winId) {
      this.winId = winId;
      if (config_.debug) console.log('[SessionEntity] Assigned window %s to session %o', this.winId, this);
    }

    /**
     * [unsetWinId description]
     */
    unsetWinId() {
      if (config_.debug) console.log('[SessionEntity] Removed window %s from session %o', this.winId, this);
      this.winId = null;
    }
  };

  /**
   * [SessionManager description]
   */
  class SessionManager {
    constructor(config) {
      config_         = config;
      this.sessions   = [];
      this.prev_sessions = [];
      this.openingProject = null;
      this.activeInfo = {
        id:       null,
        start:    null,
        end:      null,
        tabId:    null,
        windowId: null
      };

      // set initial window id
      chrome.windows.getCurrent({populate:true}, win => {
        this.activeInfo.tabId    = null;
        this.activeInfo.windowId = win.id;
      });

      // chrome.tabs.onCreated.addListener(this.oncreated.bind(this));
      chrome.tabs.onUpdated.addListener(this.onupdated.bind(this));
      chrome.tabs.onMoved.addListener(this.onmoved.bind(this));
      // chrome.tabs.onSelectionChanged.addListener(TODO);
      // chrome.tabs.onActiveChanged.addListener(TODO);
      chrome.tabs.onActivated.addListener(this.onactivated.bind(this));
      // chrome.tabs.onHighlightChanged.addListener(TODO);
      // chrome.tabs.onHighlighted.addListener(TODO);
      chrome.tabs.onDetached.addListener(this.ondetached.bind(this));
      chrome.tabs.onAttached.addListener(this.onattached.bind(this));
      chrome.tabs.onRemoved.addListener(this.onremoved.bind(this));
      chrome.tabs.onReplaced.addListener(this.onreplaced.bind(this));

      chrome.windows.onCreated.addListener(this.onwindowcreated.bind(this));
      chrome.windows.onFocusChanged.addListener(this.onwindowfocuschanged.bind(this));
      chrome.windows.onRemoved.addListener(this.onwindowremoved.bind(this));
    }
    /**
     * Adds Project
     * @param {chrome.tabs.Tab} tab - adds a tab to project
     */
    oncreated(tab) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onCreated', tab);
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        let session = this.getSessionFromWinId(tab.windowId);
        session && session.updateTab(tab);
      }
    }

    /**
     * Updates tab info
     * @param  {Integer}          tabId       first argument of chrome.tabs.onUpdated.addListener
     * @param  {Object}           changeInfo  second argument of chrome.tabs.onUpdated.addListener
     * @param  {chrome.tabs.Tab}  tab         third argument of chrome.tabs.onUpdated.addListener
     */
    onupdated(tabId, changeInfo, tab) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onUpdated', tabId, changeInfo, tab);
      if (!tab.url.match(util.CHROME_EXCEPTION_URL)) {
        if (tab.status === 'complete') {
          this.oncreated.call(this, tab);
          UpdateManager.tabComplete(tab);
        } else if (tab.status === 'loading') {
          UpdateManager.tabLoading(tab);
        }
      } else {
        let session = this.getSessionFromWinId(tab.windowId);
        if (session) session.removeTab(tabId);
        if (config_.debug) console.log('[SessionManager] removing a tab which transitioned to url starting with "chrome://"');
      }
    }

    /**
     * Removes a tab from project
     * @param  {Integer} tabId        first argument of chrome.tabs.onRemoved.addListener
     * @param  {Object} removeInfo    second argument of chrome.tabs.onRemoved.addListener
     */
    onremoved(tabId, removeInfo) {
      let winId = removeInfo.windowId;
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onRemoved', tabId, removeInfo);

      let session = this.getSessionFromWinId(winId);
      // When closing the window, remove session.
      if (removeInfo.isWindowClosing && session) {
        if (config_.debug) console.log('[SessionManager] Skip removing tab', removeInfo);
      } else {
        if (session) {
          session.removeTab(tabId);
          if (session.tabs.length === 0) {
            if (config_.debug) console.log('[SessionManager] removing the session %o itself since all tabs are closing', session);
            this.removeSessionFromProjectId(session.id);
          }
          UpdateManager.storeSessions();
        } else {
          if (config_.debug) console.log('[SessionManager] tab %s being removed was not in the session being tracked', tabId);
        }
      }
    }

    /**
     * [onmoved description]
     * @param  {Integer} tabId    [description]
     * @param  {Object} moveInfo [description]
     */
    onmoved(tabId, moveInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onMoved', tabId, moveInfo);
      let session = this.getSessionFromWinId(moveInfo.windowId);
      if (session) {
        session.sortTabs();
        if (config_.debug) console.log('[SessionManager] moved tab from %d to %d', moveInfo.fromIndex, moveInfo.toIndex);
      }
      UpdateManager.storeSessions();
    }

    /**
     * [onreplaced description]
     * @param  {Integer} addedTabId   [description]
     * @param  {Integer} removedTabId [description]
     */
    onreplaced(addedTabId, removedTabId) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onReplaced', addedTabId, removedTabId);
      this.removeTab(removedTabId);
      UpdateManager.storeSessions();
    }

    /**
     * [onattached description]
     * @param  {Integer} tabId      [description]
     * @param  {Object} attachInfo [description]
     */
    onattached(tabId, attachInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onAttached', tabId, attachInfo);
      getWindowInfo(attachInfo.newWindowId).then(win => {
        if (win === undefined) return;
        let session = this.getSessionFromWinId(attachInfo.newWindowId);
        // If this tab generates new window, it should be a new session
        if (!session) {
          session = new SessionEntity(win);
          this.sessions.unshift(session);
        }
        chrome.tabs.get(tabId, tab => {
          session.addTab(tab);
          if (config_.debug) console.log('[SessionManager] added tab %d to window', tabId, attachInfo.newWindowId);
          UpdateManager.storeSessions();
        });
      });
    }

    /**
     * [ondetached description]
     * @param  {Integer} tabId      [description]
     * @param  {Object} detachInfo [description]
     */
    ondetached(tabId, detachInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onDetached', tabId, detachInfo);
      let old_session = this.getSessionFromWinId(detachInfo.oldWindowId);
      if (old_session) {
        old_session.removeTab(tabId);
        if (old_session.tabs.length === 0) {
          this.removeSessionFromWinId(old_session.winId);
        }
        if (config_.debug) console.log('[SessionManager] removed tab %d from window', tabId, detachInfo.oldWindowId);
      }
      UpdateManager.storeSessions();
    }

    /**
     * [onactivated description]
     * @param  {Integer} activeInfo [description]
     */
    onactivated(activeInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onActivated', activeInfo);
      getWindowInfo(activeInfo.windowId).then(win => {
        if (win === undefined) return;
        this.activeInfo.tabId    = activeInfo.tabId; // not used
        this.activeInfo.windowId = activeInfo.windowId;
      });
    }

    onwindowcreated(win) {
      // ignore windows that are devtools, chrome extension, etc
      if (win.type !== "normal" || win.id === chrome.windows.WINDOW_ID_NONE) return;
      if (config_.debug) console.log('[SessionManager] chrome.windows.onCreated', win);
      getWindowInfo(win.id).then(win => {
        // If this is a project intentionally opened
        if (this.openingProject) {
          if (config_.debug) console.log('[SessionManager] Intentionally opened window', win);
          let session = this.getSessionFromProjectId(this.openingProject);
          if (session) {
            // If session found, update its winId
            session.setWinId(win.id);
          } else {
            // If not, create a new session
            session = new SessionEntity(win);
            this.sessions.unshift(session);
            session.setId(this.openingProject);
          }
          this.setActiveSession(win.id, session);
          this.openingProject = null;
        } else {
          if (config_.debug) console.log('[SessionManager] Unintentionally opened window', win);
          // Loop through existing sessions to see if there's an identical one
          // This happens when
          // * Restoring previous session (Chrome's native feature)
          // * Opening a profile
          // * Opening a new window after closing all
          for (let i = 0; i < this.sessions.length; i++) {
            if (this.sessions[i].winId) continue;
            if (this.compareTabs(win, this.sessions[i])) {
              // set project id and title to this session and make it bound session
              this.sessions[i].setWinId(win.id);
              if (config_.debug) console.log('[SessionManager] Associated with a previous session', this.sessions[i]);
              this.setActiveSession(win.id, this.sessions[i]);
              UpdateManager.storeSessions();
              return;
            }
          }
          // Create new session
          let session = new SessionEntity(win);
          this.sessions.unshift(session);
          this.setActiveSession(win.id, session);
        }
        UpdateManager.storeSessions();
      });
    }

    /**
     * [onwindowfocuschanged description]
     * @param  {Integer} winId [description]
     */
    onwindowfocuschanged(winId) {
      if (config_.debug) console.log('[SessionManager] chrome.windows.onFocusChanged', winId);
      // Put in database only if active session exists
      if (this.activeInfo.start !== null) {
        this.activeInfo.end = (new Date()).getTime();
        db.put(db.SUMMARIES, this.activeInfo);
      }

      let session = this.getSessionFromWinId(winId);
      this.setActiveSession(winId, session);
    }

    /**
     *
     *
     */
    onwindowremoved(winId) {
      if (winId === chrome.windows.WINDOW_ID_NONE) return;
      if (config_.debug) console.log('[SessionManager] chrome.windows.onRemoved', winId);
      let session = this.getSessionFromWinId(winId);
      if (session) {
        session.unsetWinId();
        UpdateManager.storeSessions();
      }
    }

    /**
     * [removeSessionFromProjectId description]
     * @param  {String} projectId [description]
     */
    removeSessionFromProjectId(projectId) {
      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].id === projectId) {
          this.sessions.splice(i--, 1);
          if (config_.debug) console.log('[SessionManager] removed session of project id:', projectId);
        }
      }
      UpdateManager.storeSessions();
    }

    /**
     * Removes session of given window id
     * @param   {String}    winId
     * @return  {Boolean}
     */
    removeSessionFromWinId(winId) {
      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].winId === winId) {
          this.sessions.splice(i, 1);
          if (config_.debug) console.log('[SessionManager] removed session of window id:', winId);
          UpdateManager.storeSessions();
          return true;
        }
      }
      return false;
    }

    unsetWinId(winId) {
      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].winId === winId) {
          this.sessions[i].unsetWinId();
        }
      }
      return;
    }

    /**
     * Returns an array of sessions
     * @return  {Array} sessions
     */
    getSessions() {
      return this.sessions;
    }

    /**
     * [getSession description]
     * @param  {String}                  projectId   project id of the session to get
     * @return {SessionEntity|undefined}
     */
    getSessionFromProjectId(projectId) {
      if (!projectId) return undefined;
      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].id === projectId) {
          return this.sessions[i];
        }
      }
      return undefined;
    }

    /**
     * [getSessionFromWinId description]
     * @param  {Integer} winId [description]
     * @return {[type]}       [description]
     */
    getSessionFromWinId(winId) {
      if (!winId) return undefined;
      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].winId === winId) {
          return this.sessions[i];
        }
      }
      return undefined;
    }

    /**
     * [setActiveSession description]
     * @param {integer} winId   session window id
     * @param {string}  session optional session id
     */
    setActiveSession(winId, session) {
      if (session) {
        this.activeInfo.id        = session.id;
        this.activeInfo.start     = (new Date()).getTime();
        this.activeInfo.end       = null;
        this.activeInfo.windowId  = session.winId;

        // Put in database
        db.put(db.SUMMARIES, this.activeInfo);
      } else {
        this.activeInfo.id        = null;
        this.activeInfo.start     = null;
        this.activeInfo.end       = null;
        this.activeInfo.windowId  = winId;
      }

      if (config_.debug) console.log('[SessionManager] active session info updated', this.activeInfo);

      this.updateBrowserAction();
    }

    /**
     * [getActiveSession description]
     * @return {SessionEntity} [description]
     */
    getActiveSession() {
      let winId = this.getCurrentWindowId();
      if (winId) {
        let session = this.getSessionFromWinId(winId);
        if (config_.debug) console.log('[SessionManager] Got active session', session);
        return session;
      }
      return undefined;
    }

    /**
     * [getCurrentWindowId description]
     * @return {[type]} [description]
     */
    getCurrentWindowId() {
      var winId = this.activeInfo.windowId;
console.log('active window id:', winId);
      if (!winId) {
        chrome.windows.getCurrent(function(win) {
console.log('current window id:', win.id);
        });
      }
      return winId || null;
    }

    /**
     * Update the browser action with an active (colored) or non-active (grey) icon
     */
    updateBrowserAction() {
      let session = this.getActiveSession();
      let isBoundSession = session && !/^-/.test(session.id);
      let scale = Math.max(Math.min(Math.ceil(window.devicePixelRatio), 3), 1)
      let inactiveIconPath = chrome.extension.getURL(`img/${scale * 19}.png`);
      let activeIconPath = chrome.extension.getURL(`img/active-${scale * 19}.png`);

      chrome.browserAction.setIcon({path: isBoundSession ? activeIconPath : inactiveIconPath});
    }

    /**
     * Removes tab from session without knowing which session it belongs to.
     * @param  {Integer} tabId  Tab id of which to remove
     * @return {Boolean}       [description]
     */
    removeTab(tabId) {
      for (let i = 0; i < this.sessions.length; i++) {
        let session = this.sessions[i];
        for (let j = 0; j < session.tabs.length; j++) {
          if (session.tabs[j].id === tabId) {
            session.removeTab(tabId);
            return true;
          }
        }
      }
      return false;
    }

    /**
     * [compareTabs description]
     * @param  {[type]} win
     * @param  {[type]} session
     * @return {[type]}
     */
    compareTabs(win, session) {
      let similar = 0,
          count = 0;

      // Loop through all tabs in temporary session
      for (let j = 0; j < win.tabs.length; j++) {
        if (win.tabs[j].url.match(util.CHROME_EXCEPTION_URL)) continue;
        count++;
        // Loop through all tabs in previous session
        for (let k = 0; k < session.tabs.length; k++) {
          // Check if tab url is similar
          if (util.resembleUrls(session.tabs[k].url, win.tabs[j].url)) {
            similar++;
          }
        }
      }

      if (config_.debug) console.log('[SessionManager] %d/%d similar tabs found between window %d:%o and project %s:%o', similar, count, win.id, win, session.id, session);
      // similarity threshold is hardcoded as 80%
      return similar !== 0 && similar/count > 0.8 ? true : false;
    }

    /**
     * Clear sessions with duplicate project id assigned
     * @param {Array<SessionEntity>} sessions Array of SessionEntities to be cleaned
     * @return Array<SessionEntity>
     */
    cleanSessions(sessions) {
      if (config_.debug) console.log('[SessionManager] Cleaning sessions: %o', sessions);
      let projects = [];
      for (let i = 0; i < sessions.length; i++) {
        let id = sessions[i].id;
        if (projects.indexOf(id) !== -1) {
          sessions.splice(i--, 1);
        } else if (id !== null) {
          projects.push(id);
        }
      }
      if (config_.debug) console.log('[SessionManager] Cleaning done: %o', sessions);
      return sessions;
    }

    /**
     * Exports sessions
     * @return {Object}
     */
    export() {
      return {
        sessions: this.getSessions()
      };
    }

    /**
     * Resume sessions from previous one
     */
    resumeSessions() {
      return new Promise((resolve, reject) => {
        // Restore sessions
        UpdateManager.restoreSessions(sessions => {
          // Cleans duplicate sessions
          sessions = this.cleanSessions(sessions);
          this.prev_sessions = sessions;
          chrome.windows.getAll({populate: true}, windows => {
            if (config_.debug) console.log('[SessionManager] Resuming sessions from windows', windows);

            // Loop through all open windows
            if (config_.debug) console.log('[SessionManager] Looping through windows.');
            Array.prototype.forEach.call(windows, this.restoreSession.bind(this));

            // Loop through left sessions from previous ones to create unopened sessions
            if (config_.debug) console.log('[SessionManager] Looping through previous sessions.');
            for (let i = 0; i < this.prev_sessions.length; i++) {
              let session = new SessionEntity(this.prev_sessions[i]);
              // `push` not `unshift`
              this.sessions.push(session);
              if (config_.debug) console.log('[SessionManager] This session window is not open.');
              this.prev_sessions.splice(i--, 1);
            }
            if (config_.debug) console.log('[SessionManager] Session list created.', sessionManager.sessions);

            // Update the icon
            this.updateBrowserAction();

            resolve();
          });
        });
      });
    }

    /**
     * Compare a window status with previous sessions
     */
    restoreSession(win) {
      if (win.type !== "normal" || win.id === chrome.windows.WINDOW_ID_NONE) return;

      // Create temporary non-bound session
      let session = new SessionEntity(win);
      // `unshift` not `push`
      this.sessions.unshift(session);

      // Loop through previous sessions to see if there's identical one
      for (let i = 0; i < this.prev_sessions.length; i++) {
        if (this.compareTabs(win, this.prev_sessions[i])) {
          session.setId(this.prev_sessions[i].id);
          session.rename(this.prev_sessions[i].title);
          if (config_.debug) console.log('[SessionManager] This session window is open', session);
          this.prev_sessions.splice(i--, 1);
        }
      }
    }

    /**
     * [getSummary description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getTimeTable(date, callback) {
      let start     = util.getLocalMidnightTime(date);
      let next_day  = start + (60 * 60 * 24 * 1000);
      let end       = (new Date(next_day)).getTime();
      db.getRange(db.SUMMARIES, start, end, table => {
        table.forEach((session, i) => {
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
      });
    }

    /**
     * [getSummary description]
     * @param  {[type]}   _start   [description]
     * @param  {[type]}   _end     [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getSummary(_start, _end, callback) {
      let start     = (new Date(_start)).getTime();
      let next_day  = (new Date(_end)).getTime() + (60 * 60 * 24 * 1000);
      let end       = (new Date(next_day)).getTime();
      db.getRange(db.SUMMARIES, start, end, summary => {
        let _summary = {};
        summary.forEach(function(session, i) {
          let id = session.id;
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
    }

    deleteOldSummary() {
      let boundDateOffset = config_.summaryRemains;
      let today = new Date().toDateString();
      let boundDate = (new Date(today)).getTime() - boundDateOffset;
      db.deleteOlder(db.SUMMARIES, boundDate, () => {
        if (config_.debug) console.log('[SessionManager] Old summary record has been deleted in database.');
      });
    }
  };

  return SessionManager;
})();
