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
import { PtmBase } from '../components/ptm-base';

@customElement('ptm-dropdown-button')
export class PtmDropdownButton extends PtmBase {
  @property({
    type: Array
  })
  items: any[] = []

  @property({
    type: Object,
  })
  selected: object = {}

  @property({
    type: Boolean
  })
  selecting: boolean = false

  static styles = css`
    :host {
      position: relative;
    }
    #dropdown-menu {
      top: -48px;
    }
    paper-item {
      background-color: white;
    }
  `;

  render() {
    return html`
      <paper-icon-button icon="icons:link" @click="${this.drop}">
      </paper-icon-button>
      <array-selector
        id="selector"
        items="${this.items}"
        selected="${this.selected}">
      </array-selector>
      ${this.selecting ? html`
      <paper-material id="dropdown-menu" elevation="2">
        ${this.items.map(item => html`
        <paper-item @click="${this.selectItem}">
          <paper-ripple initial-opacity="0.05" recenters></paper-ripple>
          <div class="flex">${item.title}</div>
          ${this.isSelected(item) ? html`
          <paper-icon-button icon="icons:check"></paper-icon-button>
          `:''}
        </paper-item>`
        )}
      </paper-material>
      `: ''}
    `;
  }

  public firstUpdated() {
    // TODO: resolve array-selector element
    this.selector = this.querySelector('#selector');
  }

  public selectItem(e) {
    // TODO: What's `itemForElement`?
    var selected = this.querySelectorAll('itemList').itemForElement(e.target);
    this.selector?.select(selected);
    this.selecting = false;
  }

  public drop() {
    this.selecting = !this.selecting;
  }

  public isSelected(item) {
    return item.id == this.selected.id;
  }
}
