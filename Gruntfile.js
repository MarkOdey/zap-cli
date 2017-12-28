/* 
	This is the Grunt Workflow for small projects
	Author: Spotful Team
*/

'use strict';

//  Grunt Module
module.exports = function (grunt) {


    // Set a common var for the package.json to parse it later...
    var npmPackage = grunt.file.readJSON('package.json');

    // Time that shiz
    require('time-grunt')(grunt);

    // Configuration
    grunt.initConfig({

        projectConfig: grunt.file.readJSON('Grunt.config'),

        // Get Meta Data
        pkg: grunt.file.readJSON('package.json'),

        // Watch for changes in .scss files, & autoprefix them css
        watch: {
            dev: {
                files: '<%= projectConfig.js %>/**/*.js',
                tasks: ['concat:dev']
            }
        },
        // Concatenation
        concat: {
            options: {
                separator: '\n',
            },
            dev: {
                src: ['<%= projectConfig.js %>/**/*.js'],
                dest: '<%= projectConfig.dist %>/app.js',
            }
        },
        // Uglify
        uglify: {
            options: {
                expand: false,
                mangle: false
            },
            dist: {
                files: {
                    '<%= projectConfig.dist %>/app.min.js' : '<%= projectConfig.js %>/**/*.js'
                }
            }
        },
        // Clean
        // for cleaning up dist directory
        clean: {
            temp: {
                src: '<%= projectConfig.temp %>'
            },
            dist: {
                src: '<%= projectConfig.dist %>'
            }
        },
        
        // Browser Sync Config
        browserSync: {
            dev: {
                options: {
                    startPath:'/',
                    server: {
                        baseDir: './',
                        middleware: function (req, res, next) {
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            next();
                        }
                    },
                    browser: "<%= projectConfig.browser %>",
                    // The index file to serve
                    //proxy: "http://localhost:7000/<%= projectConfig.index %>",
                }
            }
        },

        // AWS S3
        aws_s3: {
            options: {
                accessKeyId: '<%= projectConfig.aws.accessKeyId %>', // Use the variables
                secretAccessKey: '<%= projectConfig.aws.secretAccessKey %>', // You can also use env variables
                region: 'us-east-1',
                uploadConcurrency: 5, // 5 simultaneous uploads
                downloadConcurrency: 5 // 5 simultaneous downloads
            },
            deploy: {
                options: {
                    bucket: 'spotful-apps',
                    differential: true, // Only uploads the files that have changed
                },
                files: [
                    {expand: true, cwd: 'dist/', src: ['**'], dest: npmPackage.name+'/'+npmPackage.version+'/'}
                ]
            }
        },

        // Postcss / Autoprefixer config
        postcss: {
            options: {
                map: false,
                processors: [
		        require('autoprefixer')({
                    browsers: ['> 0.5%', 'Explorer 10']
                })
		      ]
            },
            dev: {
                files: {
                    '<%= projectConfig.dist %>/main.css': '<%= projectConfig.temp %>/main.css'
                }
            },
            dist: {
                files: {
                    '<%= projectConfig.dist %>/main.css': '<%= projectConfig.temp %>/main.css'
                }
            }
        },

        run : {

            dev : {
                cmd : "node",
                args : [
                    'server/index.js'
                ]
            }
        },

        concurrent : {

            dev : {

                tasks : [ 'watch', 'run:dev'],

                options : {
                    logConcurrentOutput : true
                }
            } 
        }

    });
    
    // Automatically load Grunt plugins
    require('load-grunt-tasks')(grunt);



    // Register tasks
    grunt.registerTask('dev', [
        'clean:temp',
        'clean:dist',
        'concat:dev',
        'concurrent:dev'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'copy:dev',
        'concat:dist',
        'uglify:dist',
        'clean:temp'
    ]);

    grunt.registerTask('deploy', ['aws_s3']);

    // default: alias for the build task
    grunt.registerTask('default', ['build']);

};