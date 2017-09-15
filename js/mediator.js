



/**
 *
 * Mediator
 * 
 */


var Mediator = (function () {

	var self = this;

	this.root = document.createElement('div');

	this.root.id = 'root';

	
	window.addEventListener("load", function() {

	 	document.body.appendChild(this.root);

	 });

	

	 
	//The action stack this is where we store our scheduled action.
	this.actions = [];

	this.idle = 0;
	this.understanding = 0;

	//How deep should the ai before resolving;
	this.depth = 0;


	//This is where we store our knowledge base.
	this.data = {};

	//Static reference of all supported types
	this.types = {
				"Terminal" : Terminal,
				"Read" : Read,
				"Write" : Write,
				"Text" : Text,
				"Concatenate" : Concatenate
			};



	/**
	*
	* @params the id of the item
	* @returns the object reference 
	**/
	this.get = function (name) {
		return this.data[name];
	}

	this.init = function () {

		this.registerAction();

		this.update();

	
	}

	this.registerAction = function () {

		for(var i in this.types) {



			//this.types[i].prototype = new Relation();


		}



	}

	this.update = function () {


		///Let's generate the depth of the parsing. 
		//This parameter should be modulated by understandibility and the idle state.

		//For now lets just generate a random number every iteration.
		this.depth = Math.floor(Math.random()*2);

		var index = Math.floor(Math.random()*this.actions.length);
		var action = this.actions[index];



	//console.log(JSON.stringify(this.actions));
	//console.log(JSON.stringify(this.data));

		//console.log(this.actions);
		////console.log(this.data);

		if(action != undefined) {

			//console.log(action);

			action.parse(function (resolve) {

				console.log(action);

				this.update();
				console.log(resolve);

				console.log(this.actions);
				console.log(this.data);

				this.removeAction(action);
			
			});

		}else{

			window.setTimeout(this.update, 20);
		}

	}

	this.getSize = function () {

		return Object.keys(this.actions).length;
	}

	this.addData = function (data) {

		if(data.id != undefined && data.id != null) {

			//console.log('data already exists!');

			return data;
		}
		///We check if it already exists in the system.
		var tempData = this.parseData(data);

		if(tempData!= undefined) {

			data = tempData;

			return data;

		}

		///Otherwise create a new entry
		
		///Lets generate a random id to retrieve the object.
		data.id = Helper.makeid();

		var index=0;
		for(var i in this.types) {

			if(data instanceof this.types[i]){
				
				////console.log(Object.keys(this.types));


				data.type = Object.keys(this.types)[index];



				break;
			}

			index +=1;

		}

		if(data!= null){

			this.data[data.id] = new Relation();

			//console.log(this.data[data.id]);
			for(var i in data) {

				//console.log(i);
				this.data[data.id][i] = data[i];
			}


			return this.data[data.id];
			
		}else{
			throw "Could not recognize element."+JSON.stringify(data);
		}


	}


	window.document.addEventListener('click', function () {
		Mediator.saveData();
	});
	this.saveData = function () {

		for(var i in this.data) { 

			this.data[i].relations = this.data[i].relations;

		}

		var stringData = JSON.stringify(this.data);

		//console.log(JSON.parse(stringData));
	}

	this.loadData = function () {

	}

	this.parseData = function (data) {

		for(var i in this.data){

			if(this.data[i].compare(data)){
				return this.data[i];
			}
		}

		
	}

	this.addAction = function (action) {

		//lets first attempt to parse the action in the data 
		var temp_action = this.parseData(action);

		//If the action is undefined create a new action and add it to the action stack
		if(temp_action != undefined) {

			action = temp_action;

		}else {

			temp_action = this.addData(action);
		}

		//console.log(temp_action);
		this.actions.push(temp_action);	

		return action;

	}

	this.removeAction = function (action) {

		var index = this.actions.indexOf(action);

		this.actions.splice(index, 1); 
	}



	return this;

})();



/**
 * Menu
 */

var Menu = (function() {

	var self = this;

	this.menu = document.createElement('div');
	this.menu.id = 'menu';

	this.fullScreenBtn = document.createElement('div');
	this.fullScreenBtn.className = 'icon-expand';


	 this.menu.appendChild(this.fullScreenBtn);

	window.addEventListener("load", function() {
		
		document.body.appendChild(this.menu);

	});


	this.menu.addEventListener('click', function () {
		
		toggleFullScreen();

	});




	function toggleFullScreen() {

		console.log(Mediator.root);

	  	
	  	if (Mediator.root) {

	  		console.log(Mediator.root);

	  			var root =  document.querySelector("#root");

	  			console.log(root);

	  			if(root.webkitRequestFullScreen) {
	  				root.webkitRequestFullScreen();
	  			}

	  			if(root.requestFullScreen){
	  				root.requestFullScreen();
	  			}
	          	
	          	if(root.mozRequestFullScreen) {
    				root.mozRequestFullScreen();
  				}


	      } else {
	        if (document.exitFullscreen) {
	          document.exitFullscreen(); 
	        }
	      }
	}




})();
