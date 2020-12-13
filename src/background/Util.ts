/**
 * /*
 * Copyright 2020 Eiji Kitamura
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Eiji Kitamura (agektmr@gmail.com)
 *
 * @format
 */

import { Config } from './Config';

export class Util {
  static CHROME_EXCEPTION_URL = /^chrome(|-devtools|-extensions):/;
  static STRIP_HASH = /^(.*?)#.*$/;
  static config: Config;

  static configure(config: Config): void {
    this.config = config;
  }

  /**
   * [lazify description]
   * @param  {[type]} url        [description]
   * @param  {[type]} title      [description]
   * @param  {[type]} favIconUrl [description]
   * @return {[type]}            [description]
   */
  static lazify(
    url: string,
    title: string = '* Lazy loading',
    favIconUrl: string = '',
  ): string {
    return (
      `lazy.html?url=${encodeURIComponent(url)}` +
      `&title=${encodeURIComponent(title)}` +
      `&favIconUrl=${encodeURIComponent(favIconUrl)}`
    );
  }

  /**
   * [unlazify description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  static unlazify(url?: string): string {
    if (!url) return '';
    if (
      url.match(
        RegExp(
          '^chrome-extension://' +
            chrome.i18n.getMessage('@@extension_id') +
            '/lazy.html',
        ),
      )
    ) {
      const parsed = Util.parse(url);
      const _params = parsed?.query.split('&');
      for (let param of _params) {
        const tmp = param.split('=');
        if (tmp[0] === 'url') return decodeURIComponent(tmp[1]);
      }
    }
    return url;
  }

  /**
   * [resembleUrls description]
   * @param  {[type]} url1 [description]
   * @param  {[type]} url2 [description]
   * @return {[type]}      [description]
   */
  static resembleUrls(url1: string = '', url2: string = ''): boolean {
    if (url1 == '' || url2 == '') return false;
    url1 = Util.unlazify(url1).replace(Util.STRIP_HASH, '$1');
    url2 = Util.unlazify(url2).replace(Util.STRIP_HASH, '$1');
    if (url1 === url2 || url1.indexOf(url2) === 0 || url2.indexOf(url1) === 0)
      return true;
    else return false;
  }

  /**
   * parse url as per http://en.wikipedia.org/wiki/URI_scheme
   * @param  {String} url
   * @return {Object}
   */
  static parse(url: string): any {
    const parsed = url.match(
      /^(.*?:\/\/)(.*?)(:?([0-9]+))??(\/(.*?))??(\?(.*?))??(#(.*))??$/i,
    );
    return {
      url: parsed?.[0],
      scheme: parsed?.[1],
      domain: parsed?.[2],
      port: parsed?.[4],
      authority: `${parsed?.[1]}${parsed?.[2]}${!parsed?.[4] ?? ''}`,
      path: parsed?.[6],
      query: parsed?.[8],
      fragment: parsed?.[10],
    };
  }

  /**
   * [getLocalMidnightTime description]
   * @param  {[type]} dateStr [description]
   * @return {[type]}         [description]
   */
  static getLocalMidnightTime(dateStr: string) {
    const date = new Date(dateStr);
    const UTCMidnight = date.getTime();
    const TimezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return UTCMidnight + TimezoneOffset;
  }

  static log(str: string, ...vals: any): void {
    if (!this.config.debug) return;
    console.log(str, ...vals);
  }

  /**
   * Deep copies an array
   * @param  {Array}  array     an array to deep copy
   * @return {Promise}          A promise
   */
  static deepCopy(array: any[]): any[] {
    return [...array];
  }
}
