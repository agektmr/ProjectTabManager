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
import { l10n } from '../ts/ChromeL10N';
import { FieldEntity } from "../ts/FieldEntity";

import './ptm-bookmark';
import './ptm-list-item';
import '@polymer/iron-collapse/iron-collapse.js';
import '@material/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-icon-button';

import { PtmBase } from './ptm-base';

@customElement('ptm-project')
export class PtmProject extends PtmBase {
  // TODO: Remove properties as much as possible
  @property({
    type: Array
  })
  fields: FieldEntity[] = []

  @property({
    type: String,
    reflect: true,
    attribute: 'project-id'
  })
  projectId: string = ''

  @property({
    type: String,
    reflect: true,
    attribute: 'project-title'
  })
  projectTitle: string = ''

  @property({
    type: Number,
    reflect: true,
    attribute: 'win-id'
  })
  winId: number | undefined = undefined

  @property({
    type: Boolean,
    reflect: true
  })
  focused: boolean = false

  @property({
    type: Boolean,
    reflect: true
  })
  expanded: boolean = false

  @property({
    type: Boolean
  })
  initialized: boolean = false

  render() {
    return html`
      <style>
        :host {
          display: block;
        }
        *:focus {
          outline: none;
        }
        :host:focus {
          outline: none;
        }
        /* paper-material[expanded] {
          margin: 0 0 1em 0;
        }
        paper-item {
          padding: 0;
          font-size: 1.0em;
          background-color: var(--default-background-color);
          min-height: 24px;
          line-height: 16px;
          display: flex;
        }
        paper-item > *:not(:first-child):not(:last-child) {
          margin-right: 0 !important;
        }
        paper-icon-button {
          width: 24px;
          height: 24px;
          padding: 2px 4px 4px 4px;
          flex: 0 0 24px;
        }
        paper-item > paper-icon-button:first-child {
          padding-left: 2px;
          border-left: 2px white solid;
        }
        paper-item[focused] > paper-icon-button:first-child {
          border-left: 2px var(--accent-color) solid;
        } */
        .content {
          display: flex;
          align-items: center;
        }
        .title {
          cursor: pointer;
          color: var(--secondary-text-color);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          flex: 1 1 auto;
        }
        .title[active] {
          font-weight: bold;
          color: var(--primary-text-color);
        }
        .buttons {
          display: none;
          flex: 0 0 auto;
        }
        .content:hover .buttons {
          display: block;
        }
        mwc-list {
          height: var(--mdc-icon-button-size);
        }
        mwc-list[expanded] {
          height: auto;
        }
      </style>
      <mwc-list
        ?expanded="${this.expanded}">
        <ptm-list-item
          graphic="icon"
          ?focused="${this.focused}">
          <mwc-icon-button-toggle
            slot="graphic"
            ?on=${this.expanded}
            @click="${this.toggle}">
            <img slot="onIcon" src="../img/expand-more.svg">
            <img slot="offIcon" src="../img/expand-less.svg">
          </mwc-icon-button-toggle>
          <div class="content">
            <div
              class="title"
              @click="${this.openProject}"
              ?active="${!!this.winId}">
              <span>${this.projectTitle}</span>
            </div>
            <div class="buttons">
              ${!this.winId ? html`
              <mwc-icon-button
                @click="${this.onTapRemove}"
                title="${l10n('remove')}">
                <img src="../img/delete.svg">
              </mwc-icon-button>`:''}
              <mwc-icon-button
                @click="${this.onTapRename}"
                title="${l10n('edit')}">
                <img src="../img/create.svg">
              </mwc-icon-button>
            </div>
          </div>
        </ptm-list-item>
        <iron-collapse id="collapse" ?opened="${this.expanded}">
          ${!this.fields.length ? html`
          <ptm-list-item graphic="icon">
            <mwc-icon-button
              slot="graphic">
              <img src="../img/warning.svg">
            </mwc-icon-button>
            <span class="title">${l10n('no_bookmarks')}</span>
          </ptm-list-item>
          `:''}
          ${this.expanded || this.initialized ? html`
          ${this.fields.map((field, index) => html`
          <ptm-bookmark
            index="${index}"
            url="${field.url}"
            fav-icon-url="${field.favIconUrl}"
            bookmark-id="${field.bookmarkId || ''}"
            tab-id="${field.tabId || ''}"
            site-title="${field.title}"
            project-id="${this.projectId}"
            @add-bookmark="${this.addBookmark}"
            @remove-bookmark="${this.removeBookmark}">
          </ptm-bookmark>
          `)}`:''}
        </iron-collapse>
      </mwc-list>`;
  }

  // keyBindings: {
  //   'left right': '_onArrow',
  //   'enter': 'openProject'
  // }

  // hostAttributes: {
  //   tabindex: 0
  // }

  // observers: [
  //   '_focusedChanged(receivedFocusFromKeyboard)'
  // ]

  public firstUpdated() {
    this.initialized = true;
    // this.keyEventTarget = this;
  }

  protected toggle(e: MouseEvent) {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }

  public openProject(e: MouseEvent) {
    e.stopPropagation();
    // Let PtmApp send openProject command
    this.fire('open-clicked', {
      id: this.projectId
    });
  }

  // private _onArrow(e) {
  //   e.stopPropagation();
  //   switch (e.detail.key) {
  //     case 'left':
  //       this.expanded = false;
  //       break;
  //     case 'right':
  //       this.expanded = true;
  //       break;
  //   }
  // }

  protected onTapRename(e: MouseEvent) {
    e.stopPropagation();
    this.fire('rename-clicked', {
      id: this.projectId
    });
  }

  protected onTapRemove(e: MouseEvent) {
    e.stopPropagation();
    this.fire('remove-clicked', {
      id: this.projectId
    });
  }

  protected async addBookmark(
    e: CustomEvent
  ): Promise<void> {
    e.stopPropagation();
    try {
      const bookmark = await this.command('addBookmark', {
        projectId: this.projectId,
        tabId: e.detail.tabId
      });
      this.fire('reload');
      this.fire('show-toast', {
        text: l10n('bookmark_added')
      });
    } catch (e) {
      this.fire('show-toast', { text: e });
    }
  }

  protected async removeBookmark(
    e: CustomEvent
  ): Promise<void> {
    e.stopPropagation();
    try {
      const bookmark = await this.command('removeBookmark', {
        projectId: this.projectId,
        bookmarkId: e.detail.bookmarkId
      });
      this.fire('reload');
      this.fire('show-toast', {
        text: l10n('bookmark_removed')
      });
    } catch (e) {
      this.fire('show-toast', { text: e });
    }
  }
}
