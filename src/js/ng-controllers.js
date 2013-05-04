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

app.value('ProjectManager', chrome.extension.getBackgroundPage().projectManager);

app.controller('ProjectListCtrl', function($scope, $window, ProjectManager) {
  $window.addEventListener('keydown', function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      var scope = angular.element(event.target).scope();
      if (scope.open) {
        scope.open();
      }
    }
  });

  $scope.setActiveProjectId = function(id) {
    $scope.activeProjectId = id;
  },

  $scope.reload = function() {
    $scope.projects = ProjectManager.getProjectList(true);
    $scope.$apply();
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

  $scope.reload();
  // TODO: merge active window and active project id into active project?
  $scope.activeWindowId   = ProjectManager.getActiveWindowId();
  var activeProject       = ProjectManager.getActiveProject();

  $scope.setActiveProjectId(activeProject && activeProject.id || '0');
});

app.controller('ProjectCtrl', function($scope, ProjectManager) {
  $scope.expand = $scope.project.winId === $scope.activeWindowId ? true : false;

  $scope.save = function() {
    ProjectManager.createProject($scope.project_name, function(project) {
      $scope.project = project;
      $scope.setActiveProjectId(project.id);
      $scope.reload();
    });
  };

  $scope.associate = function() {
    // TODO check if this works well
    var winId = ProjectManager.getActiveWindowId();
    $scope.project.associateWindow(winId);
    $scope.setActiveProjectId($scope.project.id);
  };

  $scope.flip = function() {
    $scope.expand = !$scope.expand;
  };

  $scope.open = function() {
    $scope.project.open();
  };

  $scope.remove = function() {
    ProjectManager.removeProject($scope.project.id, function() {
      $scope.reload();
    });
  };
});

app.controller('FieldCtrl', function($scope, ProjectManager) {
  $scope.toggle = function() {
    if ($scope.field.id !== undefined) {
      $scope.project.removeBookmark($scope.field.id, function() {
        $scope.field.id = undefined;
        $scope.$apply();
      });
    } else {
      $scope.project.addBookmark($scope.field.tabId, function(bookmark) {
        $scope.field.id = bookmark.id;
        $scope.$apply();
      });
    }
  };

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
          // Just activate open project field
          chrome.tabs.update(tabId, {active: true});
        }
      });
    }
  };
});

// app.controller('DebugCtrl', function($scope, ProjectManager) {
//   $scope.debug = true;
//   $scope.expand = false;
//   $scope.tracker = [];
//   $scope.windows = {};

//   $scope.flip = function() {
//     $scope.expand = !$scope.expand;
//   };

//   // Background.timesummary(function(tracker) {
//   //   $scope.tracker = tracker;
//   // });
//   // Background.windows(function(windows) {
//   //   $scope.windows = windows;
//   // });
// });

