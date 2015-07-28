module.exports = function(grunt) {
	grunt.initConfig({
	  ts: {
	    default: {
	      src: ['{lib,settings,test}/**/*.ts'],
	      options: {
	        module: 'commonjs',
	        target: 'es5'
	      }
	    }
	  },
    mochaTest: {
      test: {
        src: ['test/**/*.js']
      },
    },
    watch: {
      scripts: {
        files: ['{lib,settings,test}/**/*.ts'],
        tasks: ['build', 'test'],
        options: {
          spawn: false,
        },
      },
    },
	});

	grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', ['ts']);
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask('default', ['build']);
}