        
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
