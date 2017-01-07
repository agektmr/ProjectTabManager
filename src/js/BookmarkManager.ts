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

class BookmarkManager {
  rootId: string
  bookmarks: Array<chrome.bookmarks.BookmarkTreeNode>
  /**
   * [BookmarkManager description]
   * @param {[type]}   config   [description]
   */
  constructor() {
    this.rootId = null;
    this.bookmarks = [];
  }

  /**
   * Gets root chrome.bookmarks.BookmarkTreeNode object of given bookmark id
   * @param  {String}           parentId    Root bookmark folder id
   * @param  {String}           title       Root folder title
   * @return {Promise} [description]
   */
  private getBookmarkFolder(parentId: string, title: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(resolve => {
      chrome.bookmarks.getSubTree(parentId, bookmarks => {
        // Loop through bookmarks under parentId
        let folder = bookmarks[0].children.find(bookmark => {
          return bookmark.title === title;
        });
        if (folder) resolve(folder);

        // Create new root folder if not existing
        chrome.bookmarks.create({
          parentId: parentId,
          title:    title
        }, resolve);
      });
    });
  }

  /**
   * Creates bookmark under given bookmark id
   * @param  {String}            folderId
   * @param  {String}            title
   * @param  {String}            url
   */
  public addBookmark(folderId: string, title: string, url: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
      if (url.match(util.CHROME_EXCEPTION_URL)) reject();
      chrome.bookmarks.create({
        parentId: folderId,
        title: title,
        url: util.unlazify(url)
      }, bookmark => {
        this.load().then(() => resolve(bookmark), reject);
      });
      if (config_.debug) console.log('[BookmarkManager] added bookmark', title);
    });
  }

  /**
   * Removes a bookmark
   * @param  {String}           bookmarkId
   */
  public removeBookmark(bookmarkId: string): Promise<undefined> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.remove(bookmarkId, () => {
        this.load().then(resolve, reject);
      });
      if (config_.debug) console.log('[BookmarkManager] removed bookmark', bookmarkId);
    });
  }

  /**
   * Gets project list
   * @param {Boolean} force_reload whether reload bookmarks or not
   * @return {Array} Array of chrome.bookmarks.BookmarkTreeNode
   */
  public getRoot(force_reload: boolean): Promise<Array<chrome.bookmarks.BookmarkTreeNode>> {
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
  public addFolder(title: string = 'Untitled'): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.create({
        parentId: this.rootId,
        index:    0,
        title:    title
      }, folder => {
        if (config_.debug) console.log('[BookmarkManager] added new folder', folder);
        this.load().then(() => resolve(folder), reject);
      });
    });
  }

  /**
   * Renames folder bookmark under root
   * @param {[type]}   id       Bookmark id
   * @param {[type]}   title    New title
   */
  public renameFolder(id: string, title: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(resolve => {
      chrome.bookmarks.update(id, {title: title}, resolve);
    });
  }

  /**
   * Gets chrome.bookmarks.BookmarkTreeNode of given bookmark id
   * @param  {String}           bookmarkId
   */
  public getFolder(folderId: string): chrome.bookmarks.BookmarkTreeNode {
    return this.bookmarks.find(bookmark => {
      return folderId === bookmark.id;
    });
  }

  /**
   * Moves a bookmark to the archive folder
   * @param  {String}           bookmarkId
   */
  public archiveFolder(bookmarkId: string): Promise<chrome.bookmarks.BookmarkTreeNode> {
    return new Promise(async (resolve, reject) => {
      try {
        let archiveFolder = await this.getBookmarkFolder(this.rootId, config_.archiveFolderName);
        chrome.bookmarks.move(bookmarkId, {
          parentId: archiveFolder.id
        }, bookmark => {
          if (config_.debug) console.log('[BookmarkManager] archived a bookmark', bookmark);
          return this.load().then(resolve, reject);
        });
      } catch (error) {
        reject();
      }
    });
  }

  /**
   * [openEditWindow description]
   * @param  {[type]} bookmarkId [description]
   */
  public openEditWindow(bookmarkId: string = this.rootId): void {
    chrome.tabs.create({url: `chrome://bookmarks#${bookmarkId}`});
  }

  /**
   * [load description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  public load(): Promise<Array<chrome.bookmarks.BookmarkTreeNode>> {
    return new Promise((resolve, reject) => {
      this.getBookmarkFolder(config_.rootParentId, config_.rootName).then(folder => {
        this.rootId = folder.id;
        this.bookmarks = folder.children || [];
        resolve(this.bookmarks);
      }, reject);
    });
  }
}

const bookmarkManager = new BookmarkManager();

export default bookmarkManager;
