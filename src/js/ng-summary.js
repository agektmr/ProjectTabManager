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
app.controller('SummaryCtrl', function($scope, ProjectManager) {
  var now   = new Date(),
      year  = now.getFullYear(),
      month = now.getMonth() + 1,
      date  = now.getDate(),
      today = year + '-' +
              (month < 10 ? '0' + month : month) + '-' +
              (date  < 10 ? '0' + date  : date);

  $scope.max = 0;
  $scope.summary_date   = today;
  $scope.summary_start  = today;
  $scope.summary_end    = today;

  $scope.get_summary = function() {
    ProjectManager.getSummary($scope.summary_start, $scope.summary_end, function(summary) {
      var max = 0, i = 0;
      for (var id in summary) {
        var session = summary[id];
        max += session.duration;
        session.backgroundColor = 'hsl('+((parseInt(id || 0)*135)%360)+', 100%, 50%)';
      };
      $scope.max = max;
      $scope.summary = summary;
      $scope.$apply();
    });
  };

  $scope.get_time_table = function() {
    ProjectManager.getTimeTable($scope.summary_date, function(table) {
      var start     = util.getLocalMidnightTime($scope.summary_date);
          end       = (new Date(start + (60 * 60 * 24 * 1000))).getTime();
      $scope.work_hour = end - start;
      table.forEach(function(session, index) {
        session.left  = (((session.start - start) / $scope.work_hour * 100))+'%';
        if (session.end === null) {
          session.width = (((end - session.start) / $scope.work_hour * 100))+'%';
        } else {
          session.width = (((session.end - session.start) / $scope.work_hour * 100))+'%';
        }
        session.backgroundColor = 'hsl('+((parseInt(session.id || 0)*135)%360)+', 100%, 50%)';
      });
      $scope.table = table;
      $scope.$apply();
    });
  };

  $scope.get_summary();
  $scope.get_time_table();
});

app.controller('ProjectSummaryCtrl', function($scope) {
  var sec   = $scope.project.duration;
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