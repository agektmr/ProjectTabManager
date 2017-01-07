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

const Utilities = {
  CHROME_EXCEPTION_URL: /^chrome(|-devtools|-extensions):/,
  STRIP_HASH: /^(.*?)#.*$/,
  FAVICON_URL: 'http://www.google.com/s2/favicons?domain=',
  EXTENSION_ID: chrome.i18n.getMessage('@@extension_id'),

  /**
   * [lazify description]
   * @param  {[type]} url        [description]
   * @param  {[type]} title      [description]
   * @param  {[type]} favIconUrl [description]
   * @return {[type]}            [description]
   */
  lazify: function(url: string, title: string = '* Lazy Loading', favIconUrl: string = ''): string {
    return `lazy.html?url=${encodeURIComponent(url)}`+
           `&title=${encodeURIComponent(title)}`+
           `&favIconUrl=${encodeURIComponent(favIconUrl)}`;
  },

  /**
   * [unlazify description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  unlazify: function(url: string): string {
    let result: string = '';
    let _url =  new URL(url);
    if (_url.protocol === 'chrome-extension:' &&
        _url.pathname === '/lazy.html') {
      result = _url.searchParams.get('url');
    }
    return result ? result : url;
  },

  /**
   * [resembleUrls description]
   * @param  {[type]} url1 [description]
   * @param  {[type]} url2 [description]
   * @return {[type]}      [description]
   */
  resembleUrls: function(url1: string, url2: string): boolean {
    let _url1 = new URL(Utilities.unlazify(url1));
    let _url2 = new URL(Utilities.unlazify(url2));
    // If origins are different, definitely not resemble
    if (_url1.origin !== _url2.origin) return false;
    // Compare pathname
    return _url1.pathname === _url2.pathname;
    // Hash will be ignored
  },

  // /**
  //  * parse url as per http://en.wikipedia.org/wiki/URI_scheme
  //  * @param  {String} url
  //  * @return {Object}
  //  */
  // parse: function(url: string) {
  //   var parsed = url.match(/^(.*?:\/\/)(.*?)(:?([0-9]+))??(\/(.*?))??(\?(.*?))??(#(.*))??$/i);
  //   return {
  //     url:        parsed[0],
  //     scheme:     parsed[1],
  //     domain:     parsed[2],
  //     port:       parsed[4],
  //     authority:  parsed[1]+parsed[2]+(parsed[4]?':'+parsed[4]:''),
  //     path:       parsed[6],
  //     query:      parsed[8],
  //     fragment:   parsed[10]
  //   }
  // },

  /**
   * [getLocalMidnightTime description]
   * @param  {[type]} dateStr [description]
   * @return {[type]}         [description]
   */
  getLocalMidnightTime: function(dateStr: string) {
    let date = new Date(dateStr);
    let UTCMidnight = date.getTime();
    let TimezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return UTCMidnight + TimezoneOffset;
  },

  /**
   * Deep copies an array
   * @param  {Array}  array     an array to deep copy
   * @return {Promise}          A promise
   */
  deepCopy: (function() {
    return function(array: Array<Project>) {
      var mc = new MessageChannel;
      return new Promise(resolve => {
        mc.port1.onmessage = resolve;
        mc.port2.postMessage(array);
      }).then(function(e) {
        return e.data;
      });
    }
  })()
};

export default Utilities;