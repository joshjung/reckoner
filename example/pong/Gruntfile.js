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

  grunt.registerTask('default', ['browserify', 'uglify']);
}