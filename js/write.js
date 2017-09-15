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