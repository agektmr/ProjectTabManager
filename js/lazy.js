var query = location.href.replace(/.*\?(.*)$/, '$1');
var params = {};
var _params = query.split('&');
_params.forEach(function(param) {
  var comb = param.split('=');
  if (comb.length == 2)
    params[comb[0]] = decodeURIComponent(comb[1]);
});
if (params.title) {
  document.querySelector('title').innerText = params.title;
}
document.addEventListener('webkitvisibilitychange', function(e) {
  if (e.target.webkitVisibilityState == 'visible') {
    if (params.url) {
      location.href = params.url;
    }
  }
});