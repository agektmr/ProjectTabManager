var util = {};
util.lazify = function(obj) {
  return 'lazy.html?url='+encodeURIComponent(obj.url)+'&title='+encodeURIComponent(obj.title);
};
util.unlazify = function(url) {
  if (url.match(/^chrome-extension:\/\//i)) {
    if (url.match(RegExp(chrome.i18n.getMessage('@@extension_id')+'\/lazy\.html'))) {
      var query = url.replace(/.*\?(.*)$/, '$1');
      var params = {};
      var _params = query.split('&');
      _params.forEach(function(param) {
        var comb = param.split('=');
        if (comb.length == 2)
          params[comb[0]] = decodeURIComponent(comb[1]);
      });
      if (params.url) {
        return params.url;
      }
    }
  }
  return url;
};