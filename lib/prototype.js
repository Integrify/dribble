var fs = require('fs'),
    events = require('events'),
    util = require('util'),
    assert = require('assert'),

    _ = require('underscore'),
    moment = require('moment'),
    uuid = require('node-uuid'),

    colors = require('./colors.js');


function Dribble() {
    this.error_cnt = 0;


    events.EventEmitter.call(this);
}

util.inherits(Dribble, events.EventEmitter);


/**
 * Initialize the config
 * @param config
 */
Dribble.prototype.config = function(config) {
    this._config = config;

    this.activeConfig = config.activeConfig;
        this.config = config[this.activeConfig];
        //
        // info cache of configs per transport
        //
        this.levelCache = {};
        //
        // stack of labels for grouping
        //
        this.groupLabels = [];

    //
    // create the file dump location if it does not exist
    //
    if (config.rootPath) {
        fs.exists(config.rootPath,function(exists) {
            if (exists === false) {
                fs.mkdir(config.rootPath);
            }
        })
    }


}

Dribble.prototype.log = Dribble.prototype.emit;
//
//
//
Dribble.prototype.assert = assert;


Dribble.prototype.error = function (message, error, location, cb) {
    this.log('error', message, error, location, cb);

}

Dribble.prototype.info = function (message, obj, location, cb) {
    this.log('info', message, obj, location, cb);

}

Dribble.prototype.warning = function (message, obj, location, cb) {
    this.log('warning', message, obj, location, cb);
}

Dribble.prototype.milestone = function (message, obj, location, cb) {
    this.log('milestone', message, obj, location, cb);
}

Dribble.prototype.console = function () {
    this.log.apply(this, ['console'].concat(_.toArray(arguments)));
}

Dribble.prototype.group = function (label) {

    var dlabels = this.groupLabels;
    if (process.domain) {
        dlabels = process.domain.members[0].groupLabels || (process.domain.members[0].groupLabels = ['$' + uuid.v1().substr(0, 7)]);
    }

    if (dlabels.indexOf(label) === -1 && dlabels.length < 50) {
        dlabels.push(label);
    }

};

Dribble.prototype.groupEnd = function (label) {
    var dlabels = this.groupLabels;
    if (process.domain) {
        dlabels = process.domain.members[0].groupLabels;
    }

    if (label === dlabels[dlabels.length - 1]) {
        dlabels.pop();
    }

};

Dribble.prototype.process = function (level, message, error, location, cb) {
    if (_.isFunction(error)) {
        cb = error;
        error = null;
    }
    else if (!_.isObject(error)) {
        location = error;
        error = null;
    }

    if (_.isFunction(location)) {
        cb = location;
        location = null;
    }


    this._process(level, message, error, location, cb);
}

/**
 * Common  function to log any info
 * @param level
 * @param message
 * @param error
 * @param location
 */
Dribble.prototype._process = function (level, message, meta, location, cb) {

    var log_date = new Date(),
        me = this,
        level_config = this.matchTransports(level);

    Object.keys(level_config).forEach(function (k) {

        if (level_config[k].disabled !== true) {
            switch (k) {

                case 'console':

                    var console_cfg = level_config[k];

                    var cmessage = message;


                    //
                    // apply grouping label if exists
                    //
                    var dlabels = me.groupLabels;
                    if (process.domain) {
                        dlabels = process.domain.members[0].groupLabels;

                    }


                    if (dlabels && dlabels.length > 0) {
                        cmessage = dlabels.join('/') + '::' + cmessage;
                    }


                    //
                    // if includes
                    //

                    if (meta) {

                        _.each(meta, function (v, k) {
                            if (k !== 'stack') {
                                cmessage += '\n\t\t' + k + ':';
                                if (typeof(v) !== 'object') {
                                    cmessage += ' ' + v;
                                }
                                else {
                                    cmessage += ' ' + util.inspect(v);
                                }
                            }

                        });


                        //
                        // capture stack if enabled
                        //
                        if (console_cfg.include) {
                            var stack = meta.stack;
                            if (stack && console_cfg.include.indexOf('stack') !== -1) {
                                cmessage += '\n\t' + colors['magenta'][0] + stack + colors['magenta'][1];
                            }
                        }

                    }


                    if (level_config[k].color) {
                        var style = colors[level_config[k].color],
                            cmessage = style[0] + cmessage + style[1];
                    }
                    console.log(cmessage);
                    break;
                case 'file':

                    var ds = JSON.stringify(log_date).substr(1, 24),

                        path = level_config[k].path;


                    if (path.indexOf('{name}') !== -1) {
                        path = path.replace('{name}', location || '');
                    }

                    if (path.indexOf('{date}') !== -1) {
                        path = path.replace('{date}', moment(log_date).format(level_config[k].fileDateFormat || 'YYYY-MM-DD'));
                    }

                    fs.appendFile(path, '\n' + ds + '\n\t' + message + (meta ? ('\n\t\t' + JSON.stringify(meta)) :''),
                        function (err, rsp) {

                        });
                default:
                    break;
            }
        }

    });


    //
    // exec callback if exists
    //
    if (cb) {
        cb();
    }

}

/**
 *   Get transports for current level
 * @param {String} level
 * @return {Object} return_cfg
 */

Dribble.prototype.matchTransports = function (level) {
    var me = this,
        return_cfg = me.levelCache[level];

    if (!return_cfg) {

        var level_config = me.config[level.toLowerCase()];


        var transports = level_config.transport,
            return_cfg = {};

        //
        // assume console if no transports are defined for level
        //
        if (transports === undefined) {
            transports = ['console'];
        }

        transports.forEach(function (t) {
            return_cfg[t] = {};

            switch (t) {
                case 'console':
                    if (level_config.color) {
                        return_cfg[t].color = level_config.color;
                    }
                    break;
                case 'file':
                    return_cfg[t].path = me._config.rootPath + '/' + level_config.path;

                    break;
                default:
                    break;

            }

            //
            // apply include options (trace,etc) to any transport up the tree levels
            //
            _.defaults(return_cfg[t], _.pick(level_config, 'include', 'disabled'));
            _.defaults(return_cfg[t], _.pick(me._config, 'fileDateFormat'));
        });


        me.levelCache[level] = return_cfg;


    }

    return return_cfg;
}

module.exports = Dribble;