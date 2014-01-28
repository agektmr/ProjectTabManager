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
      chrome.runtime.sendMessage({
        command: 'open',
        object: 'ProjectEntity',
        projectId: projectId
      });
    },
    // // Assign project id to specified window
    // pin: function(projectId, winId, callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'pin',
    //     winId: winId,
    //     projectId: projectId
    //   }, callback);
    // },
    // // Move specified bookmark to passive folder
    // deactivate: function(projectId, bookmarkId, callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'deactivate',
    //     projectId: projectId,
    //     bookmarkId: ''+bookmarkId
    //   }, callback);
    // },
    // // Move specified bookmark out of passive folder
    // activate: function(projectId, bookmarkId, callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'activate',
    //     projectId: projectId,
    //     bookmarkId: ''+bookmarkId
    //   }, callback);
    // },
    // // Add new bookmark
    // add: function(projectId, bookmark, callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'add',
    //     projectId: projectId,
    //     tab: bookmark
    //   }, callback);
    // },
    // Create folder and add all tabs in specified window there
    createProject: function(title, callback) {
      chrome.runtime.sendMessage({
        command: 'createProject',
        object: 'ProjectManager',
        title: title
      }, callback);
    },
    // // Remove specified bookmark from project
    // remove: function(bookmarkId, callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'remove',
    //     bookmarkId: ''+bookmarkId
    //   }, callback);
    // },
    // Remove specified project folder
    removeProject: function(projectId, callback) {
      chrome.runtime.sendMessage({
        command: 'removeProject',
        object: 'ProjectManager',
        projectId: projectId
      }, callback);
    },
    // Get folders of projects
    update: function(force_reload, callback) {
      chrome.runtime.sendMessage({
        command: 'update',
        object: 'ProjectManager',
        forceReload: force_reload
      }, callback);
    },
    // // Get project id assigned to active window
    // current: function(winId, callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'current',
    //     winId: winId
    //   }, callback);
    // },
    // Get bookmarks of specified project id
    // bookmarks: function() {
    //   chrome.runtime.sendMessage({
    //   command: 'bookmarks',
    //   winId: winId,
    //   projectId: projectId
    // });
    // },
    // Open bookmark manager tab
    openBookmarkEditWindow: function(projectId) {
      chrome.runtime.sendMessage({
        command: 'openBookmarkEditWindow',
        object: 'ProjectManager',
        projectId: projectId
      });
    },
    getActiveWindowId: function() {
      chrome.runtime.sendMessage({
        command: 'getActiveWindowId',
        object: 'ProjectManager'
      });
    },
    getActiveProject: function() {
      chrome.runtime.sendMessage({
        command: 'getActiveProject',
        object: 'ProjectManager'
      });
    // },
    // // Receive timesummary data for debug use
    // timesummary: function(callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'timesummary'
    //   }, callback);
    // },
    // // Receive summary data for debug use
    // summary: function(callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'summary'
    //   }, callback);
    // },
    // // Receive window status for debug use
    // windows: function(callback) {
    //   chrome.runtime.sendMessage({
    //     command: 'windows'
    //   }, callback);
    }
  };
});