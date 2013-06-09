dribble
============

Logging module for node.js apps.  Baked with opinions.  Domain-aware.  See an open lane.  Get to the basket.   

## Install
     npm install dribble
     
## Purpose
Dribble is a singleton, event emitter-based module geared for the development of large applications.   

## Usage

### Simple Case

    var dribble = require('dribble');
    
    // log a message
    dribble.info('I got the ball'); //prints "I got the ball"
    
    // log an error
    dribble.error('Dropped it!',new Error('Turnover'));
    
### Group/prefix your messages, ala console.group/groupEnd

    dribble.group('Lebron');
    
    dribble.info('Bring it up the floor'); //prints "Lebron::Bring it up the floor"
    dribble.info('Pass the ball'); //prints "Lebron::Pass the ball"
    
    dribble.group('DWade');
    
    dribble.info('I got it!'); //prints "Lebron/DWade::I got it!"
    
    dribble.groupEnd('Lebron');
    
    dribble.info('Pulling up for a shot');  //prints "DWade::..."
    
    dribble.groupEnd('DWade');
    
    dribble.info('Blocked by Noah!!!');  //prints "Blocked by Noah!!!"

