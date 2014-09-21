/*! ProjectTabManager - v3.0.1 - 2014-09-22
* Copyright (c) 2014 ; Licensed  */
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
  },

  /**
   * [description]
   * @return {[type]}
   */
  getFavicon: (function() {
    var cache = {};
    var fetching = {};
    var fetchFavicon = function(domain, url) {
      if (!fetching[url]) {
        fetching[url] = new Promise(function(resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url);
          xhr.responseType = 'blob';
          xhr.onload = function() {
            if (xhr.status === 200 || xhr.status === 304) {
              var entry = {domain:domain, blob:xhr.response, url:url};
              // Store fetched favicon in database
              db.put(db.FAVICONS, entry);
              resolve(entry);
            } else {
              reject();
            }
            delete fetching[url];
          };
          xhr.onerror = function() {
            reject();
            delete fetching[url];
          };
          xhr.send();
        });
      }
      return fetching[url];
    };

    return function(url, favIconUrl) {
      return new Promise(function(resolve, reject) {
        var domain = url.replace(/^.*?\/\/(.*?)\/.*$/, "$1");
        var entry = {domain:domain, url:url};
        // domain is not available
        if (domain === '') {
          entry.blobUrl = chrome.extension.getURL('/img/favicon.png');
          resolve(entry);
        // cache available
        } else if (cache[domain] && (cache[domain].url === favIconUrl || !favIconUrl)) {
          resolve(cache[domain]);
        // requires fetch or database lookup
        } else {
          db.get(db.FAVICONS, domain).then(function(entry) {
            // If this icon was fetched with Google proxy
            // Overwrite with original
            if (entry && favIconUrl && entry.url !== favIconUrl) {
              return fetchFavicon(domain, favIconUrl);
            } else {
              // Favicon is in database
              return entry;
            }
          // Not in database
          }).catch(function () {
            entry.url = favIconUrl ? favIconUrl : util.FAVICON_URL+encodeURIComponent(domain);
            // Fetch favicon from internet
            return fetchFavicon(domain, entry.url);
          }).then(function(entry) {
            entry.blobUrl = URL.createObjectURL(entry.blob);
            // Cache it
            cache[domain] = entry;
            // Create Blob URL from resulting favicon blob and resolve
            resolve(entry);
          }, function() {
            entry.blobUrl = chrome.extension.getURL('/img/favicon.png');
            resolve(entry);
          });
        }
      });
    };
  })()
};


var query = location.href.replace(/.*\?(.*)$/, '$1');
var params = {};
var _params = query.split('&');
_params.forEach(function(param) {
  var comb = param.split('=');
  if (comb.length == 2)
    params[comb[0]] = decodeURIComponent(comb[1]);
});
if (params.title) {
  if (params.title.match(/^\*\s/))
    document.querySelector('title').innerText = params.title;
  else
    document.querySelector('title').innerText = '* '+params.title;
}
if (params.favIconUrl) {
  var link = document.createElement('link');
  link.setAttribute('rel', 'shortcut icon');
  link.setAttribute('href', decodeURIComponent(params.favIconUrl));
  link.setAttribute('type', 'image/x-icon');
  document.querySelector('head').appendChild(link);
}
document.addEventListener('webkitvisibilitychange', function(e) {
  if (e.target.webkitVisibilityState == 'visible') {
    if (params.url) {
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.update(tab.id, {url: params.url});
      });
    }
  }
});