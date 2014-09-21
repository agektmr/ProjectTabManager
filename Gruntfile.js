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
    sass: {
      styles: {
        files: [{
          expand: true,
          cwd: 'src/styles',
          src: ['*.scss'],
          dest: 'app/css',
          ext: '.css'
        }]
      }
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      background: {
        src: [
          'src/js/config.js',
          'src/js/util.js',
          'src/js/idb.js',
          'src/js/SessionManager.js',
          'src/js/BookmarkManager.js',
          'src/js/ProjectManager.js',
          'src/js/background.js'
        ],
        dest: 'app/js/background.js'
      },
      popup: {
        src: [
          'src/js/config.js',
          'src/js/util.js',
          'bower_components/angular/angular.min.js',
          'bower_components/angular-route/angular-route.min.js',
          'src/js/ng-app.js',
          'src/js/ng-services.js',
          'src/js/ng-filters.js',
          'src/js/ng-directives.js'
        ],
        dest: 'app/js/popup.js'
      },
      layout: {
        src: [
          'src/js/config.js',
          'src/js/util.js',
          'bower_components/angular/angular.min.js',
          'src/js/ng-app.js',
          'src/js/ng-route.js',
          'src/js/ng-directives.js',
          'src/js/ng-services.js',
          'src/js/ng-summary.js',
          'src/js/ng-options.js'
        ],
        dest: 'app/js/layout.js'
      },
      lazy: {
        src: [
          'src/js/util.js',
          'src/js/lazy.js'
        ],
        dest: 'app/js/lazy.js'
      }
    },
    markdown: {
      defaults: {
        expand: true,
        src: [
          'HISTORY.md', 'README.md'
        ],
        dest: 'app/partials/',
        ext: '.html',
        options: {
          template: 'src/template.jst'
        }
      }
    },
    version: {
      defaults: {
        src: [
          'bower.json',
          'app/manifest.json'
        ]
      }
    },
    compress: {
      main: {
        options: {
          archive: 'app.zip',
          mode: 'zip'
        },
        src: ['app/**']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-version');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-sass');

  // Default task.
  grunt.registerTask('default', ['bower', 'concat']);
  grunt.registerTask('install', ['bower']);
  grunt.registerTask('build', ['sass', 'concat', 'markdown', 'version', 'compress']);

};
