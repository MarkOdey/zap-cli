var Find = require('./find.js');
var q = require('q');
var EventEmitter = require('events').EventEmitter;

function Play(data) {

    var self = this;

    this.data = data;

    this.run = function (socket) {

        var defer = q.defer();

        var find = new Find();

        find.run().then(function (data) {

            if (data == null) {
                console.log('no data');
                defer.resolve();
                self.emit('resolve');
                return;
            }

            console.log('Found an element :', data.SourceFile);
            console.log('Attempting to play a random file :');
            console.log('socket id' + socket.id);

            socket.emit('play', data);

            socket.once('resolve', function () {
                console.log('Resolving in play.js with :' + socket.id);
                self.emit('resolve');
                defer.resolve();
                socket.removeAllListeners('resolve');
            });

        });

        return defer.promise;

    };
}

Play.prototype.__proto__ = EventEmitter.prototype;

module.exports = Play;
