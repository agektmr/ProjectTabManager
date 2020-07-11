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

import './ptm-list-item';
import '@polymer/paper-tooltip/paper-tooltip.js';
import '@material/mwc-icon';
import '@material/mwc-icon-button-toggle';

import { PtmBase } from './ptm-base';

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
        mwc-icon > img {
          width: var(--mdc-icon-size);
          height: var(--mdc-icon-size);
          padding: 4px;
        }
        #star {
          color: #D3D3D3;
        }
        #star[bookmarked] {
          color: #FAC12F;
        }
      </style>
      <ptm-list-item
        graphic="icon"
        tabindex="-1" hasMeta>
        <mwc-icon slot="graphic">
          <img src="${navigator.onLine && this.favIconUrl ? this.favIconUrl : PtmBookmark.DEFAULT_FAVICON_URL}">
        </mwc-icon>
        <div class="title" @click="${this.open}" ?active="${!!this.tabId}">
          <span>${this.siteTitle}</span>
          <paper-tooltip>${this.siteTitle}<br/>${this.url}</paper-tooltip>
        </div>
        <!--Why this?-->
        ${this.projectId.indexOf('-') === -1 ? html`
        <mwc-icon-button
          id="star"
          slot="meta"
          @click="${this.onTapStar}"
          ?bookmarked="${this.bookmarkId != ''}"
          tabindex="-1">
          <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></g></svg>
        </mwc-icon-button>
        `:''}
      </ptm-list-item>`
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
    if (this.bookmarkId) {
      this.fire('remove-bookmark', {
        bookmarkId: this.bookmarkId
      });
    } else if (this.tabId) {
      this.fire('add-bookmark', {
        tabId: this.tabId,
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
