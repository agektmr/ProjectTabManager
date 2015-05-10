/*global module:false*/
module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      app: ['app/*']
    },
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
      app: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['styles/{,*/}*.{scss,sass}', 'elements/{,*/}*.{scss,sass}'],
          dest: 'src',
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
      polymer: {
        src: [
          'src/js/polymer-app.js'
        ],
        dest: 'app/js/polymer-app.js'
      },
      popup: {
        src: [
          'src/js/config.js',
          'src/js/util.js',
          'src/bower_components/angular/angular.min.js',
          'src/bower_components/angular-route/angular-route.min.js',
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
          'src/bower_components/angular/angular.min.js',
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
    copy: {
      app: {
        files: [{
          expand: true,
          dot: true,
          cwd: 'src',
          dest: 'app',
          src: [
            '_locales/**',
            'img/**',
            'partials/**',
            'styles/*.css',
            '*.html',
            'manifest.json',
            'elements/vulcanized*'
          ]
        }]
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
    },
    vulcanize: {
      app: {
        options: {
          strip: true,
          csp: true
        },
        files: {
          'src/elements/vulcanized.elements.html': 'src/elements/elements.html'
        }
      }
    }
  });

  // Default task.
  grunt.registerTask('install', ['bower']);
  grunt.registerTask('default', ['clean', 'sass', 'vulcanize', 'concat', 'copy', 'markdown', 'version', 'compress']);
};
