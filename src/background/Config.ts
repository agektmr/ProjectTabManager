/**
 * /*
 * Copyright 2020 Eiji Kitamura
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Eiji Kitamura (agektmr@gmail.com)
 *
 * @format
 */

/// <reference path="../../node_modules/@types/chrome/index.d.ts" />

export declare type SyncConfig = {
  rootParentId: string;
  rootName: string;
  lazyLoad: boolean;
  maxSessions: -1 | 5 | 10;
};

export class Config {
  public rootParentId: string = '2';
  public rootName: string = 'Project Tab Manager';
  public lazyLoad: boolean = false;
  public maxSessions: -1 | 5 | 10 = -1;
  public archiveFolderName: string = '__Archive__';
  public summaryRemains: number = 60 * 60 * 24 * 30 * 2 * 1000;
  public debug: boolean = true;

  constructor() {
    let manifest = chrome.runtime.getManifest();
    if (manifest.key !== undefined) {
      // If there's key property exists in manifest, this is production
      this.debug = false;
    }
  }

  public async init(): Promise<void> {
    // TODO: Do we really need to do this?
    chrome.storage.onChanged.addListener(
      (
        change: { [key: string]: chrome.storage.StorageChange },
        areaName: string,
      ) => {
        if (change.config && areaName == 'sync') {
          const config = change.config.newValue;
          this.rootParentId = config?.rootParentId || this.rootParentId;
          this.rootName = config?.rootname || this.rootName;
          this.lazyLoad = config?.lazyLoad || this.lazyLoad;
          this.maxSessions = config?.maxSessions || this.maxSessions;
          if (this.debug)
            console.log('[Config] configuration updated.', config);
        }
      },
    );

    // TODO: Make sure overwriting this will be ok
    const config = await this.get();
    if (config) {
      this.rootParentId = config.rootParentId;
      this.rootName = config.rootName;
      this.lazyLoad = config.lazyLoad;
      this.maxSessions = config.maxSessions;
    } else {
      await this.sync();
    }
    if (this.debug) console.log('[Config] initialization finished', this);
  }

  public get(): Promise<SyncConfig> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get((items) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject();
        } else {
          if (items.config) {
            resolve(items.config);
          } else {
            resolve({
              rootName: this.rootName,
              rootParentId: this.rootParentId,
              lazyLoad: this.lazyLoad,
              maxSessions: this.maxSessions,
            });
          }
        }
      });
    });
  }

  public sync(config?: SyncConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(
        {
          config: {
            lazyLoad: config?.lazyLoad || this.lazyLoad,
            rootParentId: config?.rootParentId || this.rootParentId,
            rootName: config?.rootName || this.rootName,
            maxSessions: config?.maxSessions || this.maxSessions,
          },
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            reject();
          } else {
            console.log(
              'sessions stored.',
              this.lazyLoad,
              this.rootParentId,
              this.rootName,
            );
            resolve();
          }
        },
      );
    });
  }
}
