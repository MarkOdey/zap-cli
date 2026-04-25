var EventEmitter = require('events').EventEmitter;

function Record() {

    this.run = function (data) {
        this.emit('resolve');
    };

}

Record.prototype.__proto__ = EventEmitter.prototype;

module.exports = Record;
