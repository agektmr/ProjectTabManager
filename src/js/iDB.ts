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

import config_ from './Config';
import util from './Utilities';

const error = function(e) {
  console.error('IndexedDB Error!', e);
};

const version = 4

class iDB {
  private db: IDBDatabase = null;
  private table: Object[] = [];
  SUMMARIES: string = 'summaries';
  SESSIONS: string = 'sessions';
  FAVICONS: string = 'favicons';
  public oncomplete: Function = null;
  public onprogress: Function = null;

  constructor() {
    if (!window.indexedDB) {
      throw 'Indexed Database API not supported on this browser';
    }
    var req = indexedDB.open('ProjectTabManager', version);
    req.onsuccess = e => {
      this.db = e.target.result;
    }
    req.onfailure = error;
    req.onupgradeneeded = e => {
      this.db = e.target.result;
      if (this.db.objectStoreNames.contains(this.SUMMARIES)) {
        this.db.deleteObjectStore(this.SUMMARIES);
      }
      this.db.createObjectStore(this.SUMMARIES, {keyPath: 'start'});
      if (this.db.objectStoreNames.contains(this.SESSIONS)) {
        this.db.deleteObjectStore(this.SESSIONS);
      }
      this.db.createObjectStore(this.SESSIONS, {keyPath: 'id'});
      if (this.db.objectStoreNames.contains(this.FAVICONS)) {
        this.db.deleteObjectStore(this.FAVICONS);
      }
      this.db.createObjectStore(this.FAVICONS, {keyPath: 'domain'});
      util.log('[IndexedDB] Database upgraded');
    };
  }

  public put(storeName: string, entry: Object, callback?: Function) {
    if (!this.db) return;
    let transaction = this.db.transaction([storeName], 'readwrite');
    transaction.oncomplete = () => {
      util.log('[IndexedDB] %s stored', storeName, entry);
      if (typeof callback === 'function') callback();
    };
    transaction.onerror = error;
    transaction.objectStore(storeName).put(entry);
  }

  public get(storeName: string, key: string): Promise<Object> {
    return new Promise(function(resolve, reject) {
      let result = null;
      let transaction = this.db.transaction([storeName], 'readonly');
      transaction.oncomplete = () => {
        util.log('[IndexedDB] Got %s', storeName, result);
        if (result) {
          resolve(result);
        } else {
          reject();
        }
      };
      transaction.onerror = e => {
        util.log('[IndexedDB] Database Error: %s', e.target.error.name);
        reject();
      };

      let req = transaction.objectStore(storeName).get(key);
      req.onsuccess = e => {
        result = e.target.result || null;
      };
    });
  }

  public getAll(storeName: string, callback: Function): Array<Object> {
    if (!this.db) return;
    let table = [];
    let transaction = this.db.transaction([storeName], 'readonly');
    transaction.oncomplete = () => {
      callback(table);
    };
    transaction.onerror = error;
    var req = transaction.objectStore(storeName).openCursor();
    req.onsuccess = (e) => {
      var cursor = e.target.result;
      if (cursor) {
        var data = cursor.value;
        table.push(data);
        cursor.continue();
      }
    };
  }

  public getRange(storeName: string, start: number, end: number, callback: Function) {
    if (!this.db) return;
    let table = [];
    let transaction = this.db.transaction([storeName], 'readonly');
    transaction.oncomplete = () => {
      callback(table);
    };
    transaction.onerror = error;
    let range = IDBKeyRange.bound(start, end, false, true);
    let req = transaction.objectStore(storeName).openCursor(range);
    req.onsuccess = e => {
      let cursor = e.target.result;
      if (cursor) {
        let data = cursor.value;
        table.push(data);
        cursor.continue();
      }
    };
  }

  public deleteAll(storeName: string, callback?: Function) {
    if (!this.db) return;
    this.table = [];
    let transaction = this.db.transaction([storeName], 'readwrite');
    transaction.oncomplete = callback;
    transaction.onerror = error;
    let store = transaction.objectStore(storeName);
    let req = store.openCursor();
    req.onsuccess = e => {
      let cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.key);
        cursor.continue();
      }
    };
  }

  public deleteOlder(storeName: string, boundDate: number, callback?: Function) {
    if (!this.db) return;
    this.table = [];
    let transaction = this.db.transaction([storeName], 'readwrite');
    transaction.oncomplete = callback;
    transaction.onerror = error;
    let range = IDBKeyRange.upperBound(boundDate, true);
    let req = transaction.objectStore(storeName).openCursor(range);
    req.onsuccess = e => {
      let cursor = e.target.result;
      if (cursor) {
        store.delete(cursor.key);
        cursor.continue();
      }
    };
  }
};

const db = new iDB();

export default db;