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

var bookmarkManager,
    sessionManager,
    projectManager,
    db;

chrome.runtime.onInstalled.addListener(function(details) {
  // Pop up history page only if the version changes in major (ex 2.0.0) or minor (ex 2.1.0).
  // Trivial change (ex 2.1.1) won't popu up.
  if (details.reason === 'update' && chrome.runtime.getManifest().version.match(/0$/)) {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#history')});

  // Pop up help page on first installation
  } else if (details.reason === 'install') {
    chrome.tabs.create({url:chrome.extension.getURL('/ng-layout.html#help')});
  }
});

var config = new Config(function() {
  bookmarkManager = new BookmarkManager(config, function() {
    db = new idb(config);
    sessionManager = new SessionManager(config, function() {
      projectManager = new ProjectManager(config);
      projectManager.update(true);
    });
  });
});

chrome.runtime.onMessage.addListener(function(msg, sender, respond) {
  var params = [];
  for (var key in msg) {
    if (key == 'command') continue;
    params.push(msg[key]);
  }
  params.push(respond);
  ProjectManager.prototype[msg.command].apply(projectManager, params);
  return true;
});
