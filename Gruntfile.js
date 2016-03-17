module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        transport: {
            options: {
                'debug': false
            },
            design: {
                files: {
                    '.build': ['design/js/{main.js,*/*.js}', 'config/config.js']
                }
            },
            mobile: {
                files: {
                    '.build': ['mobile/js/{main.js,*/*.js}', 'config/config.js']
                }
            }
        },
        concat: {
            design: {
                files: {
                    '.dist/design/js/main.js': ['.build/design/js/main.js', '.build/design/js/*/*.js', '.build/config/config.js']
                }
            },
            mobile: {
                files: {
                	'.dist/mobile/js/main.js': ['.build/mobile/js/main.js', '.build/mobile/js/*/*.js', '.build/config/config.js']
                }
            }
        },
        uglify: {
            design: {
                files: {
                    'design/js/main.min.js': ['.dist/design/js/main.js']
                }
            },
            mobile: {
                files: {
                    'mobile/js/main.min.js': ['.dist/mobile/js/main.js']
                }
            }
        }/*,
        clean: {
            all: ['.build'],
            js: ['.build/design/js/main.js']
        }*/
    });

    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-cmd-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['transport', 'concat', 'uglify'/*, 'clean'*/]);
    grunt.registerTask('clean', ['clean']);
}
