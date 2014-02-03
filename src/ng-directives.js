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

app.directive('project', function(ProjectManager, Background, $window) {
  return {
    restrict: 'E',
    templateUrl: 'project.html',
    controller: function($scope) {
      $scope.active = $scope.project.id === $scope.activeProjectId ? true: false;
      $scope.expand = $scope.project.winId === $scope.activeWindowId ? true : false;
      $scope.hover = false;

      $scope.save = function() {
        // $scope.$emit('start-loading');
        Background.createProject($scope.project_name, function(project) {
          // $scope.project = ProjectManager.project;
          $scope.setActiveProjectId(project.id);
          // $scope.$emit('end-loading');
          $scope.reload(true);
        });
      };

      $scope.associate = function() {
        var winId = ProjectManager.getActiveWindowId();
        $scope.project.associateWindow(winId);
        $scope.setActiveProjectId($scope.project.id);
        $scope.reload(true);
      };

      $scope.flip = function() {
        $scope.expand = !$scope.expand;
      };

      $scope.open = function() {
        $scope.project.open();
      };

      $scope.remove = function() {
        // $scope.$emit('start-loading');
        Background.removeProject($scope.project.id, function() {
          // $scope.$emit('end-loading');
          $scope.reload(true);
        });
      };
    },
    link: function(scope, elem, attr) {
      if (scope.active) {
        scope.expand = true;
      }

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

app.directive('pin', function() {
  return {
    restrict: 'C',
    link: function(scope, elem, attr) {
      if (scope.active) {
        elem.remove();
      }
      elem.bind('click', scope.associate);
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
