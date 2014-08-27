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

app.filter('percentage', function() {
  return function(max) {
    return (this.project.duration/max*100)|0;
  };
});
app.filter('sort', function() {
  return function(projects, projectId) {
    if (!projects) return;

    var preceding = [],
        following = [];
    // Move active project up to the top
    for (var i = 0; i < projects.length; i++) {
      var project = projects[i];
      if (project.id === '0' || project.id === projectId) {
        preceding.push(project);
      } else {
        following.push(project);
      }
    };
    return preceding.concat(following);
  };
});