module.exports = function(grunt) {
  grunt.initConfig({
    jscs: {
      all: {
        options: {
          config: '.jscsrc'
        },
        src: ['{lib,settings,test}/**/*.js', '*.js']
      }
    },
    eslint: {
      all: {
        src: ['{lib,settings,test}/**/*.js', '*.js']
      }
    },
    mochaTest: {
      test: {
        src: ['test/**/*.js']
      }
    },
    watch: {
      scripts: {
        files: ['{lib,settings,test}/**/*.js'],
        tasks: ['test']
      }
    }
  });

  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['mochaTest', 'eslint', 'jscs']);
};
