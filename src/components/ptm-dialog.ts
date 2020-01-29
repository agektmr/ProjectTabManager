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

import { html, customElement, property } from "lit-element";
import { PtmBase } from './ptm-base';
import { l10n } from '../ts/ChromeL10N';
import { PaperDialogElement } from '@polymer/paper-dialog/paper-dialog';
import { IronMeta } from '@polymer/iron-meta/iron-meta';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';

export declare type PtmDialogQueryString = {
  line1: string,
  line2: string,
  answer?: string,
  placeholder?: string,
  confirm: string,
  cancel: string
}

@customElement('ptm-dialog')
export class PtmDialog extends PtmBase {
  @property({
    type: String
  })
  line1: string = ''

  @property({
    type: String
  })
  line2: string = ''

  @property({
    type: String
  })
  placeholder: string = ''

  @property({
    type: String,
  })
  answer: string = ''

  @property({
    type: String,
  })
  okay: string = ''

  @property({
    type: String,
  })
  cancel: string = ''

  @property({
    type: Boolean,
  })
  _isPrompt: boolean = false

  @property({
    type: Function
  })
  _confirmed: Function | undefined

  @property({
    type: Function,
  })
  _canceled: Function | undefined

  private dialog: PaperDialogElement | undefined

  render() {
    return html`
      <style>
        paper-dialog {
          --paper-dialog: {
            font-size: 1.0em;
            margin: 0 20px;
            max-width: none;
          };

          --paper-dialog-title: {
            white-space: normal;
            margin-top: 12px !important;
            padding: 0 16px;
            font-size: 1.4em;
          };

          --paper-dialog-scrollable: {
            margin-top: 10px;
            padding: 0 16px;
          };
        }
        paper-dialog .content {
          padding: 0 16px !important;
        }
        .accent {
          background-color: var(--accent-color);
        }
      </style>
      <paper-dialog id="dialog" modal>
        <h2>${this.line1}</h2>
        <div class="content">
          ${this.line2 ? html`
          <p>${this.line2}</p>
          ` : ''}
          ${this._isPrompt ? html`
          <paper-input
            id="input"
            value="${this.answer}"
            placeholder="${this.placeholder}"
            autofocus>
          </paper-input>
          ` : ''}
        </div>
        <div class="buttons">
          <paper-button
            raised
            @click="${this.onCanceled}">
            ${this.cancel}
          </paper-button>
          <paper-button
            class="accent"
            raised
            @click="${this.onConfirmed}">
            ${this.okay}
          </paper-button>
        </div>
      </paper-dialog>
    `;
  }

  public firstUpdated() {
    new IronMeta({type: 'dialog', key: 'confirm', value: this});
    this.dialog = this.querySelector('#dialog');
  }

  public prompt(
    qs: PtmDialogQueryString
  ): Promise<void> {
    this.line1 = qs.line1 || '';
    this.line2 = qs.line2 || l10n('undonable_operation');
    this.answer = qs.answer || '';
    this.placeholder = qs.placeholder || 'Enter value';
    this.okay = qs.confirm || 'OK';
    this.cancel = qs.cancel || l10n('cancel');
    this._isPrompt = true;
    this.dialog?.open();
    return new Promise((resolve, reject) => {
      this._confirmed = resolve || function() {};
      this._canceled = reject || function() {};
    });
  }

  public confirm(
    qs: PtmDialogQueryString
  ): Promise<void> {
    this.line1 = qs.line1 || l10n('are_you_sure?');
    this.line2 = qs.line2 || l10n('undonable_operation');
    this.okay = qs.confirm || 'OK';
    this.cancel = qs.cancel || l10n('cancel');
    this._isPrompt = false;
    this.dialog?.open();
    return new Promise((resolve, reject) => {
      this._confirmed = resolve || function() {};
      this._canceled = reject || function() {};
    });
  }

  public close() {
    this.dialog?.close();
  }

  private onConfirmed(e: MouseEvent) {
    if (this._isPrompt) {
      this._confirmed?.(this.answer);
    } else {
      this._confirmed?.();
    }
    this._confirmed = function() {};
    this._canceled = function() {};
    this.close();
  }

  private onCanceled(e: MouseEvent) {
    this._canceled?.();
    this._canceled = function() {};
    this._confirmed = function() {};
    this.close();
  }
}
