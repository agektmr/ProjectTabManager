'use strict';

app.filter('sort', function() {
  return function(projects, projectId) {
    if (!projects) return;

    var preceding = [];
    var following = [];
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
        tabs.forEach(function(tab, index) {
          if (bookmark.url == tab.url) {
            bookmark.current = true;
            tabs.splice(index, 1);
          }
        });
        bookmark.passive = false;
      }
    });
    tabs.forEach(function(tab, index) {
      if (tab.url.match(RegExp('chrome-extension:\/\/'+chrome.i18n.getMessage('@@extension_id')+'\/lazy\.html'))) {
        var query = tab.url.replace(/.*\?(.*)$/, '$1');
        var params = {};
        var _params = query.split('&');
        _params.forEach(function(param) {
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