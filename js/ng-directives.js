'use strict';

app.directive('chromeI18n', function() {
  var cache = {};
  return function(scope, element, attrs) {
    var params = attrs.chromeI18n.split(':'),
        key, name;
    if (params.length !== 2) return;
    key = params[0];
    name = params[1];
    cache[key] = cache[key] || chrome.i18n.getMessage(key);
    if (name == 'inner') {
      element.append(cache[key]);
    } else {
      attrs.$set(name, cache[key]);
    };
  };
});