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

/// <reference path="../../node_modules/@types/chrome/index.d.ts" />

import { Config } from './Config';
import { Util } from './Util';
import { SessionEntity } from './SessionEntity';

/**
 * [getWindowInfo description]
 * @param  {Integer}   winId    [description]
 * @param  {Function} callback [description]
 */
function getWindowInfo(
  winId: number
): Promise<chrome.windows.Window | undefined> {
  return new Promise(resolve => {
    if (winId === chrome.windows.WINDOW_ID_NONE) {
      resolve(undefined);
    } else {
      chrome.windows.get(winId, { populate: true }, win => {
        if (chrome.runtime.lastError) {
          Util.log(`[SessionManager] window of id ${winId} not open`);
          resolve(undefined);
        } else if (!win || win.type !== 'normal') {
          resolve(undefined);
        } else {
          resolve(win);
        }
      });
    }
  });
};

declare type ActiveInfo = {
  id?: string,
  tabId?: number,
  windowId?: number
}

/**
 * [SessionManager description]
 */
export class SessionManager {
  public openingProject: string = ''
  private config: Config
  private activeInfo: ActiveInfo
  private maxSessions: any
  private sessions: SessionEntity[] = []
  private queue: chrome.tabs.Tab[] = []

  constructor(
    config: Config
  ) {
    this.config = config;
    this.activeInfo = {
      id:       undefined,
      tabId:    undefined,
      windowId: undefined
    };
    this.maxSessions = config.maxSessions;

    // set initial window id
    chrome.windows.getCurrent({ populate: true }, win => {
      this.activeInfo.tabId    = undefined;
      this.activeInfo.windowId = win.id;
    });

    // chrome.tabs.onCreated.addListener(this.onTabCreated.bind(this));
    chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
    chrome.tabs.onMoved.addListener(this.onTabMoved.bind(this));
    // chrome.tabs.onSelectionChanged.addListener(TODO);
    // chrome.tabs.onActiveChanged.addListener(TODO);
    chrome.tabs.onActivated.addListener(this.onTabActivated.bind(this));
    // chrome.tabs.onHighlightChanged.addListener(TODO);
    // chrome.tabs.onHighlighted.addListener(TODO);
    chrome.tabs.onDetached.addListener(this.onTabDetached.bind(this));
    chrome.tabs.onAttached.addListener(this.onTabAttached.bind(this));
    chrome.tabs.onRemoved.addListener(this.onTabRemoved.bind(this));
    chrome.tabs.onReplaced.addListener(this.onTabReplaced.bind(this));

    chrome.windows.onCreated.addListener(this.onWindowCreated.bind(this));
    chrome.windows.onFocusChanged.addListener(this.onWindowFocusChanged.bind(this));
    chrome.windows.onRemoved.addListener(this.onWindowRemoved.bind(this));
  }

  /**
   * Adds Project
   * @param {chrome.tabs.Tab} tab - adds a tab to project
   */
  public onTabCreated(
    tab: chrome.tabs.Tab
  ): void {
    Util.log('[SessionManager] chrome.tabs.onCreated', tab);
    if (!tab.url?.match(Util.CHROME_EXCEPTION_URL)) {
      const session = this.getSessionFromWinId(tab.windowId);
      session?.updateTab(tab);
    }
  }

  /**
   * Updates tab info
   * @param  {Integer} tabId       first argument of chrome.tabs.onUpdated.addListener
   * @param  {chrome.tabs.TabChangeInfo} changeInfo  second argument of chrome.tabs.onUpdated.addListener
   * @param  {chrome.tabs.Tab} tab         third argument of chrome.tabs.onUpdated.addListener
   * @returns void
   */
  public onTabUpdated(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ): void {
    Util.log('[SessionManager] chrome.tabs.onUpdated', tabId, changeInfo, tab);
    if (!tab.url?.match(Util.CHROME_EXCEPTION_URL)) {
      switch (tab.status) {
        case 'complete':
          this.onTabCreated.call(this, tab);
          this.tabComplete(tab);
          break;
        case 'loading':
          this.tabLoading(tab);
          break;
        default:
          Util.log('[SessionManager] changeInfo unexpectedly undefined.');
          break;
      }
    } else {
      const session = this.getSessionFromWinId(tab.windowId);
      if (!session) {
        Util.log('[SessionManager] session not found', tabId, changeInfo, tab);
      } else {
        session.removeTab(tabId);
        Util.log('[SessionManager] removing a tab which transitioned to url starting with "chrome://"');
      }
    }
  }

