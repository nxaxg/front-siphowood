"use strict";

////////////////////////////////
//////////////////////////////// Plugins
////////////////////////////////
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const browsersync = require('browser-sync').create();
const ssi = require('browsersync-ssi');
const sftp = require('gulp-sftp');
const cssPath = './css';

////////////////////////////////
//////////////////////////////// Settings
////////////////////////////////
const TARGET_BROWSERS = ['> 1%', 'IE >= 10'];


////////////////////////////////
//////////////////////////////// Tasks
////////////////////////////////


////////
//////// Styles procesor
gulp.task('styles', () => {
	return gulp.src('./styles/main.scss')
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({browsers: TARGET_BROWSERS}))
		.pipe(cssnano())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(cssPath));
});


////////
//////// Styles procesor por centro
gulp.task('styles:all', () => {
	return gulp.src('./styles/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({browsers: TARGET_BROWSERS}))
		.pipe(cssnano())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(cssPath));
});


////////
//////// Watch styles
gulp.task('styles:watch', ['styles:all'], () => {
	gulp.watch("./styles/**/*", ['styles:all']);
});

//
//sftp deploy
gulp.task('styles:all:sftp', ['styles:all'], () => {
	return gulp.src(cssPath)
		.pipe(sftp({
			"host"     : "54.148.0.90",
			"user"     : "ubuntu",
            "password" : "Borgono603*",
			"remotePath" : "/var/www/des/santotomas.dev.ida.cl/wp-content/themes/centros-investigacion/css/"
		}));
});

//
//sftp watch
gulp.task('styles:all:watch', ['styles:all:sftp'], () => {
	gulp.watch("./styles/**/*", ['styles:all:sftp']);
});


////////
//////// BrowserSync Server
gulp.task('serve', () => {
	browsersync.init({
		middleware : ssi({
			baseDir: __dirname,
			ext: '.shtml',
			version: '1.4.0'
		}),
		server: { 
			baseDir : "./"
		}
	});
	gulp.watch(["./**/*", "!./**/*.scss"]).on('change', browsersync.reload);
	gulp.watch("./styles/**/*", ['styles', browsersync.reload]);
});



////////
//////// Default task
gulp.task('default', ['styles', 'serve']);