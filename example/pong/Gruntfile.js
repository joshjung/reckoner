var Pomelo = require('pomelo'),
  path = require('path');

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

  grunt.registerTask('pomelo', function () {
    console.log('Starting Pomelo...');
    Pomelo.manager.start({
      appFile: path.resolve(__dirname, 'pong.js'),
      logDir: path.resolve(__dirname, 'log'),
      daemon: true
    });                             
    console.log('Pomelo started.')                                                                                                                                                                                                                                                                                                                                       
  });

  grunt.registerTask('default', ['browserify', 'uglify', 'pomelo']);
}