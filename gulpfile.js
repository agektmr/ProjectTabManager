var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var merge = require('event-stream').merge;
var swig = require('swig');
var path = require('path');
var through = require('through2');
var runSequence = require('run-sequence');

gulp.task('clean', function(cb) {
  return del(['app.zip', 'app/*']);
});

gulp.task('styles', function() {
  return gulp.src(['styles/**/*.scss'])
    .pipe($.debug({title: 'sass'}))
    .pipe($.sass().on('error', $.sass.logError))
    .pipe(gulp.dest(''));
});

gulp.task('concat', function() {
  return merge(
    gulp.src([
      'src/js/config.js',
      'src/js/util.js',
      'src/js/idb.js',
      'src/js/SessionManager.js',
      'src/js/BookmarkManager.js',
      'src/js/ProjectManager.js',
      'src/js/background.js'
    ])
      .pipe($.concat('background.js'))
      .pipe(gulp.dest('app/js/')),

    gulp.src([
      'src/js/config.js',
      'src/js/util.js'
    ])
      .pipe($.concat('popup.js'))
      .pipe(gulp.dest('app/js/')),

    gulp.src([
      'src/js/config.js',
      'src/js/util.js'
    ])
      .pipe($.concat('layout.js'))
      .pipe(gulp.dest('app/js/')),

    gulp.src([
      'src/js/util.js',
      'src/js/lazy.js'
    ])
      .pipe($.concat('lazy.js'))
      .pipe(gulp.dest('app/js/'))
  );
});

gulp.task('scripts', ['concat'], function() {
  return gulp.src('app/js/*.js')
    .pipe($.debug({title: 'scripts'}))
    // TODO: Gave up on using uglify for ES6
    // .pipe($.uglify())
    .pipe(gulp.dest('app/js/'));
});

gulp.task('copy', function() {
  return gulp.src([
    'src/_locales/**',
    'src/img/**',
    'src/styles/*.css',
    'src/bower_components/**',
    'src/manifest.json',
    'src/*.html'
  ], {base: 'src'})
    .pipe($.debug({title: 'copy'}))
    .pipe(gulp.dest('app'));
});

gulp.task('vulcanize', function() {
  return gulp.src('src/elements/*.html')
    .pipe($.debug({title: 'vulcanize'}))
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true
    }))
    .pipe($.rename({prefix: 'vulcanized.'}))
    .pipe(gulp.dest('app/elements/'));
});

gulp.task('minify-html', ['vulcanize'], function() {
  return gulp.src('app/elements/*.html')
    .pipe($.minifyHtml({collapseWhitespace: true, removeComments: true}))
    .pipe(gulp.dest('app/elements/'));
});

gulp.task('elements', ['minify-html'], function() {
  return gulp.src('app/elements/*.html')
    .pipe($.crisper())
    .pipe(gulp.dest('app/elements/'));
});

gulp.task('replace', function() {
  return gulp.src('app/app.html')
    .pipe($.debug({title: 'replace'}))
    .pipe($.htmlReplace({
      'vulcanized': '<link rel="import" href="elements/vulcanized.app_elems.html">'
    }))
    .pipe(gulp.dest('app/'));
});

gulp.task('zip', function() {
  return gulp.src('app/**/*')
    .pipe($.zip('app.zip'))
    .pipe(gulp.dest('.'));
});

function applyTemplate(templateFile) {
  var tpl = swig.compileFile(path.join(__dirname, templateFile));

  return through.obj(function(file, enc, cb) {
    var data = {
      pagetitle: file.path.replace(/^.*\/(.*?)\.html$/, '$1'),
      content: file.contents.toString()
    };
    file.contents = new Buffer(tpl(data), 'utf8');
    this.push(file);
    cb();
  });
};

gulp.task('markdown', function() {
  return gulp.src('./*.md')
    .pipe($.markdown())
    .pipe(applyTemplate('template.html'))
    .pipe(gulp.dest('app'));
});

gulp.task('build', function() {
  runSequence(
    'clean',
    [
      'styles',
      'scripts',
      'elements'
    ],
    'copy',
    'replace',
    'markdown',
    // 'version',
    'zip'
  );
});