  /**
   * Removes a tab from project
   * @param  {Integer} tabId        first argument of chrome.tabs.onRemoved.addListener
   * @param  {Object} removeInfo    second argument of chrome.tabs.onRemoved.addListener
   */
  public onTabRemoved(
    tabId: number,
    removeInfo: chrome.tabs.TabRemoveInfo
  ): void {
    const winId = removeInfo.windowId;
    Util.log('[SessionManager] chrome.tabs.onRemoved', tabId, removeInfo);

    const session = this.getSessionFromWinId(winId);
    // When closing the window, remove session.
    if (removeInfo.isWindowClosing && session) {
      Util.log('[SessionManager] Skip removing tab', removeInfo);
    } else {
      if (session) {
        session.removeTab(tabId);
        if (session.tabs.length === 0) {
          Util.log('[SessionManager] removing the session %o itself since all tabs are closing', session);
          this.removeSessionFromProjectId(session.id);
        }
        this.storeSessions();
      } else {
        Util.log('[SessionManager] tab %s being removed was not in the tracking session', tabId);
      }
    }
  }

  /**
   * [onmoved description]
   * @param  {Integer} tabId    [description]
   * @param  {Object} moveInfo [description]
   */
  public onTabMoved(
    tabId: number,
    moveInfo: chrome.tabs.TabMoveInfo
  ): void {
    Util.log('[SessionManager] chrome.tabs.onMoved', tabId, moveInfo);
    const session = this.getSessionFromWinId(moveInfo.windowId);
    if (session) {
      session.sortTabs();
      Util.log('[SessionManager] moved tab from %d to %d', moveInfo.fromIndex, moveInfo.toIndex);
    }
    this.storeSessions();
  }

  /**
   * [onreplaced description]
   * @param  {Integer} addedTabId   [description]
   * @param  {Integer} removedTabId [description]
   */
  public onTabReplaced(
    addedTabId: number,
    removedTabId: number
  ): void {
    Util.log('[SessionManager] chrome.tabs.onReplaced', addedTabId, removedTabId);
    // TODO: Why there is no adding?
    this.removeTab(removedTabId);
    this.storeSessions();
  }

  /**
   * [onattached description]
   * @param  {Integer} tabId      [description]
   * @param  {Object} attachInfo [description]
   */
  public async onTabAttached(
    tabId: number,
    attachInfo: chrome.tabs.TabAttachInfo
  ): Promise<void> {
    Util.log('[SessionManager] chrome.tabs.onAttached', tabId, attachInfo);
    const win = await getWindowInfo(attachInfo.newWindowId);
    if (!win) return;
    let session = this.getSessionFromWinId(attachInfo.newWindowId);
    // If this tab generates new window, it should be a new session
    if (!session) {
      session = new SessionEntity(win);
      this.sessions.unshift(session);
    }
    chrome.tabs.get(tabId, tab => {
      // @ts-ignore
      session.addTab(tab);
      Util.log('[SessionManager] added tab %d to window', tabId, attachInfo.newWindowId);
      this.storeSessions();
    });
  }

  /**
   * [ondetached description]
   * @param  {Integer} tabId      [description]
   * @param  {Object} detachInfo [description]
   */
  public onTabDetached(
    tabId: number,
    detachInfo: chrome.tabs.TabDetachInfo
  ): void {
    Util.log('[SessionManager] chrome.tabs.onDetached', tabId, detachInfo);
    const old_session = this.getSessionFromWinId(detachInfo.oldWindowId);
    if (old_session) {
      old_session.removeTab(tabId);
      if (old_session.tabs.length === 0 && old_session.winId) {
        this.removeSessionFromWinId(old_session.winId);
      }
      Util.log('[SessionManager] removed tab %d from window', tabId, detachInfo.oldWindowId);
    }
    this.storeSessions();
  }

