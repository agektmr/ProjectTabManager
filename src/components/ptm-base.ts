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

import { LitElement, customElement } from "lit-element";

@customElement('ptm-base')
export class PtmBase extends LitElement {
  constructor() {
    super();
  }

  public querySelector(query: string): any {
    return this.shadowRoot?.querySelector(query);
  }

  protected fire(
    eventName: string,
    eventDetail?: object
  ): void {
    const event = new CustomEvent(eventName, {
      detail: eventDetail,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  protected async command(
    commandName: string,
    commandDetail?: object
  ): Promise<any> {
    return new Promise(resolve =>
      chrome.runtime.sendMessage({
        command: commandName,
        detail: commandDetail
      }, resolve)
    );
  }
}