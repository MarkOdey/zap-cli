const spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var q = require('q');
var Find = require('./find.js');

function Crop(file, start, duration) {

    var self = this;

    self.start = 0;
    self.duration = 3;

    if (start != undefined) self.start = start;
    if (duration != undefined) self.duration = duration;

    this.run = function () {

        console.log('Cropping file', file);

        var defer = q.defer();

        var find = new Find();

        find.run().then(function (file) {

            console.log('at find', file);

            if (file == null) {
                defer.resolve();
                self.emit('resolve');
                return;
            }

            console.log(file.SourceUrl, file.FileName);

            var timeDuration = file.Duration ? file.Duration.split(':') : ['0', '0', '0'];
            var second = Number(timeDuration[2]) + Number(timeDuration[1]) * 60 + Number(timeDuration[0]) * 60 * 60;

            console.log('Number of seconds : ' + second);

            var filename = ('./data/' + self.start + self.duration + file.FileName).replace(/\./g, '');

            var ls = spawn('ffmpeg', ['-i', file.SourceFile,
                '-y', '-ss', self.start, '-t', self.duration,
                '-acodec', 'copy', '-vcodec', 'copy', '-async', '1', filename]);

            ls.stdout.on('data', (data) => { console.log('stdout: ' + data); });
            ls.stderr.on('data', (data) => {
                console.log('stderr: ' + data);
                self.emit('resolve');
                defer.resolve();
            });
            ls.on('close', (code) => {
                console.log('child process exited with code ' + code);
                self.emit('resolve');
                defer.resolve();
            });

        });

        return defer.promise;

    };
}

Crop.prototype.__proto__ = EventEmitter.prototype;

module.exports = Crop;
