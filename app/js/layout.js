/*! ProjectTabManager - v3.0.1 - 2015-05-10
* Copyright (c) 2015 ; Licensed  */
var Config = (function() {
  var rootParentId_ = '2',
      rootName_     = 'Project Tab Manager',
      lazyLoad_     = true,
      debug_        = true;

  var setConfig = function() {
    chrome.storage.sync.set({config: {
      lazyLoad:     lazyLoad_,
      rootParentId: rootParentId_,
      rootName:     rootName_
    }}, function() {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log('sessions stored.', lazyLoad_, rootParentId_, rootName_);
      }
    })
  };

  var Config = function(callback) {
    chrome.storage.sync.get((function(items) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        var conf = items['config'] || {};
        rootParentId_ = conf.rootParentId || localStorage.rootParentId || '2';
        rootName_     = conf.rootName     || localStorage.rootName     || 'Project Tab Manager';
        if (conf.lazyLoad !== undefined) {
          lazyLoad_ = conf.lazyLoad;
        } else {
          lazyLoad_ = localStorage.lazyLoad === 'true' ? true : false;
        }
        if (this.debug) console.log('[Config] initialization finished');
        if (typeof callback === 'function') callback();
      }
    }).bind(this));
  };

  var manifest = chrome.runtime.getManifest();
  if (manifest.key !== undefined) {
    // If there's key property exists in manifest, this is production
    debug_ = false;
  }

  Config.prototype = {
    debug: debug_,
    archiveFolderName: '__Archive__',
    hiddenFolderName: 'passive',
    summaryRemains: 60*60*24*30*2*1000, // 2 month ago
    set lazyLoad(val) {
      lazyLoad_ = val ? true : false;
      setConfig();
    },
    get lazyLoad() {
      return lazyLoad_;
    },
    set rootParentId(val) {
      rootParentId_ = val;
      setConfig();
    },
    get rootParentId() {
      return rootParentId_;
    },
    set rootName(val) {
      rootName_ = val;
      setConfig();
    },
    get rootName() {
      return rootName_;
    }
  };
  return Config;
})();

'use strict';

