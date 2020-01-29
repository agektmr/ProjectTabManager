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

import { Config } from './Config';
import { ProjectManager } from './ProjectManager';
import { SessionManager } from './SessionManager';
import { BookmarkManager } from './BookmarkManager';
import { Util } from './Util';

let projectManager: ProjectManager;

chrome.runtime.onInstalled.addListener(details => {
  // Pop up history page only if the version changes in major (ex 2.0.0) or minor (ex 2.1.0).
  // Trivial change (ex 2.1.1) won't popu up.
  if (details.reason === 'update' &&
      chrome.runtime.getManifest().version.match(/0$/)) {
    chrome.tabs.create({url: chrome.extension.getURL('/CHANGELOG.html')});

  // Pop up help page on first installation
  } else if (details.reason === 'install') {
    chrome.tabs.create({url: chrome.extension.getURL('/README.html')});
  }
});

(async () => {
  const config = new Config();
  await config.init();
  Util.configure(config);
  BookmarkManager.configure(config);
  const sessionManager = new SessionManager(config);
  await sessionManager.resumeSessions()
  projectManager = new ProjectManager(config, sessionManager);
  await projectManager.update();
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    /**
     * **Commands**
     * update: {
     *   forceReload: boolean
     * }
     * createProject: {
     *   projectId: string
     *   title: string
     * }
     * renameProject: {
     *   projectId: string
     *   title: string
     * }
     * removeProject: {
     *   projectId: string
     * }
     * openProject: {
     *   projectId: string
     *   closeCurrent: boolean
     * }
     * getActiveProject: {}
     * getActiveWindowId: {}
     * getConfig: {}
     * setConfig: {
     *   config: SyncConfig
     * }
     * addBookmark: {
     *   tabId: number
     * }
     * removeBookmark: {
     *   bookmarkId: string
     * }
     * openBookmarkEditWindow: {}
     * openHelp: {}
     */
    const params = Object.values(msg.detail);
    Util.log('[Background] Received a command:', msg.command, params);
    // @ts-ignore
    ProjectManager.prototype[msg.command].apply(projectManager, params)
    .then((result: any) => {
      if (chrome.runtime.lastError) throw chrome.runtime.lastError.message;
      respond({result: result});
    }).catch((e: any) => {
      respond({error: e});
    });
    return true;
  });
})();
