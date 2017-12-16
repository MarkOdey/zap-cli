const fs = require('fs');


var q = require('q');

var mime = require("mime");

var MongoClient = require('mongodb').MongoClient;
var mongoclient;
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

const spawn = require('child_process').spawn;


function getMetaData(url) {



    EventEmitter.apply(this, arguments);

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
function Explore() {

    EventEmitter.apply(this, arguments);

    var self = this;

    this.data = {};

    this.run = function () {

        var defer = q.defer();

        MongoClient.connect('mongodb://localhost:27017/zap', function(err, mongocli) {
            
            mongoclient = mongocli;


            var db = mongoclient.db("zap");
            var col = db.collection('data');

        
            fs.readdir('../data/', function (err, data){

                console.log(err);


                for(var i in data) {


                    var meta = new getMetaData('../data/'+data[i]);

                    meta.on('resolve', function (metadata){

                        if(metadata == undefined) {
                            return;
                        }

                        metadata.weight = Math.random();

                        metadata["SourceUrl"] = metadata["SourceFile"].replace("..", "");


                        console.log(metadata);

                        var r = col.update({ SourceFile : metadata["SourceFile"] },
                                       { 
                                            $set : metadata
                                         }, 
                                       { 
                                            upsert : true 
                                        });

                    });

                  
                    self.data[i] = data[i];

                }

                self.emit('resolve', self.data);
                defer.resolve();

            });



        });

        
        return defer.promise;

    }

}


Explore.prototype.__proto__ = EventEmitter.prototype;

module.exports = Explore;