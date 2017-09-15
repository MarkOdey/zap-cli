const fs = require('fs');

var q = require('q');

var mime = require("mime");

var MongoClient = require('mongodb').MongoClient;
var mongoclient;
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

const spawn = require('child_process').spawn;


var db;
function RemoveAll() {

    EventEmitter.apply(this, arguments);

    var self = this;

    this.data = {};

    this.run = function () {

        var defer = q.defer();


        console.log('Removing all assets');

        MongoClient.connect('mongodb://localhost:27017/zap', function(err, mongocli) {
            mongoclient = mongocli; 
            
            var db = mongoclient.db("zap");
            var data = db.collection('data');

            data.remove({});
            
            console.log('Assets removed');
            return defer.promise;


        }); 

    }

}

RemoveAll.prototype.__proto__ = EventEmitter.prototype;

module.exports = RemoveAll;