'use strict';

import gulp from 'gulp';
import del from 'del';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import download from 'gulp-download';
import decompress from 'gulp-decompress';
import historyApiFallback from 'connect-history-api-fallback';

const $ = gulpLoadPlugins();
const DEST = 'dist';
browserSync.create();

/**
 * Task jshint
 * Use js lint
 */
gulp.task('jshint', () => {
  return gulp.src([
    'src/js/**/*.js',
    'gulfile.js',
  ])
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter('default'))
    .pipe($.jshint.reporter('fail'));
});

/**
 * Task jscs
 * Use js cs lint
 */
gulp.task('jscs', () => {
  return gulp.src([
    'src/js/**/*.js',
    'gulfile.js',
  ])
    .pipe($.jscs('.jscsrc'))
    .pipe($.jscs.reporter())
    .pipe($.jscs.reporter('fail'));
});

/**
 * Task fonts
 * Move fonts to DEST
 */
gulp.task('fonts', () => {
  return gulp.src([
      'src/assets/fonts/*',
      'src/lib/font-awesome/fonts/*',
    ])
    .pipe(gulp.dest(DEST + '/fonts'));
});

/**
 * Task images
 * Apply imagemin and move it to DEST
 */
gulp.task('images', () => {
  return gulp.src('src/assets/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}],
    }))))
    .pipe(gulp.dest(DEST + '/images'));
});

/**
 * Task flags
 * Move country flags to DEST
 */
gulp.task('flags', () => {
  return gulp.src('src/lib/flag-css/dist/flags/*')
    .pipe(gulp.dest(DEST + '/flags'));
});

/**
 * Task styles
 * Apply scss transformation to css
 */
gulp.task('styles', () => {
  return gulp.src('src/scss/*.scss')
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.'],
    }))
    .pipe(gulp.dest('src/css'));
});

/**
 * Task html
 * Apply uglify, minify to src
 */
gulp.task('html', ['styles'], () => {
  if (process.env.NODE_ENV === 'production') {
    return gulp.src('src/**/*.html')
      .pipe($.useref())
      .pipe($.if('*.js', $.uglify()))
      .pipe($.if('*.css', $.minifyCss()))
      .pipe(gulp.dest(DEST));
  }
  return gulp.src('src/**/*.html')
    .pipe($.useref())
    .pipe(gulp.dest(DEST));
});

/**
 * Task lang
 * Download locales files to dest
 */
gulp.task('lang', () => {
  return download('https://localise.biz:443/' +
    'api/export/archive/json.zip?' +
    'key=eMJfQxM9QEEO7im7ZxWZZgMgOQ6lqsKy&' +
    'fallback=en&' +
    'path=locale-%7B%25lang%7D.json')
    .pipe(decompress({strip: 1}))
    .pipe(gulp.dest(DEST + '/locales'));
});

/**
 * Task icon
 * Move favicon.png file to dest
 */
gulp.task('icon', () => {
  return gulp.src([
    'src/assets/favicon.png',
  ])
    .pipe(gulp.dest(DEST));
});

/**
 * Task bower
 * Launch bower
 */
gulp.task('bower', () => {
  return $.bower();
});

/**
 * Task clean
 * Remove dist directory
 */
gulp.task('clean', () => {
  return del([
    DEST,
    'src/lib',
    'src/css',
  ]);
});

/**
 * Task watch-html
 * Listen to html task and reload the browser
 */
gulp.task('watch-html', ['jshint', 'jscs', 'html'], () => {
  return browserSync.reload();
});

/**
 * Task serve
 * Launch an instance of the server and listen to
 * every change reloading the browser
 */
gulp.task('serve', ['html'], () => {
  browserSync.init({
    server: {
      baseDir: './' + DEST,
      middleware: [ historyApiFallback() ],
    }
  });
  $.watch([
    'src/scss/*.scss',
    'src/**/*.html',
    'src/js/**/*.js',
  ], $.batch((events, done) => {
    gulp.start('watch-html', done);
  }));
});

/**
 * Task test
 * Build the project and test for it's consistency
 */
gulp.task('test', () => {
  return $.runSequence(
    'jshint',
    'jscs');
});

/**
 * Task reload
 * reload the browser after executing default
 */
gulp.task('reload', ['default'], () => {
  browserSync.reload();
});

/**
 * Task default
 * Apply all tasks to build project
 */
gulp.task('default', ['clean'], () => {
  return $.runSequence(
    'bower',
    'jshint',
    'jscs',
    'fonts',
    'images',
    'flags',
    'lang',
    'html');
});
