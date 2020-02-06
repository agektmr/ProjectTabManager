/*
Copyright 2020 Eiji Kitamura

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

import { TabEntity } from './TabEntity';
import { Util } from './Util';

/**
 * Window entity which represents chrome.windows.Window
 * @param {chrome.windows.Window} win
 */
export class SessionEntity {
  public id: string
  public winId?: number
  public title: string
  public tabs: TabEntity[]

  constructor(
    target: chrome.windows.Window | SessionEntity
  ) {
    // if target.focused is set, target is chrome.windows.Window object
    if ((<chrome.windows.Window>target).focused !== undefined) {
      target = <chrome.windows.Window>target;
      // project id for non-bound session can be anything
      // as long as it's unique.
      this.id     = `-${target.id}`;
      this.winId  = <number>target.id;
      this.title  = (new Date()).toLocaleString();

    // if project id is null, this is non-bound session (transitional solution)
    } else if (target.id === '') {
      target = <chrome.windows.Window>target;
      this.id     = `-${Math.floor(Math.random() * 100000)}`;
      this.winId  = undefined;
      this.title  = (new Date()).toLocaleString();

    // otherwise, target is SessionEntity object recovering from previous session
    } else {
      target = <SessionEntity>target;
      this.id     = <string>target.id;
      this.winId  = undefined;
      this.title  = target.title;
    }

    this.tabs = <TabEntity[]>[];
    if (target.tabs) {
      for (let tab of target.tabs) {
        this.addTab(tab);
      }
    }
    Util.log('[SessionEntity] Created a new session entity %o based on %o', this, target);
  }

  /**
   * Rename session title
   * @param {String} name
   */
  public rename(
    name: string
  ): void {
    this.title = name;
  }
  /**
   * Adds tab entity of given chrome.tabs.Tab
   * @param {chrome.tabs.Tab} tab
   */
  public addTab(
    tab: TabEntity | chrome.tabs.Tab
  ): void {
    if (!tab.url?.match(Util.CHROME_EXCEPTION_URL)) {
      // Create new tab entity
      this.tabs.push(new TabEntity(tab));
      this.sortTabs();
    }
  }

  /**
   *  Update TabEntity
   *  @param {chrome.tabs.Tab} tab  Tab object to update
   */
  public updateTab(
    tab: chrome.tabs.Tab | undefined
  ): void {
    if (!tab || tab.url?.match(Util.CHROME_EXCEPTION_URL)) return;
    // Find a tab with same id
    const i = this.tabs.findIndex(_tab => _tab.id === tab?.id);
    if (i > -1) {
      let new_tab = new TabEntity(tab);
      let old_tab = this.tabs.splice(i, 1, new_tab)[0];
      Util.log('[SessionEntity] updating tab %o to %o', old_tab, new_tab);
    } else {
      this.addTab(tab);
    }
  }

  /**
   *  Removes TabEntity
   *  @param    {Integer} tabId   id of a tab to remove
   *  @returns  {Boolean}
   **/
  public removeTab(
    tabId: number
  ): boolean {
    const i = this.tabs.findIndex(_tab => _tab.id === tabId);
    if (i === -1) return false;
    Util.log('[SessionEntity] removed tab %d from session %s', this.tabs[i].id, this.id);
    // Remove TabEntity
    this.tabs.splice(i, 1);
    if (this.tabs.length > 0) this.sortTabs();
    return true;
  }

  /**
   *  Sort TabEntity
   *  @returns  void
   **/
  public sortTabs(): void {
    // Skip if there's no winId
    if (!this.winId) return;

    // Sort tab order
    chrome.windows.get(this.winId, { populate: true }, win => {
      if (!win?.tabs) return;
      const tmp = [];
      for (let tab of win.tabs) {
        if (tab.url?.match(Util.CHROME_EXCEPTION_URL)) continue;
        let _tab = this.tabs.find(_tab => _tab.id === tab.id);
        if(_tab) tmp.push(_tab);
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
  public getTabs(): TabEntity[] {
    return this.tabs;
  }

  /**
   * [openSession description]
   */
  // TODO: Move to SessionManager
  public openTabs(
    lazify: boolean = false
  ): Promise<void> {
    Util.log('[SessionEntity] Opening a session', this);
    return new Promise(resolve => {
      // open first tab with window
      chrome.windows.create({
        url: this.tabs?.[0]?.url,
        focused: true
      }, win => {
        if (!win) return;
        this.tabs[0].id = win.tabs?.[0]?.id;

        // open bookmarks in window
        this.tabs.forEach((tab, i) => {
          if (tab?.pinned && tab.id && i === 0) {
            // Don't forget to make this pinned if required
            chrome.tabs.update(tab.id, {
              pinned: true
            });
          }
          if (!tab || !tab.url || i === 0) return; // skip if undefined or first tab (since it's already opened)
          let url = lazify ? tab.url : Util.lazify(tab.url, tab.title, tab.favIconUrl);
          chrome.tabs.create({
            windowId: win?.id,
            index:    i,
            url:      url,
            pinned:   tab.pinned,
            active:   false
          }, tab => {
            this.tabs[i].id = tab.id;
          });
        });
        resolve();
      });
    });
  }

  /**
   * Sets project id of this session
   * @param {String} projectId  project id
   */
  public setId(
    projectId: string
  ): void {
    this.id = projectId;
    Util.log('[SessionEntity] Assigned project %s to session %o', projectId, this);
  }

  /**
   * Unsets project id of this session
   */
  public unsetId(): void {
    Util.log('[SessionEntity] Removed project %s from session %o', this.id, this);
    this.id = '';
  }

  /**
   * [setWinId description]
   * @param {Integer} winId
   */
  public setWinId(
    winId: number
  ): void {
    this.winId = winId;
    Util.log('[SessionEntity] Assigned window %s to session %o', this.winId, this);
  }

  /**
   * [unsetWinId description]
   */
  public unsetWinId(): void {
    Util.log('[SessionEntity] Removed window %s from session %o', this.winId, this);
    this.winId = undefined;
  }
}