var util = {
  CHROME_EXCEPTION_URL: /^chrome(|-devtools):/,
  STRIP_HASH: /^(.*?)#.*$/,
  FAVICON_URL: 'http://www.google.com/s2/favicons?domain=',

  /**
   * [lazify description]
   * @param  {[type]} url        [description]
   * @param  {[type]} title      [description]
   * @param  {[type]} favIconUrl [description]
   * @return {[type]}            [description]
   */
  lazify: function(url, title, favIconUrl) {
    return 'lazy.html?url=' +encodeURIComponent(url)+
           '&title='        +encodeURIComponent(title || '* Lazy loading')+
           '&favIconUrl='   +encodeURIComponent(favIconUrl || '');
  },

  /**
   * [unlazify description]
   * @param  {[type]} url [description]
   * @return {[type]}     [description]
   */
  unlazify: function(url) {
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
  },

  /**
   * [resembleUrls description]
   * @param  {[type]} url1 [description]
   * @param  {[type]} url2 [description]
   * @return {[type]}      [description]
   */
  resembleUrls: function(url1, url2) {
    url1 = util.unlazify(url1).replace(util.STRIP_HASH, '$1');
    url2 = util.unlazify(url2).replace(util.STRIP_HASH, '$1');
    if (url1.length >= url2.length) {
      if (url1.indexOf(url2) === 0) return true;
    } else {
      if (url2.indexOf(url1) === 0) return true;
    }
    return url1 === url2;
  },

  /**
   * parse url as per http://en.wikipedia.org/wiki/URI_scheme
   * @param  {String} url
   * @return {Object}
   */
  parse: function(url) {
    var parsed = url.match(/^(.*?:\/\/)(.*?)(:?([0-9]+))??(\/(.*?))??(\?(.*?))??(#(.*))??$/i);
    return {
      url:        parsed[0],
      scheme:     parsed[1],
      domain:     parsed[2],
      port:       parsed[4],
      authority:  parsed[1]+parsed[2]+(parsed[4]?':'+parsed[4]:''),
      path:       parsed[6],
      query:      parsed[8],
      fragment:   parsed[10]
    }
  },

  /**
   * [getLocalMidnightTime description]
   * @param  {[type]} dateStr [description]
   * @return {[type]}         [description]
   */
  getLocalMidnightTime: function(dateStr) {
    var date = new Date(dateStr);
    var UTCMidnight = date.getTime();
    var TimezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    return UTCMidnight + TimezoneOffset;
  },

  /**
   * [description]
   * @return {[type]}
   */
  getFavicon: (function() {
    var cache = {};
    var fetching = {};
    var fetchFavicon = function(domain, url) {
      if (!fetching[url]) {
        fetching[url] = new Promise(function(resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url);
          xhr.responseType = 'blob';
          xhr.onload = function() {
            if (xhr.status === 200 || xhr.status === 304) {
              var entry = {domain:domain, blob:xhr.response, url:url};
              // Store fetched favicon in database
              db.put(db.FAVICONS, entry);
              resolve(entry);
            } else {
              reject();
            }
            delete fetching[url];
          };
          xhr.onerror = function() {
            reject();
            delete fetching[url];
          };
          xhr.send();
        });
      }
      return fetching[url];
    };

    return function(url, favIconUrl) {
      return new Promise(function(resolve, reject) {
        var domain = url.replace(/^.*?\/\/(.*?)\/.*$/, "$1");
        var entry = {domain:domain, url:url};
        // domain is not available
        if (domain === '') {
          entry.blobUrl = chrome.extension.getURL('/img/favicon.png');
          resolve(entry);
        // cache available
        } else if (cache[domain] && (cache[domain].url === favIconUrl || !favIconUrl)) {
          resolve(cache[domain]);
        // requires fetch or database lookup
        } else {
          db.get(db.FAVICONS, domain).then(function(entry) {
            // If this icon was fetched with Google proxy
            // Overwrite with original
            if (entry && favIconUrl && entry.url !== favIconUrl) {
              return fetchFavicon(domain, favIconUrl);
            } else {
              // Favicon is in database
              return entry;
            }
          // Not in database
          }).catch(function () {
            entry.url = favIconUrl ? favIconUrl : util.FAVICON_URL+encodeURIComponent(domain);
            // Fetch favicon from internet
            return fetchFavicon(domain, entry.url);
          }).then(function(entry) {
            entry.blobUrl = URL.createObjectURL(entry.blob);
            // Cache it
            cache[domain] = entry;
            // Create Blob URL from resulting favicon blob and resolve
            resolve(entry);
          }, function() {
            entry.blobUrl = chrome.extension.getURL('/img/favicon.png');
            resolve(entry);
          });
        }
      });
    };
  })()
};


'use strict';

var app = angular.module('ProjectTabManager', []);
app.value('ProjectManager', chrome.extension.getBackgroundPage().projectManager);

app.config(function($routeProvider) {
  $routeProvider.
    when('/options', {
      templateUrl: 'partials/options.html',
      controller: 'OptionsCtrl'
    }).
    when('/summary', {
      templateUrl: 'partials/summary.html',
      controller: 'SummaryCtrl'
    }).
    when('/help', {
      templateUrl: 'partials/readme.html'
    }).
    when('/history', {
      templateUrl: 'partials/history.html'
    }).
    otherwise({
      templateUrl: 'partials/options.html',
      controller: 'OptionsCtrl'
    });
});
'use strict';

app.directive('projectList', function(ProjectManager, Background) {
  return {
    restrict: 'C',
    controller: function($scope) {
      $scope.setActiveProjectId = function(id) {
        $scope.activeProjectId = id;
      },

      $scope.reload = function() {
        $scope.$emit('start-loading');
        Background.update(true).then(function() {
          $scope.projects = ProjectManager.projects;
          $scope.$apply();
          $scope.$emit('end-loading');
        });
      };

      $scope.set_dialog_title = function(title) {
        $scope.dialog_title = title;
      };

      $scope.openBookmarks = function() {
        var projectId = $scope.activeProjectId === '0' ? null : $scope.activeProjectId;
        ProjectManager.openBookmarkEditWindow(projectId);
      };

      $scope.openSummary = function() {
        chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#summary')});
      };

      $scope.openOptions = function() {
        chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#options')});
      };

      var activeProject = ProjectManager.getActiveProject();
      $scope.setActiveProjectId(activeProject && activeProject.id || '0');

      Background.update(false).then(function() {
        $scope.projects = ProjectManager.projects;
        if (!$scope.$$phase) $scope.$apply();
      });
    },
    link: function(scope, elem, attr) {
    }
  }
});

app.directive('dialog', function() {
  return {
    restrict: 'E',
    link: function(scope, elem, attr) {
    }
  }
});

app.directive('project', function(ProjectManager, Background, $window) {
  return {
    restrict: 'E',
    templateUrl: 'project.html',
    controller: function($scope) {
      $scope.title = $scope.project.title;
      $scope.expand = $scope.project.id === $scope.activeProjectId || false;
      $scope.hover = false;
      $scope.editing = false;

      $scope.flip = function() {
        $scope.expand = !$scope.expand;
        $scope.$apply();
      };

      $scope.open = function() {
        $scope.project.open();
      };

      $scope.toggle_editing = function() {
        if ($scope.editing && $scope.project.title !== $scope.title) {
          $scope.$emit('start-loading');
          Background.renameProject($scope.project.id, $scope.title).then(function() {
            $scope.$emit('end-loading');
            $scope.reload(true);
          });
        }
        $scope.editing = !$scope.editing;
      };

      $scope.remove = function() {
        // $scope.$emit('start-loading');
        Background.removeProject($scope.project.id).then(function() {
          // $scope.$emit('end-loading');
          $scope.reload(true);
        });
      };
    },
    link: function(scope, elem, attr) {
      elem.bind('keydown', function(e) {
        // Avoid shotcut on input element
        if (e.target.nodeName == 'INPUT' && e.keyCode === 13) {
          e.target.disabled = true;
          scope.save();
        } else {
          switch (e.keyCode) {
            case 13:
              scope.open();
              break;
            case 39:
              scope.expand = true;
              scope.$apply();
              break;
            case 37:
              scope.expand = false;
              scope.$apply();
              break;
            default:
              return;
          }
          e.preventDefault();
        }
      });

      elem.bind('mouseover', function(e) {
        scope.hover = true;
        scope.$apply();
      });

      elem.bind('mouseleave', function(e) {
        scope.hover = false;
        scope.$apply();
      });
    }
  }
});

app.directive('bookmark', function() {
  return {
    restrict: 'E',
    templateUrl: 'bookmark.html',
    controller: function($scope) {
      $scope.open = function() {
        var tabId = $scope.field.tabId;
        // If tab id is not assigned
        if (!tabId) {
          // Open new project field
          chrome.tabs.create({url: $scope.field.url, active: true});
        } else {
          chrome.tabs.get(tabId, function(tab) {
            // If the project filed is not open yet
            if (!tab) {
              // Open new project field
              chrome.tabs.create({url: $scope.field.url, active: true});
            // If the project filed is already open
            } else {
              chrome.windows.get(tab.windowId, function(win) {
                if (!win.focused) {
                  // Move focus to the window
                  chrome.windows.update(tab.windowId, {focused:true});
                }
                // Activate open project field
                chrome.tabs.update(tabId, {active: true});
              });
            }
          });
        }
      };
    },
    link: function(scope, elem, attr) {
    }
  }
});

app.directive('reload', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      scope.$on('start-loading', function() {
        elem.addClass('loading');
      });
      scope.$on('end-loading', function() {
        elem.removeClass('loading');
      });
    }
  }
});

