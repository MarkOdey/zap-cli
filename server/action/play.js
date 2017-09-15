

var MongoClient = require('mongodb').MongoClient;
var q = require('q');


var EventEmitter = require('events').EventEmitter;

var mongoclient;

MongoClient.connect('mongodb://localhost:27017/zap', function(err, mongocli) {
  mongoclient = mongocli;

  console.log('Mongo Client connected.')
});



function Play(data) {

    var self = this;


    this.data = data;

    this.run = function (socket) {

		var defer = q.defer();

		var db = mongoclient.db("zap");

		var dataCollection = db.collection('data');

		console.log('Attempting to find an element.');

		//var data = dataCollection.findOne({ MIMEType : {$regex : ".video.*"}, weight : { $gt : Math.random(), $lt : Math.random()}}).then(function (doc) {
		var query = {
			weight : { $gt : Math.random(), $lt : Math.random()},
			FileType : 'MP4'
		}

		var dataQuery = dataCollection.findOne(query, function (err, data) {

		    if(data == null) {
		      console.log('no data');
		      defer.resolve();
		      self.emit('resolve');
		      return defer.promise;
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

    }

}


Play.prototype.__proto__ = EventEmitter.prototype;

module.exports = Play;