  /**
   * [onactivated description]
   * @param  {Integer} activeInfo [description]
   */
  public onTabActivated(
    activeInfo: chrome.tabs.TabActiveInfo
  ): void {
    Util.log('[SessionManager] chrome.tabs.onActivated', activeInfo);
    getWindowInfo(activeInfo.windowId).then(win => {
      if (!win) return;
      this.activeInfo.tabId    = activeInfo.tabId;
      this.activeInfo.windowId = activeInfo.windowId;
    });
  }

  public async onWindowCreated(
    win: chrome.windows.Window
  ): Promise<void> {
    // ignore windows that are devtools, chrome extension, etc
    if (win.type !== 'normal' || win.id === chrome.windows.WINDOW_ID_NONE) return;
    Util.log('[SessionManager] chrome.windows.onCreated', win);
    const win_ = await getWindowInfo(win.id);
    if (!win_) throw `[SessionManager] Created window not found (this shouldn't happen)`;
    // If this is a project intentionally opened
    if (this.openingProject !== '') {
      Util.log('[SessionManager] Intentionally opened window', win_);
      let session = this.getSessionFromProjectId(this.openingProject);
      if (session) {
        // If session found, update its winId
        session.setWinId(win_.id);
        // Move session to the top of the list
        this.removeSessionFromWinId(win_.id);
      } else {
        // If not, create a new session
        session = new SessionEntity(win_);
        session.setId(this.openingProject);
      }
      this.sessions.unshift(session);

      this.setActiveSession(win_.id, session);
      this.openingProject = '';
    } else {
      Util.log('[SessionManager] Unintentionally opened window', win_);
      // Loop through existing sessions to see if there's an identical one
      // This happens when
      // * Restoring previous session (Chrome's native feature)
      // * Opening a profile
      // * Opening a new window after closing all
      for (let session of this.sessions) {
        if (session.winId) continue;
        if (this.compareTabs(win_, session)) {
          // set project id and title to this session and make it a bound session
          session.setWinId(win_.id);
          Util.log('[SessionManager] Associated with a previous session', session);
          this.setActiveSession(win_.id, session);
          this.storeSessions();
          return;
        }
      }
      // Create new session
      const session = new SessionEntity(win_);
      this.sessions.unshift(session);
      this.setActiveSession(win_.id, session);
    }
    this.storeSessions();
  }

  /**
   * [onwindowfocuschanged description]
   * @param  {Integer} winId [description]
   */
  public onWindowFocusChanged(
    winId: number
  ): void {
    Util.log('[SessionManager] chrome.windows.onFocusChanged', winId);
    // // Put in database only if active session exists
    // if (this.activeInfo.start !== null) {
    //   this.activeInfo.end = (new Date()).getTime();
    //   db.put(db.SUMMARIES, this.activeInfo);
    // }

    const session = this.getSessionFromWinId(winId);
    this.setActiveSession(winId, session);
  }

  /**
   *
   *
   */
  public onWindowRemoved(
    winId: number
  ): void {
    if (winId === chrome.windows.WINDOW_ID_NONE) return;
    Util.log('[SessionManager] chrome.windows.onRemoved', winId);
    const session = this.getSessionFromWinId(winId);
    if (!session) return;
    // Move session to the top of the list
    this.removeSessionFromWinId(winId);
    session.unsetWinId();

    this.sessions.unshift(session);
    this.storeSessions();
  }

  // /**
  //  * Removes session of given id
  //  * @param  {String} id [description]
  //  * @return Promise A promise that resolves with session object
  //  */
  // public removeSessionFromId(
  //   id: string
  // ): Promise<SessionEntity[]> {
  //   let i = this.sessions.findIndex(session => session.id === id);
  //   if (i === -1) return Promise.reject();
  //   const sessions = this.sessions.splice(i, 1);
  //   Util.log(`[SessionManager] removed session of id:`, id);
  //   UpdateManager.storeSessions();
  //   return Promise.resolve(sessions);
  // }

  /**
   * Removes session of given project id
   * @param  {String} projectId [description]
   * @return Promise A promise that resolves with session object
   */

  public removeSessionFromProjectId(
    projectId: string
  ): Promise<SessionEntity[]> {
    let i = this.sessions.findIndex(session => session.id === projectId);
    if (i === -1) return Promise.reject();
    const sessions = this.sessions.splice(i, 1);
    Util.log('[SessionManager] removed session of project id:', projectId);
    this.storeSessions();
    return Promise.resolve(sessions);
  }

