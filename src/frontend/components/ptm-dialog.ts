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
import { l10n } from '../frontend/ChromeL10N';
import { IronMeta } from '@polymer/iron-meta/iron-meta';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import '@material/mwc-button';

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
    reflect: true
  })
  answer: string = ''

  @property({
    type: String
  })
  okay: string = ''

  @property({
    type: String
  })
  cancel: string = ''

  @property({
    type: Boolean,
  })
  isPrompt: boolean = false

  @property({
    type: Object
  })
  confirmed: Function = function() {};

  @property({
    type: Object,
  })
  canceled: Function = function() {};

  @property({
    type: Object
  })
  dialog: any

  render() {
    return html`
      <style>
        .vertical-center {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        paper-button {
          color: var(--text-primary-color);
          background-color: var(--default-primary-color);
        }
      </style>
      <mwc-dialog id="dialog" heading="${this.line1}">
        <div class="vertical-center">
          ${this.line2 ? html`
          <p>${this.line2}</p>
          ` : ''}
          ${this.isPrompt ? html`
          <mwc-textfield
            id="input"
            value="${this.answer}"
            placeholder="${this.placeholder}"
            autofocus>
          </mwc-textfield>
          ` : ''}
        </div>
        <mwc-button
          slot="secondaryAction"
          @click="${this.onCanceled}">
          ${this.cancel}
        </mwc-button>
        <mwc-button
          slot="primaryAction"
          @click="${this.onConfirmed}">
          ${this.okay}
        </mwc-button>
      </mwc-dialog>
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
    this.isPrompt = true;
    this.dialog?.show();
    return new Promise((resolve, reject) => {
      this.confirmed = resolve;
      this.canceled = reject;
    });
  }

  public confirm(
    qs: PtmDialogQueryString
  ): Promise<void> {
    this.line1 = qs.line1 || l10n('are_you_sure?');
    this.line2 = qs.line2 || l10n('undonable_operation');
    this.okay = qs.confirm || 'OK';
    this.cancel = qs.cancel || l10n('cancel');
    this.isPrompt = false;
    this.dialog?.show();
    return new Promise((resolve, reject) => {
      this.confirmed = resolve;
      this.canceled = reject;
    });
  }

  public close() {
    this.dialog?.close();
  }

  private onConfirmed(e: MouseEvent) {
    if (this.isPrompt) {
      const answer = this.querySelector('#input')?.value;
      this.confirmed(answer);
    } else {
      this.confirmed();
    }
    this.confirmed = function() {};
    this.canceled = function() {};
    this.close();
  }

  private onCanceled(e: MouseEvent) {
    this.canceled();
    this.canceled = function() {};
    this.confirmed = function() {};
    this.close();
  }
}
