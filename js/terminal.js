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