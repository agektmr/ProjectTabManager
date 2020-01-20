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

import { html, css, customElement, property } from "lit-element";
import { PtmBase } from './ptm-base';
import { l10n } from '../ts/ChromeL10N';
import { FieldEntity } from "../ts/FieldEntity";
import './ptm-bookmark';
import '@polymer/paper-material/paper-material.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-collapse/iron-collapse.js';

@customElement('ptm-session')
export class PtmSession extends PtmBase {
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

  static styles = css`
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
    }
    paper-item > *:not(:first-child):not(:last-child) {
      margin-right: 0 !important;
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
      @apply(--layout-flex);
    }
    .title[active] {
      font-weight: bold;
      color: var(--primary-text-color);
    }
  `

  render() {
    return html`
      <paper-material
        elevation="${this.expanded ? 2 : 0}"
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
          ${this.projectId.indexOf('-') === -1 && this.expanded ? html`
          <paper-icon-button
            icon="create"
            @click="${this.onTapRename}"
            tabindex="-1"
            title="${l10n('edit')}">
          </paper-icon-button>
          ${!this.winId ? html`
          <paper-icon-button
            icon="icons:delete"
            @click="${this.onTapRemove}"
            tabindex="-1"
            title="${l10n('remove')}">
          </paper-icon-button>
          `:''}
          `:html`
          <paper-icon-button
            icon="icons:delete"
            @click="${this.onTapRemove}"
            tabindex="-1"
            title="${l10n('remove')}">
          </paper-icon-button>
          <paper-icon-button
            icon="icons:link"
            @click="${this.onTapLink}"
            tabindex="-1"
            title="${l10n('link_session_to_a_project')}">
          </paper-icon-button>
          <paper-icon-button
            icon="notification:folder-special"
            @click="${this.onTapNewProject}"
            tabindex="-1"
            title="${l10n('create_a_new_project')}">
          </paper-icon-button>
          `}
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
              @toggle-bookmark="${this.toggleBookmark}">
            </ptm-bookmark>
            `):''}
          </div>
        </iron-collapse>
      </paper-material>
    `;
  }

  public firstUpdated() {
    // TODO: Why do I need this?
    this.initialized = true;
    // TODO:
    // this.keyEventTarget = this;
  }

  private toggle(e: MouseEvent) {
    e.stopPropagation();
    this.expanded = !this.expanded;
  }

  public openProject(e: MouseEvent) {
    e.stopPropagation();
    this.fire('open-clicked', {
      id: this.projectId
    });
  }

  // TODO:
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

  private onTapRename(e: MouseEvent) {
    e.stopPropagation();
    this.fire('rename-clicked', {
      id: this.projectId
    });
  }

  private onTapRemove(e: MouseEvent) {
    e.stopPropagation();
    this.fire('remove-clicked', {
      id: this.projectId
    });
  }

  private async toggleBookmark(
    e: CustomEvent
  ): Promise<void> {
    e.stopPropagation();

    const bookmark = await this.command('toggleBookmark', {
      projectId: this.projectId,
      tabId: e.detail.tabId
    });
    if (bookmark) {
      this.fire('show-toast', {
        text: l10n('bookmark_added')
      });
    } else {
      this.fire('show-toast', {
        text: l10n('bookmark_removed')
      });
    }
  }
}