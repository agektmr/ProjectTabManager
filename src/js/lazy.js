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