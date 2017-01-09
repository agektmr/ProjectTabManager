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

import config_ from './Config';
import util from './Utilities';
import db from './iDB';

interface UpdateManager {
  queue: Array<chrome.tabs.Tab>;
  restoreSessions(): Promise<Array<SessionEntity>>;
  storeSessions(): Promise<undefined>;
  tabLoading(tab: chrome.tabs.Tab): void;
  tabComplete(tab: chrome.tabs.Tab): void;
}

const UpdateManager: UpdateManager = {
  queue: [],

  /**
   * [initialize description]
   */
  restoreSessions() {
    return new Promise(resolve => {
      // restore projects from chrome.storage.local
      chrome.storage.local.get(items => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          throw '[UpdateManager] chrome.storage.local.get error';
        } else {
          let sessions = items['sessions'] || items['projects'] || []; // 'projects' is a transitional solution
          util.log('[UpdateManager] restoring sessions from storage.', sessions);
          resolve(sessions);
        }
      });
    });
  },

  /**
   * Synchronize project status to chrome.storage. Restores when on initialization.
   */
  storeSessions() {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.set(sessionManager.export(), () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject();
        } else {
          util.log('[UpdateManager] sessions stored.', sessionManager.sessions);
          resolve();
        }
      });
    });
  },

  /**
   * Add sync status to queue so that synchronization only happens when all status is clear.
   * @param {chrome.tabs.Tab} tab
   */
  tabLoading(tab: chrome.tabs.Tab) {
    let index = UpdateManager.queue.findIndex(_tab => {
      return _tab.id === tab.id;
    });
    if (index > -1) {
      UpdateManager.queue[index] = tab;
      util.log('[UpdateManager] tab %o loading. %d in total', tab, UpdateManager.queue.length);
      return;
    }
    UpdateManager.queue.push(tab);
    util.log('[UpdateManager] added tab %o. %d in total.', tab, UpdateManager.queue.length);
  },

  /**
   * Removes completed sync status and kick start synchronization when all queue's gone.
   * @param {chrome.tabs.Tab} tab
   */
  tabComplete(tab: chrome.tabs.Tab) {
    let index = UpdateManager.queue.findIndex(_tab => {
      return _tab.id === tab.id;
    });
    if (index > -1) {
      UpdateManager.queue.splice(index, 1);
    }
    if (UpdateManager.queue.length === 0) {
      util.log('[UpdateManager] Queue cleared. Storing session.');
      UpdateManager.storeSessions();
    } else {
      util.log('[UpdateManager] tab %o sync completed. %o remaining', tab, UpdateManager.queue);
    }
  }
}

/**
 *  Tab entity which represents chrome.tabs.Tab
 *  @param {chrome.tabs.Tab} tab
 **/
export class TabEntity {
  id: number
  title: string
  url: string
  pinned: boolean
  favIconUrl: string
  constructor(tab: chrome.tabs.Tab) {
    let url = util.unlazify(tab.url);

    this.id = tab.id;
    this.title = tab.title;
    this.url = url;
    this.pinned = tab.pinned || false;
    this.favIconUrl = tab.favIconUrl;
  }
}

/**
 * Window entity which represents chrome.windows.Window
 * @param {chrome.windows.Window} win
 */
export class SessionEntity {
  id: string = null
  winId: number = null
  title: string = ''
  tabs: Array<TabEntity> = []
  constructor(target: chrome.windows.Window|SessionEntity) {
    // if target.focused is set, target is chrome.windows.Window object
    if ('focused' in target) {
      this.id     = '-'+target.id; // project id for non-bound session can be anything as long as it's unique.
      this.winId  = <number>target.id;
      this.title  = (new Date()).toLocaleString();
    // otherwise, target is SessionEntity object recovering from previous session
    } else {
      this.id     = <string>target.id;
      this.title  = target.title;
    }

    for (let tab of target.tabs) {
      this.addTab(tab);
    }
    util.log('[SessionEntity] Created a new session entity %o based on %o', this, target);
  }

  /**
   * Rename session title
   * @param {String} name
   */
  public rename(name: string): void {
    this.title = name;
  }
  /**
   * Adds tab entity of given chrome.tabs.Tab
   * @param {chrome.tabs.Tab} tab
   */
  public addTab(tab: chrome.tabs.Tab|TabEntity): void {
    if (tab && !tab.url.match(util.CHROME_EXCEPTION_URL)) {
      // Create new tab entity
      if (tab instanceof TabEntity) {
        this.tabs.push(tab);
      } else {
        this.tabs.push(new TabEntity(tab));
      }
      this.sortTabs();
    }
  }

