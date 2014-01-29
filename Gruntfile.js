/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      install: {
        options: {
          targetDir: 'app/lib',
          layout: 'byType',
          install: true,
          verbose: true,
          cleanTargetDir: true,
          cleanBowerDir: false
        }
      }
    },
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      background: {
        src: [
          'src/config.js',
          'src/util.js',
          'src/idb.js',
          'src/SessionManager.js',
          'src/BookmarkManager.js',
          'src/ProjectManager.js',
          'src/background.js'
        ],
        dest: 'app/js/background.js'
      },
      popup: {
        src: [
          'src/config.js',
          'src/util.js',
          'bower_components/angular/angular.min.js',
          'bower_components/angular-route/angular-route.min.js',
          'src/ng-app.js',
          'src/ng-services.js',
          'src/ng-controllers.js',
          'src/ng-filters.js',
          'src/ng-directives.js'
        ],
        dest: 'app/js/popup.js'
      },
      layout: {
        src: [
          'src/config.js',
          'src/util.js',
          'bower_components/angular/angular.min.js',
          'src/ng-app.js',
          'src/ng-route.js',
          'src/ng-directives.js',
          'src/ng-services.js',
          'src/ng-summary.js',
          'src/ng-options.js'
        ],
        dest: 'app/js/layout.js'
      },
      lazy: {
        src: [
          'src/util.js',
          'src/lazy.js'
        ],
        dest: 'app/js/lazy.js'
      }
    },
    markdown: {
      all: {
        files: [
          {
            expand: true,
            src: 'HISTORY.md',
            dest: 'app/partials/',
            ext: '.html'
          }
        ],
        options: {
          template: 'src/template.jst'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-markdown');

  // Default task.
  grunt.registerTask('default', ['bower', 'concat']);
  grunt.registerTask('install', ['bower']);
  grunt.registerTask('build', ['concat']);

};
