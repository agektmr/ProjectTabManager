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

/// <reference path="../../node_modules/@types/chrome/index.d.ts" />

import { Util } from './Util';
import { Config } from './Config';

export class BookmarkManager {
  static readonly archiveFolderName: string = '__Archive__'
  static config: Config

  static configure(
    config: Config
  ): void {
    BookmarkManager.config = config;
  }
  static async openBookmark(
    tabId: number | undefined,
    url: string
  ): Promise<void> {
    return new Promise(resolve => {
      Util.log('[BookmarkManager] Opening a bookmark', tabId, url);
      // If tab id is not assigned
      if (!tabId) {
        // Open new project entry
        chrome.tabs.create({url: url, active: true});
        return;
      }
      chrome.tabs.get(tabId, tab => {
        // If the project filed is not open yet
        if (!tab) {
          // Open new project entry
          chrome.tabs.create({url: url, active: true});
          return;
        }
        // If the project filed is already open
        chrome.windows.get(tab.windowId, win => {
          if (!win.focused) {
            // Move focus to the window
            chrome.windows.update(tab.windowId, {focused:true});
          }
          // Activate open project entry
          chrome.tabs.update(tabId, {active: true});
        });
      });
    });
  }

  static addBookmark(
    folderId: string,
    title: string = 'Untitled',
    url: string = ''
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(resolve => {
      if (url == '' || url.match(Util.CHROME_EXCEPTION_URL)) {
        resolve(undefined);
        return;
      }
      chrome.bookmarks.create({
        parentId: folderId,
        title: title,
        url: Util.unlazify(url)
      }, bookmark => resolve(bookmark));
    })
  }

  static removeBookmark(
    bookmarkId: string
  ): Promise<void> {
    return new Promise(resolve => {
      chrome.bookmarks.remove(bookmarkId, () => {
        Util.log('[BookmarkManager] removed bookmark', bookmarkId);
        resolve();
      });
    });
  }

  /**
   * [normalizeBookmarks description]
   * @param  {Array} src [description]
   * @param  {Array} dst [description]
   * @return {[type]}     [description]
   */
  static flat(
    src: chrome.bookmarks.BookmarkTreeNode[] = []
  ): chrome.bookmarks.BookmarkTreeNode[] {
    // @ts-ignore
    return src.flatMap((
      node: chrome.bookmarks.BookmarkTreeNode
    ) => {
      if (node.url || !node.children?.length) return node;
      return BookmarkManager.flat(node.children);
    });
  }

  static getRootFolder(): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(resolve => {
      chrome.bookmarks.getSubTree(BookmarkManager.config.rootParentId,
          bookmarks => {
        if (!bookmarks)
          throw '[BookmarkManager] Bookmark root not found.';
        const root = bookmarks[0].children?.find(bookmark => {
          return bookmark.title === BookmarkManager.config.rootName
        });
        if (root) {
          resolve(root);
        } else {
          chrome.bookmarks.create({
            parentId: BookmarkManager.config.rootParentId,
            title: BookmarkManager.config.rootName
          }, resolve);
        }
      });
    });
  }

  static async getBookmarkFolders(
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const root = await BookmarkManager.getRootFolder();
    return root?.children || [];
  }

  static addFolder(
    title: string = 'Untitled'
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(async resolve => {
      const root = await BookmarkManager.getRootFolder();
      chrome.bookmarks.create({
        parentId: root.id,
        title:    title
      }, folder => {
        Util.log('[BookmarkManager] added new folder', folder);
        resolve(folder);
      });
    });
  }

  static renameFolder(
    folderId: string,
    title: string
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(resolve => {
      chrome.bookmarks.update(folderId, {title: title}, resolve);
    });
  }

  static async getFolder(
    folderId: string = ''
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
      if (!folderId) reject();
      chrome.bookmarks.get(folderId, folders => {
        if (folders.length > 0) {
          resolve(folders[0]);
        } else {
          reject();
        }
      });
    });
  }

  static async archiveFolder(
    bookmarkId: string,
  ): Promise<void> {
    let folder: chrome.bookmarks.BookmarkTreeNode | undefined;
    const folders = await BookmarkManager.getBookmarkFolders();
    folder = folders?.find(folder => {
      return folder.title === BookmarkManager.archiveFolderName;
    });
    if (!folder) {
      folder = await BookmarkManager.addFolder(
        BookmarkManager.archiveFolderName);
    }
    chrome.bookmarks.move(bookmarkId, { parentId: folder.id });
    Util.log('[BookmarkManager] archived a bookmark', folder);
  }

  static async openWindow(
    bookmarks: chrome.bookmarks.BookmarkTreeNode[],
    lazify: boolean = false
  ): Promise<void> {
    let i = 0;
    return new Promise((resolve, reject) => {
      // open first tab with window
      chrome.windows.create({
        url: bookmarks[0].url,
        focused: true
      }, win => {
        if (!win) {
          reject();
          return;
        }
        // open bookmarks in window
        for (let bookmark of bookmarks) {
          // skip first bookmark and a folder
          if (i++ === 0 || bookmark.url === undefined)
            continue;

          let url = lazify ?
            bookmark.url : Util.lazify(bookmark.url, bookmark.title);
          chrome.tabs.create({
            windowId: win.id,
            url:      url,
            active:   false
          });
        }
        resolve();
      });
    });
  }

  static openEditWindow(
    bookmarkId: string
  ): void {
    chrome.tabs.create({url: `chrome://bookmarks?id=${bookmarkId}`});
  }
}