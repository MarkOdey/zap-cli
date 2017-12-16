const fs = require('fs');

var q = require('q');

var mime = require("mime");
var EventEmitter = require('events').EventEmitter;

var getMetaData = function() {

    var defer = q.defer();

    var self = this;

    //console.log(url);
     
    const ls = spawn('exiftool', [ '-json', url]);
    ls.stdout.on('data', (data) => {
      
        console.log(String(data));

        var metadata = JSON.parse(String(data));

        self.emit('resolve', metadata[0]);

        defer.resolve(metadata[0]);


    });


}

getMetaData.prototype.__proto__ = EventEmitter.prototype;



var db;
function Find(payload) {

    EventEmitter.apply(this, arguments);

    var self = this;

    this.data = {};

    var record = function () {



    }

    this.run = function () {

        var defer = q.defer();

        MongoClient.connect('mongodb://localhost:27017/zap', function(err, mongocli) {

            mongoclient = mongocli;

            var db = mongoclient.db("zap");
            var dataCollection = db.collection('data');

            //var data = dataCollection.findOne({ MIMEType : {$regex : ".video.*"}, weight : { $gt : Math.random(), $lt : Math.random()}}).then(function (doc) {

            dataCollection.findOne({ weight : { $gt : Math.random(), $lt : Math.random()}}).then(function (data) {
       
                self.emit('resolve');

                defer.resolve(data);

            });

        });
    
        return defer.promise;

    }

}


Find.prototype.__proto__ = EventEmitter.prototype;

module.exports = Find;