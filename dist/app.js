//Relations 
//they express a tree like structure syntax that puts different elements in relation
//The relation works as above mentionned contains the relation key
//An array of items in relation.

var Concatenate = function (elements) {

    var self = this;


    this.init = function (elements) {

        this.elements = elements;


    }


    var runIndex = 0;
    var runData;

    this.run = function (resolver) {

        runIndex = 0;
        runData = undefined;

        iterateRuns(function() {

            //console.log(runData);

            resolver({
                data : runData,
                weight:0});

        });

    }

    var iterateRuns = function (resolver) {

        if(runIndex>=self.elements.length){

            runIndex = 0;
            resolver(runData);
            return;
        }

        self.elements[runIndex].run(function (response) {

            //console.log(response);

            runIndex +=1;

            if(typeof response.data == "string"  && runData == undefined) {
                runData = "";
            }

            runData = runData.concat(response.data);
            iterateRuns(resolver)

        })
        
    } 

    

    this.compare = function (data) {

        if(data==undefined || data.elements == undefined){
            return false;
        }

        if(data.type != "Relation"){
            //////console.log(data);
            return false;
        }

        return this.elements.join("+") == data.elements.join("+");
    }

    this.init(elements);
}
   var Emitter = function() {
            
    var self    = this;

    /**
     * Stack of registered event.
     * @type {Object}
     */
    self.events = {};

    /**
     * Registers a new emitter.
     * @param  {String} event The key reference of the event registered
     */
    self.register = function(event) {

        if (Array.isArray(event)) {
            
            for (var i in event) {
                self.events[event[i]] = [];
            }

        } else {
            
            self.events[event] = [];    
        
        }

    };

    /**
     * Checks wether the object has a specific event registered.
     */
    self.has = function (event) {
        
        if(self.events[event] != undefined) {
            return true;
        }

        return false;
    }

    /**
     * Registers an handler to the event.
     * @param  {String}   event The event key to register to.
     * @param  {Function} fn    The callback to fire.
     * @return {Function}       The function reference.
     */
    self.on = function(event, fn) {
    
        if (self.events[event] == undefined) {
           // $log.error('Event "' + event + '" is not registered! At on emitter');
        }

        self.events[event].push(fn);


        return fn;
    
    };

    self.once = function (event, fn) {

        var cb = self.on(event, function(obj) {

            fn(obj);
            self.off(event, cb);

        });


    }

    /**
     * Emits the event. 
     * @param  {String} event "The event key to emit to."
     * @param  {Object} obj   The payload passed in the callback.
     */
    self.emit = function(event, obj) {

        if (self.events[event] == undefined) {
            //$log.error('Event "' + event + '" is not registered! At on emitter');
        }
        
        for (var i in self.events[event]) {
            self.events[event][i](obj);
        }
    
    };

    /**
     * [off description]
     * @param  {String}   event "The event key to deregister the event."
     * @param  {Function} fn    The callback reference.
     */
    self.off = function(event, fn) {

        if (self.events[event] == undefined) {
            //$log.error('Event "' + event + '" is not registered! At off emitter');
        }

        var index = self.events[event].indexOf(fn);

        delete self.events[event][index];

        console.log(self.events[event]);

    };
}
Helper = {


    makeid : function () {

      var text = ""
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 10; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

        return text;

    },
    
    parse : function (variable) {

    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    ////console.log('Query variable %s not found', variable);


    },

    merge :  function (obj1,obj2){
   
      for (var attrname in obj1) { obj2[attrname] = obj1[attrname]; }
      for (var attrname in obj2) { obj2[attrname] = obj2[attrname]; }
      return obj2;
    
    },
 
	load : function (url, callback) {


		var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    	xobj.open('GET', url, true); 
    	
    	xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {

          	
          	project = JSON.parse(xobj.responseText);

          	callback(project);

           
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
  
            //////console.log(xobj.responseText);
           // ////console.log(project);
          }

    	}
    	
    	xobj.send(null);  

    	return this;
	}
}
var Image = function (data) {


    Emitter.apply(this, arguments);

    var self = this;

    self.register('resolve');

    this.duration = 2000;

    if(data.duration != undefined) {
        this.duration = data.duration;
    }



    var image = document.createElement("img");

    //We provide its url
    image.src = 'data/'+data.SourceFile;  

    //We provide a width and height;
    image.style.position = "absolute";
    image.style.width = "100%";
    image.style.height = "100%";

    var click = function () {
         self.resolve();
    }

    image.addEventListener('click', click);

    this.resolve = function () {
        
        self.emit('resolve');
        image.removeEventListener('click', click);
        document.body.removeChild(image);
    }


    this.run = function() {

        Mediator.root.appendChild(image);

    }


}

