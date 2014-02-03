/*! ProjectTabManager - v2.2.3 - 2014-02-04
* Copyright (c) 2014 ; Licensed  */
var Config = (function() {
  var rootParentId_ = '2',
      rootName_     = 'Project Tab Manager',
      lazyLoad_     = true,
      debug_        = true;

  var setConfig = function() {
    chrome.storage.sync.set({config: {
      lazyLoad:     lazyLoad_,
      rootParentId: rootParentId_,
      rootName:     rootName_
    }}, function() {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log('sessions stored.', lazyLoad_, rootParentId_, rootName_);
      }
    })
  };

  var Config = function(callback) {
    chrome.storage.sync.get((function(items) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        var conf = items['config'] || {};
        rootParentId_ = conf.rootParentId || localStorage.rootParentId || '2';
        rootName_     = conf.rootName     || localStorage.rootName     || 'Project Tab Manager';
        if (conf.lazyLoad !== undefined) {
          lazyLoad_ = conf.lazyLoad;
        } else {
          lazyLoad_ = localStorage.lazyLoad === 'true' ? true : false;
        }
        if (this.debug) console.log('[Config] initialization finished');
        if (typeof callback === 'function') callback();
      }
    }).bind(this));
  };

  var manifest = chrome.runtime.getManifest();
  if (manifest.key !== undefined) {
    // If there's key property exists in manifest, this is production
    debug_ = false;
  }

  Config.prototype = {
    debug: debug_,
    archiveFolderName: '__Archive__',
    hiddenFolderName: 'passive',
    summaryRemains: 60*60*24*30*2*1000, // 2 month ago
    set lazyLoad(val) {
      lazyLoad_ = val ? true : false;
      setConfig();
    },
    get lazyLoad() {
      return lazyLoad_;
    },
    set rootParentId(val) {
      rootParentId_ = val;
      setConfig();
    },
    get rootParentId() {
      return rootParentId_;
    },
    set rootName(val) {
      rootName_ = val;
      setConfig();
    },
    get rootName() {
      return rootName_;
    }
  };
  return Config;
})();

'use strict';

