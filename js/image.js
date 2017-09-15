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

