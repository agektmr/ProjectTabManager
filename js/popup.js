var $ = function(query) {
  return document.querySelector(query);
};

var currentWinId = '0',
    currentTabs = [],
    debug = false;

var hoverMenu = function(target, actions) {
  /*
   * actions = [
   *   {
   *     button: button class
   *     annotation: annotation string (option)
   *     func: function to execute
   *   }
   * ]
   *
   */
  var timer = null;
  var menu = document.createElement('div');
  menu.classList.add('menu');
  actions.forEach(function(action) {
    var span = document.createElement('span');
    span.classList.add('button');
    span.classList.add(action.button);
    span.title = action.annotation;
    span.onclick = action.func;
    menu.appendChild(span);
    menu.style.display = 'none';
  });
  target.appendChild(menu);
  target.onmouseover = function(event) {
    menu.style.display = 'block';
  };
  target.onmouseout = function() {
    menu.style.display = 'none';
  };
};

var renewProjectList = function(projectId) {
  chrome.extension.sendRequest({command:'projects'}, function(projects) {
    $('#projects').innerHTML = '';

    var addNew = {
      id: 0,
      title: chrome.i18n.getMessage('name_this'),
      children: []
    };
    projects.unshift(addNew);
    projects.forEach(function(project) {
      if (project.title == config.archiveFolderName) return;
      var li = document.createElement('li');
      li.classList.add('accordion');
      li.innerHTML = ('<div class="project"><span class="button arrow"></span>'
                     +'<span class="name">##title##</span></div>')
                     .replace(/##title##/, project.title);
      li.querySelector('.name').onclick = function() {
        chrome.extension.sendRequest({command:'open', projectId:project.id});
      };
      hoverMenu(li, [
        {
          button: 'pin',
          annotation: chrome.i18n.getMessage('pin'),
          func: function() {
            chrome.windows.getCurrent(function(win) {
              chrome.extension.sendRequest({command:'pin', winId:win.id, projectId:project.id}, function(project) {
                renewProjectList(project.id);
              });
            });
          }
        },
        {
          button: 'remove',
          annotation: chrome.i18n.getMessage('remove'),
          func: function() {
            chrome.extension.sendRequest({command:'removeProject', projectId:project.id}, function() {
              currentWinId = '0';
              renewProjectList();
            });
          }
        }
      ]);
      // include window tabs if user is on working project window or nowhere
      var mergeTabs = (project.id == projectId) || (project.id == 0) ? true : false;
      var ul = getBookmarksDOM(project, mergeTabs);
      li.appendChild(ul);
      li.querySelector('span.arrow').onclick = function(event) {
        var t = event.target;
        if (t.classList.contains('expand')) {
          t.classList.remove('expand');
          t.parentNode.parentNode.classList.remove('expand');
        } else {
          t.classList.add('expand');
          t.parentNode.parentNode.classList.add('expand');
        }
      };
      if (project.id == projectId) {
        li.querySelector('.project span.name').classList.add('current');
        li.querySelector('.project span.arrow').classList.add('expand');
        li.classList.add('expand');
        $('#projects').insertBefore(li, $('#projects').childNodes[0]);
      } else {
        $('#projects').appendChild(li);
      }
    });
  });
};

var getBookmarksDOM = function(project, mergeTabs) {
  var ul = document.createElement('ul');
  var template = '<img src="##favicon##" class="favicon" />'
                 +'<span class="name"><a href="##url##" target="_blank" title="##title##\n##url##">##title##</a></span>';
  var bookmarks = project.children;
  var tabs = mergeTabs ? currentTabs.slice(0) : [];

  if (project.id == 0) {
    var li = document.createElement('li');
    var html = ('<input type="text" id="projectName" value="##project_name##" />'
               +'<input type="button" id="add" value="##save##" />')
               .replace(/##project_name##/, chrome.i18n.getMessage('project_name'))
               .replace(/##save##/, chrome.i18n.getMessage('save'));
    li.innerHTML = html;
    li.querySelector('#add').onclick = function() {
      var name = $('#projectName').value;
      // TODO: validate name
      chrome.windows.getCurrent(function(win) {
        chrome.extension.sendRequest({command:'addProject', name:name, windowId:win.id}, function(project) {
          renewProjectList(project.id);
        });
      });
    };

    ul.appendChild(li);
  } else if (bookmarks.length == 0) {
    var li = document.createElement('li');
    var html = '<img src="../img/favicon.png" class="favicon" />##title##' // fix default icon
               .replace(/##title##/g, chrome.i18n.getMessage('no_bookmarks_found'));
    li.innerHTML = html;
    ul.appendChild(li);
  } else {
    // bookmarks deeper than 2nd level won't be opened in project window by default
    var depth = 0;
    // recursive dig down of bookmark folder
    var getFolderLI = function(bookmarks, ul) {
      var _depth = depth++;
      bookmarks.forEach(function(bookmark) {
        if (!bookmark.children) {
          // if this is a bookmark, create li and append
          ul.appendChild(getBookmarkLI(bookmark, _depth));
        } else {
          // if this is a folder, recursively dig down
          getFolderLI(bookmark.children, ul);
        }
      });
    };
    // bookmark li generation
    var getBookmarkLI = function(bookmark, depth) {
      // FIXME: avoid adding bookmarks starting with "chrome-extension"
      var domain = bookmark.url.replace(/^.*?\/\/(.*?)\/.*$/, "$1");
      var li = document.createElement('li');
      var html = template.replace(/##favicon##/g, 'http://www.google.com/s2/favicons?domain='+domain)
                         .replace(/##url##/g, bookmark.url)
                         .replace(/##title##/g, bookmark.title);
      li.innerHTML = html;
      var status = depth > 0 ? 'activate' : 'deactivate';
      hoverMenu(li, [
        {
          button: status,
          annotation: chrome.i18n.getMessage(status),
          func: function(event) {
            var t = event.target;
            var command = 'activate';
            if (t.classList.contains('deactivate')) {
              command = 'deactivate';
            }
            chrome.extension.sendRequest({command:command, projectId:project.id, bookmarkId:bookmark.id}, function() {
              if (t.classList.contains('deactivate')) {
                t.classList.remove('deactivate');
                t.classList.add('activate');
                li.querySelector('.name').classList.add('passive');
              } else {
                t.classList.remove('activate');
                t.classList.add('deactivate');
                li.querySelector('.name').classList.remove('passive');
              }
            });
          }
        },
        {
          button: 'delete',
          annotation: chrome.i18n.getMessage('remove'),
          func: function() {
            chrome.extension.sendRequest({command:'remove', bookmarkId:bookmark.id}, function() {
              // TODO: this will change pinned project
              renewProjectList(project.id);
            });
          }
        }
      ]);
      if (depth > 0) {
        // this is more than 2nd level
        li.querySelector('.name').classList.add('passive');
      }
      // loop through current window's tabs
      tabs.forEach(function(tab, index) {
        // if the url is already opened
        if (bookmark.url == tab.url) {
          // mark it as open
          li.querySelector('.name').classList.add('current');
          // remove from add list
          tabs.splice(index, 1);
        }
      });
      return li;
    };

    getFolderLI(bookmarks, ul);
  }

  // Append current window's tabs
  tabs.forEach(function(tab) {
    // do not list lazy loading pages
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
    favicon = favicon.match(/^chrome:\/\/theme/) ? '../img/favicon.png' : favicon;
    var li = document.createElement('li');
    var html = template.replace(/##favicon##/g, favicon)
                       .replace(/##url##/g, tab.url)
                       .replace(/##title##/g, tab.title);
    li.innerHTML = html;
    li.querySelector('.name').classList.add('adding');
    if (project.id != '0') {
      hoverMenu(li, [
        {
          button: 'add',
          annotation: chrome.i18n.getMessage('add'),
          func: function() {
            chrome.extension.sendRequest({command:'add', projectId:project.id, tab:tab}, function() {
              renewProjectList(project.id);
            });
          }
        }
      ]);
    }
    ul.appendChild(li);
  });
  return ul;
};

window.addEventListener('DOMContentLoaded', function() {
  chrome.windows.getCurrent(function(win) {
    chrome.tabs.query({windowId:win.id}, function(tabs) {
      currentTabs = tabs;
    });
    chrome.extension.sendRequest({command:'current', winId:win.id}, function(projectId) {
      renewProjectList(projectId);
    });
  });
  $('header span.edit').title = chrome.i18n.getMessage('edit');
  $('header span.edit').onclick = function() {
    chrome.extension.sendRequest({command:'edit'});
  };
  $('header span.summary').title = chrome.i18n.getMessage('todays_project_summary');
  $('header span.summary').onclick = function() {
    chrome.tabs.create({url:'/summary.html'});
  };
  $('header span.options').title = chrome.i18n.getMessage('options');
  $('header span.options').onclick = function() {
    chrome.tabs.create({url:'/options.html'});
  };
  if (config.debug) {
    $('#debug_expand').innerHTML = 'Debug Info';
    $('#debug_expander .flipper').onclick = function() {
      if ($('#debug_expander .flipper').classList.contains('open')) {
        $('#debug_expander .flipper').classList.remove('open');
        $('#debug').style.display = 'none';
      } else {
        $('#debug_expander .flipper').classList.add('open');
        $('#debug').style.display = 'block';
      }
    };
    $('#debug_expander').style.display = 'block';
    chrome.extension.sendRequest({command:'debug'}, function(tracker) {
      for (var i = 0; i < tracker.length; i++) {
        var li = document.createElement('li');
        var start = tracker[i].start;
        var end = tracker[i].end;
        var html = ('<span class="project_name">##projectName##: ##start## ~ ##end##</span/>')
                   .replace(/##projectName##/g, tracker[i].projectName)
                   .replace(/##start##/g, start)
                   .replace(/##end##/g, end);
        li.innerHTML = html;
        $('#debug').appendChild(li);
      }
    });
  }
});