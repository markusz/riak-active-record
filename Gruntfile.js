module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    mocha: {
      local: {
        options: {
          bail: false,
          reporter: 'spec',
          ui: 'bdd',
          require: 'reports/coverage/blanket',
          timeout: 8000
        },
        src: [
          'tests/**/*.spec.js'
        ]
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'reports/coverage/coverage.html'
        },
        src: [
          'spec/**/*.spec.js'
        ]
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: [
        'lib/**/*.js',
        'tests/**/*.js'
      ]
    },

    jscs: {
      options: {
        config: '.jscsrc',
        excludeFiles: ['**/node_modules/**'],
        force: true
      },
      files: {
        src: [
          'lib/**/*.js',
          'tests/**/*.js'
        ]
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint:files', 'test']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.registerTask('default', 'Default task that runs the "jshint" and "test" tasks.', ['jshint:files', 'jscs:files', 'test']);
  grunt.registerTask('test', 'Runs all tests against a mocked RiakDB - very fast.', ['mocha']);
  grunt.registerTask('coverage', 'Runs all mocha tests + Coverage.', ['mocha:coverage']);
  grunt.registerTask('lint', 'Runs all tests and save reports.', ['jshint:files']);
  grunt.registerTask('codestyle', 'Runs all tests and save reports.', ['jscs:files']);
};