Image.validate = function (data) {

    if(data.MIMEType.indexOf("image") !=-1) {

        var element = new Image(data);

        element.run();

    }

}






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


/**
* Read
* 
* The read sequence will analyse text and break it down into multiple relation.
* 
*/
function Read(data) {

    var self= this;

    // --- public available values

    this.run = function (resolver) {


        Mediator.addAction(new Write(this.text));


        this.parseText();

        resolver({

            data : {},
            weight : 1
        });


    }

    this.parseText = function () {

        var textNode = Mediator.get(this.text);

        var text = textNode.get();

        ////console.log(this.text);

        var middle = text.indexOf(" ", text.length/2 );
        ////console.log(middle);

        var textStr1 = text.slice(0, middle);
        var textStr2 = text.slice(middle);

        ////console.log(textStr1, textStr2);

        var text1 = Mediator.addData(new Text(textStr1));
        var text2 = Mediator.addData(new Text(textStr2));

        var concatenatedText = Mediator.addData(new Concatenate([text1, text2]));

        this.addRelation(concatenatedText);

        //console.log(concatenatedText);

        Mediator.addAction(new Write(concatenatedText.get()));

    }

    // --- Initialization --- \\

    this.init = function (data) {

        //////console.log('reading text');
        var textData = new Text(data);

        Mediator.addData(textData);

        this.text = textData.id;
                

    }

    this.compare = function (action) {

       // //console.log(action);

        if(action == undefined || action.type == 'Read' ) {
            return false;
        }   

        if(this.text == action.text ){
            ////console.log(action.text);
            return true;
        }


    }

    this.init(data);

}

/**
* Relation
* 
* Primitive of all action implementations. This is a helper class for creating a new action. It dictates what is required for a proper action to be implemented.
* The Action object provides also the relations and the evaluation phase of an action.
* 
* N.B You can use 
*/
function Relation(data) {

    var self= this;

    this.id = null;

    if(this.id !=undefined) {
        throw "No id defined"
    }

    //key is id value is weight
    this.relations = {};

    //Chaos is being used to weight the context.
    this.chaos = 0.5;

    this.get = function () {
        return this.id;
    }

    //This is usually never necessary to override 
    this.parse = function (resolver) {

        ////console.log(Mediator.depth);
        ////console.log(Object.keys(this.relations).length);

        //We don't need to go deeper lets resolve and proceed to the run sequence.
        if(Mediator.depth == 0 || Object.keys(this.relations).length == 0) {

            this.run(function (response) {

                console.log(response);
                resolver(response);

            });

            return;
        } 

        Mediator.depth-=1;
        
        for (var i in this.relations) {

            var weight = this.relations[i];

            //if(relation < this.chaos){

                //console.log('has found an action to parse');

                var relation = Mediator.get(i);

                relation.parse(function (nested_resolver) {


                    self.run(function (response) {

                        //console.log(response);

                        resolver(response);

                    });

                }); 

                return;
            //}   

        }

    }


  /*  this.run = function () {};*/


    // --- public available values

    //This object is typically being overriden. This is in this sequence that you would use to do your custom manipulation/actions
   /* this.run = function (resolver) {

       //console.log('ho ho');

    }*/

    // --- Initialization --- \\

    this.init = function (data) {



    }

    this.addRelation = function (action, weight) {

        Mediator.addData(action);

        if(weight == undefined) {
            weight = 1;
        }

        this.relations[action.id] = weight;
    }

    /**
     * Compare
     *
     * The compare function will always be ran when injected in a cluster. This will maintain be used for controlling collision.
     *
     * When extending the action object to create new node in the cluster always make sure you override the comparator with your own comparator.
     * @param Compares two singleton nodes to determine whether they are the same
     * @returns true or false whether the comparator passed\
     *
     */
    this.compare = function (action) {


    }


    this.init(data);

}


        
        var socket = io('http://localhost:8080/');


        socket.on('connected', function (data) {
        	
        	console.log("connected");
        	var terminal = new Terminal();
          
        });

        var elements = {
            'Video' : Video,
            'Image' : Image
        }
          
        socket.on('play', function (data) {

            console.log(data);

            console.log('play');

            var valid = false;

            for(var i in elements) {

                if(elements[i].validate(data)) {

                    var element =  new elements[i](data);

                    valid = true;

                    element.run();

                    element.once('resolve', function() {

                        console.log('resolved');

                        socket.emit('resolve');

                    });

                    break;
                    
                }

            }

            if(valid == false) {

                socket.emit('resolve');
            }


        });

