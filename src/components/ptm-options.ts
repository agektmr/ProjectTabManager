/**
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
**/

/// <reference path="../../node_modules/@types/chrome/index.d.ts" />

import { html, css, customElement, property } from "lit-element";
import { PtmBase } from './ptm-base';
import { SyncConfig } from '../ts/Config';
import { l10n } from '../ts/ChromeL10N';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
// import '@polymer/paper-menu/paper-menu.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '@polymer/paper-button/paper-button.js';

@customElement('ptm-options')
export class PtmOptions extends PtmBase {
  @property({
    type: Boolean
  })
  lazyLoad: boolean = false

  @property({
    type: String
  })
  rootName: string = 'Project Tab Manager'

  @property({
    type: Number
  })
  rootParent: number = 1

  @property({
    type: String
  })
  rootParentId: string = '2'

  @property({
    type: []
  })
  rootFolders: chrome.bookmarks.BookmarkTreeNode[] | undefined = []

  @property({
    type: Number
  })
  maxSessions: -1 | 5 | 10 = -1

  @property({
    type: Number
  })
  maxSessIdx: number = 0

  @property({
    type: Object
  })
  dialog: any

  @property({
    type: Boolean
  })
  debug: boolean = true

  private readonly maxSessCand = [ -1, 5, 10 ]

  static styles = css`
    iron-icon {
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
    paper-item {
      cursor: pointer;
      padding: 0 16px;
      margin: 0;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    p {
      color: var(--secondary-text-color);
    }
    .accent {
      color: var(--text-primary-color);
      background-color: var(--accent-color);
    }
    .buttons {
      padding: 10px 5px 10px 10px;
      @apply(--layout-horizontal);
      @apply(--layout-end-justified);
    }
  `;

  render() {
    return html`
    <paper-dialog id="dialog" modal>
      <h2>${l10n('settings')}</h2>
      <paper-dialog-scrollable>
        <paper-dropdown-menu id="root" label="${l10n('root_folder_location')}">
          <paper-menu class="dropdown-content" selected="${this.rootParent}">
            ${this.rootFolders?.map(item => html`
            <paper-item>${item.title}</paper-item>
            `)}
          </paper-menu>
        </paper-dropdown-menu><br/>
        <paper-input
          id="rootName"
          value="${this.rootName}"
          label="${l10n('root_folder_name')}">
        </paper-input>
        <p>${l10n('root_folder_location_help')}</p>
        <paper-toggle-button
          id="lazyLoad"
          ?checked="${this.lazyLoad}">
          ${l10n('disable_lazy_load')}
        </paper-toggle-button>
        <p>${l10n('disable_lazy_load_help')}</p>
        <paper-dropdown-menu id="sessions" label="${l10n('maximum_sessions')}">
          <paper-menu class="dropdown-content" selected="${this.maxSessIdx}">
            <paper-item>${l10n('unlimited')}</paper-item>
            <paper-item>5</paper-item>
            <paper-item>10</paper-item>
          </paper-menu>
        </paper-dropdown-menu><br/>
        <p>${l10n('maximum_sessions_help')}</p>
      </paper-dialog-scrollable>
      <div class="buttons">
        <paper-button
          @click="${this.close}"
          raised>
          ${l10n('cancel')}
        </paper-button>
        <paper-button
          class="accent"
          @click="${this.save}"
          raised>${l10n('save')}
        </paper-button>
      </div>
    </paper-dialog>
    `;
  }

  public async firstUpdated(): Promise<void> {
    this.dialog = this.querySelector('#dialog');
    chrome.bookmarks.getSubTree('0', bookmarks => {
      this.rootFolders = bookmarks[0].children;
    });

    const config = <SyncConfig>(await this.command('getConfig'));
    this.rootParentId = config.rootParentId;
    this.rootParent   = parseInt(config.rootParentId) - 1;
    this.rootName     = config.rootName || this.rootName;
    this.lazyLoad     = config.lazyLoad;
    this.maxSessions  = config.maxSessions;
    this.maxSessIdx   = this.maxSessCand.indexOf(this.maxSessions);
    if (this.debug) console.log('[Config] initialization finished');

    const manifest = chrome.runtime.getManifest();
    if (manifest.key !== undefined) {
      // If there's a key property exists in manifest, this is production
      this.debug = false;
    }
  }

  public async save() {
    // @ts-ignore
    this.maxSessions = this.maxSessCand[this.maxSessIdx];
    try {
      const config: SyncConfig = {
        lazyLoad:     this.lazyLoad,
        rootParentId: this.rootParent.toString(),
        rootName:     this.rootName,
        maxSessions:  this.maxSessions
      };
      await this.command('setConfig', { config: config });
      this.fire('show-toast', {
        text: 'Options saved.'
      });
      this.close();
    } catch (e) {
      this.fire('show-toast', {
        text: 'Chrome storage sync error'
      });
    }
  }

  public open() {
    this.dialog.open();
  }

  public close() {
    this.dialog.close();
  }
}
