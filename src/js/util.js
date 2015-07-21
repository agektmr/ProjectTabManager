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

'use strict';

var util = {
  CHROME_EXCEPTION_URL: /^chrome(|-devtools):/,
  STRIP_HASH: /^(.*?)#.*$/,
  FAVICON_URL: 'http://www.google.com/s2/favicons?domain=',

  /**
   * [lazify description]
   * @param  {[type]} url        [description]
   * @param  {[type]} title      [description]
   * @param  {[type]} favIconUrl [description]
   * @return {[type]}            [description]
   */
  lazify: function(url, title, favIconUrl) {
    return 'lazy.html?url=' +encodeURIComponent(url)+
           '&title='        +encodeURIComponent(title || '* Lazy loading')+
           '&favIconUrl='   +encodeURIComponent(favIconUrl || '');
  },

  /**
   * [unlazify description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  unlazify: function(url) {
    var params = {};
    if (url.match(RegExp('^chrome-extension:\/\/'+chrome.i18n.getMessage('@@extension_id')+'\/lazy\.html'))) {
      var query = url.replace(/.*\?(.*)$/, '$1');
      var _params = query.split('&');
      _params.forEach(function(param) {
        var comb = param.split('=');
        if (comb.length == 2)
          params[comb[0]] = decodeURIComponent(comb[1]);
      });
    }
    return params.url ? params.url : url;
  },

  /**
   * [resembleUrls description]
   * @param  {[type]} url1 [description]
   * @param  {[type]} url2 [description]
   * @return {[type]}      [description]
   */
  resembleUrls: function(url1, url2) {
    url1 = util.unlazify(url1).replace(util.STRIP_HASH, '$1');
    url2 = util.unlazify(url2).replace(util.STRIP_HASH, '$1');
    if (url1.length >= url2.length) {
      if (url1.indexOf(url2) === 0) return true;
    } else {
      if (url2.indexOf(url1) === 0) return true;
    }
    return url1 === url2;
  },

  /**
   * parse url as per http://en.wikipedia.org/wiki/URI_scheme
   * @param  {String} url
   * @return {Object}
   */
  parse: function(url) {
    var parsed = url.match(/^(.*?:\/\/)(.*?)(:?([0-9]+))??(\/(.*?))??(\?(.*?))??(#(.*))??$/i);
    return {
      url:        parsed[0],
      scheme:     parsed[1],
      domain:     parsed[2],
      port:       parsed[4],
      authority:  parsed[1]+parsed[2]+(parsed[4]?':'+parsed[4]:''),
      path:       parsed[6],
      query:      parsed[8],
      fragment:   parsed[10]
    }
  },

  /**
   * [getLocalMidnightTime description]
   * @param  {[type]} dateStr [description]
   * @return {[type]}         [description]
   */
  getLocalMidnightTime: function(dateStr) {
    var date = new Date(dateStr);
    var UTCMidnight = date.getTime();
    var TimezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return UTCMidnight + TimezoneOffset;
  }
};
