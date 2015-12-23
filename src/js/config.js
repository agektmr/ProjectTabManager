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

'use strict';

class Config {
  constructor() {
    this.rootParentId = '2';
    this.rootName = 'Project Tab Manager';
    this.lazyLoad = true;
    this.debug = true;

    let manifest = chrome.runtime.getManifest();
    if (manifest.key !== undefined) {
      // If there's key property exists in manifest, this is production
      this.debug = false;
    }
  }

  init() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get((function(items) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject();
        } else {
          let conf = items.config || {};
          this.rootParentId = conf.rootParentId || '2';
          this.rootName     = conf.rootName     || 'Project Tab Manager';
          if (conf.lazyLoad !== undefined) {
            this.lazyLoad = conf.lazyLoad;
          }
          if (this.debug) console.log('[Config] initialization finished');
          resolve();
        }
      }).bind(this));

      chrome.storage.onChanged.addListener((change, areaName) => {
        if (areaName == 'sync' && 'config' in change) {
          var config = change.config.newValue;
          this.rootParentId = config.rootParentId;
          this.rootname     = config.rootname;
          this.lazyLoad     = config.lazyLoad;
          if (this.debug)
            console.log('[Config] configuration updated.', config);
        }
      });
    });
  }

  sync() {
    chrome.storage.sync.set({config: {
      lazyLoad:     this.lazyLoad,
      rootParentId: this.rootParentId,
      rootName:     this.rootName
    }}, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log('sessions stored.',
          this.lazyLoad, this.rootParentId, this.rootName);
      }
    });
  }

  get archiveFolderName() {
    return '__Archive__';
  }

  get summaryRemains() {
    return 60 * 60 * 24 * 30 * 2 * 1000; // 2 month ago
  }
};