var util = {
  CHROME_EXCEPTION_URL: /^chrome(|-devtools):/,
  STRIP_HASH: /^(.*?)#.*$/,
  FAVICON_URL: 'http://www.google.com/s2/favicons?domain=',

  /**
   * [lazify description]
   * @param  {[type]} url        [description]
   * @param  {[type]} title      [description]
   * @param  {[type]} favIconUrl [description]
   * @return {[type]}            [description]
   */
  lazify: function(url, title, favIconUrl) {
    return 'lazy.html?url=' +encodeURIComponent(url)+
           '&title='        +encodeURIComponent(title || '* Lazy loading')+
           '&favIconUrl='   +encodeURIComponent(favIconUrl || '');
  },

  /**
   * [unlazify description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  unlazify: function(url) {
    var params = {};
    if (url.match(RegExp('^chrome-extension:\/\/'+chrome.i18n.getMessage('@@extension_id')+'\/lazy\.html'))) {
      var query = url.replace(/.*\?(.*)$/, '$1');
      var _params = query.split('&');
      _params.forEach(function(param) {
        var comb = param.split('=');
        if (comb.length == 2)
          params[comb[0]] = decodeURIComponent(comb[1]);
      });
    }
    return params.url ? params.url : url;
  },

  /**
   * [getFavIconUrl description]
   * @param  {[type]} favIconUrl [description]
   * @param  {[type]} url        [description]
   * @return {[type]}            [description]
   */
  getFavIconUrl: function(favIconUrl, url) {
    var domain = url.replace(/^.*?\/\/(.*?)\/.*$/, "$1");
    var favIconUrl_ = favIconUrl || util.FAVICON_URL+encodeURIComponent(domain);
    return favIconUrl_;
  },

  /**
   * [resembleUrls description]
   * @param  {[type]} url1 [description]
   * @param  {[type]} url2 [description]
   * @return {[type]}      [description]
   */
  resembleUrls: function(url1, url2) {
    url1 = util.unlazify(url1).replace(util.STRIP_HASH, '$1');
    url2 = util.unlazify(url2).replace(util.STRIP_HASH, '$1');
    if (url1.length >= url2.length) {
      if (url1.indexOf(url2) === 0) return true;
    } else {
      if (url2.indexOf(url1) === 0) return true;
    }
    return url1 === url2;
  },

  /**
   * parse url as per http://en.wikipedia.org/wiki/URI_scheme
   * @param  {String} url
   * @return {Object}
   */
  parse: function(url) {
    var parsed = url.match(/^(.*?:\/\/)(.*?)(:?([0-9]+))??(\/(.*?))??(\?(.*?))??(#(.*))??$/i);
    return {
      url:        parsed[0],
      scheme:     parsed[1],
      domain:     parsed[2],
      port:       parsed[4],
      authority:  parsed[1]+parsed[2]+(parsed[4]?':'+parsed[4]:''),
      path:       parsed[6],
      query:      parsed[8],
      fragment:   parsed[10]
    }
  },

  /**
   * [getLocalMidnightTime description]
   * @param  {[type]} dateStr [description]
   * @return {[type]}         [description]
   */
  getLocalMidnightTime: function(dateStr) {
    var date = new Date(dateStr);
    var UTCMidnight = date.getTime();
    var TimezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return UTCMidnight + TimezoneOffset;
  }
};
'use strict';

var idb = (function(config) {
  var error = function(e) {
    adding = false;
    console.error('IndexedDB Error!', e);
  };

  var version = 3,
      db      = null,
      config_ = config;

  var idb = function(config) {
    config_ = config;
    if (!window.indexedDB) {
      throw 'Indexed Database API not supported on this browser';
    }
    this.table = [];
    var req = indexedDB.open('ProjectTabManager', version);
    req.onsuccess = (function(e) {
      db = e.target.result;
    }).bind(this);
    req.onfailure = error;
    req.onupgradeneeded = (function(e) {
      db = e.target.result;
      if (db.objectStoreNames.contains(this.SUMMARIES)) {
        db.deleteObjectStore(this.SUMMARIES);
      }
      db.createObjectStore(this.SUMMARIES, {keyPath: 'start'});
      if (db.objectStoreNames.contains(this.SESSIONS)) {
        db.deleteObjectStore(this.SESSIONS);
      }
      db.createObjectStore(this.SESSIONS, {keyPath: 'id'});
      if (config_.debug) console.log('[IndexedDB] Database upgraded');
    }).bind(this);
  };
  idb.prototype = {
    SUMMARIES: 'summaries',
    SESSIONS:  'sessions',
    oncomplete: null,
    onprogress: null,
    put: function(storeName, entry, callback) {
      if (!db) return;
      var transaction = db.transaction([storeName], 'readwrite');
      transaction.oncomplete = (function() {
        if (config_.debug) console.log('[IndexedDB] Summary stored', entry);
        if (typeof callback === 'function') callback();
      }).bind(this);
      transaction.onerror = error;
      var store = transaction.objectStore(storeName);
      store.put(entry);
    },
    getAll: function(storeName, callback) {
      if (!db) return;
      var table = [];
      var transaction = db.transaction([storeName], 'readonly');
      transaction.oncomplete = (function() {
        callback(table);
      }).bind(this);
      transaction.onerror = error;
      var req = transaction.objectStore(storeName).openCursor();
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          var data = cursor.value;
          table.push(data);
          cursor.continue();
        }
      }).bind(this);
    },
    getRange: function(storeName, start, end, callback) {
      if (!db) return;
      var table = [];
      var transaction = db.transaction([storeName], 'readonly');
      transaction.oncomplete = (function() {
        callback(table);
      }).bind(this);
      transaction.onerror = error;
      var range = IDBKeyRange.bound(start, end, false, true);
      var req = transaction.objectStore(storeName).openCursor(range);
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          var data = cursor.value;
          table.push(data);
          cursor.continue();
        }
      }).bind(this);
    },
    deleteAll: function(storeName, callback) {
      if (!db) return;
      this.table = [];
      var transaction = db.transaction([storeName], 'readwrite');
      transaction.oncomplete = callback;
      transaction.onerror = error;
      var store = transaction.objectStore(storeName);
      var req = store.openCursor();
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.key);
          cursor.continue();
        }
      }).bind(this);
    },
    deleteOlder: function(storeName, boundDate, callback) {
      if (!db) return;
      this.table = [];
      var transaction = db.transaction([storeName], 'readwrite');
      transaction.oncomplete = callback;
      transaction.onerror = error;
      var range = IDBKeyRange.upperBound(boundDate, true);
      var req = transaction.objectStore(storeName).openCursor(range);
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.key);
          cursor.continue();
        }
      }).bind(this);
    }
  };
  return idb;
})();
var SessionManager = (function() {
  var config_ = null,
      db      = null;

  /**
   * [getWindowInfo description]
   * @param  {Integer}   winId    [description]
   * @param  {Function} callback [description]
   */
  var getWindowInfo = function(winId, callback) {
    if (winId === chrome.windows.WINDOW_ID_NONE) {
      callback(undefined);
    } else {
      chrome.windows.get(winId, {populate:true}, function(win) {
        if (chrome.runtime.lastError) {
          throw '[SessionManager] closing window of id '+winId+' not open';
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
    // if target.focused is set, target is chrome.windows.Window object
    if (target.focused !== undefined) {
      this.id     = null;
      this.winId  = target.id;

    // otherwise, target is SessionEntity object recovering from previous session
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
            // TODO: better logic
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
            active:   i ? false : true
          }, (function(tab) {
            this.tabs[i].id = tab.id;
          }).bind(this));
        }).bind(this));
      }).bind(this));
    },

    /**
     * Sets project id of this session
     * @param {String} projectId  project id
     */
    setId: function(projectId) {
      this.id = projectId;
      if (config_.debug) console.log('[SessionEntity] assigned project id of', projectId, 'to session', this);
    },

    /**
     * Unsets project id of this session
     */
    unsetId: function() {
      if (config_.debug) console.log('[SessionEntity] removed project id of', this.id, 'from session', this);
      this.id = null;
    },

    /**
     * [setWinId description]
     * @param {Integer} winId
     */
    setWinId: function(winId) {
      this.winId = winId;
      if (config_.debug) console.log('[SessionEntity] assigned window id of', this.winId, 'to session', this);
    },

    /**
     * [unsetWinId description]
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

    chrome.windows.onCreated.addListener(this.onwindowcreated.bind(this));
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
          // This shouldn't happen. onwindowcreated should catch and create session first.
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
     * @param  {Integer} tabId    [description]
     * @param  {Object} moveInfo [description]
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
     * @param  {Integer} addedTabId   [description]
     * @param  {Integer} removedTabId [description]
     */
    onreplaced: function(addedTabId, removedTabId) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onReplaced', addedTabId, removedTabId);
      this.removeTab(removedTabId);
    },

    /**
     * [onattached description]
     * @param  {Integer} tabId      [description]
     * @param  {Object} attachInfo [description]
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
     * @param  {Integer} tabId      [description]
     * @param  {Object} detachInfo [description]
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
     * @param  {Integer} activeInfo [description]
     */
    onactivated: function(activeInfo) {
      if (config_.debug) console.log('[SessionManager] chrome.tabs.onActivated', activeInfo);
      getWindowInfo(activeInfo.windowId, (function(win) {
        if (win === undefined) return;
        this.activeInfo.tabId    = activeInfo.tabId; // not used
        this.activeInfo.windowId = activeInfo.windowId;
      }).bind(this));
    },

    onwindowcreated: function(win) {
      if (config_.debug) console.log('[SessionManager] chrome.windows.onCreated', win);
      this.createSession(win);
    },

    /**
     * [onfocuschanged description]
     * @param  {Integer} winId [description]
     */
    onfocuschanged: function(winId) {
      if (config_.debug) console.log('[SessionManager] chrome.windows.onFocusChanged', winId);
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
     * @param  {chrome.windows.Window} win [description]
     * @return {SessionEntity}     [description]
     */
    createSession: function(win) {
      var session = this.getSessionFromWinId(win.id);
      if (session) {
        if (config_.debug) console.log('[SessionManager] session found', session);
        return session;
      } else {
        session = new SessionEntity(win);
        this.sessions.push(session);
        if (config_.debug) console.log('[SessionManager] session %o created from %o', session, win);
        return session;
      }
    },

    /**
     * [removeSessionFromProjectId description]
     * @param  {String} projectId [description]
     */
    removeSessionFromProjectId: function(projectId) {
      for (var i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].id === projectId) {
          this.sessions.splice(i--, 1);
          if (config_.debug) console.log('[SessionManager] removed session of project id:', projectId);
        }
      }
      UpdateManager.storeSessions();
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
     * @param  {String}                  projectId   project id of the session to get
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
     * @param  {Integer} winId [description]
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
     * @return {SessionEntity} [description]
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
     * Removes tab from session without knowing which session it belongs to.
     * @param  {Integer} tabId  Tab id of which to remove
     * @return {Boolean}       [description]
     */
    removeTab: function(tabId) {
      for (var i = 0; i < this.sessions.length; i++) {
        var session = this.sessions[i];
        for (var j = 0; j < session.tabs.length; j++) {
          if (session.tabs[j].id === tabId) {
            session.removeTab(tabId);
            return true;
          }
        }
      }
      return false;
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
          if (config_.debug) console.log('[SessionManager] restoring session from windows', windows);
          // Loop through all open windows
          Array.prototype.forEach.call(windows, (function(win) {
            if (win.type !== "normal" || win.id === chrome.windows.WINDOW_ID_NONE) return;

            var session = this.createSession(win);

            // Loop through previous sessions to look for matching one
            for (var i = 0; i < prev_sessions.length; i++) {
              var similar = 0,
                  count = 0,
                  prev_session = prev_sessions[i];

              if (config_.debug) console.log('[SessionManager] ***** matching session with window', prev_session);
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
var BookmarkManager = (function() {
  var config_ = null;

  /**
   * Gets root chrome.bookmarks.BookmarkTreeNode object of given bookmark id
   * @param  {String}           parentId    Root bookmark folder id
   * @param  {String}           title       Root folder title
   * @param  {requestCallback}  callback    Function to call when root detected
   */
  var getFolder = function(parentId, title, callback) {
    chrome.bookmarks.getSubTree(parentId, function(bookmarks) {
      var children = bookmarks[0].children;
      // Loop through bookmarks under parentId
      for (var i = 0; i < children.length; i++) {
        if (title === children[i].title) {
          callback(children[i]);
          return;
        }
      }
      // Create new root folder if not existing
      chrome.bookmarks.create({
        parentId: String(parentId),
        title:    title
      }, callback);
    });
  };

  /**
   * [BookmarkManager description]
   * @param {[type]}   config   [description]
   * @param {Function} callback [description]
   */
  var BookmarkManager = function(config, callback) {
    config_         = config;
    this.rootId     = null;
    this.bookmarks  = [];
    this.load(function() {
      if (typeof callback === 'function') callback();
    });
  };
  BookmarkManager.prototype = {
    /**
     * Creates bookmark under given bookmark id
     * @param  {String}            folderId
     * @param  {String}            title
     * @param  {String}            url
     * @param  {requestCallback}   callback
     */
    addBookmark: function(folderId, title, url, callback) {
      if (url.match(util.CHROME_EXCEPTION_URL)) return;
      chrome.bookmarks.create({
        parentId: folderId,
        title: title,
        url: util.unlazify(url)
      }, (function(bookmark) {
        this.load(function() {
          if (typeof callback === 'function') callback(bookmark);
        });
      }).bind(this));
      if (config_.debug) console.log('[BookmarkManager] added bookmark', title);
    },

    /**
     * Removes a bookmark
     * @param  {String}           bookmarkId
     * @param  {requestCallback}  callback
     */
    removeBookmark: function(bookmarkId, callback) {
      chrome.bookmarks.remove(bookmarkId, (function() {
        this.load(callback);
      }).bind(this));
      if (config_.debug) console.log('[BookmarkManager] removed bookmark', bookmarkId);
    },

    /**
     * Gets project list
     * @return {Array} Array of chrome.bookmarks.BookmarkTreeNode
     */
    getRoot: function(force_reload, callback) {
      if (force_reload) {
        this.load(callback);
      } else {
        if (typeof callback === 'function') callback(this.bookmarks);
      }
    },

    /**
     * Creates folder bookmark under root
     * @param {[type]}   title    [description]
     * @param {Function} callback [description]
     */
    addFolder: function(title, callback) {
      chrome.bookmarks.create({
        parentId: this.rootId,
        index:    0,
        title:    title || 'Untitled'
      }, (function(folder) {
        if (config_.debug) console.log('[BookmarkManager] added new folder', folder);
        this.load(function() {
          if (typeof callback === 'function') callback(folder);
        });
      }).bind(this));
    },

    /**
     * Gets chrome.bookmarks.BookmarkTreeNode of given bookmark id
     * @param  {String}           bookmarkId
     */
    getFolder: function(folderId) {
      for (var i = 0; i < this.bookmarks.length; i++) {
        if (folderId == this.bookmarks[i].id) {
          return this.bookmarks[i];
        }
      }
      return undefined;
    },

    /**
     * Moves a bookmark to the archive folder
     * @param  {String}           bookmarkId
     * @param  {requestCallback}  callback
     */
    archiveFolder: function(bookmarkId, callback) {
      getFolder(this.rootId, config_.archiveFolderName, (function(archiveFolder) {
        if (archiveFolder) {
          chrome.bookmarks.move(bookmarkId, {parentId: archiveFolder.id}, (function(bookmark) {
            if (config_.debug) console.log('[BookmarkManager] archived a bookmark', bookmark);
            this.load(function() {
              if (typeof callback === 'function') callback(bookmark);
            });
          }).bind(this));
        }
      }).bind(this));
    },

    /**
     * [openEditWindow description]
     * @param  {[type]} bookmarkId [description]
     */
    openEditWindow: function(bookmarkId) {
      chrome.tabs.create({url:'chrome://bookmarks#'+(bookmarkId||this.rootId)});
    },

    /**
     * [load description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    load: function(callback) {
      getFolder(config_.rootParentId, config_.rootName, (function(folder) {
        this.rootId = folder.id;
        this.bookmarks = folder.children || [];
        if (typeof callback === 'function') callback(this.bookmarks);
      }).bind(this));
    }
  };

  return BookmarkManager;
})();
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
          this.associateWindow(win.id);
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
      sessionManager.removeSessionFromProjectId(this.id);
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
    this.projects = [];

    chrome.windows.onRemoved.addListener((function(winId) {
      if (winId === chrome.windows.WINDOW_ID_NONE) return;
      if (config_.debug) console.log('[ProjectManager] chrome.windows.onRemoved', winId);
      var project = this.getProjectFromWinId(winId);
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
              this.projects.unshift(new_project);
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
      var project =this.getProjectFromId(id);
      project.open();
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
      for (var i = 0; i < this.projects.length; i++) {
        if (this.projects[i].winId === winId) {
          return this.projects[i];
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
      for (var i = 0; i < this.projects.length; i++) {
        if (this.projects[i].id === id) {
          // Remove project from list first
          var project = this.projects.splice(i, 1)[0];
          // Then remove bookmark
          if (project.bookmark) {
            bookmarkManager.archiveFolder(id, (function() {
              if (typeof callback === 'function') callback(project);
            }).bind(this));
          }
        }
        // Don't break. There could be multiple same projects
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
      if (config_.debug) console.log('[ProjectManager] Starting to generate project list');
      bookmarkManager.getRoot(force_reload, (function(bookmarks) {
        this.projects = [];

        // Loop through all sessions
        for (var i = 0; i < bookmarks.length; i++) {
          var found = false,
              bookmark = bookmarks[i];

          // Skip Archives folder
          if (bookmark.title === config_.archiveFolderName) continue;

          var session = sessionManager.getSessionFromProjectId(bookmark.id);
          var project = new ProjectEntity(session, bookmark);
          this.projects.push(project);
          if (config_.debug) console.log('[ProjectManager] Project %s: %o created from session: %o and project: %o', project.id, project, session, bookmark);
        }

        var activeSession = sessionManager.getActiveSession();

        if (activeSession !== undefined) {
          if (activeSession.id === null) {
            if (config_.debug) console.log('[ProjectManager] creating empty project', activeSession);
            this.projects.unshift(new ProjectEntity(activeSession, undefined));
          }
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

'use strict';

var bookmarkManager,
    sessionManager,
    projectManager;

chrome.runtime.onInstalled.addListener(function(details) {
  // Pop up history page only if the version changes in major (ex 2.0.0) or minor (ex 2.1.0).
  // Trivial change (ex 2.1.1) won't popu up.
  if (details.reason === 'update' && chrome.runtime.getManifest().version.match(/0$/)) {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#history')});

  // Pop up help page on first installation
  } else if (details.reason === 'install') {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#help')});
  }
});

var config = new Config(function() {
  bookmarkManager = new BookmarkManager(config, function() {
    sessionManager = new SessionManager(config, function() {
      projectManager = new ProjectManager(config);
      projectManager.update(true);
    });
  });
});

chrome.runtime.onMessage.addListener(function(msg, sender, respond) {
  var params = [];
  for (var key in msg) {
    if (key == 'command') continue;
    params.push(msg[key]);
  }
  params.push(respond);
  ProjectManager.prototype[msg.command].apply(projectManager, params);
  return true;
});
