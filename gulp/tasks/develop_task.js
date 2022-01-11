const nodemon = require('gulp-nodemon');

const startDev = ()=>{
    const stream = nodemon({
        script: 'dist/server.js',
        watch: "dist",
        tasks: ["build"],

    });
};
module.exports = startDev;
