var Play = require('./action/play.js');
var Find = require('./action/find.js');
var Crop = require('./action/crop.js');
var Concat = require('./action/concat.js');
var RemoveAll = require('./action/removeAll.js');
var Explore = require('./action/explore.js');

var Session = require('./session.js');

var Cognition = require('./cognition.js');

var http = require('http');

const express = require('express')
const app = express();

//Index available actions
var actions = {

	"play" : Play,
	"find" : Find,
	"crop" : Crop,
	"concat" : Concat,
	"removeAll" : RemoveAll,
	"explore" : Explore

}

app.use(express.static('../'));



//Add actions a Session can handle.
Session.addAction(Play);

var io = require('socket.io')(8080);

console.log('instantiation of socket io');
io.on('connection', function(socket){
	console.log('a user connected');

	socket.emit('connected');

	//socket.join(socket.id);

	var session = new Session(socket);

	session.update();


});


//We check if action specified.
if(process.argv[2] != undefined) {

	console.log(process.argv[2]);
	var Action = actions[process.argv[2]];

	console.log('Loading action');

	if(Action != undefined) {

	    var params = process.argv[3];


		var action = new Action(params);

		action.run();

	}


} else {


}



/*

var cognition = new Cognition();

cognition.run();

*/