'use strict';

app.factory('Background', function() {
  return {
    open: function(projectId) {
      chrome.extension.sendRequest({command: 'open', projectId: projectId});
    },
    pin: function(projectId, winId, callback) {
      chrome.extension.sendRequest({command: 'pin', winId: winId, projectId: projectId}, callback);
    },
    deactivate: function(projectId, bookmarkId, callback) {
      chrome.extension.sendRequest({command: 'deactivate', projectId: projectId, bookmarkId: bookmarkId}, callback);
    },
    activate: function(projectId, bookmarkId, callback) {
      chrome.extension.sendRequest({command: 'activate', projectId: projectId, bookmarkId: bookmarkId}, callback);
    },
    add: function(projectId, bookmark, callback) {
      chrome.extension.sendRequest({command: 'add', projectId: projectId, tab: bookmark}, callback);
    },
    addProject: function(name, winId, callback) {
      chrome.extension.sendRequest({command: 'addProject', name: name, winId: winId}, callback);
    },
    remove: function(bookmarkId, callback) {
      chrome.extension.sendRequest({command: 'remove', bookmarkId: bookmarkId}, callback);
    },
    removeProject: function(projectId, callback) {
      chrome.extension.sendRequest({command: 'removeProject', projectId: projectId}, callback);
    },
    projects: function(callback) {
      chrome.extension.sendRequest({command: 'projects'}, function(projects) {
        callback(projects.slice(0));
      });
    },
    current: function(winId, callback) {
      chrome.extension.sendRequest({command: 'current', winId: winId}, callback);
    },
    bookmarks: function() {
      chrome.extension.sendRequest({command: 'bookmarks', winId: winId, projectId: projectId});
    },
    edit: function() {
      chrome.extension.sendRequest({command: 'edit'});
    },
    debug: function(callback) {
      chrome.extension.sendRequest({command: 'debug'}, callback);
    },
    summary: function(callback) {
      chrome.extension.sendRequest({command: 'summary'}, callback);
    }
  };
});