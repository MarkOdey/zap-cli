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