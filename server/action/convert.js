const spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;


var Find = require('./find.js');

var q = require('q');

var MongoConnexion = require('../utils/MongoConnexion');



function Convert(payload) {

	var self = this;

	var ABSOLUTE_PATH = "../";

	var find = function () {

	}

	var convert = function (file) {

		var defer = q.defer();

		console.log("Generating new file : " +file);

		var convertedFile = '../memory/' + file + '.mp4';

	    this.ls = spawn('ffmpeg', [ "-i", doc.SourceFile, '-y',
	                            "-vcodec", "libx264",
	                            "-crf", "23", 
	                            "-preset", "ultrafast",
	                            "-acodec", "aac",
	                            "-strict", "experimental", 
	                            "-ac", "2", 
	                            "-ar", "44100", 
	                            "-ab", "128k",
	                            "-async", "1", convertedFile]);


		this.ls.stdout.on('data', (data) => {

			console.log(`stdout: ${data}`);

		});

		this.ls.stderr.on('data', (data) => {

			console.log(`stderr: ${data}`);

		});

		ls.on('close', (code) => {


			defer.resolve(convertFile);

		});


		return defer.promise;


	}

	this.run = function (payload) {

		var defer = q.defer();


		//var data = dataCollection.findOne({ MIMEType : {$regex : ".video.*"}, weight : { $gt : Math.random(), $lt : Math.random()}}).then(function (doc) {

		var stripExtension = /(?:\.([^.]+))?$/;


		//Let's check if the payload is manipulable.
		if(payload != undefined) {

			var find = new Find(payload);

			find.run().then(function (){

				
			});



		} 

		console.log("==========================Converting===================");


		var random = Math.random();

		MongoConnexion.get().then(function (mongoclient) {

			var db = mongoclient.db("zap");

			var dataCollection = db.collection('data');

			var data = dataCollection.findOne({ MIMEType : {$regex : "video.*"}, 
										weight : { $gt : random, $lt : random + 0.3}
										}).then(function (doc) {

				if(doc == null) {

					console.log('no data');
					defer.resolve();
					self.emit('resolve');
					return defer.promise;

				}


				var file = doc.FileName.replace(/\.[^/.]+$/, '')+Math.floor(Math.random()*1000);

				console.log(doc);

				convert(file).then(function() {

					console.log(`child process exited with code ${code}`);
					self.emit('resolve');
					defer.resolve();

				});


			});

		});

		return defer.promise;

	}

}

Convert.prototype.__proto__ = EventEmitter.prototype;

module.exports = Convert;



