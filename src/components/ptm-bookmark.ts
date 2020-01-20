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

import { html, css, customElement, property } from 'lit-element';
import { PtmBase } from './ptm-base';
import '@polymer/paper-item/paper-item.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
import '@polymer/paper-icon-button/paper-icon-button.js';

// entry {
//   id         : bookmark id if bookmarked
//   tabId      : tabId of the page if open
//   title      : title of the page
//   url        : url of the bookmark
//   pinned     : pinned flag
//   favIconUrl : favicon Url
// }

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

  // private meta: IronMetaElement | undefined

  static styles = css`
    paper-item {
      padding: 0;
    }
    paper-item > *:not(:first-child):not(:last-child) {
      margin-right: 0 !important;
    }
    .favicon {
      display: block;
      width: 16px;
      height: 16px;
      padding: 2px 4px 4px 4px;
      -webkit-user-select: none;
    }
    iron-icon {
      width: 100%;
      height: 100%;
    }
    .title {
      cursor: pointer;
      color: #aaa;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      @apply(--layout-flex);
    }
    .title[active] {
      color: black;
    }
    #star {
      color: #D3D3D3;
    }
    #star[bookmarked] {
      color: #FAC12F;
    }`

  render () {
    return html`
      <paper-item tabindex="-1">
        <!-- <div class="favicon">
          <iron-icon
            src="${this.favIconUrl || PtmBookmark.DEFAULT_FAVICON_URL}">
          </iron-icon>
        </div> -->
        <paper-icon-button
          src="${this.favIconUrl || PtmBookmark.DEFAULT_FAVICON_URL}">
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
          ?bookmarked="${!!this.bookmarkId}"
          tabindex="-1">
        </paper-icon-button>
        `:''}
      </paper-item>`
  }

  public firstUpdated() {
    // TODO:
    // this.keyEventTarget = this;
    // this.addOwnKeyBinding('enter', 'open');

    // this.meta = this.querySelector('#meta');
    // this.db = this.meta?.byKey('ProjectTabManager-favicons');
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
    // // If tab id is not assigned
    // if (!this.tabId) {
    //   // Open new project entry
    //   chrome.tabs.create({url: this.url, active: true});
    // } else {
    //   chrome.tabs.get(this.tabId, tab => {
    //     // If the project filed is not open yet
    //     if (!tab) {
    //       // Open new project entry
    //       chrome.tabs.create({url: this.url, active: true});
    //     // If the project filed is already open
    //     } else {
    //       chrome.windows.get(tab.windowId, win => {
    //         if (!win.focused) {
    //           // Move focus to the window
    //           chrome.windows.update(tab.windowId, {focused:true});
    //         }
    //         // Activate open project entry
    //         chrome.tabs.update(this.tabId, {active: true});
    //       });
    //     }
    //   });
    // }
  }

  private onTapStar(e: MouseEvent): void {
    e.stopPropagation();
    this.fire('toggle-bookmark', {
      tabId: this.tabId
    });
  }

  private readFavicon(): void {
    let domain = this.extractDomain(this.url);

    // If favicon is not specified
    if (!this.favIconUrl) {
      // But favicon url is already cached
      if (PtmBookmark.cache[domain]) {
        // Use the cache
        this.favIconUrl = PtmBookmark.cache[domain].url || '';
      // favicon url is not yet cached
      // } else {
      //   // Look up on database
      //   this.db.get(domain).then(result => {
      //     // If there's an entry, use it and cache
      //     // Otherwise, fallback to default icon
      //     if (result) {
      //       this.favIconUrl = result.url || '';
      //       PtmBookmark.cache[domain] = <UrlCache>{
      //         domain: domain,
      //         url: this.favIconUrl
      //       }
      //     } else {
      //       this.favIconUrl = PtmBookmark.DEFAULT_FAVICON_URL;
      //     }
      //   });
      }
    // If favicon is specified
    } else {
      // Check if cache exists
      if (!PtmBookmark.cache[domain]) {
        // Look up on database
        // this.db.get(domain).then(result => {
        //   // If there's no entry or exists but differ
        //   if (!result || result.url != this.favIconUrl) {
        //     // Save the favicon
        //     this.saveFavIconUrl(domain, this.favIconUrl);
        //   }
          // Cache it regardless of database entry exists or not
          PtmBookmark.cache[domain] = {
            domain: domain,
            url: this.favIconUrl
          }
        // });
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
