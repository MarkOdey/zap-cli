var MongoClient = require('mongodb').MongoClient;
var q = require('q');

var MongoConnexion = function() {

	var self = this;

	this.client;

	this.get = function () {

		var defer = q.defer();

		if(this.client == undefined) {

			defer.resolve(this.client);

		} else {

			return this.init();
		}

		return defer.promise;

	}

	this.init = function () {

		var defer = q.defer();

		MongoClient.connect('mongodb://localhost:27017/zap', function(err, mongocli) {
			
			this.client = mongocli;

			console.log('Mongo Client connected.');

			defer.resolve(self.client);

		});

		return defer.promise;

	}


	self.init();
}

var mongoConnexion = new MongoConnexion();

module.exports = mongoConnexion;