var Terminal = function (data) {

    var self= this;

    var availabble = false;


    // --- public available values

    this.run = function (resolver) {





    }

    // --- Initialization --- \\

    this.init = function (data) {

        
        var inputTerminal = document.createElement("input");


        inputTerminal.style.position = "absolute";
        inputTerminal.style.bottom = "0px";
        inputTerminal.style.left = "0px";
        inputTerminal.style.width = "100%";




        inputTerminal.addEventListener("keydown", function(event) {


            //When pressed enter
            if(event.keyCode == '13') {
                ////console.log("enter key pressed");
                ////console.log(event.target.value);

                if(event.target.value != '' && event.target.value != undefined) {
                    

                    console.log(event.target.value);


                   // Mediator.addAction(new Read(event.target.value));

                    socket.emit('run', event.target.value);

                    event.target.value = "";


                }
            }
        });

    
        window.document.body.appendChild(inputTerminal);

    }

    this.init();


}
function Text (data) {

   this.data = data;

    this.get = function () {
        return data;
    }

    this.run = function (resolver) {
        resolver({data:data,
                  weight:0});
    }


    this.compare = function (data) {

        if(data==undefined || data.text == undefined){
            return false;
        }

        if(data.type != "Text") {
            return false;
        }

        return text == data.get();
    }
}

/*
* Timeline
* Responsible for providing the next video to be played
* 
* *Warning this module is not mediator agnostic!*
*/
var MainPlayer = function () {

 //This object has a stack of element to add 
    
}
var Upload = function () {


	this.run = function () {


	}

	


}


