
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

