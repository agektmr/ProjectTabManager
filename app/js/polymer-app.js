/*! ProjectTabManager - v3.0.1 - 2015-02-11
* Copyright (c) 2015 ; Licensed  */
/*! ProjectTabManager - v3.0.1 - 2015-01-02
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

var app = {};

var ProjectManager = chrome.extension.getBackgroundPage().projectManager;

document.addEventListener('polymer-ready', function() {
  var t = document.querySelector('#t');
  t.selectedMenu = 0;
  t.projects = ProjectManager.projects;
  t.toggle = function() {
    this.$.drawerPanel.togglePanel();
  };
  t.openSummary = function() {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#summary')});
  };
  t.openBookmarks = function() {
    // var projectId = $scope.activeProjectId === '0' ? null : $scope.activeProjectId;
    // ProjectManager.openBookmarkEditWindow(projectId);
  };
  t.openOptions = function() {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#options')});
  };
});

// app.filter('percentage', function() {
//   return function(max) {
//     return (this.project.duration/max*100)|0;
//   };
// });
// app.filter('sort', function() {
//   return function(projects, projectId) {
//     if (!projects) return;
//
//     var preceding = [],
//         following = [];
//     // Move active project up to the top
//     for (var i = 0; i < projects.length; i++) {
//       var project = projects[i];
//       if (project.id === '0' || project.id === projectId) {
//         preceding.push(project);
//       } else {
//         following.push(project);
//       }
//     };
//     return preceding.concat(following);
//   };
// });
//
// app.directive('project', function(ProjectManager, Background, $window) {
//   return {
//     restrict: 'E',
//     templateUrl: 'project.html',
//     controller: function($scope) {
//       $scope.hover = false;
//       $scope.editing = false;
//
//       $scope.open = function() {
//         $scope.project.open();
//       };
//
//       $scope.toggle_editing = function() {
//         if ($scope.editing && $scope.project.title !== $scope.title) {
//           $scope.$emit('start-loading');
//           Background.renameProject($scope.project.id, $scope.title).then(function() {
//             $scope.$emit('end-loading');
//             $scope.reload(true);
//           });
//         }
//         $scope.editing = !$scope.editing;
//       };
//
//     },
//     link: function(scope, elem, attr) {
//       elem.bind('keydown', function(e) {
//         // Avoid shotcut on input element
//         if (e.target.nodeName == 'INPUT' && e.keyCode === 13) {
//           e.target.disabled = true;
//           scope.save();
//         } else {
//           switch (e.keyCode) {
//             case 13:
//               scope.open();
//               break;
//             case 39:
//               scope.expand = true;
//               scope.$apply();
//               break;
//             case 37:
//               scope.expand = false;
//               scope.$apply();
//               break;
//             default:
//               return;
//           }
//           e.preventDefault();
//         }
//       });
//
//       elem.bind('mouseover', function(e) {
//         scope.hover = true;
//         scope.$apply();
//       });
//
//       elem.bind('mouseleave', function(e) {
//         scope.hover = false;
//         scope.$apply();
//       });
//     }
//   }
// });
//
// app.directive('bookmark', function() {
//   return {
//     restrict: 'E',
//     templateUrl: 'bookmark.html',
//     controller: function($scope) {
//       $scope.open = function() {
//         var tabId = $scope.field.tabId;
//         // If tab id is not assigned
//         if (!tabId) {
//           // Open new project field
//           chrome.tabs.create({url: $scope.field.url, active: true});
//         } else {
//           chrome.tabs.get(tabId, function(tab) {
//             // If the project filed is not open yet
//             if (!tab) {
//               // Open new project field
//               chrome.tabs.create({url: $scope.field.url, active: true});
//             // If the project filed is already open
//             } else {
//               chrome.windows.get(tab.windowId, function(win) {
//                 if (!win.focused) {
//                   // Move focus to the window
//                   chrome.windows.update(tab.windowId, {focused:true});
//                 }
//                 // Activate open project field
//                 chrome.tabs.update(tabId, {active: true});
//               });
//             }
//           });
//         }
//       };
//     },
//     link: function(scope, elem, attr) {
//     }
//   }
// });
//
// app.directive('reload', function() {
//   return {
//     restrict: 'C',
//     link: function(scope, elem, attr) {
//       scope.$on('start-loading', function() {
//         elem.addClass('loading');
//       });
//       scope.$on('end-loading', function() {
//         elem.removeClass('loading');
//       });
//     }
//   }
// });
//
// app.directive('projectName', function() {
//   return {
//     restrict: 'C',
//     link: function(scope, elem, attr) {
//       scope.compositing = false;
//       elem.bind('compositionstart', function(e) {
//         scope.compositing = true;
//       });
//       elem.bind('compositionend', function(e) {
//         scope.compositing = false;
//       });
//       elem.bind('keydown', function(e) {
//         if (e.keyCode === 13 && !scope.compositing) {
//           scope.toggle_editing();
//         }
//         e.stopPropagation();
//       });
//       elem.bind('blur', function(e) {
//         scope.compositing = false;
//         scope.toggle_editing();
//       });
//     }
//   }
// })
//
// app.directive('edit', function() {
//   return {
//     restrict: 'C',
//     link: function(scope, elem, attr) {
//       elem.bind('click', scope.toggle_editing);
//       // elem.bind('click', function() {
//       //   scope.set_dialog_title(scope.project.title);
//       //   scope.dialog.showModal();
//       // });
//     }
//   }
// });
//
// app.directive('remove', function() {
//   return {
//     restrict: 'C',
//     link: function(scope, elem, attr) {
//       elem.bind('click', scope.remove);
//     }
//   }
// });
//
// app.directive('chromeI18n', function() {
//   var cache = {};
//   return function(scope, element, attrs) {
//     var params = attrs.chromeI18n.split(':'),
//         key, name;
//     if (params.length !== 2) return;
//     key = params[0];
//     name = params[1];
//     cache[key] = cache[key] || chrome.i18n.getMessage(key);
//     if (name == 'inner') {
//       element.append(cache[key]);
//     } else {
//       attrs.$set(name, cache[key]);
//     };
//   };
// });
