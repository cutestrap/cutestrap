// Include Our Plugins
const clean       = require('gulp-clean'),
    concat        = require('gulp-concat'),
    cssmin        = require('gulp-cssmin'),
    cssvariables  = require('postcss-css-variables'),
    exec          = require('gulp-exec'),
    fs            = require('fs'),
    gulp          = require('gulp'),
    minimist      = require('minimist'),
    rename        = require('gulp-rename'),
    replace       = require('gulp-replace'),
    postcss       = require('gulp-postcss'),
    stylelint     = require('gulp-stylelint'),
    swig          = require('gulp-swig'),
    zip           = require('gulp-zip');

// Clean build
gulp.task('clean', function() {
  return gulp.src([
      './dist',
      './temp',
      './docs',
      './cutestrap.zip'
    ], {
        allowEmpty: true
    })
    .pipe(clean({
        force: true
    }));
});

gulp.task('css', function() {
  return gulp.src([
    'src/css/core.css',
    'src/css/base.css',
    'src/css/buttons.css',
    'src/css/forms.css',
    'src/css/grid.css',
    'src/css/wrappers.css',
    'src/css/utilities.css',
  ]).pipe(gulp.dest('./dist/css/src'))
    .pipe(concat('cutestrap.css'))
    .pipe(gulp.dest('./dist/css/'))
    .pipe(cssmin())
		.pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('postcss', function() {
  const plugins = [
    cssvariables()
  ];

  return gulp.src('./dist/css/cutestrap.css')
    .pipe(postcss(plugins))
    .pipe(rename("cutestrap.compiled.css"))
    .pipe(gulp.dest('./dist/css/experimental'))
    .pipe(cssmin())
		.pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./dist/css/experimental'));
});

gulp.task('distify', gulp.series('css', 'postcss'));

// Move source over for compiling
gulp.task('temp', function(){
  return gulp.src('./src/css/**/*.css')
    .pipe(gulp.dest('./temp/css/'));

});

// Compile Templates
gulp.task('kss-html', gulp.series('temp', function(){

  return gulp.src('./kss-html/homepage.md')
    .pipe(swig({
      defaults: {
        cache: false
      }
    }))
    .pipe(rename("homepage.md"))
    .pipe(gulp.dest('./temp/kss'));
}));

// KSS for CSS documentation
gulp.task('kss', gulp.series('kss-html', function(cb) {
  const options = {
    continueOnError: false,
    pipeStdout: true
  };
  const reportOptions = {
    err: true,
    stderr: true,
    stdout: true
  };

  fs.readFile("./kss-html/html/includes/kss-markup.html", "UTF8", function(err, kss_markup) {
    if (err) { throw err };

    gulp.src('./kss-html/html/layouts/kss-template.html')
    .pipe(swig({
      defaults: {
        cache: false
      }
    }))
    .pipe(rename("index.html"))
    .pipe(replace(/INJECT_KSS_MARKUP/g, kss_markup))
    .pipe(gulp.dest('./temp/kss'));

  });

  return gulp.src('./src/css/**/*.*')
    .pipe(concat('kss'))
    .pipe(exec('./node_modules/kss/bin/kss-node --config=.kss-node.json', options))
    .pipe(exec.reporter(reportOptions));
}));

gulp.task('kss-public', gulp.series('kss', function(){

  gulp.src('./kss-html/css/**/*.*')
    .pipe(gulp.dest('./docs/public/css'));

  gulp.src('./dist/css/**/*.*')
    .pipe(gulp.dest('./docs/public/css'));


  gulp.src('CNAME')
    .pipe(gulp.dest('./docs'));

  return gulp.src([
      './kss-html/js/kss.js'
    ])
    .pipe(concat('kss.js'))
    .pipe(gulp.dest('./docs/public/js'));
}));

gulp.task('zip-temp-docs', function(){

  return gulp.src('docs/**/*')
    .pipe(gulp.dest('./temp/zip/docs'));

});

gulp.task('zip-temp-dist', function(){

  return gulp.src('dist/**/*')
    .pipe(gulp.dest('./temp/zip/dist'));

});

gulp.task('zip', gulp.series('zip-temp-dist', 'zip-temp-docs', function(){
  return gulp.src('temp/zip/**/*')
    .pipe(zip('cutestrap.zip'))
    .pipe(gulp.dest('./'));

}));
gulp.task('compile',
    gulp.series('clean', 'distify', 'kss-public', 'zip')
);

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('./src/css/**/*.css', gulp.series('compile'));
  gulp.watch('./kss-html/**/*.*', gulp.series('compile'));
});

gulp.task('default', gulp.series('compile', 'watch', function(done) {
    done();
}));