  /**
   * Removes session of given window id
   * @param   {String}    winId
   * @return  {Boolean}
   */
  public removeSessionFromWinId(
    winId: number
  ): Promise<SessionEntity[]> {
    let i = this.sessions.findIndex(session => session.winId === winId);
    if (i === -1) return Promise.reject();
    const sessions = this.sessions.splice(i, 1);
    Util.log('[SessionManager] removed session of win id:', winId);
    this.storeSessions();
    return Promise.resolve(sessions);
  }

  // /**
  //  * @param  {number} winId
  //  * @returns boolean
  //  */
  // public unsetWinId(
  //   winId: number
  // ): boolean {
  //   const session = this.getSessionFromWinId(winId);
  //   if (!session) return false;
  //   session.unsetWinId();
  //   return true
  // }

  /**
   * Returns an array of sessions
   * @return  {Array} sessions
   */
  public getSessions(): SessionEntity[] {
    return this.sessions;
  }

  /**
   * [getSession description]
   * @param  {String}                  projectId   project id of the session to get
   * @return {SessionEntity|undefined}
   */
  public getSessionFromProjectId(
    projectId: string
  ): SessionEntity | undefined {
    return this.sessions.find(session => session.id === projectId);
  }

  /**
   * [getSessionFromWinId description]
   * @param  {Integer} winId [description]
   * @return {[type]}       [description]
   */
  public getSessionFromWinId(
    winId: number
  ): SessionEntity | undefined {
    return this.sessions.find(session => session.winId === winId);
  }

  /**
   * Update `ActiveInfo`
   * @param {integer} winId   session window id
   * @param {SessionEntity}  session optional session id
   */
  public setActiveSession(
    winId: number,
    session?: SessionEntity
  ): void {
    if (session) {
      this.activeInfo.id        = session.id;
      // this.activeInfo.start     = (new Date()).getTime();
      // this.activeInfo.end       = null;
      this.activeInfo.windowId  = session.winId;

      // Put in database
      // db.put(db.SUMMARIES, this.activeInfo);
    } else {
      this.activeInfo.id        = undefined;
      // this.activeInfo.start     = null;
      // this.activeInfo.end       = null;
      this.activeInfo.windowId  = winId;
    }
    Util.log('[SessionManager] active session info updated', this.activeInfo);
  }

  /**
   * Returns a `SessionEntity` which is associated with currently active window.
   * @returns SessionEntity
   */
  public getActiveSession(): SessionEntity | undefined {
    const winId = this.getCurrentWindowId();
    if (!winId) return undefined;
    const session = this.getSessionFromWinId(winId);
    Util.log('[SessionManager] Got active session', session);
    return session;
  }

  /**
   * [getCurrentWindowId description]
   * @return {[type]} [description]
   */
  public getCurrentWindowId(): number | undefined {
    return this.activeInfo?.windowId;
  }

  /**
   * Removes tab from session without knowing which session it belongs to.
   * @param  {Integer} tabId  Tab id of which to remove
   * @return {Boolean}       [description]
   */
  public removeTab(
    tabId: number
  ): boolean {
    let i = this.sessions.findIndex(session => {
      if (session.tabs.findIndex(tab => tab.id === tabId) > -1) {
        session.removeTab(tabId);
        return true;
      } else {
        return false;
      }
    });
    return i > -1;
  }

  /**
   * [compareTabs description]
   * @param  {[type]} win
   * @param  {[type]} session
   * @return {[type]}
   */
  public compareTabs(
    win: chrome.windows.Window,
    session: SessionEntity
  ): boolean {
    let similar = 0, count = 0;

    // If no tabs, return `false`
    if (!win?.tabs?.length) return false;

    // Loop through all tabs in temporary session
    for (let tab of win.tabs) {
      if (tab.url?.match(Util.CHROME_EXCEPTION_URL)) continue;
      count++;
      // Loop through all tabs in previous session
      similar = session.tabs.reduce((acc, t) => {
        return Util.resembleUrls(
          Util.unlazify(t.url),
          Util.unlazify(tab.url)
        ) ? acc + 1 : acc;
      }, 0);
    }

    Util.log('[SessionManager] %d/%d similar tabs found between window %d:%o and project %s:%o', similar, count, win.id, win, session.id, session);
    // similarity threshold is hardcoded as 80%
    return similar !== 0 && similar/count >= 0.8 ? true : false;
  }

