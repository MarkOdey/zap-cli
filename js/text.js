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