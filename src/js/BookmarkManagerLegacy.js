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
     * Renames folder bookmark under root
     * @param {[type]}   id       Bookmark id
     * @param {[type]}   title    New title
     * @param {Function} callback [description]
     */
    renameFolder: function(id, title, callback) {
      chrome.bookmarks.update(id, {title: title}, callback);
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