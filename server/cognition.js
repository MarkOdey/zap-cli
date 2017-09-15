
var Find = require('./action/find.js');
var Crop = require('./action/crop.js');
var Concat = require('./action/concat.js');
var Convert = require('./action/convert.js');

var Explore = require('./action/explore.js');

function Cognition () {

	var self = this;

	this.actions = [];

	var actionType = {
    "find" : Find,
    "convert" : Convert
	};

//	this.actions.push(new Explore());
	this.actions.push(new Crop());
//	this.actions.push(new Convert());


	this.run = function () { 

		var promise = this.update();


	}

	this.update = function () {

		var index = Math.floor(Math.random()*this.actions.length);
		var action = self.actions[index];

		action.run().then(function () {

			console.log('running : ', action);

			setTimeout(function () {

				console.log('test');
				self.update();
				
			}, 10000);

		});

	}
}



module.exports = Cognition;
