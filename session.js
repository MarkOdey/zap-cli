var explore = require('./action/explore.js');

function Session(socket) {

    var self = this;
    this.socket = socket;
    var deleted = false;

    this.update = function () {

        var action;

        for (var i in self.actions) {
            if (Math.floor(Math.random() * 2) == 0) {
                action = new this.actions[i]();
            }
        }

        if (deleted == true) {
            return;
        }

        if (action == undefined) {
            console.log('----------------------ACTION IS UNDEFINED-----------------');
            this.update();
            return;
        } else {
            var runPromise = action.run(this.socket);
            runPromise.then(function () {
                console.log("resolving action for socket " + socket.id);
                console.log('action');
                setTimeout(function () {
                    self.update();
                }, 2000);
            });
        }
    };

    Session.sessions.push(this);

    this.socket.on('disconnect', (reason) => {
        console.log('at user disconnect');
        self.destroy();
    });

    this.socket.on('run', function (data) {
        console.log(data);
        try {
            var action;
            eval("action= new " + data + "();");
            console.log('Run action from terminal : ', action);
            if (typeof action.run == 'function') {
                action.run().then(function (response) {
                    console.log(response);
                });
            }
        } catch (err) {
            console.log(err);
            console.log('error running the code ');
        }
        console.log('reading text from user');
    });

    this.destroy = function () {
        var index = Session.sessions.indexOf(self);
        Session.sessions.splice(index);
        deleted = true;
    };
}

Session.actions = Session.prototype.actions = [];

Session.addAction = function (action) {
    Session.actions.push(action);
};

Session.sessions = [];

module.exports = Session;
