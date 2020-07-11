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

import { FieldEntity } from './FieldEntity';
import { SessionEntity } from './SessionEntity'
import { TabEntity } from './TabEntity';
import { BookmarkManager } from './BookmarkManager';
import { Util } from './Util';
import { l10n } from './ChromeL10N';

/**
 * [ProjectEntity description]
 * @param {SessionEntity}                     session [description]
 * @param {chrome.bookmarks.BookmarkTreeNode} folder  [description]
 */
export class ProjectEntity {
  public id: string
  public title: string
  public fields: FieldEntity[] = []
  public session?: SessionEntity
  public bookmark?: chrome.bookmarks.BookmarkTreeNode

  constructor(
    session?: SessionEntity,
    bookmark?: chrome.bookmarks.BookmarkTreeNode
  ) {
    if (!session && !bookmark)
      throw '[ProjectEntity] Invalid ProjectEntity creation.';

    this.id           = bookmark?.id || session?.id || '';
    this.session      = session;
    this.bookmark     = bookmark;
    this.title        = bookmark?.title ||
                        session?.title ||
                        l10n('new_project');

    this.load(session?.tabs, bookmark?.children);
  }

  /**
   * [load description]
   * @param  {Array}            tabs      Array of chrome.tabs.Tab
   * @param  {Array}            bookmarks Array of chrome.bookmarks.BookmarkTreeNode
   * @return {[type]}             [description]
   */
  public load(
    tabs: TabEntity[] = [],
    bookmarks: chrome.bookmarks.BookmarkTreeNode[] = []
  ): void {
    this.fields = [];
    let copy = BookmarkManager.flat(bookmarks);

    // Loop through tabs
    for (let tab of tabs) {
      if (tab.url?.match(Util.CHROME_EXCEPTION_URL)) continue;
      let bookmark;
      // Loop through bookmarks to find matched one
      for (let j = 0; j < copy.length; j++) {
        if (Util.resembleUrls(tab?.url, copy[j]?.url)) {
          bookmark = copy.splice(j--, 1)[0];
          break;
        }
      }
      this.fields.push(new FieldEntity(this.id, tab, bookmark));
    }

    for (let c of copy) {
      this.fields.push(new FieldEntity(this.id, undefined, c));
    }
  }

  /**
   * [open description]
   * @return {[type]}            [description]
   */
  public async open(
    lazify: boolean = false
  ): Promise<boolean> {
    this.setBadgeText();

    // If there's no fields, open an empty window
    if (this.fields.length === 0) {
      chrome.windows.create({ focused: true });
      return true;

    // If there's a session
    } else if (this.session) {
      if (this.session.winId) {
        // And it is already open
        chrome.windows.update(this.session.winId, { focused: true });
      } else {
        // If the session is not open yet
        await this.session.openTabs(lazify);
      }
      return true;

    // If there's no session, open from bookmark
    } else if (this.bookmark) {
      Util.log('[ProjectEntity] Opening bookmarks', this.bookmark);

      const bookmarks = BookmarkManager.flat(this.bookmark.children);
      await BookmarkManager.openWindow(bookmarks, lazify);
      return true;
    }
    return false;
  }

  /**
   * Closes the project window
   * @return Promise returns promise object
   */
  public close(): void {
    if (this.session?.winId) {
      return chrome.windows.remove(this.session.winId);
    }
  }

  /**
   * Adds bookmark of given tab id
   * @param {Integer}         tabId
   */
  public async addBookmark(
    tabId: number
  ): Promise<chrome.bookmarks.BookmarkTreeNode | undefined> {
    const field = this.fields.find(field => field.tabId === tabId);
    if (!field) throw 'Tab not being tracked in current window.';

    const { title, url } = field;
    if (url === '') {
      throw "Unsync session. Adding bookmark failed because relevant tab counld't be found";
    }
    if (!this.bookmark) {
      const folder = await BookmarkManager.addFolder(this.title)
      this.id       = folder.id;
      this.bookmark = folder;
      if (this.session) {
        this.session.setId(folder.id);
      }
      const bookmark = await BookmarkManager.addBookmark(this.id, title, url);
      return this.mergeBookmark(bookmark);
    } else {
      const bookmark = await BookmarkManager.addBookmark(this.id, title, url);
      return this.mergeBookmark(bookmark);
    }
  }

  /**
   * Removes bookmark of given bookmark id
   * @param {Integer}         bookmarkId
   */
  public async removeBookmark(
    bookmarkId: string
  ): Promise<undefined> {
    await BookmarkManager.removeBookmark(bookmarkId);
    return undefined;
  }

  private mergeBookmark(
    bookmark: chrome.bookmarks.BookmarkTreeNode
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(async resolve => {
      this.bookmark = await BookmarkManager.getFolder(bookmark.parentId);
      this.load(this.session?.tabs, this.bookmark?.children);
      resolve(bookmark);
    });
  };


  /**
   * Opens this bookmark folder's edit window
   */
  public openBookmarkEditWindow(): void {
    BookmarkManager.openEditWindow(this.id);
  }

  /**
   * Associates a project with bookmark entity. Use when:
   * - creating new project from session
   * @param  {[type]} folder [description]
   * @return {[type]}        [description]
   */
  public associateBookmark(
    folder: chrome.bookmarks.BookmarkTreeNode
  ): void {
    this.id = folder.id; // Overwrite project id
    Util.log('[ProjectEntity] associated bookmark', folder);
    this.bookmark = folder;
    this.session?.setId(this.id); // Overwrite project id
    this.load(this.session?.tabs, this.bookmark.children);
  }

  /**
   * Remove association of a project with bookmark entity. Use when:
   * - unlinking bookmark with a session
   * - abondoning a session from linked project
   */
  public deassociateBookmark(): void {
    const projectId = this.session?.id;
    this.id = projectId?.indexOf('-') === 0 ? projectId : `-${projectId}`;
    Util.log('[ProjectEntity] deassociated bookmark', this.bookmark);
    this.bookmark = undefined;
    this.title = this.session?.title || l10n('new_project');
    this.session?.setId(this.id);
    this.load(this.session?.tabs, undefined);
  }

  /**
   * Sets badge text
   * @param {String} winId Window Id
   */
  public setBadgeText(): void {
    let text = this.title.substr(0, 4).trim() || '';
    Util.log(`[ProjectEntiry] Badge set to "${text}"`, this);
    chrome.browserAction.setBadgeText({text: text});
  }
}