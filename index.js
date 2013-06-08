
var Dribble = require('./lib/prototype.js'),
    _ = require('underscore'),
    dribble = new Dribble();


dribble.on('error', function (message, error, location, cb) {

    this.process('error', message, error, location, cb);
    ++(this.error_cnt);
});


dribble.on('info', function (message, obj, location) {

    this.process('info', message, obj, location);

});

dribble.on('warning', function (message, obj, location) {

    this.process('warning', message, obj, location);

});

dribble.on('milestone', function (message, obj, location) {


    this.process('milestone', message, obj, location);

});


dribble.on('console', function () {

    var return_cfg = this.matchTransports('console');
    if (!return_cfg || return_cfg['console'].disabled !== true) {
        console.log.apply(this, _.toArray(arguments));
    }

});

module.exports = dribble;