  /**
   * Clear sessions with duplicate project id assigned
   * @param {Array<SessionEntity>} sessions Array of SessionEntities to be cleaned
   * @return Array<SessionEntity>
   */
  public cleanSessions(
    sessions: SessionEntity[]
  ): SessionEntity[] {
    Util.log('[SessionManager] Cleaning sessions: %o', sessions);
    const projects: string[] = [];
    const sessions_ = sessions.filter(session => {
      if (projects.includes(session.id)) {
        return false;
      } else {
        projects.push(session.id);
        return true;
      }
    });
    Util.log('[SessionManager] Cleaning done: %o', sessions_);
    return sessions_;
  }

  /**
   * Exports sessions
   * @return {Object}
   */
  public export(): any {
    return { sessions: this.getSessions() };
  }

  /**
   * Resume sessions from previous one
   */
  public async resumeSessions(): Promise<void> {
    // Restore sessions
    let sessions = await this.restoreSessions()
    // Cleans duplicate sessions
    sessions = this.cleanSessions(sessions);
    const prev_sessions = sessions;
    const windows: chrome.windows.Window[] = await new Promise(resolve => {
      chrome.windows.getAll({populate: true}, windows => resolve(windows));
    });
    Util.log('[SessionManager] Resuming sessions from windows', windows);

    // Loop through all open windows
    Util.log('[SessionManager] Looping through windows.');
    for (let win of windows) {
      this.restoreSession(win, prev_sessions);
    }

    // Loop through left sessions from previous ones to create unopened sessions
    Util.log('[SessionManager] Looping through left previous sessions.');
    let unboundSessions = 0;
    const new_sessions = prev_sessions.filter(prev_session => {
      const session = new SessionEntity(prev_session);
      if (session.id.indexOf('-') === 0) {
        // Unbound session
        unboundSessions++;
        if (unboundSessions > this.maxSessions) {
          Util.log('[SessionManager] Max session number exceeded. Eliminating an old session.', session);
          return false;
        }
        // `push` not `unshift`
        Util.log('[SessionManager] A session without open window.', session);
      }
      return true;
    });
    this.sessions.concat(new_sessions);
    Util.log('[SessionManager] Session list created.', this.sessions);
  }

  /**
   * Compare a window status with previous sessions
   * @param {Window} win Window object
   * @param {Array} prev_sessions previous sessions array
   */
  public restoreSession(
    win: chrome.windows.Window,
    prev_sessions: SessionEntity[]
  ): void {
    if (win.type !== 'normal' || win.id === chrome.windows.WINDOW_ID_NONE) return;

    // Create temporary non-bound session
    const session = new SessionEntity(win);
    // `unshift` not `push`
    this.sessions.unshift(session);

    // Loop through previous sessions to see if there's identical one
    for (let i = 0; i < prev_sessions.length; i++) {
      if (this.compareTabs(win, prev_sessions[i])) {
        session.setId(prev_sessions[i].id);
        session.rename(prev_sessions[i].title);
        Util.log('[SessionManager] A session with open window', session);
        prev_sessions.splice(i--, 1);
      }
    }
  }

