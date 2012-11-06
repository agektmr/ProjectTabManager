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

app.filter('percentage', function() {
  return function(max) {
    return (this.project.duration/max*100)|0;
  };
});
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
  return function(bookmarks, tabs) {
    var results = [],
        splices = [];
    bookmarks = bookmarks || [];

    // Loop through bookmarks and find child folders
    for (var i = 0; i < bookmarks.length; i++) {
      var bookmark = bookmarks[i];
      bookmark.session = false;
      bookmark.added = true;
      if (bookmark.children) {
        // Append to parent folder
        for (var j = 0; j < bookmark.children.length; j++) {
          bookmarks.push(bookmark.children[j]);
        }
        // Keep indexes for later removal
        splices.push(i);
        continue;
      }
      // Check if this bookmark is in session
      for (var tabId in tabs) {
        if (bookmark.url &&
            tabs[tabId].url.replace(util.STRIP_HASH, '$1') === bookmark.url.replace(util.STRIP_HASH, '$1')) {
          bookmark.favIconUrl = tabs[tabId].favIconUrl;
          tabs[tabId].added = true;
          bookmark.session = true;
          break;
        }
      }
      if (!bookmark.favIconUrl) {
        bookmark.favIconUrl = 'http://www.google.com/s2/favicons?domain='+encodeURIComponent(bookmark.url.replace(/^.*?\/\/(.*?)\/.*$/, "$1"));
      }
    }
    // Remove folders
    splices.forEach(function(index) {
      bookmarks.splice(index, 1);
    });
    for (i in tabs) {
      if (tabs[i].added) continue;
      tabs[i].added = false;
      tabs[i].session = true;
      results.push(tabs[i]);
    }
    for (i = 0; i < bookmarks.length; i++) {
      results.push(bookmarks[i]);
    }
    return results;
  };
});