
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