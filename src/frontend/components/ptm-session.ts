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
import { l10n } from '../frontend/ChromeL10N';

import './ptm-bookmark';
import './ptm-list-item';
import '@polymer/iron-collapse/iron-collapse.js';
import '@material/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';

import { PtmProject } from './ptm-project';

@customElement('ptm-session')
export class PtmSession extends PtmProject {
  @property({
    type: String,
    reflect: true,
    attribute: 'session-id'
  })
  sessionId: string = ''

  @property({
    type: String,
    reflect: true,
    attribute: 'session-title'
  })
  sessionTitle: string = ''

  render() {
    return html`
      <style>
        :host {
          display: block;
        }
        *:focus {
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
          height: 32px;
        }
        mwc-list[expanded] {
          height: auto;
        }
      </style>
      <mwc-list
        ?expanded="${this.expanded}">
        <ptm-list-item
          graphic="avatar"
          ?focused="${this.focused}">
          <mwc-icon-button-toggle
            slot="graphic"
            ?on=${this.expanded}
            @click="${this.toggle}">
            <svg slot="onIcon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></g></svg>
            <svg slot="offIcon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"></path></g></svg>
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
                @click="${this.onTapLink}"
                title="${l10n('link_session_to_a_project')}">
                <img src="../img/link.svg">
              </mwc-icon-button>
              ${this.projectId.indexOf('-') === -1 ? html`
              <mwc-icon-button
                @click="${this.onTapRename}"
                title="${l10n('edit')}">
                <img src="../img/create.svg">
              </mwc-icon-button>`:html`
              <mwc-icon-button
                @click="${this.onTapNewProject}"
                title="${l10n('create_a_new_project')}">
                <img src="../img/folder-special.svg">
              </mwc-icon-button>`}
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
            <span class="title">${l10n('no_tabs')}</span>
          </ptm-list-item>
          `:''}
          ${this.initialized ? this.fields.map((field, index) => html`
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
          `):''}
        </iron-collapse>
      </mwc-list>`;
  }
  private onTapLink(e: MouseEvent) {
    e.stopPropagation();
    this.fire('link-clicked', {
      id: this.projectId
    });
  }

  private onTapNewProject(e: MouseEvent) {
    e.stopPropagation();
    this.fire('create-project', {
      id: this.projectId
    });
  }
}