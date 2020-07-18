/*
Copyright 2012 Eiji Kitamura

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
*/

/// <reference path="../../node_modules/@types/chrome/index.d.ts" />

const query = location.href.replace(/.*?\?(.*)$/, '$1');
const params: any = {};
const _params = query.split('&');
for (let param of _params) {
  const comb = param.split('=');
  if (comb.length == 2) params[comb[0]] = decodeURIComponent(comb[1]);
}

const title = document.querySelector('title');
if (title && params.title) {
  if (params.title.match(/^\*\s/))
    title.innerText = params.title;
  else
    title.innerText = `* ${params.title}`;
}

if (params.favIconUrl) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'shortcut icon');
  link.setAttribute('href', decodeURIComponent(params.favIconUrl));
  link.setAttribute('type', 'image/x-icon');
  const head = document.querySelector('head');
  head?.appendChild(link);
}

document.addEventListener('visibilitychange', e => {
  // @ts-ignore
  if (e.target?.visibilityState == 'visible' && params.url) {
    chrome.tabs.getCurrent((tab: chrome.tabs.Tab | undefined) => {
      if (tab?.id) chrome.tabs.update(tab.id, {url: params.url});
    });
  }
});
