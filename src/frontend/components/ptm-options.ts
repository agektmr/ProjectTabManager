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

import { html, customElement, property } from "lit-element";
import { SyncConfig } from '../background/Config';
import { l10n } from '../frontend/ChromeL10N';

import '@material/mwc-select';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-switch';
import '@material/mwc-button';
import '@material/mwc-dialog';

import { PtmBase } from './ptm-base';
import { Select } from '@material/mwc-select';
import { Dialog } from '@material/mwc-dialog';

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
    type: Object
  })
  maxSess: Select | undefined

  @property({
    type: Object
  })
  root: Select | undefined

  @property({
    type: Object
  })
  dialog: Dialog | undefined

  @property({
    type: Boolean
  })
  debug: boolean = true

  private readonly maxSessCand = [ -1, 5, 10 ]

  render() {
    return html`
    <style>
      :host {
        font-size: 1.0em;
      }
      iron-icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
      paper-dialog {
        font-size: 1.0em;
        margin: 0 20px;
        max-width: none;
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
      paper-button {
        color: var(--text-primary-color);
        background-color: var(--default-primary-color);
      }
      .accent {
        color: var(--text-primary-color);
        background-color: var(--accent-color);
      }
      .buttons {
        padding: 10px 5px 10px 10px;
      }
    </style>
    <mwc-dialog id="dialog" heading="${l10n('settings')}">
      <mwc-select
        id="root"
        label="${l10n('root_folder_location')}">
        ${this.rootFolders?.map((item, i) => html`
        <mwc-list-item
          ?selected="${this.rootParent === i}">
          ${item.title}
        </mwc-list-item>
        `)}
      </mwc-select>
      <mwc-textfield
        id="rootName"
        value="${this.rootName}"
        label="${l10n('root_folder_name')}">
      </mwc-textfield>
      <p>${l10n('root_folder_location_help')}</p>
      <mwc-switch
        id="lazyLoad"
        ?checked="${this.lazyLoad}">
        ${l10n('disable_lazy_load')}
      </mwc-switch>
      <p>${l10n('disable_lazy_load_help')}</p>
      <mwc-select
        id="max_sessions"
        label="${l10n('maximum_sessions')}">
        <mwc-list-item ?selected="${this.maxSessions === -1}">
          ${l10n('unlimited')}
        </mwc-list-item>
        <mwc-list-item ?selected="${this.maxSessions === 5}">
          5
        </mwc-list-item>
        <mwc-list-item ?selected="${this.maxSessions === 10}">
          10
        </mwc-list-item>
      </mwc-select><br/>
      <p>${l10n('maximum_sessions_help')}</p>
      <mwc-button
        @click="${this.close}"
        slot="secondaryAction">
        ${l10n('cancel')}
      </mwc-button>
      <mwc-button
        @click="${this.save}"
        slot="primaryAction">
        ${l10n('save')}
      </mwc-button>
    </mwc-dialog>
    `;
  }

  public async firstUpdated(): Promise<void> {
    this.dialog = this.querySelector('#dialog');
    this.maxSess = this.querySelector('#max_sessions');
    this.root = this.querySelector('#root');
    chrome.bookmarks.getSubTree('0', bookmarks => {
      this.rootFolders = bookmarks[0].children;
    });

    const config = <SyncConfig>(await this.command('getConfig'));
    this.rootParentId = config.rootParentId;
    this.rootParent   = parseInt(config.rootParentId) - 1;
    this.rootName     = config.rootName || this.rootName;
    this.lazyLoad     = config.lazyLoad;
    this.maxSessions  = config.maxSessions;
    if (this.debug) console.log('[Config] initialization finished');

    const manifest = chrome.runtime.getManifest();
    if (manifest.key !== undefined) {
      // If there's a key property exists in manifest, this is production
      this.debug = false;
    }
  }

  public async save() {
    // @ts-ignore
    this.maxSessions = this.maxSessCand[this.maxSess.index];
    try {
      const config: SyncConfig = {
        lazyLoad:     this.lazyLoad,
        rootParentId: this.root?.index.toString() || '2',
        rootName:     this.rootName,
        // @ts-ignore
        maxSessions:  this.maxSessCand[this.maxSess.index]
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
    this.dialog?.show();
  }

  public close() {
    this.dialog?.close();
  }
}
