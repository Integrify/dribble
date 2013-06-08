///
///  Test basic query
///
var dribble = require('../index.js'),
    config = require('./dribble-config.json'),
    assert = require('assert');

try {
    dribble.config(config);


//
// set a group
//
    dribble.group('foo');

    dribble.info('I am under foo');
    dribble.info('I am under foo too');

    dribble.group('bar');
    dribble.info('I am under bar');
    dribble.info('And it looks foo too!');

    dribble.groupEnd('bar');

    dribble.info('goodbye bar!');
    dribble.groupEnd('foo');
    dribble.info('goodbye foo!');

}
catch (e) {
    assert.ifError(e);
}