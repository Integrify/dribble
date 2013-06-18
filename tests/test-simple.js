///
///  Test basic query
///
var dribble = require('../index.js'),
    config = require('./dribble-config.json'),
    assert = require('assert');

try {
    dribble.config(config);

//
// simple console alias you can disable
//

    dribble.console('Begin testing, be sure to look at ./dribble-config.json for settings!', __filename);


//
// logging some info
//
    dribble.info('Logging some request info',
        {url:'/users/address', token:'1223456',
            body:{street:'2100 W Division', city:'Chicago'},
            units: [{x:1},2]
        });


//
// log a warning
//
    dribble.warning('This is a warning');

//
// log a milestone in the app
//
    dribble.milestone('We reached a milestone');

//
// log an error
//
    var err = new Error('test');
    dribble.error('New error!', err);


//
// do console logging you can disable
//


    dribble.console('Simple test passed.');
}
catch (e) {
    assert.ifError(e);
}