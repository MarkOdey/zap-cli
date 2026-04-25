const fs = require('fs');
var q = require('q');
var EventEmitter = require('events').EventEmitter;

function Find(payload) {

    EventEmitter.apply(this, arguments);

    var self = this;

    this.run = function () {

        var defer = q.defer();

        fs.readdir('./data/', function (err, files) {

            if (err || !files || files.length === 0) {
                self.emit('resolve');
                defer.resolve(null);
                return;
            }

            var index = Math.floor(Math.random() * files.length);
            var file = files[index];

            var data = {
                FileName: file,
                SourceFile: './data/' + file,
                SourceUrl: '/data/' + file
            };

            self.emit('resolve');
            defer.resolve(data);

        });

        return defer.promise;

    };
}

Find.prototype.__proto__ = EventEmitter.prototype;

module.exports = Find;
