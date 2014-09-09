/*
Copyright 2013 Eiji Kitamura

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
'use strict';

var idb = (function(config) {
  var error = function(e) {
    adding = false;
    console.error('IndexedDB Error!', e);
  };

  var version = 4,
      db      = null,
      config_ = config;

  var idb = function(config) {
    config_ = config;
    if (!window.indexedDB) {
      throw 'Indexed Database API not supported on this browser';
    }
    this.table = [];
    var req = indexedDB.open('ProjectTabManager', version);
    req.onsuccess = (function(e) {
      db = e.target.result;
    }).bind(this);
    req.onfailure = error;
    req.onupgradeneeded = (function(e) {
      db = e.target.result;
      if (db.objectStoreNames.contains(this.SUMMARIES)) {
        db.deleteObjectStore(this.SUMMARIES);
      }
      db.createObjectStore(this.SUMMARIES, {keyPath: 'start'});
      if (db.objectStoreNames.contains(this.SESSIONS)) {
        db.deleteObjectStore(this.SESSIONS);
      }
      db.createObjectStore(this.SESSIONS, {keyPath: 'id'});
      if (db.objectStoreNames.contains(this.FAVICONS)) {
        db.deleteObjectStore(this.FAVICONS);
      }
      db.createObjectStore(this.FAVICONS, {keyPath: 'domain'});
      if (config_.debug) console.log('[IndexedDB] Database upgraded');
    }).bind(this);
  };
  idb.prototype = {
    SUMMARIES: 'summaries',
    SESSIONS:  'sessions',
    FAVICONS:  'favicons',
    oncomplete: null,
    onprogress: null,
    put: function(storeName, entry, callback) {
      if (!db) return;
      var transaction = db.transaction([storeName], 'readwrite');
      transaction.oncomplete = (function() {
        if (config_.debug) console.log('[IndexedDB] %s stored', storeName, entry);
        if (typeof callback === 'function') callback();
      }).bind(this);
      transaction.onerror = error;
      transaction.objectStore(storeName).put(entry);
    },
    get: function(storeName, key) {
      return new Promise(function(resolve, reject) {
        var result = null;
        var transaction = db.transaction([storeName], 'readonly');
        transaction.oncomplete = function() {
          if (config_.debug) console.log('[IndexedDB] Got %s', storeName, result);
          if (result) {
            resolve(result);
          } else {
            reject();
          }
        };
        transaction.onerror = function(e) {
          if (config_.debug) console.log('[IndexedDB] Database Error: %s', e.target.error.name);
          reject();
        };
        var req = transaction.objectStore(storeName).get(key);
        req.onsuccess = function(e) {
          result = e.target.result || null;
        };
      });
    },
    getAll: function(storeName, callback) {
      if (!db) return;
      var table = [];
      var transaction = db.transaction([storeName], 'readonly');
      transaction.oncomplete = (function() {
        callback(table);
      }).bind(this);
      transaction.onerror = error;
      var req = transaction.objectStore(storeName).openCursor();
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          var data = cursor.value;
          table.push(data);
          cursor.continue();
        }
      }).bind(this);
    },
    getRange: function(storeName, start, end, callback) {
      if (!db) return;
      var table = [];
      var transaction = db.transaction([storeName], 'readonly');
      transaction.oncomplete = (function() {
        callback(table);
      }).bind(this);
      transaction.onerror = error;
      var range = IDBKeyRange.bound(start, end, false, true);
      var req = transaction.objectStore(storeName).openCursor(range);
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          var data = cursor.value;
          table.push(data);
          cursor.continue();
        }
      }).bind(this);
    },
    deleteAll: function(storeName, callback) {
      if (!db) return;
      this.table = [];
      var transaction = db.transaction([storeName], 'readwrite');
      transaction.oncomplete = callback;
      transaction.onerror = error;
      var store = transaction.objectStore(storeName);
      var req = store.openCursor();
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.key);
          cursor.continue();
        }
      }).bind(this);
    },
    deleteOlder: function(storeName, boundDate, callback) {
      if (!db) return;
      this.table = [];
      var transaction = db.transaction([storeName], 'readwrite');
      transaction.oncomplete = callback;
      transaction.onerror = error;
      var range = IDBKeyRange.upperBound(boundDate, true);
      var req = transaction.objectStore(storeName).openCursor(range);
      req.onsuccess = (function(e) {
        var cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.key);
          cursor.continue();
        }
      }).bind(this);
    }
  };
  return idb;
})();