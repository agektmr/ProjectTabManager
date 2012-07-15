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
var $ = function(query) {
  return document.querySelector(query);
};
window.onload = function() {
  $('#folderName').value = localStorage.rootName || 'Project Tab Manager';
  $('#lazyLoad').checked = localStorage.lazyLoad ? true : false;
  chrome.bookmarks.getSubTree('0', function(bookmarks) {
    for (var i = 0; i < bookmarks[0].children.length; i++) {
      var bookmark = bookmarks[0].children[i];
      var option = document.createElement('option');
      option.value = bookmark.id;
      option.innerHTML = bookmark.title;
      if (localStorage.rootParentId == bookmark.id) option.selected = true;
      $('#root').appendChild(option);
    };
  });
  $('#save').onclick = function() {
    localStorage.rootParentId = $('#root').value;
    localStorage.rootName = $('#folderName').value;
    localStorage.lazyLoad = $('#lazyLoad').checked ? 'true' : '';
    alert('Project location saved!');
  };
};