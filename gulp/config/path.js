const nodePath = require('path');

const rootFolder = nodePath.basename(nodePath.resolve());
const buildFolder = './dist';
const srcFolder = './src';

const path = {
  build: {},
  src: { files: `${srcFolder}/**/*.js` },
  watch: {},
  clean: buildFolder,
  buildFolder,
  srcFolder,
  rootFolder,
};
module.exports = path;
