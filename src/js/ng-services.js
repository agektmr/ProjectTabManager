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

app.factory('Background', function() {
  return {
    // Open project tabs. If existing project window found, activate it.
    open: function(projectId) {
      chrome.extension.sendRequest({command: 'open', projectId: projectId});
    },
    // Assign project id to specified window
    pin: function(projectId, winId, callback) {
      chrome.extension.sendRequest({command: 'pin', winId: winId, projectId: projectId}, callback);
    },
    // Move specified bookmark to passive folder
    deactivate: function(projectId, bookmarkId, callback) {
      chrome.extension.sendRequest({command: 'deactivate', projectId: projectId, bookmarkId: bookmarkId}, callback);
    },
    // Move specified bookmark out of passive folder
    activate: function(projectId, bookmarkId, callback) {
      chrome.extension.sendRequest({command: 'activate', projectId: projectId, bookmarkId: bookmarkId}, callback);
    },
    // Add new bookmark
    add: function(projectId, bookmark, callback) {
      chrome.extension.sendRequest({command: 'add', projectId: projectId, tab: bookmark}, callback);
    },
    // Create folder and add all tabs in specified window there
    addProject: function(name, winId, callback) {
      chrome.extension.sendRequest({command: 'addProject', name: name, winId: winId}, callback);
    },
    // Remove specified bookmark from project
    remove: function(bookmarkId, callback) {
      chrome.extension.sendRequest({command: 'remove', bookmarkId: bookmarkId}, callback);
    },
    // Remove specified project folder
    removeProject: function(projectId, callback) {
      chrome.extension.sendRequest({command: 'removeProject', projectId: projectId}, callback);
    },
    // Get folders of projects
    projects: function(callback) {
      chrome.extension.sendRequest({command: 'projects'}, function(projects) {
        if (projects && projects.length > 0) {
          callback(projects.slice(0));
        } else {
          callback([]);
        }
      });
    },
    // Get project id assigned to active window
    current: function(winId, callback) {
      chrome.extension.sendRequest({command: 'current', winId: winId}, callback);
    },
    // Get bookmarks of specified project id
    // bookmarks: function() {
    //   chrome.extension.sendRequest({command: 'bookmarks', winId: winId, projectId: projectId});
    // },
    // Open bookmark manager tab
    edit: function() {
      chrome.extension.sendRequest({command: 'edit'});
    },
    // Receive timesummary data
    timesummary: function(callback) {
      chrome.extension.sendRequest({command: 'timesummary'}, callback);
    },
    // Receive summary data
    summary: function(callback) {
      chrome.extension.sendRequest({command: 'summary'}, callback);
    }
  };
});