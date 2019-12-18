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

/// <reference path="../../node_modules/@types/chrome/index.d.ts" />"

import Util from './Util';

/**
 * Gets root chrome.bookmarks.BookmarkTreeNode object under a given parent folder.
 * Creates if not existing.
 */
const getFolder = (
  parentId: string,
  title: string
): Promise<chrome.bookmarks.BookmarkTreeNode> => {
  return new Promise(resolve => {
    chrome.bookmarks.getSubTree(parentId, bookmarks => {
      const children = bookmarks[0].children;
      // Loop through bookmarks under parentId
      for (let child of children) {
        if (title === child.title) {
          resolve(child);
          return;
        }
      }
      // Create new root folder if not existing
      chrome.bookmarks.create({
        parentId: parentId,
        title:    title
      }, resolve);
    });
  });
}

class BookmarkManager {
  private rootId: string
  private bookmarks: chrome.bookmarks.BookmarkTreeNode[]
  private config: Config

  constructor(config: Config) {
    this.config = config;
    this.rootId = null;
    this.bookmarks = [];
  }

  public addBookmark(
    folderId,
    title,
    url
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
      if (url.match(Util.CHROME_EXCEPTION_URL)) reject();
      chrome.bookmarks.create({
        parentId: folderId,
        title: title,
        url: Util.unlazify(url)
      }, bookmark => {
        this.load().then(() => resolve(bookmark), reject);
      });
      if (this.config.debug) console.log('[BookmarkManager] added bookmark', title);
    });
  }

  public removeBookmark(
    bookmarkId: string
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.remove(bookmarkId, () => {
        this.load().then(resolve, reject);
      });
      if (this.config.debug) console.log('[BookmarkManager] removed bookmark', bookmarkId);
    });
  }

  public getRoot(
    force_reload: boolean
  ): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve, reject) => {
      if (force_reload) {
        this.load().then(resolve, reject);
      } else {
        resolve(this.bookmarks);
      }
    });
  }

  /**
   * Creates folder bookmark under root
   * @param {[type]}   title    [description]
   */
  public addFolder(
    title: string = 'Untitled'
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.create({
        parentId: this.rootId,
        index:    0,
        title:    title
      }, folder => {
        if (this.config.debug)
          console.log('[BookmarkManager] added new folder', folder);
        this.load().then(() => resolve(folder), reject);
      });
    });
  }

  /**
   * Renames folder bookmark under root
   * @param {[type]}   id       Bookmark id
   * @param {[type]}   title    New title
   */
  public renameFolder(
    id: string,
    title: string
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(resolve => {
      chrome.bookmarks.update(id, {title: title}, resolve);
    });
  }

  /**
   * Gets chrome.bookmarks.BookmarkTreeNode of given bookmark id
   * @param  {String}           bookmarkId
   */
  public getFolder(
    folderId: string
  ): chrome.bookmarks.BookmarkTreeNode {
    for (let bookmark of this.bookmarks) {
      if (folderId == bookmark.id) {
        return bookmark;
      }
    }
    return undefined;
  }

  /**
   * Moves a bookmark to the archive folder
   * @param  {String}           bookmarkId
   */
  public archiveFolder(
    bookmarkId: string
  ): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
      getFolder(this.rootId, this.config.archiveFolderName)
      .then(archiveFolder => {
        if (!archiveFolder)
          throw 'Archive folder not found';
        chrome.bookmarks.move(bookmarkId, { parentId: archiveFolder.id },
          bookmark => {
          if (this.config.debug)
            console.log('[BookmarkManager] archived a bookmark', bookmark);
          this.load().then(() => resolve(bookmark), reject);
        });
      }, reject);
    });
  }

  /**
   * [openEditWindow description]
   * @param  {[type]} bookmarkId [description]
   */
  public openEditWindow(
    bookmarkId: string = this.rootId
  ): void {
    chrome.tabs.create({url: `chrome://bookmarks#${bookmarkId}`});
  }

  /**
   * [load description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  public load(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve, reject) => {
      getFolder(
        this.config.rootParentId,
        this.config.rootName
      ).then(folder => {
        this.rootId = folder.id;
        this.bookmarks = folder.children || [];
        resolve(this.bookmarks);
      }, reject);
    });
  }
};

export default BookmarkManager;
