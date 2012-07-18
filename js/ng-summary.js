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
app.controller('SummaryCtrl', function($scope, Background) {
  Background.summary(function(summary) {
    var max = 0, i = 0;
    for(var key in summary) {
      max = summary[key].time > max ? summary[key].time : max;
      summary[key].backgroundColor = 'hsl('+((i++*135)%360)+', 100%, 50%)';
    }
    $scope.max = max;
    $scope.summary = summary;
    Background.debug(function(tracker) {
      var start = 0,
          end = (new Date()).getTime();
      if (tracker[0]) start = tracker[0].start;
      $scope.work_hour = end - start;
      tracker.forEach(function(session, index) {
        session.left  = (((session.start - start) / $scope.work_hour * 100))+'%';
        if (session.end === null) {
          session.width = (((end - session.start) / $scope.work_hour * 100))+'%';
        } else {
          session.width = (((session.end - session.start) / $scope.work_hour * 100))+'%';
        }
        session.backgroundColor = $scope.summary[session.winId].backgroundColor;
      })
      $scope.tracker = tracker;
      $scope.$apply();
    });
  });
});

app.controller('ProjectSummaryCtrl', function($scope) {
  // var sec   = $scope.project.time;
  // var hour  = (sec/60*60)|0;
  //     sec  -= hour*60*60|0;
  // var min   = sec/60|0;
  //     sec  -= min*60|0;
  var sec   = $scope.project.time;
  var hour  = ~~(sec/(60*60));
      sec  -= (hour*60*60);
  var min   = ~~(sec/60);
      sec  -= (min*60);

  var hour_min_sec = chrome.i18n.getMessage('hour_min_sec');
  $scope.project.timeStr = hour_min_sec.replace(/##hour##/, hour)
                                       .replace(/##min##/, min)
                                       .replace(/##sec##/, sec);
});

app.controller('TimeSummaryCtrl', function($scope) {
});