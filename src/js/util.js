var util = {};
util.CHROME_EXCEPTION_URL = /^chrome(|-devtools):/;
util.STRIP_HASH = /^(.*?)#.*$/;
util.lazify = function(obj) {
  return 'lazy.html?url='+encodeURIComponent(obj.url)+'&title='+encodeURIComponent(obj.title);
};
util.unlazify = function(url) {
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
};