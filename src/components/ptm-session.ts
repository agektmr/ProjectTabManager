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
import { PtmProject } from './ptm-project';
import { l10n } from '../ts/ChromeL10N';
import './ptm-bookmark';
import '@polymer/paper-material/paper-material.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-collapse/iron-collapse.js';

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

  @property({
    type: Boolean,
    reflect: true
  })
  mouseover: boolean = false

  render() {
    return html`
      <style>
        :host {
          display: block;
        }
        *:focus {
          outline: none;
        }
        paper-material[expanded] {
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
        }
        .buttons.visible {
          display: block;
        }
      </style>
      <paper-material
        elevation="${this.expanded ? 2 : 0}"
        @mouseenter="${()=>{this.mouseover=true}}"
        @mouseleave="${()=>{this.mouseover=false}}"
        ?expanded="${this.expanded}"
        animated>
        <paper-item ?focused="${this.focused}" tabindex="-1">
          <paper-icon-button tabindex="-1"
            icon="${this.expanded ? 'expand-more' : 'expand-less'}"
            @click="${this.toggle}"></paper-icon-button>
          <div
            class="title"
            @click="${this.openProject}"
            ?active="${!!this.winId}">
            <!-- <paper-ripple></paper-ripple> -->
            <span>${this.projectTitle}</span>
          </div>
          <div class="buttons ${this.mouseover?'visible':''}">
            ${!this.winId ? html`
            <paper-icon-button
              icon="delete"
              @click="${this.onTapRemove}"
              tabindex="-1"
              title="${l10n('remove')}">
            </paper-icon-button>
            `:''}
            <paper-icon-button
              icon="link"
              @click="${this.onTapLink}"
              tabindex="-1"
              title="${l10n('link_session_to_a_project')}">
            </paper-icon-button>
            ${this.projectId.indexOf('-') === -1 ? html`
            <paper-icon-button
              icon="create"
              @click="${this.onTapRename}"
              tabindex="-1"
              title="${l10n('edit')}">
            </paper-icon-button>
            `:html`
            <paper-icon-button
              icon="notification:folder-special"
              @click="${this.onTapNewProject}"
              tabindex="-1"
              title="${l10n('create_a_new_project')}">
            </paper-icon-button>
            `}
          </div>
        </paper-item>
        <iron-collapse id="collapse" ?opened="${this.expanded}" tabindex="-1">
          <div class="collapse-content">
            ${!this.fields.length ? html`
            <paper-item class="layout">
              <paper-icon-button icon="icons:warning"></paper-icon-button>
              <span class="title">${l10n('no_tabs')}</span>
            </paper-item>
            `:''}
            ${this.initialized ? this.fields.map((field, index) => html`
            <ptm-bookmark
              index="${index}"
              url="${field.url}"
              fav-icon-url="${field.favIconUrl}"
              bookmark-id="${field.bookmarkId}"
              tab-id="${field.tabId}"
              site-title="${field.title}"
              project-id="${this.projectId}"
              @add-bookmark="${this.addBookmark}"
              @remove-bookmark="${this.removeBookmark}">
            </ptm-bookmark>
            `):''}
          </div>
        </iron-collapse>
      </paper-material>
    `;
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