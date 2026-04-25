const spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var q = require('q');
var Find = require('./find.js');

function Concat(file) {

    var self = this;

    this.run = function () {

        var defer = q.defer();

        var find1 = new Find();
        var find2 = new Find();

        find1.run().then(function (file1) {
            return find2.run().then(function (file2) {

                if (file1 == null || file2 == null) {
                    console.log('no data');
                    defer.resolve();
                    self.emit('resolve');
                    return;
                }

                console.log(file1);
                console.log(file2);

                var filename = (file1.FileName + file2.FileName).replace(/\./g, '');

                var ls = spawn('./action/mmcat', [
                    file1.SourceFile,
                    file2.SourceFile,
                    './data/concat' + filename + '.mp4'
                ]);

                ls.stdout.on('data', (data) => {
                    console.log('stdout: ' + data);
                });

                ls.stderr.on('data', (data) => {
                    console.log('error: ' + data);
                });

                ls.on('close', (code) => {
                    console.log('child process exited with code ' + code);
                    self.emit('resolve');
                    defer.resolve();
                });

            });
        });

        return defer.promise;

    };
}

Concat.prototype.__proto__ = EventEmitter.prototype;

module.exports = Concat;
