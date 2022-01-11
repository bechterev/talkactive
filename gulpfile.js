const gulp = require('gulp');
const path = require('./gulp/config/path');
const buildTask = require('./gulp/tasks/build_task');
const devTask = require('./gulp/tasks/develop_task');

global.app = {
  path,
  gulp,
};

gulp.task('build', buildTask)
gulp.task('dev', ['build'], devTask);