  /**
   * Gets tab entity of given tab id
   * @param  {Integer} tabId
   * @return {TabEntity|undefined}
   */
  public getTab(tabId: number): TabEntity {
    return this.tabs.find(tab => {
      return tab.id === tabId;
    });
  }

  /**
   *  Update TabEntity
   *  @param {chrome.tabs.Tab} tab  Tab object to update
   */
  public updateTab(tab: chrome.tabs.Tab): void {
    if (tab.url.match(util.CHROME_EXCEPTION_URL)) return;
    // Find a tab with same id
    let index = this.tabs.findIndex(_tab => {
      return _tab.id === tab.id;
    });
    if (index > -1) {
      let newTab = new TabEntity(tab);
      let oldTab = this.tabs.splice(index, 1, newTab)[0];
      util.log('[SessionEntity] updating tab %o to %o', oldTab, newTab);
      return;
    } else {
      this.addTab(tab);
    }
  }

  /**
   *  Removes TabEntity
   *  @param    {Integer} tabId   id of a tab to remove
   *  @returns  {Boolean}
   **/
  public removeTab(tabId: number): boolean {
    let index = this.tabs.findIndex(_tab => {
      return _tab.id === tabId;
    });
    if (index > -1) {
      util.log('[SessionEntity] removed tab %d from session %s', this.tabs[index].id, this.id);
      // Remove TabEntity
      this.tabs.splice(index, 1);
      if (this.tabs.length > 0) {
        this.sortTabs();
      }
      return true;
    } else {
      return false;
    }
  }

  /**
   *  Sort TabEntity
   *  @returns  void
   **/
  public sortTabs(): void {
    // Skip if there's no winId
    if (this.winId === null) return;

    // Sort tab order
    chrome.windows.get(this.winId, {populate:true}, win => {
      if (!win) return;
      let tmp = [];
      for (let tab of win.tabs) {
        if (tab.url.match(util.CHROME_EXCEPTION_URL)) continue;
        let _tab = this.getTab(tab.id);
        if (_tab) {
          // tab.index = tab.index;
          tmp.push(_tab);
        }
      }
      // Isn't this leaking memory?
      this.tabs = tmp;
    });
  }

  /**
   * Gets Array of tab entities
   * @return {Array}  Array of TabEntities
   */
  public getTabs(): Array<TabEntity> {
    return this.tabs;
  }

