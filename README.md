## Purpose
Dribble is a singleton, event emitter-based module geared for the development of large applications.   

## Usage

    var dribble = require('dribble');
    
    dribble.info('I got the ball'); //prints "I got the ball"
    dribble.error('Dropped it!',new Error('Turnover'));
    
## Group your messages, ala console.group/groupEnd

    dribble.group('Lebron');
    
    dribble.info('Bring it up...'); //prints "Lebron::Bring it up"
    dribble.info('Gonna pass...'); //prints "Lebron::Gonna pass"
    
    dribble.group('DWade');
    
    dribble.info('I got it!'); //prints "Lebron/DWade::I got it!"
    
    dribble.groupEnd('Lebron');
    
    dribble.info('Pulling up for a shot');  //prints "DWade::..."
    
    dribble.groupEnd('DWade');
    
    dribble.info('Blocked by Duncan!!!');  //prints "Blocked by Duncan"