app.directive('star', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      attr.$set('bookmarked', !!scope.field.id);
      attr.$set('chrome-i18n', 'add:title');
      if (scope.project.id == 0) {
        elem.css('display', 'none');
      }
      elem.bind('click', function() {
        if (scope.field.id !== undefined) {
          scope.project.removeBookmark(scope.field.id, function() {
            scope.field.id = undefined;
            attr.$set('bookmarked', false);
            scope.$apply();
          });
        } else {
          scope.$emit('start-loading');
          scope.project.addBookmark(scope.field.tabId, function(bookmark) {
            scope.field.id = bookmark.id;
            attr.$set('bookmarked', true);
            scope.$emit('end-loading');
            scope.$apply();
          });
        }
      });
    }
  }
});

app.directive('projectName', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      scope.compositing = false;
      elem.bind('compositionstart', function(e) {
        scope.compositing = true;
      });
      elem.bind('compositionend', function(e) {
        scope.compositing = false;
      });
      elem.bind('keydown', function(e) {
        if (e.keyCode === 13 && !scope.compositing) {
          scope.toggle_editing();
        }
        e.stopPropagation();
      });
      elem.bind('blur', function(e) {
        scope.compositing = false;
        scope.toggle_editing();
      });
    }
  }
})

app.directive('edit', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      elem.bind('click', scope.toggle_editing);
      // elem.bind('click', function() {
      //   scope.set_dialog_title(scope.project.title);
      //   scope.dialog.showModal();
      // });
    }
  }
});

