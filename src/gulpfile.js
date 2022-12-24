const gulp = require("gulp");
const sass = require("gulp-sass");
const plumber = require("gulp-plumber");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const sourceMaps = require("gulp-sourcemaps");
const imagemin = require("gulp-imagemin");
const imageminJpegRecompress = require("imagemin-jpeg-recompress");
const pngquant = require("imagemin-pngquant");
const run = require("run-sequence");
const del = require("del");
const svgSprite = require("gulp-svg-sprite");
const svgmin = require("gulp-svgmin");
const cheerio = require("gulp-cheerio");
const cleanCss = require("gulp-clean-css");
const concat = require("gulp-concat");
const gulpIf = require("gulp-if");
const notify = require("gulp-notify");
const watch = require("gulp-watch");
const replace = require("gulp-replace");
const fileinclude = require("gulp-file-include");

const Develop = false;

gulp.task("sass", function (callback) {
  return gulp
    .src("scss/style.scss")
    .pipe(
      plumber({
        errorHandler: notify.onError(function (err) {
          return {
            title: "Sass",
            sound: false,
            message: err.message,
          };
        }),
      })
    )
    .pipe(gulpIf(Develop, sourceMaps.init()))
    .pipe(sass())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 4 versions"],
      })
    )
    .pipe(gulpIf(!Develop, cleanCss()))
    .pipe(gulpIf(Develop, sourceMaps.write()))
   .pipe(gulp.dest("build/css"))
    .pipe(browserSync.reload({ stream: true }));
  callback();
});

gulp.task("html", function (callback) {
  return gulp
    .src("*.html")
    .pipe(
      plumber({
        errorHandler: notify.onError(function (err) {
          return {
            title: "Html",
            sound: false,
            message: err.message,
          };
        }),
      })
    )
    .pipe(gulp.dest("build"))
    .pipe(browserSync.reload({ stream: true }));
  callback();
});

gulp.task("js", function () {
  return gulp
    .src("js/**/*.js")
    .pipe(gulp.dest("build/js"))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task("css", function () {
  return gulp
    .src("css/**/*.css")
    .pipe(gulp.dest("build/css"))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task("allimg", function () {
  return gulp
    .src("img/**/*.{png,jpg}")
    .pipe(gulp.dest("build/img"))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task("images", function () {
  return gulp
    .src("build/img/**/*.{png,jpg}")
    .pipe(
      imagemin([
        imagemin.mozjpeg({ progressive: true }),
        imageminJpegRecompress({
          loops: 5,
          min: 65,
          max: 70,
          quality: "medium",
        }),
        imagemin.optipng({ optimizationLevel: 3 }),
        pngquant({quality: [0.65,0.90], speed: 5}),
      ])
    )
    .pipe(gulp.dest("build/img"));
});

gulp.task("svg", function () {
  return (
    gulp
      .src("img/**/*.svg")
      .pipe(
        svgmin({
          js2svg: {
            pretty: true,
          },
        })
      )
      .pipe(
        cheerio({
          run: function ($) {
            $("[fill]").removeAttr("fill");
            $("[stroke]").removeAttr("stroke");
            $("[style]").removeAttr("style");
          },
          parserOptions: { xmlMode: true },
        })
      )
      .pipe(replace("&gt;", ">"))
      // build svg sprite
      .pipe(
        svgSprite({
          mode: {
            symbol: {
              sprite: "sprite.svg",
            },
          },
        })
      )
      .pipe(gulp.dest("build/img"))
  );
});

gulp.task("serve", function () {
  browserSync.init({
    server: "build",
  });
});

gulp.task("watch", function () {
  //Делаем задержку в 1 секунду, если проект находится на HDD диске, а не на SSD диске
  watch("scss/**/*.scss", function () {
    setTimeout(gulp.parallel("sass"), 1000);
  });
  watch("*.html", function () {
    setTimeout(gulp.parallel("html"), 1000);
  });
  watch("js/**/*.js", function () {
    setTimeout(gulp.parallel("js"), 1000);
  });
  watch("css/**/*.css", function () {
    setTimeout(gulp.parallel("css"), 1000);
  });
  watch("img/**/*.{png,jpg}", function () {
    setTimeout(gulp.parallel("sallimg"), 1000);
  });
  watch("img/**/*.{svg}", function () {
    setTimeout(gulp.parallel("svg"), 1000);
  });
  
});



gulp.task("copy", function () {
  return gulp
    .src(["img/**", "js/**", "css/**", "*.html"], {
      base: ".",
    })
    .pipe(gulp.dest("build"));
});

gulp.task("del", function () {
  return del("build");
});


gulp.task(
  "build",
  gulp.series("del", "copy", "sass", "images", "svg")
);

gulp.task(
  "server",
  gulp.parallel("serve", "watch")
  );