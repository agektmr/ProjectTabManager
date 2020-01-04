/// <reference path="../../node_modules/@types/chrome/index.d.ts" />

import { Util } from './Util';

/**
 *  Tab entity which represents chrome.tabs.Tab
 *  @param {chrome.tabs.Tab} tab
 **/
export class TabEntity {
  public id?: number
  public title?: string
  public url?: string
  public pinned: boolean
  public favIconUrl: string

  constructor(
    tab: TabEntity | chrome.tabs.Tab
  ) {
    this.id =         tab.id;
    this.title =      tab.title || '';
    this.url =        Util.unlazify(tab.url) || '';
    this.pinned =     tab.pinned || false;
    this.favIconUrl = tab.favIconUrl || '/img/favicon.png';
  }
}