var Video = function (data) {

    Emitter.apply(this, arguments);

    this.register('resolve');

    console.log(data);



    var video;

    var self= this;

    //Let's populate the default data;
    this.src = "./"+data.SourceUrl;

    //We set autoplay value if provided
    if(data.autoplay != undefined) {

        this.autoplay = data.autoplay;

    } else {

        this.autoplay = true;
    }

    if(data.loop != undefined) {

        this.loop = data.loop;

    }

    if(data.controls != undefined) {

        this.controls = data.controls;

    }


    // --- public available values

    this.currentTime = 0;
    this.duration = 0;
    
    video = document.createElement("video");

    //We provide its url
    video.src = this.src;  

    //We provide a width and height;
    video.style.position = "absolute";




    video.style.width = "100%";
    video.style.height = "100%";
    video.controls = true;

    video.muted = true;

    video.controls = false;


    //We set autoplay value if provided
    if(this.autoplay != undefined) {

        video.autoplay = this.autoplay;

    }

    if(this.loop != undefined) {

        video.loop = this.loop;

    }

    if(this.controls != undefined) {

        video.controls = this.controls;

    }




    var handleEnded = function (event) {

        console.log('event ended');

        self.destroy();


    }



    window.addEventListener("resize", resizeThrottler, false);

    var resizeTimeout;
    
    function resizeThrottler() {
        // ignore resize events as long as an actualResizeHandler execution is in the queue
        if ( !resizeTimeout ) {

            resizeTimeout = setTimeout(function() {
                resizeTimeout = null;
                 render();
             
               // The actualResizeHandler will execute at a rate of 15fps
            }, 66);

        }
    }


  function computeFitLayout(videoWidth, videoHeight, canvasWidth, canvasHeight) {

            // Ratio of video
            var videoRatio = videoWidth / videoHeight;

            if(isNaN(videoRatio)) return false;
            //
            var result = {};
            // Ratio of canvas
            var canvasRatio = canvasWidth / canvasHeight;


            if (canvasRatio > videoRatio) {

                // New video width
                result.width = canvasWidth;
                // New video height
                result.height = (1/videoRatio) * canvasWidth;
                // Video offset from the top
                result.top = - (result.height - canvasHeight) / 2;
                // Video offset from left
                result.left = 0;
                // Video offset from the bottom
                result.bottom = 0;

            } else {    // The canvas height is more than the canvas width

                // New video height
                result.height = canvasHeight;
                // New video width
                result.width = videoRatio * canvasHeight;
                // Offset from the left
                result.left = -(result.width - canvasWidth) / 2;
                // Offset from the top
                result.top = 0;
                // Offset from bottom
                result.bottom = 0;

            }

            return result;
        }

  function render() {


       /* console.log(data.ImageHeight);
        console.log(data.ImageWidth);
        console.log(document.body.clientWidth);
        console.log(document.body.clientHeight);*/


        var frame = computeFitLayout(data.ImageWidth, data.ImageHeight, document.body.clientWidth, document.body.clientHeight)

        console.log(frame);
        video.style.position='absolute';

        video.style.width=Math.round(frame.width)+"px";
        video.style.height=Math.round(frame.height)+"px";

        video.style.top=Math.round(frame.top)+"px";
        video.style.left=Math.round(frame.left)+"px";



        console.log('window resized');
  }


    //   ---  Time Update --- \\


    ///This will be overridden by the system you don't need to instantiated ortouch it.
    //this.onTimeUpdate = function() { };

    var handleTimeUpdate = function (event) {
        //console.log(event);

        //We give it the current time in the public level so you can perform match.
        self.currentTime = video.currentTime;

        if(video.currentTime >  video.duration-3 ) {

            self.resolve();
            
        }
        
    }

    //   ---  PLAY  --- \\

    this.play = function () {
        //console.log("play is invoked");

        video.play();
    };

    //This will be overriden
    this.onPlay = function () {};


    var handlePlay = function (event) {
        self.onPlay();
    }

    //   ---  PAUSE  --- \\

    this.pause = function () {
        video.pause();
    }

    //This will be overriden
    this.onPause = function () {};

    var handlePause = function (e) {
        self.onPause();
    }


    video.addEventListener('ended', handleEnded);
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    video.addEventListener('timeupdate', handleTimeUpdate);

    this.resolve = function () {

        self.emit('resolve');

        self.destroy();
        
    }

    this.destroy = function () {


        Mediator.root.removeChild(video);

        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('timeupdate', handleTimeUpdate);

      //  this.resolve();


    }




    this.run = function () {


        Mediator.root.appendChild(video);
        render();
        
    }
    
}

Video.validate = function (data) {

    if(data.FileType == 'MP4' && data.MIMEType.indexOf("video") !=-1) {

        return true;
    }

    return false;

}
function Write(data) {

    var self= this;

    this.text;


    // --- public available values

    this.run = function (resolver) {




        var textDom = document.createElement("div");

        textDom.style.fontSize = "20px";
        textDom.style.width = "100%";
        textDom.style.height = "100%";

        textDom.style.textDecoration = "blink";

        textDom.style.textAlign = "center";

        ////console.log(resolver);

        var textNode = Mediator.get(self.text);

        //console.log(textNode);

        textNode.run(function (response){

            //console.log(response);

            textDom.innerHTML = response.data;   

            document.body.appendChild(textDom);

            window.setTimeout(function () {


                document.body.removeChild(textDom);
                
                resolver({
                    data : response.data,
                    weight: 0
                });
            }, 3000);

        });

    }

    // --- Initialization --- \\

    this.init = function (data) {

        ////console.log(data);

        ////console.log('reading text');
        this.text = data;

                

    }

    this.compare = function (data) {

        if(data == undefined) {
            return false;
        }

        if(data.type != "Write") {
            return false
        }

        if(this.text == data.text){
            return true;
        }
    }

    this.init(data);


}