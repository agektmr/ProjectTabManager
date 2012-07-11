'use strict';

app.controller('ProjectListCtrl', function($scope, Background) {
  $scope.currentWinId = '0';
  $scope.currentTabs = [];
  $scope.projectId = '0';

  $scope.reload = function(projectId) {
    Background.projects(function(projects) {
      projects.unshift({
        id: '0',
        title: chrome.i18n.getMessage('name_this'),
        children: []
      });
      $scope.$apply(function() {
        $scope.projectId = projectId || $scope.projectId;
        $scope.projects = projects;
      });
    });
  };

  $scope.openSummary = function() {
    chrome.tabs.create({url:'/summary.html'});
  };

  $scope.openOptions = function() {
    chrome.tabs.create({url:'/options.html'});
  };

  $scope.edit = Background.edit;

  chrome.windows.getCurrent(function(win) {
    $scope.currentWinId = win.id;
    chrome.tabs.query({windowId:win.id}, function(tabs) {
      $scope.currentTabs = tabs;
    });
    Background.current(win.id, function(projectId) {
      $scope.reload(projectId);
    });
  });
});

app.controller('ProjectCtrl', function($scope, Background) {
  $scope.expand = false;

  $scope.add = function() {
    if ($scope.project_name.length == 0) return;
    Background.addProject($scope.project_name, $scope.currentWinId, function(project) {
      $scope.reload(project.id);
    });
  };

  $scope.pin = function() {
    Background.pin($scope.project.id, $scope.currentWinId, function(project) {
      $scope.reload(project.id);
    });
  };

  $scope.flip = function() {
    $scope.expand = !$scope.expand;
  };

  $scope.open = function() {
    if ($scope.project.id == '0') return;
    Background.open($scope.project.id);
  };

  $scope.remove = function() {
    var projectId = $scope.project.id == $scope.projectId ? '0' : $scope.projectId;
    Background.removeProject($scope.project.id, function() {
      $scope.reload(projectId);
    });
  };
});

app.controller('BookmarkCtrl', function($scope, Background) {
  $scope.passive = $scope.bookmark.passive || false;
  $scope.current = $scope.bookmark.current || false;
  $scope.adding  = $scope.bookmark.adding  || false;

  var i18n_activate   = chrome.i18n.getMessage('activate');
  var i18n_deactivate = chrome.i18n.getMessage('deactivate');
  $scope.titleStatus  = $scope.passive ? i18n_activate : i18n_deactivate;

  $scope.domain = ($scope.bookmark.url && $scope.bookmark.url.replace(/^.*?\/\/(.*?)\/.*$/, "$1")) || '';

  $scope.add = function() {
    Background.add($scope.project.id, $scope.bookmark, function() {
      $scope.reload();
    });
  };

  $scope.changeStatus = function() {
    Background[$scope.passive ? 'activate' : 'deactivate']($scope.project.id, $scope.bookmark.id, function() {
      $scope.passive = !$scope.passive;
      $scope.titleStatus = $scope.passive ? i18n_activate : i18n_deactivate;
    });
  };

  $scope.delete = function() {
    Background.remove($scope.bookmark.id, function() {
      $scope.reload();
    });
  };
});

app.controller('DebugCtrl', function($scope, Background) {
  $scope.debug = config.debug;
  $scope.expand = false;
  $scope.tracker = [];

  $scope.flip = function() {
    $scope.expand = !$scope.expand;
  };

  Background.debug(function(tracker) {
    $scope.tracker = tracker;
  });
});