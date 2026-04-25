const spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var Find = require('./find.js');
var q = require('q');

function Convert(payload) {

    var self = this;

    var convert = function (file, sourceFile) {

        var defer = q.defer();

        console.log('Generating new file : ' + file);

        var convertedFile = './memory/' + file + '.mp4';

        var ls = spawn('ffmpeg', ['-i', sourceFile, '-y',
            '-vcodec', 'libx264',
            '-crf', '23',
            '-preset', 'ultrafast',
            '-acodec', 'aac',
            '-strict', 'experimental',
            '-ac', '2',
            '-ar', '44100',
            '-ab', '128k',
            '-async', '1', convertedFile]);

        ls.stdout.on('data', (data) => { console.log('stdout: ' + data); });
        ls.stderr.on('data', (data) => { console.log('stderr: ' + data); });
        ls.on('close', (code) => { defer.resolve(convertedFile); });

        return defer.promise;

    };

    this.run = function (payload) {

        var defer = q.defer();

        console.log('==========================Converting===================');

        var find = new Find(payload);

        find.run().then(function (doc) {

            if (doc == null) {
                console.log('no data');
                defer.resolve();
                self.emit('resolve');
                return;
            }

            var file = doc.FileName.replace(/\.[^/.]+$/, '') + Math.floor(Math.random() * 1000);

            convert(file, doc.SourceFile).then(function () {
                self.emit('resolve');
                defer.resolve();
            });

        });

        return defer.promise;

    };
}

Convert.prototype.__proto__ = EventEmitter.prototype;

module.exports = Convert;
