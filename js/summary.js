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
var $ = function(query) {
  return document.querySelector(query);
};
var secondsToTimeString = function(seconds) {
  var sec = seconds;
  var hour = ~~(sec/(60*60));
  sec -= (hour*60*60);
  var min = ~~(sec/60);
  sec -= (min*60);
  var hour_min_sec = chrome.i18n.getMessage('hour_min_sec');
  return hour_min_sec.replace(/##hour##/, hour)
                     .replace(/##min##/, min)
                     .replace(/##sec##/, sec);
};
google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(function() {
  chrome.extension.sendRequest({command:'summary'}, function(summary) {
    var data = new google.visualization.DataTable();
    data.addColumn('string', chrome.i18n.getMessage('project_name'));
    data.addColumn('number', chrome.i18n.getMessage('amount_of_time_spent'));
    var rows = [];
    var total = 0;
    for (var winId in summary) {
      summary[winId].timeString = secondsToTimeString(summary[winId].time);
      summary[winId].title = summary[winId].title+' ('+summary[winId].timeString+')';
      rows.push([''+summary[winId].title, summary[winId].time]);
      total += summary[winId].time;
    }
    console.log(secondsToTimeString(total));
    data.addRows(rows);

    var options = {
      title: chrome.i18n.getMessage('todays_project_summary'),
      height: 500,
      chartArea: {
        top: 100,
        width: 600,
        height: 500
      }
    };

    var chart = new google.visualization.PieChart($('#chart_div'));
    chart.draw(data, options);
  });
});