var Pomelo = require('pomelo'),
  fs = require('fs'),
  path = require('path'),
  pidFile = 'pid';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    browserify: {
      reckonerClient: {
        files: {
          'web-server/public/js/pong.js': ['src/PongClient.js'],
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'web-server/public/js/pong.min.js': ['web-server/public/js/pong.js']
        }
      }
    }
  }); 

  grunt.registerTask('kill', function () {
    if (fs.existsSync(pidFile))
    {
      var pids = fs.readFileSync(pidFile).toString().split(/\n/).map(function (i) {return parseInt(i);});

      pids.forEach(function (pid) {
        if (!pid) return;
        console.log('Killing pid: ', pid);
        try {
          process.kill(pid, 'SIGKILL');
        }
        catch (err){
        }
      });

      fs.unlink(pidFile);
    }
  });

  grunt.registerTask('pomelo', function () {
    Pomelo.manager.start({
      appFile: path.resolve(__dirname, 'pong.js'),
      logDir: path.resolve(__dirname, 'log'),
      daemon: false
    });                             
  });

  grunt.registerTask('start', ['pomelo']);
  grunt.registerTask('restart', ['kill', 'start']);
  grunt.registerTask('build', ['browserify', 'uglify']);

  grunt.registerTask('default', ['build', 'restart']);
}