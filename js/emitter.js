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