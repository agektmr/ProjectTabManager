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
import '@polymer/paper-material';
import '@polymer/paper-item';
import '@polymer/paper-icon-button';
import '@polymer/iron-collapse';
import '@polymer/iron-icon';
import '@polymer/iron-icons';



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

  static styles = css`
    :host {
      display: block;
    }
    *:focus {
      outline: none;
    }
    :host:focus {
      outline: none;
    }
    paper-material[expanded] {
      margin: 0 0 1em 0;
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
      color: var(--primary-text-color);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      @apply(--layout-flex);
    }
    .title[active] {
      font-weight: bold;
      color: var(--primary-text-color);
    }
  `;

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
          ${this.expanded ? html`
          <paper-icon-button
            icon="create"
            @click="${this.onTapRename}"
            tabindex="-1"
            title="${l10n('edit')}">
          </paper-icon-button>
          ${!this.winId ? html`
          <paper-icon-button
            icon="delete"
            @click="${this.onTapRemove}"
            tabindex="-1"
            title="${l10n('remove')}">
          </paper-icon-button>
          `:''}
          `:''}
        </paper-item>
        <iron-collapse id="collapse" ?opened="${this.expanded}" tabindex="-1">
          ${!this.fields.length ? html`
          <paper-item class="layout">
            <paper-icon-button icon="icons:warning"></paper-icon-button>
            <span class="title">${l10n('no_bookmarks')}</span>
          </paper-item>
          `:''}
          ${this.expanded || this.initialized ? html`
          ${this.fields.map((field, index) => html`
          <ptm-bookmark
            index="${index}"
            url="${field.url}"
            fav-icon-url="${field.favIconUrl}"
            bookmark-id="${field.bookmarkId}"
            tab-id="${field.tabId}"
            site-title="${field.title}"
            project-id="${this.projectId}"
            @toggle-bookmark="${this.toggleBookmark}">
          </ptm-bookmark>`
          )}`:''}
        </iron-collapse>
      </paper-material>
    `;
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

  private toggle(e: MouseEvent) {
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

  private onTapRename(e: MouseEvent) {
    e.stopPropagation();
    this.fire('renmae-clicked', {
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
    // TODO: render
  }
}
