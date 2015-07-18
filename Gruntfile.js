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
          src: [
            'styles/{,*/}*.{scss,sass}',
            'elements/{,*/}*.{scss,sass}'
          ],
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
      shadowdom: {
        src: [
          'src/js/shadowdom.js'
        ],
        dest: 'app/js/shadowdom.js'
      },
      popup: {
        src: [
          'src/js/config.js',
          'src/js/util.js'
        ],
        dest: 'app/js/popup.js'
      },
      layout: {
        src: [
          'src/js/config.js',
          'src/js/util.js'
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
    replace: {
      app: {
        options: {
          patterns: [{
            match: /elements\/elements\.html/g,
            replacement: 'elements/vulcanized.elements.html'
          }]
        },
        files: {
          'app/lazy.html': 'src/lazy.html',
          'app/app.html': 'src/app.html'
        }
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
            'manifest.json',
            'elements/vulcanized*',
            'bower_components/**'
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
  grunt.registerTask('default', ['clean', 'sass', 'vulcanize', 'concat', 'copy', 'replace', 'markdown', 'version', 'compress']);
  grunt.registerTask('vulcanizeless', ['clean', 'sass', 'concat', 'copy', 'replace', 'markdown', 'version', 'compress']);
};
