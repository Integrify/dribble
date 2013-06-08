///
///  Test basic query
///
var dribble = require('../index.js'),
    config = require('./dribble-config.json'),
    assert = require('assert');


dribble.config(config);


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

dribble.error('New error!',new Error());