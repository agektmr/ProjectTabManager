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

import { html, customElement, property } from 'lit-element';
import { PtmBase } from './ptm-base';
import '@polymer/paper-item/paper-item.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
import '@polymer/paper-icon-button/paper-icon-button.js';

declare class UrlCache {
  domain: string
  url: string
}

@customElement('ptm-bookmark')
export class PtmBookmark extends PtmBase {
  static DEFAULT_FAVICON_URL: string = '../img/favicon.png'
  static cache: { [domain: string]: UrlCache } = {}

  // TODO: Should I remove this?
  @property({
    type: Number,
  })
  index: number = 0

  @property({
    type: String,
    reflect: true
  })
  url: string = ''

  @property({
    type: String,
    reflect: true,
    attribute: 'fav-icon-url'
  })
  favIconUrl: string = ''

  @property({
    type: String,
    reflect: true,
    attribute: 'project-id'
  })
  projectId: string = ''

  @property({
    type: String,
    reflect: true,
    attribute: 'site-title'
  })
  siteTitle: string = ''

  @property({
    type: Number,
    reflect: true,
    attribute: 'tab-id'
  })
  tabId: number | undefined = undefined

  @property({
    type: String,
    reflect: true,
    attribute: 'bookmark-id'
  })
  bookmarkId: string = ''

  render () {
    return html`
      <style>
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
        .favicon {
          display: block;
          width: 16px;
          height: 16px;
          padding: 2px 4px 4px 4px;
          -webkit-user-select: none;
        }
        .title {
          cursor: pointer;
          color: #aaa;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          flex: 1 1 auto;
        }
        .title[active] {
          color: black;
        }
        #star {
          color: #D3D3D3;
        }
        #star[bookmarked] {
          color: #FAC12F;
        }
      </style>
      <paper-item tabindex="-1">
        <paper-icon-button
          src="${navigator.onLine && this.favIconUrl ? this.favIconUrl : PtmBookmark.DEFAULT_FAVICON_URL}">
        </paper-icon-button>
        <div class="title" @click="${this.open}" ?active="${!!this.tabId}">
          <!-- <paper-ripple recenters></paper-ripple> -->
          <span>${this.siteTitle}</span>
          <paper-tooltip>${this.siteTitle}<br/>${this.url}</paper-tooltip>
        </div>
        <!--Why this?-->
        ${this.projectId.indexOf('-') === -1 ? html`
        <paper-icon-button
          id="star"
          icon="icons:star"
          @click="${this.onTapStar}"
          ?bookmarked="${this.bookmarkId != 'undefined'}"
          tabindex="-1">
        </paper-icon-button>
        `:''}
      </paper-item>`
  }

  public firstUpdated() {
    // TODO:
    // this.keyEventTarget = this;
    // this.addOwnKeyBinding('enter', 'open');

    this.readFavicon();
  }

  public async open(
    e: MouseEvent
  ): Promise<void> {
    e.stopPropagation();
    await this.command('openBookmark', {
      tabId: this.tabId,
      url: this.url
    });
  }

  private onTapStar(e: MouseEvent): void {
    e.stopPropagation();
    if (this.tabId) {
      this.fire('add-bookmark', {
        tabId: this.tabId,
      });
    } if (this.bookmarkId) {
      this.fire('remove-bookmark', {
        bookmarkId: this.bookmarkId
      });
    }
  }

  private readFavicon(): void {
    let domain = this.extractDomain(this.url);

    // If favicon is not specified
    if (!this.favIconUrl) {
      // But favicon url is already cached
      if (PtmBookmark.cache[domain]) {
        // Use the cache
        this.favIconUrl = PtmBookmark.cache[domain].url || '';
      }
    // If favicon is specified
    } else {
      // Check if cache exists
      if (!PtmBookmark.cache[domain]) {
        // Cache it regardless of database entry exists or not
        PtmBookmark.cache[domain] = {
          domain: domain,
          url: this.favIconUrl
        }
      // Renew cache with new favicon
      } else if (PtmBookmark.cache[domain].url == PtmBookmark.DEFAULT_FAVICON_URL) {
        PtmBookmark.cache[domain].url = this.favIconUrl;
      }
    }
  }

  private extractDomain(
    url: string
  ): string {
    let domain = url.replace(/^.*?:\/\/(.*?)\/.*$/, "$1");
    // Special case, if Google Docs, it could be /spreadsheet, /document or /presentation
    if (/docs.google.com/.test(domain)) {
      domain = url.replace(/^.*?:\/\/(docs.google.com\/(a\/.*?\/)?.*?)\/.*$/, "$1");
    }
    return domain;
  }

  // private saveFavIconUrl(
  //   domain: string,
  //   favIconUrl: string
  // ): void {
  //   this.db.put({
  //     domain: domain,
  //     url: favIconUrl
  //   });
  // }
}


// Polymer.IronA11yKeysBehavior
