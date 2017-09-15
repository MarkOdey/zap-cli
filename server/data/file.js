const spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;

var q = require('q');


var MongoClient = require('mongodb').MongoClient;
var mongoclient;

MongoClient.connect('mongodb://localhost:27017/zap', function(err, mongocli) {
  mongoclient = mongocli;
});




function File(file) {

	var self = this;

	var ABSOLUTE_PATH = "../";

	this.run = function () {


	}

	this.validate = function (data) {

		//We check if the file exists;
		var fs = require('fs');
		if (fs.existsSync(path)) {
		    
		    return true;
		}

	}

}

File.prototype.__proto__ = EventEmitter.prototype;

module.exports = File;



