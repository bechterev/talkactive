const gulp = require('gulp');
const gts = require('gulp-typescript');

const tsProject = gts.createProject('tsconfig.json');
const buildTask = () => tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('dist'));
module.exports = buildTask;
