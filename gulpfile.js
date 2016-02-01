var gulp = require('gulp');
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer');
var browserify = require('browserify');


gulp.task('js', function(){
  var b = browserify({
    entries: './src/js/app.js',
    debug: true,
    transform: ['babelify']
  });
  
  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist/js/'));
});

gulp.task('html', function(){
 return gulp.src('./src/*.html')
  .pipe(gulp.dest('./dist/'));
});

gulp.task('css', function(){
 return gulp.src('./src/css/*.css')
  .pipe(gulp.dest('./dist/css/'));
});

gulp.task('watch', function(){
  gulp.watch('src/**/*', ['default']);
});

gulp.task('default', ['js', 'html', 'css']);