  /**
   * [initialize description]
   */
  private restoreSessions(): Promise<SessionEntity[]> {
    return new Promise((resolve, reject) => {
      // restore projects from chrome.storage.local
      chrome.storage.local.get(items => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject();
        } else {
          // 'projects' is a transitional solution
          const sessions = items['sessions'] || items['projects'] || [];
          Util.log('[SessionManager] restoring sessions from storage.', sessions);
          resolve(sessions);
        }
      });
    });
  }

  /**
   * Synchronize project status to chrome.storage.
   * Restores when on initialization.
   */
  private storeSessions(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(this.export(), () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject();
        } else {
          Util.log('[SessionManager] sessions stored.', this.sessions);
          resolve();
        }
      });
    });
  }

  /**
   * Add sync status to queue so that synchronization only happens when all status is clear.
   * @param {chrome.tabs.Tab} tab
   */
  private tabLoading(
    tab: chrome.tabs.Tab
  ): void {
    const i = this.queue.findIndex(session => session.id === tab.id);
    if (i > -1) {
      this.queue[i] = tab;
      Util.log('[SessionManager] tab %o loading. %d in total', tab, this.queue.length);
      return;
    }
    this.queue.push(tab);
    Util.log('[SessionManager] added tab %o. %d in total.', tab, this.queue.length);
  }

  /**
   * Removes completed sync status and kick start synchronization when all queue's gone.
   * @param {chrome.tabs.Tab} tab
   */
  private tabComplete(
    tab: chrome.tabs.Tab
  ): void {
    const i = this.queue.findIndex(session => session.id === tab.id);
    if (i > -1) {
      this.queue.splice(i, 1);
    }
    if (this.queue.length === 0) {
      Util.log('[SessionManager] Queue cleared. Storing session.');
      this.storeSessions();
    } else {
      Util.log('[SessionManager] tab %o sync completed. %o remaining', tab, this.queue);
    }
  }
  // /**
  //  * [getSummary description]
  //  * @param  {Function} callback [description]
  //  * @return {[type]}            [description]
  //  */
  // public getTimeTable(
  //   date: number,
  //   callback: Function
  // ): void {
  //   let start     = Util.getLocalMidnightTime(date);
  //   let next_day  = start + (60 * 60 * 24 * 1000);
  //   let end       = (new Date(next_day)).getTime();
  //   db.getRange(db.SUMMARIES, start, end, table => {
  //     table.forEach((session, i) => {
  //       // If end time not known
  //       if (session.end === null) {
  //         // If next session exists
  //         if (table[i+1]) {
  //           // Assign start time of next session as end time
  //           session.end = (new Date(table[i+1].start)).getTime();
  //           Util.log('[SessionManager] Assigning session end time as start time of next one', session);
  //         // If next session doesn't exist, this is the last session
  //         } else {
  //           // Simply assign latest possible
  //           session.end = end > Date.now() ? Date.now() : end;
  //           Util.log('[SessionManager] Assigning session end time as latest possible', session);
  //         }
  //       }
  //       table[i] = session;
  //     });
  //     callback(table);
  //   });
  // }

  // /**
  //  * [getSummary description]
  //  * @param  {[type]}   _start   [description]
  //  * @param  {[type]}   _end     [description]
  //  * @param  {Function} callback [description]
  //  * @return {[type]}            [description]
  //  */
  // public getSummary(
  //   _start: number,
  //   _end: number,
  //   callback: Function
  // ): void {
  //   let start     = (new Date(_start)).getTime();
  //   let next_day  = (new Date(_end)).getTime() + (60 * 60 * 24 * 1000);
  //   let end       = (new Date(next_day)).getTime();
  //   db.getRange(db.SUMMARIES, start, end, summary => {
  //     let _summary = {};
  //     summary.forEach(function(session, i) {
  //       let id = session.id;
  //       if (!_summary[id]) {
  //         _summary[id] = {
  //           duration: 0
  //         };
  //       }
  //       // If end time not known
  //       if (session.end === null) {
  //         // If next session exists
  //         if (summary[i+1]) {
  //           // Assign start time of next session as end time
  //           session.end = (new Date(summary[i+1].start)).getTime();
  //           Util.log('[SessionManager] Assigning session end time as start time of next one', session);
  //         // If next session doesn't exist, this is the last session
  //         } else {
  //           // Simply remove that last session
  //           Util.log('[SessionManager] Removing session since end time is not known', session);
  //           summary.splice(i, 1);
  //           return;
  //         }
  //       }
  //       _summary[id].duration += ~~((session.end - session.start) / 1000);
  //     });
  //     callback(_summary);
  //   });
  // }

  // public deleteOldSummary(): void {
  //   let boundDateOffset = config_.summaryRemains;
  //   let today = new Date().toDateString();
  //   let boundDate = (new Date(today)).getTime() - boundDateOffset;
  //   db.deleteOlder(db.SUMMARIES, boundDate, () => {
  //     Util.log('[SessionManager] Old summary record has been deleted in database.');
  //   });
  // }
}