  /**
   * [openSession description]
   */
  public openTabs(): void {
    util.log('[SessionEntity] Opening a session', this);
    // open first tab with window
    chrome.windows.create({
      url: this.tabs[0] && this.tabs[0].url || null,
      focused: true
    }, win => {
      this.tabs[0].id = win.tabs[0].id;

      // open bookmarks in window
      this.tabs.forEach((tab, i) => {
        // skip if undefined
        if (!tab) return;
        // If first tab
        if (i === 0) {
          if (tab.pinned) {
            // Don't forget to make this pinned if required
            chrome.tabs.update(tab.id, {
              pinned: true
            });
          }
          return;
        }
        // Lazy load if preferred
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
  public setId(projectId: string): void {
    this.id = projectId;
    util.log('[SessionEntity] Assigned project %s to session %o', projectId, this);
  }

  /**
   * Unsets project id of this session
   */
  public unsetId(): void {
    util.log('[SessionEntity] Removed project %s from session %o', this.id, this);
    this.id = null;
  }

  /**
   * [setWinId description]
   * @param {Integer} winId
   */
  public setWinId(winId: number): void {
    this.winId = winId;
    util.log('[SessionEntity] Assigned window %s to session %o', this.winId, this);
  }

  /**
   * [unsetWinId description]
   */
  public unsetWinId(): void {
    util.log('[SessionEntity] Removed window %s from session %o', this.winId, this);
    this.winId = null;
  }
}

class ActiveInfo {
  id: string = ''
  start: number = null
  end: number = null
  tabId: number = null
  windowId: number = null
}

/**
 * [getWindowInfo description]
 * @param  {Integer}   winId    [description]
 * @param  {Function} callback [description]
 */
const getWindowInfo = function(winId: number): Promise<chrome.windows.Window> {
  return new Promise(resolve => {
    if (winId === chrome.windows.WINDOW_ID_NONE) {
      resolve(undefined);
    } else {
      chrome.windows.get(winId, {populate:true}, function(win) {
        if (chrome.runtime.lastError) {
          util.log(`[SessionManager] window of id ${winId} not open`);
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
 * [SessionManager description]
 */
class SessionManager {
  sessions: Array<SessionEntity> = []
  openingProject: string = ''
  activeInfo: ActiveInfo = new ActiveInfo()
  maxSessions: number = 0

  constructor() {
    this.maxSessions = config_.maxSessions;

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
  private oncreated(tab: chrome.tabs.Tab) {
    util.log('[SessionManager] chrome.tabs.onCreated', tab);
    if (tab.url.match(util.CHROME_EXCEPTION_URL)) return;
    let session = this.getSessionFromWinId(tab.windowId);
    if (session) session.updateTab(tab);
  }

  /**
   * Updates tab info
   * @param  {Integer}          tabId       first argument of chrome.tabs.onUpdated.addListener
   * @param  {Object}           changeInfo  second argument of chrome.tabs.onUpdated.addListener
   * @param  {chrome.tabs.Tab}  tab         third argument of chrome.tabs.onUpdated.addListener
   */
  private onupdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    util.log('[SessionManager] chrome.tabs.onUpdated', tabId, changeInfo, tab);
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
      util.log('[SessionManager] removing a tab which transitioned to url starting with "chrome://"');
    }
  }

  /**
   * Removes a tab from project
   * @param  {Integer} tabId        first argument of chrome.tabs.onRemoved.addListener
   * @param  {Object} removeInfo    second argument of chrome.tabs.onRemoved.addListener
   */
  private onremoved(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
    let winId = removeInfo.windowId;
    util.log('[SessionManager] chrome.tabs.onRemoved', tabId, removeInfo);

    let session = this.getSessionFromWinId(winId);

    // When closing the window, remove session.
    if (removeInfo.isWindowClosing && session) {
      util.log('[SessionManager] Skip removing tab', removeInfo);
    } else if (session) {
      session.removeTab(tabId);
      if (session.tabs.length === 0) {
        util.log('[SessionManager] removing the session %o itself since all tabs are closing', session);
        this.removeSessionFromProjectId(session.id);
      }
      UpdateManager.storeSessions();
    } else {
      util.log('[SessionManager] tab %s being removed was not in the session being tracked', tabId);
    }
  }

  /**
   * [onmoved description]
   * @param  {Integer} tabId    [description]
   * @param  {Object} moveInfo [description]
   */
  private onmoved(tabId: number, moveInfo: chrome.tabs.TabMoveInfo) {
    util.log('[SessionManager] chrome.tabs.onMoved', tabId, moveInfo);
    let session = this.getSessionFromWinId(moveInfo.windowId);
    if (session) {
      session.sortTabs();
      util.log('[SessionManager] moved tab from %d to %d', moveInfo.fromIndex, moveInfo.toIndex);
    }
    UpdateManager.storeSessions();
  }

  /**
   * [onreplaced description]
   * @param  {Integer} addedTabId   [description]
   * @param  {Integer} removedTabId [description]
   */
  private onreplaced(addedTabId: number, removedTabId: number) {
    util.log('[SessionManager] chrome.tabs.onReplaced', addedTabId, removedTabId);
    this.removeTab(removedTabId);
    UpdateManager.storeSessions();
  }

  /**
   * [onattached description]
   * @param  {Integer} tabId      [description]
   * @param  {Object} attachInfo [description]
   */
  private async onattached(tabId: number, attachInfo: chrome.tabs.TabAttachInfo) {
    util.log('[SessionManager] chrome.tabs.onAttached', tabId, attachInfo);
    let win = await getWindowInfo(attachInfo.newWindowId);
    if (win === undefined) return;
    let session = this.getSessionFromWinId(attachInfo.newWindowId);
    // If this tab generates new window, it should be a new session
    if (!session) {
      session = new SessionEntity(win);
      this.sessions.unshift(session);
    }
    chrome.tabs.get(tabId, tab => {
      session.addTab(tab);
      util.log('[SessionManager] added tab %d to window', tabId, attachInfo.newWindowId);
      UpdateManager.storeSessions();
    });
  }

  /**
   * [ondetached description]
   * @param  {Integer} tabId      [description]
   * @param  {Object} detachInfo [description]
   */
  private ondetached(tabId: number, detachInfo: chrome.tabs.TabDetachInfo) {
    util.log('[SessionManager] chrome.tabs.onDetached', tabId, detachInfo);
    let oldSession = this.getSessionFromWinId(detachInfo.oldWindowId);
    if (!oldSession) return;
    oldSession.removeTab(tabId);
    if (oldSession.tabs.length === 0) {
      this.removeSessionFromWinId(oldSession.winId);
    }
    util.log('[SessionManager] removed tab %d from window', tabId, detachInfo.oldWindowId);
    UpdateManager.storeSessions();
  }

  /**
   * [onactivated description]
   * @param  {Integer} activeInfo [description]
   */
  private async onactivated(activeInfo: chrome.tabs.TabActiveInfo) {
    util.log('[SessionManager] chrome.tabs.onActivated', activeInfo);
    let win = await getWindowInfo(activeInfo.windowId);
    if (win === undefined) return;
    this.activeInfo.tabId    = activeInfo.tabId; // not used
    this.activeInfo.windowId = activeInfo.windowId;
  }

  private async onwindowcreated(_win: chrome.windows.Window) {
    // ignore windows that are devtools, chrome extension, etc
    if (_win.type !== 'normal' || _win.id === chrome.windows.WINDOW_ID_NONE) return;

    util.log('[SessionManager] chrome.windows.onCreated', _win);
    let win = await getWindowInfo(_win.id);
    // If this is a project intentionally opened
    if (this.openingProject) {
      util.log('[SessionManager] Intentionally opened window', win);
      let session = this.getSessionFromProjectId(this.openingProject);
      if (session) {
        // If session found, update its winId
        session.setWinId(win.id);
        // Move session to the top of the list
        this.removeSessionFromWinId(win.id);
      } else {
        // If not, create a new session
        session = new SessionEntity(win);
        session.setId(this.openingProject);
      }
      this.sessions.unshift(session);

      this.setActiveSession(win.id, session);
      this.openingProject = '';
    } else {
      util.log('[SessionManager] Unintentionally opened window', win);
      // Loop through existing sessions to see if there's an identical one
      // This happens when
      // * Restoring previous session (Chrome's native feature)
      // * Opening a profile
      // * Opening a new window after closing all
      for (let session of this.sessions) {
        if (session.winId) continue;
        if (this.compareTabs(win, session)) {
          // set project id and title to this session and make it bound session
          session.setWinId(win.id);
          util.log('[SessionManager] Associated with a previous session', session);
          this.setActiveSession(win.id, session);
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
  }

  /**
   * [onwindowfocuschanged description]
   * @param  {Integer} winId [description]
   */
  private onwindowfocuschanged(winId: number) {
    util.log('[SessionManager] chrome.windows.onFocusChanged', winId);
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
  private onwindowremoved(winId: number) {
    if (winId === chrome.windows.WINDOW_ID_NONE) return;
    util.log('[SessionManager] chrome.windows.onRemoved', winId);
    let session = this.getSessionFromWinId(winId);
    if (!session) return;
    // Move session to the top of the list
    this.removeSessionFromWinId(winId);
    session.unsetWinId();

    this.sessions.unshift(session);
    UpdateManager.storeSessions();
  }

  /**
   * Removes session of given id
   * @param  {String} id [description]
   * @return Promise A promise that resolves with session object
   */
  public removeSessionFromId(id: string): Promise<SessionEntity> {
    let index = this.sessions.findIndex(session => {
      return session.id === id;
    });
    if (index > -1) {
      let session = this.sessions.splice(index, 1)[0];
      util.log(`[SessionManager] removed session of id:`, id);
      UpdateManager.storeSessions();
      return Promise.resolve(session);
    } else {
      return Promise.resolve(null);
    }
  }

  // TODO: What is different between `removeSessionFromId()` and `removeSessionFromProjectId`?

  /**
   * Removes session of given project id
   * @param  {String} projectId [description]
   * @return Promise A promise that resolves with session object
   */
  public removeSessionFromProjectId(projectId: string): Promise<SessionEntity> {
    let index = this.sessions.findIndex(session => {
      return session.id === projectId;
    });
    if (index > -1) {
      let session = this.sessions.splice(index, 1)[0];
      util.log('[SessionManager] removed session of project id:', projectId);
      UpdateManager.storeSessions();
      return Promise.resolve(session);
    } else {
      return Promise.resolve(null);
    }
  }

  /**
   * Removes session of given window id
   * @param   {String}    winId
   * @return  {Boolean}
   */
  public removeSessionFromWinId(winId: number): Promise<SessionEntity> {
    let index = this.sessions.findIndex(session => {
      return session.winId === winId;
    });
    if (index > -1) {
      let session = this.sessions.splice(index, 1)[0];
      util.log('[SessionManager] removed session of window id:', winId);
      UpdateManager.storeSessions();
      return Promise.resolve(session);
    } else {
      return Promise.resolve(null);
    }
  }

  public unsetWinId(winId: number): boolean {
    let session = this.sessions.find(session => {
      return session.winId === winId;
    });
    if (session) {
      session.unsetWinId();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns an array of sessions
   * @return  {Array} sessions
   */
  public getSessions(): Array<SessionEntity> {
    return this.sessions;
  }

  /**
   * [getSession description]
   * @param  {String}                  projectId   project id of the session to get
   * @return {SessionEntity|undefined}
   */
  public getSessionFromProjectId(projectId: string): SessionEntity {
    return this.sessions.find(session => {
      return session.id === projectId;
    });
  }

  /**
   * [getSessionFromWinId description]
   * @param  {Integer} winId [description]
   * @return {[type]}       [description]
   */
  public getSessionFromWinId(winId: number): SessionEntity {
    return this.sessions.find(session => {
      return session.winId === winId;
    });
  }

  /**
   * [setActiveSession description]
   * @param {integer} winId   session window id
   * @param {string}  session optional session id
   */
  public setActiveSession(winId: number, session: SessionEntity) {
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
    util.log('[SessionManager] active session info updated', this.activeInfo);
  }

  /**
   * [getActiveSession description]
   * @return {SessionEntity} [description]
   */
  public getActiveSession(): SessionEntity {
    let winId = this.getCurrentWindowId();
    if (!winId) return undefined;
    let session = this.getSessionFromWinId(winId);
    util.log('[SessionManager] Got active session', session);
    return session;
  }

  /**
   * [getCurrentWindowId description]
   * @return {[type]} [description]
   */
  public getCurrentWindowId(): number {
    var winId = this.activeInfo.windowId;
    // TODO: confirm the type
    return winId || null;
  }

  /**
   * Removes tab from session without knowing which session it belongs to.
   * @param  {Integer} tabId  Tab id of which to remove
   * @return {Boolean}       [description]
   */
  public removeTab(tabId: number): boolean {
    for (let session of this.sessions) {
      let tab = session.tabs.find(tab => {
        return tab.id === tabId;
      });
      if (tab) {
        session.removeTab(tabId);
        return true;
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
  public compareTabs(win: chrome.windows.Window, session: SessionEntity): boolean {
    let similar = 0, count = 0;

    // Loop through all tabs in temporary session
    for (let tab of win.tabs) {
      if (tab.url.match(util.CHROME_EXCEPTION_URL)) continue;
      count++;
      // Loop through all tabs in previous session
      for (let t of session.tabs) {
        // Check if tab url is similar
        if (util.resembleUrls(t.url, tab.url)) {
          similar++;
        }
      }
    }

    util.log('[SessionManager] %d/%d similar tabs found between window %d:%o and project %s:%o', similar, count, win.id, win, session.id, session);
    // similarity threshold is hardcoded as 80%
    return similar > 0 && similar/count >= 0.8 ? true : false;
  }

  /**
   * Clear sessions with duplicate project id assigned
   * @param {Array<SessionEntity>} sessions Array of SessionEntities to be cleaned
   * @return Array<SessionEntity>
   */
  public cleanSessions(sessions: Array<SessionEntity>): Array<SessionEntity> {
    util.log('[SessionManager] Cleaning sessions: %o', sessions);
    let projects = [];
    for (let i = 0; i < sessions.length; i++) {
      let id = sessions[i].id;
      if (projects.includes(id)) {
        sessions.splice(i--, 1);
      } else if (id !== null) {
        projects.push(id);
      }
    }
    util.log('[SessionManager] Cleaning done: %o', sessions);
    return sessions;
  }

  /**
   * Exports sessions
   * @return {Object}
   */
  public export(): Object {
    return {
      sessions: this.getSessions()
    };
  }

  /**
   * Resume sessions from previous one
   */
  public resumeSessions(): Promise<any> {
    return new Promise(async resolve => {
      // Restore sessions
      let sessions = await UpdateManager.restoreSessions()
      // Cleans duplicate sessions
      sessions = this.cleanSessions(sessions);
      var prevSessions = sessions;

      chrome.windows.getAll({populate: true}, windows => {
        util.log('[SessionManager] Resuming sessions from windows', windows);

        // Loop through all open windows
        util.log('[SessionManager] Looping through windows.');
        Array.prototype.forEach.call(windows, win => {
          this.restoreSession(win, prevSessions);
        });

        // Loop through left sessions from previous ones to create unopened sessions
        util.log('[SessionManager] Looping through left previous sessions.');
        let unboundSessions = 0;
        for (let i = 0; i < prevSessions.length; i++) {
          let session = new SessionEntity(prevSessions[i]);

          // '-' in `id` indicates unbound session
          if (session.id.indexOf('-') === 0) {
            unboundSessions++;

            // Eliminate old sessions if specified
            if (this.maxSessions === -1 || unboundSessions <= this.maxSessions) {
              // `push` not `unshift`
              this.sessions.push(session);
              util.log('[SessionManager] A session without open window.', session);
            } else {
              util.log('[SessionManager] Max session number exceeded. Eliminating an old session.', session);
            }
          } else {
            this.sessions.push(session);
          }
          prevSessions.splice(i--, 1);
        }
        util.log('[SessionManager] Session list created.', sessionManager.sessions);
        resolve();
      });
    });
  }

  /**
   * Compare a window status with previous sessions
   * @param {Window} win Window object
   * @param {Array} prevSessions previous sessions array
   */
  public restoreSession(win: chrome.windows.Window, prevSessions: Array<SessionEntity>) {
    if (win.type !== 'normal' || win.id === chrome.windows.WINDOW_ID_NONE) return;

    // Create temporary non-bound session
    let session = new SessionEntity(win);
    // `unshift` not `push`
    this.sessions.unshift(session);

    // Loop through previous sessions to see if there's identical one
    let counter = 0;
    for (let _session of prevSessions) {
      if (this.compareTabs(win, _session)) {
        session.setId(_session.id);
        session.rename(_session.title);
        util.log('[SessionManager] A session with open window', session);
        prevSessions.splice(counter, 1);
      } else {
        counter++;
      }
    }
  }

  // TODO: Make this return a promise
  /**
   * [getSummary description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  public getTimeTable(date: string, callback: Function) {
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
            util.log('[SessionManager] Assigning session end time as start time of next one', session);
          // If next session doesn't exist, this is the last session
          } else {
            // Simply assign latest possible
            session.end = end > Date.now() ? Date.now() : end;
            util.log('[SessionManager] Assigning session end time as latest possible', session);
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
  public getSummary(_start: number, _end: number, callback: Function) {
    let start     = (new Date(_start)).getTime();
    let next_day  = (new Date(_end)).getTime() + (60 * 60 * 24 * 1000);
    let end       = (new Date(next_day)).getTime();
    db.getRange(db.SUMMARIES, start, end, summary => {
      let _summary = {};
      summary.forEach((session, i) => {
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
            util.log('[SessionManager] Assigning session end time as start time of next one', session);
          // If next session doesn't exist, this is the last session
          } else {
            // Simply remove that last session
            util.log('[SessionManager] Removing session since end time is not known', session);
            summary.splice(i, 1);
            return;
          }
        }
        _summary[id].duration += ~~((session.end - session.start) / 1000);
      });
      callback(_summary);
    });
  }

  public deleteOldSummary() {
    let boundDateOffset = config_.summaryRemains;
    let today = new Date().toDateString();
    let boundDate = (new Date(today)).getTime() - boundDateOffset;
    db.deleteOlder(db.SUMMARIES, boundDate, () => {
      util.log('[SessionManager] Old summary record has been deleted in database.');
    });
  }
}

export const sessionManager = new SessionManager();