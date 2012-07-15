/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eiji Kitamura (agektmr@chromium.org)
*/
var VisibilityTracker = (function() {
  var tracker = [];
  var session = (function() {
    var getFormattedStartTime = function(ydt) {
      if (ydt == null) return '';
      var year  = ydt.getFullYear();
      var month = ydt.getMonth()+1;
      var date  = ydt.getDate();
      var hour  = ydt.getHours() < 10 ? '0'+ydt.getHours() : ydt.getHours();
      var min   = ydt.getMinutes() < 10 ? '0'+ydt.getMinutes() : ydt.getMinutes();;
      var sec   = ydt.getSeconds() < 10 ? '0'+ydt.getSeconds() : ydt.getSeconds();;
      // return year+'/'+month+'/'+date+' '+hour+':'+min+':'+sec;
      return hour+':'+min+':'+sec;
    };
    var session = function(winId) {
      this.winId = winId;
      this.start = new Date();
      this.end = null;
    };
    session.prototype = {
      endSession: function() {
        this.end = new Date();
      },
      convertTransferrable: function() {
        var obj = {
          winId: this.winId,
          start: null,
          end: null
        };
        obj.start = getFormattedStartTime(this.start);
        obj.end = getFormattedStartTime(this.end);
        return obj;
      }
    };
    return function(winId) {
      return new session(winId);
    }
  })();
  chrome.windows.getCurrent(function(win) {
      tracker.push(new session(win.id));
  });
  return {
    winChanged: function(winId) {
      var last = tracker.length-1;
      if (winId == chrome.windows.WINDOW_ID_NONE) {
        tracker[last].endSession();
      } else {
        if (tracker[last].end == null)
          tracker[last].endSession();
        tracker.push(new session(winId));
      }
      return;
    },
    getSummary: function(windowHistory) {
      var times = {};
      tracker.forEach(function(session) {
        var winId = session.winId;
        if (!times[winId]) {
          times[winId] = {};
          times[winId].time = 0;
          times[winId].title = windowHistory[winId] ? windowHistory[winId].title : session.winId;
        }
        var end = session.end ? session.end.getTime() : (new Date()).getTime();
        var time = ~~((end - session.start.getTime()) / 1000);
        times[winId].time += time;
      })
      return times;
    },
    getDebugInfo: function(windowHistory) {
      var copy = [];
      for (var i = 0; i < tracker.length; i++) {
        var debugInfo = tracker[i].convertTransferrable();
        if (windowHistory[debugInfo.winId])
          debugInfo.projectName = windowHistory[debugInfo.winId].title;
        else
          debugInfo.projectName = debugInfo.winId;
        copy.push(debugInfo);
      }
      return copy;
    }
  };
})();