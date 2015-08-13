var BookmarkManager = (function() {
  'use strict'

  var config_ = null;

  /**
   * Gets root chrome.bookmarks.BookmarkTreeNode object of given bookmark id
   * @param  {String}           parentId    Root bookmark folder id
   * @param  {String}           title       Root folder title
   * @return {Promise} [description]
   */
  var getFolder = function(parentId, title) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.getSubTree(parentId, bookmarks => {
        var children = bookmarks[0].children;
        // Loop through bookmarks under parentId
        for (var i = 0; i < children.length; i++) {
          if (title === children[i].title) {
            resolve(children[i]);
            return;
          }
        }
        // Create new root folder if not existing
        chrome.bookmarks.create({
          parentId: String(parentId),
          title:    title
        }, resolve);
      });
    });
  };

  class BookmarkManager {
    /**
     * [BookmarkManager description]
     * @param {[type]}   config   [description]
     */
    constructor(config) {
      config_ = config;
      this.rootId = null;
      this.bookmarks = [];
    }

    /**
     * Creates bookmark under given bookmark id
     * @param  {String}            folderId
     * @param  {String}            title
     * @param  {String}            url
     */
    addBookmark(folderId, title, url) {
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
    removeBookmark(bookmarkId) {
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
    getRoot(force_reload) {
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
    addFolder(title) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.create({
          parentId: this.rootId,
          index:    0,
          title:    title || 'Untitled'
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
    renameFolder(id, title) {
      return new Promise((resolve, reject) => {
        chrome.bookmarks.update(id, {title: title}, resolve);
      });
    }

    /**
     * Gets chrome.bookmarks.BookmarkTreeNode of given bookmark id
     * @param  {String}           bookmarkId
     */
    getFolder(folderId) {
      for (var i = 0; i < this.bookmarks.length; i++) {
        if (folderId == this.bookmarks[i].id) {
          return this.bookmarks[i];
        }
      }
      return undefined;
    }

    /**
     * Moves a bookmark to the archive folder
     * @param  {String}           bookmarkId
     */
    archiveFolder(bookmarkId) {
      return new Promise((resolve, reject) => {
        getFolder(this.rootId, config_.archiveFolderName).then(archiveFolder => {
          if (archiveFolder) {
            chrome.bookmarks.move(bookmarkId, {parentId: archiveFolder.id}, bookmark => {
              if (config_.debug) console.log('[BookmarkManager] archived a bookmark', bookmark);
              this.load().then(() => resolve(bookmark), reject);
            });
          }
        }, reject);
      })
    }

    /**
     * [openEditWindow description]
     * @param  {[type]} bookmarkId [description]
     */
    openEditWindow(bookmarkId) {
      chrome.tabs.create({url:'chrome://bookmarks#' + (bookmarkId || this.rootId)});
    }

    /**
     * [load description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    load() {
      return new Promise((resolve, reject) => {
        getFolder(config_.rootParentId, config_.rootName).then(folder => {
          this.rootId = folder.id;
          this.bookmarks = folder.children || [];
          resolve(this.bookmarks);
        }, reject);
      });
    }
  }

  return BookmarkManager;
})();
