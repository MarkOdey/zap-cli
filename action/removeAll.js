const fs = require('fs');
const path = require('path');
var q = require('q');
var EventEmitter = require('events').EventEmitter;

function RemoveAll() {

    EventEmitter.apply(this, arguments);

    var self = this;

    this.run = function () {

        var defer = q.defer();

        console.log('Removing all assets');

        fs.readdir('./data/', function (err, files) {

            if (err) {
                defer.resolve();
                return;
            }

            files.forEach(function (file) {
                fs.unlink(path.join('./data/', file), function (err) {
                    if (err) console.log(err);
                });
            });

            console.log('Assets removed');
            defer.resolve();

        });

        return defer.promise;

    };
}

RemoveAll.prototype.__proto__ = EventEmitter.prototype;

module.exports = RemoveAll;
