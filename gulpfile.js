var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var swig = require('swig');
var path = require('path');
var through = require('through2');
var runSequence = require('run-sequence');

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
    file.contents = new Buffer.from(tpl(data), 'utf8');
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

gulp.task('build', gulp.series('markdown', 'zip', done => done()));
