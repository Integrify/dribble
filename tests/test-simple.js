///
///  Test basic query
///
var dribble = require('../index.js'),
    config = require('./dribble-config.json'),
    assert = require('assert');

try
{
dribble.config(config);

dribble.info('I am gonna test grouping');


//
// logging some info
//
dribble.info('Logging some info');


//
// log a warning
//
dribble.warning('This is a warning');

//
// log an error
//
var err = new Error();
dribble.error('New error!',err);


//
// do console logging you can disable
//

dribble.console(process.version,'my node version',__dirname,'this path');
dribble.console('Simple test passed.');
}
catch (e) {
    assert.ifError(e);
}