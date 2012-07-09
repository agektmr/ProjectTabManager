'use strict';

app.controller('ProjectListCtrl', function($scope, Background) {
  $scope.currentWinId = '0';

  $scope.currentTabs = [];

  $scope.projectId = '0';

  $scope.reload = function() {
    Background.projects(function(projects) {
      projects.unshift({
        id: '0',
        title: chrome.i18n.getMessage('name_this'),
        children: []
      });
      $scope.projects = projects;
    });
  };

  $scope.openSummary = function() {
    chrome.tabs.create({url:'/summary.html'});
  };

  $scope.openOptions = function() {
    chrome.tabs.create({url:'/options.html'});
  };

  $scope.pinProject = function(projectId) {
    return function() {
      Background.pin(projectId, $scope.currentWinId, function(project) {
        $scope.projectId = project.id;
        $scope.reload();
      });
    };
  };

  $scope.edit = Background.edit;

  chrome.windows.getCurrent(function(win) {
    $scope.currentWinId = win.id;
    chrome.tabs.query({windowId:win.id}, function(tabs) {
      $scope.currentTabs = tabs;
    });
    Background.current(win.id, function(projectId) {
      $scope.projectId = projectId;
      $scope.reload();
    });
  });
});

app.controller('ProjectCtrl', function($scope, Background) {
  $scope.expand = false;

  $scope.add = function() {
    Background.addProject($scope.project_name, $scope.currentWinId, function(project) {
      $scope.projectId = project.id;
      $scope.reload();
    });
  };

  $scope.pin = $scope.pinProject($scope.project.id);

  $scope.flip = function() {
    $scope.expand = $scope.expand  ? false : true;
  };

  $scope.open = function() {
    if ($scope.project.id == '0') return;
    Background.open($scope.project.id);
  };

  $scope.remove = function() {
    Background.removeProject($scope.project.id, function() {
      $scope.reload();
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
      $scope.passive = $scope.passive ? false : true;
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
    $scope.expand = $scope.expand ? false : true;
  };

  Background.debug(function(tracker) {
    $scope.tracker = tracker;
  });
});