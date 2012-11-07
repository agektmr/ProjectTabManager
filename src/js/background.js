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

var windowHistory = {};

chrome.windows.onRemoved.addListener(function(winId) {
  TabManager.resetProject(winId);
});

chrome.windows.onFocusChanged.addListener(function(winId) {
  if (winId == chrome.windows.WINDOW_ID_NONE) {
    VisibilityTracker.winChanged();
  } else {
    chrome.windows.get(winId, {populate:true}, VisibilityTracker.winChanged);
  }
});

chrome.extension.onRequest.addListener(function(req, sender, callback) {
  switch (req.command) {
  case 'open':
    ProjectTabManager.openProject(req.projectId);
    break;
  case 'pin':
    ProjectTabManager.getProject(req.projectId, function(project) {
      TabManager.setProject(req.winId, project);
      windowHistory[req.winId] = {};
      windowHistory[req.winId].title = project.title;
      callback(project);
    });
    break;
  case 'deactivate':
    ProjectTabManager.moveToHiddenFolder(req.projectId, req.bookmarkId, callback);
    break;
  case 'activate':
    ProjectTabManager.moveFromHiddenFolder(req.projectId, req.bookmarkId, callback);
    break;
  case 'add':
    ProjectTabManager.addBookmark(req.projectId, req.tab, callback);
    break;
  case 'addProject':
    ProjectTabManager.addProject(req.name || 'New Project', function(newProject) {
      chrome.windows.getCurrent(function(win) {
        TabManager.setProject(win.id, newProject);
        windowHistory[win.id] = {};
        windowHistory[win.id].title = newProject.title;
      });
      callback(newProject);
    });
    break;
  case 'remove':
    ProjectTabManager.removeBookmark(req.bookmarkId, callback);
    break;
  case 'removeProject':
    ProjectTabManager.removeProject(req.projectId, callback);
    break;
  case 'projects':
    ProjectTabManager.getProjectList(callback);
    break;
  case 'current':
    callback(TabManager.getCurrentProjectId(req.winId));
    break;
  case 'bookmarks':
    ProjectTabManager.getBookmarks(req.projectId, callback);
    break;
  case 'edit':
    ProjectTabManager.getRoot(function(root) {
      chrome.tabs.create({url:'chrome://bookmarks/#'+root.id});
    });
    break;
  case 'timesummary':
    callback(VisibilityTracker.getTimeSummary(windowHistory));
    break;
  case 'summary':
    callback(VisibilityTracker.getSummary(windowHistory));
    break;
  case 'windows':
    callback(TabManager.projects);
  default:
    break;
  }
});

// chrome.experimental.commands.onCommand.addListener(function(command) {
//   console.log('command');
// });