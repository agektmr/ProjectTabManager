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

var VisibilityTracker = (function() {
  var tracker = [];
  var Session = (function() {
    var Session = function(winId) {
      this.winId = winId;
      this.projectId = TabManager.projectIds[winId] || null;
      this.start = new Date();
      this.end = null;
    };
    Session.prototype = {
      endSession: function() {
        this.end = new Date();
      }
    };
    return function(winId) {
      return new Session(winId);
    };
  })();

  chrome.windows.onFocusChanged.addListener(function(winId) {
    if (winId == chrome.windows.WINDOW_ID_NONE) {
      VisibilityTracker.winChanged();
    } else {
      chrome.windows.get(winId, {populate:true}, VisibilityTracker.winChanged);
    }
  });

  chrome.windows.getCurrent(function(win) {
    tracker.push(new Session(win.id));
  });

  return {
    winChanged: function(win) {
      var last = tracker.length-1;
      if (!win) { // null window means session end
        tracker[last].endSession();
        return;
      }
      if (win.tabs.length == 1 && win.tabs[0].url.match(util.CHROME_EXCEPTION_URL)) {
        return;
      }
      if (tracker[last].end === null)
        tracker[last].endSession();
      tracker.push(new Session(win.id));
    },
    getSummary: function() {
      var _session = {};
      tracker.forEach(function(session) {
        var projectId = session.projectId;
        if (!_session[projectId]) {
          _session[projectId] = {};
          _session[projectId].duration = 0;
          if (projectId) {
            ProjectTabManager.getProject(projectId, function(project) {
              _session[projectId].title = project.title;
            });
          } else {
            _session[projectId].title = 'Unknown';
          }
        }
        var end = session.end ? session.end.getTime() : (new Date()).getTime();
        var duration = ~~((end - session.start.getTime()) / 1000);
        _session[projectId].duration += duration;
      });
      return _session;
    },
    getTimeSummary: function() {
      var copy = [];
      tracker.forEach(function(session) {
        var _session = {};
        _session.winId = session.winId;
        _session.projectId = session.projectId;
        _session.start = session.start.getTime();
        _session.end = session.end ? session.end.getTime() : null;
        if (session.projectId) {
          ProjectTabManager.getProject(session.projectId, function(project) {
            _session.projectName = project.title;
          });
        } else {
          _session.projectName = 'Unknown';
        }
        copy.push(_session);
      });
      return copy;
    }
  };
})();