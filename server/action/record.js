var MongoClient = require('mongodb').MongoClient;

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var db = MongoClient.connect('mongodb://localhost:27017/zap');


function Record() {

    this.run = function (data){

        var col = db.collection('updates');

        var r = col.updateOne({
         }, {$set: {b: 1}}, {
            upsert: true
        });

        this.emit('resolve');

    }
}


Record.prototype.__proto__ = EventEmitter.prototype;

module.exports = Record;