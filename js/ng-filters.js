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

app.filter('sort', function() {
  return function(projects, projectId) {
    if (!projects) return;

    var preceding = [],
        following = [];
    // Move active project up to the top
    projects.forEach(function(project, index) {
      if (project.title == config.archiveFolderName) {
        return;
      }
      if (project.id == '0' || project.id == projectId) {
        preceding.push(project);
      } else {
        following.push(project);
      }
    });
    return preceding.concat(following);
  };
});

app.filter('normalize', function() {
  return function(bookmarks, projectId) {
    bookmarks = bookmarks || [];
    var tabs = (projectId == this.project.id || this.project.id == '0') ? this.currentTabs.slice(0) : [];

    // Loop through bookmarks and find folders (passive bookmarks folder)
    bookmarks.forEach(function(bookmark, index) {
      if (bookmark.children) {
        // Add passive flag and append to parent folder
        bookmark.children.forEach(function(_bookmark) {
          _bookmark.passive = true;
          bookmarks.push(_bookmark);
        });
        bookmarks.splice(index, 1);
      } else {
        bookmark.current = false;
        // Flag opened bookmark on current window's tabs
        tabs.forEach(function(tab, index) {
          if (bookmark.url == tab.url) {
            bookmark.current = true;
            // Remove from appending tabs
            tabs.splice(index, 1);
          }
        });
        bookmark.passive = false;
      }
    });
    // Append open tabs for addition candidate
    tabs.forEach(function(tab, index) {
      // If the tab is opened using lazy loading, extract original url
      if (tab.url.match(RegExp('chrome-extension:\/\/'+chrome.i18n.getMessage('@@extension_id')+'\/lazy\.html'))) {
        var query   = tab.url.replace(/.*\?(.*)$/, '$1'),
            params  = {};
        query.split('&').forEach(function(param) {
          var comb = param.split('=');
          if (comb.length == 2)
            params[comb[0]] = decodeURIComponent(comb[1]);
        });
        if (params.url) tab.url = params.url;
      }
      var favicon = tab.favIconUrl || '../img/favicon.png';
      var bookmark = {
        favIconUrl: favicon.match(/^chrome:\/\/theme/) ? '../img/favicon.png' : favicon,
        url: tab.url,
        title: tab.title,
        adding: true
      };
      bookmarks.push(bookmark);
    });
    return bookmarks;
  };
});