app.directive('remove', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      elem.bind('click', scope.remove);
    }
  }
});

app.directive('arrow', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      elem.bind('click', scope.flip);
    }
  }
});

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

'use strict';

app.factory('Background', function() {
  return {
    // Create folder and add all tabs in specified window there
    createProject: function(title) {
      return new Promise(function(resolve) {
        chrome.runtime.sendMessage({
          command: 'createProject',
          title: title
        }, resolve);
      });
    },
    // Rename specified project folder
    renameProject: function(projectId, newTitle) {
      return new Promise(function(resolve) {
        chrome.runtime.sendMessage({
          command: 'renameProject',
          projectId: projectId,
          title: newTitle
        }, resolve);
      });
    },
    // Remove specified project folder
    removeProject: function(projectId) {
      return new Promise(function(resolve) {
        chrome.runtime.sendMessage({
          command: 'removeProject',
          projectId: projectId
        }, resolve);
      });
    },
    // Get folders of projects
    update: function(force_reload) {
      return new Promise(function(resolve) {
        chrome.runtime.sendMessage({
          command: 'update',
          forceReload: force_reload
        }, resolve);
      });
    }
  };
});
app.controller('SummaryCtrl', function($scope, ProjectManager) {
  var now   = new Date(),
      year  = now.getFullYear(),
      month = now.getMonth() + 1,
      date  = now.getDate(),
      today = year + '-' +
              (month < 10 ? '0' + month : month) + '-' +
              (date  < 10 ? '0' + date  : date);

  $scope.max = 0;
  $scope.summary_date   = today;
  $scope.summary_start  = today;
  $scope.summary_end    = today;

  $scope.get_summary = function() {
    ProjectManager.getSummary($scope.summary_start, $scope.summary_end, function(summary) {
      var max = 0, i = 0;
      for (var id in summary) {
        var session = summary[id];
        max += session.duration;
        session.backgroundColor = 'hsl('+((parseInt(id || 0)*135)%360)+', 100%, 50%)';
      };
      $scope.max = max;
      $scope.summary = summary;
      $scope.$apply();
    });
  };

  $scope.get_time_table = function() {
    ProjectManager.getTimeTable($scope.summary_date, function(table) {
      var start     = util.getLocalMidnightTime($scope.summary_date);
          end       = (new Date(start + (60 * 60 * 24 * 1000))).getTime();
      $scope.work_hour = end - start;
      table.forEach(function(session, index) {
        session.left  = (((session.start - start) / $scope.work_hour * 100))+'%';
        if (session.end === null) {
          session.width = (((end - session.start) / $scope.work_hour * 100))+'%';
        } else {
          session.width = (((session.end - session.start) / $scope.work_hour * 100))+'%';
        }
        session.backgroundColor = 'hsl('+((parseInt(session.id || 0)*135)%360)+', 100%, 50%)';
      });
      $scope.table = table;
      $scope.$apply();
    });
  };

  $scope.get_summary();
  $scope.get_time_table();
});

app.controller('ProjectSummaryCtrl', function($scope) {
  var sec   = $scope.project.duration;
  var hour  = ~~(sec/(60*60));
      sec  -= (hour*60*60);
  var min   = ~~(sec/60);
      sec  -= (min*60);

  var hour_min_sec = chrome.i18n.getMessage('hour_min_sec');
  $scope.project.timeStr = hour_min_sec.replace(/##hour##/, hour)
                                       .replace(/##min##/, min)
                                       .replace(/##sec##/, sec);
});

app.controller('TimeSummaryCtrl', function($scope) {
});
app.value('config', new Config());

app.controller('OptionsCtrl', function($scope, config) {
  $scope.config = config;
  chrome.bookmarks.getSubTree('0', function(bookmarks) {
    $scope.root_folders = bookmarks[0].children;
    $scope.$apply();
  });
});