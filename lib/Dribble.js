var fs = require('fs'),
    events = require('events'),
    util = require('util'),
    assert = require('assert'),

    _ = require('underscore'),
    moment = require('moment'),
    colors = require('./colors.js'),
    formatters = require('./formatters.js'),
    default_config = require('./default_config.json');


function Dribble() {

    //
    // may use this for total error count
    //
    this.error_cnt = 0;

    //
    // info cache of configs per transport
    //
    this.levelCache = {};
    //
    // stack of labels for grouping
    //
    this.groupLabels = [];

    //
    // intialize config with defaults
    //
    this._config = {};
    this.config(default_config);

    events.EventEmitter.call(this);
}

util.inherits(Dribble, events.EventEmitter);


/**
 * Initialize the config
 * @param config
 */
Dribble.prototype.config = function (config) {
    _.extend(this._config, config);

    this.activeConfig = this._config[this._config.activeConfig];


    //
    // create the file dump location if it does not exist
    //
    if (this._config.rootPath) {
        fs.exists(this._config.rootPath, function (exists) {
            if (exists === false) {
                fs.mkdir(config.rootPath);
            }
        })
    }


}

/**
 * Alias emit function as .log
 * @type {*}
 */
Dribble.prototype.log = Dribble.prototype.emit;

//
//TODO - add assertions
//
//Dribble.prototype.assert = assert;


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

        dlabels = process.domain.__dribble_groupLabels || (process.domain.__dribble_groupLabels = ['$' + (new Date()).getTime()]);
    }

    if (dlabels.indexOf(label) === -1 && dlabels.length < 50) {
        dlabels.push(label);
    }

};

Dribble.prototype.groupEnd = function (label) {
    var dlabels = this.groupLabels;
    if (process.domain) {
        dlabels = process.domain.__dribble_groupLabels;
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

    var
        me = this,
        level_config = this.matchTransports(level);

    Object.keys(level_config).forEach(function (k) {

        if (level_config[k].disabled !== true) {

            if (level_config[k].include) {
                if (level_config[k].include.indexOf('stack') !== -1 && (meta instanceof Error)) {
                    meta.trace = meta.stack;
                }
            }
            switch (k) {


                case 'console':

                    var console_cfg = level_config[k];

                    var cmessage = message;


                    //
                    // apply grouping label if exists
                    //
                    var dlabels = me.groupLabels;
                    if (process.domain) {
                        dlabels = process.domain.__dribble_groupLabels;

                    }


                    if (dlabels && dlabels.length > 0) {
                        cmessage = dlabels.join(me._config.groupLevelSeparator) + me._config.groupSeparator + cmessage;
                    }

                    if (meta && meta.trace) {
                        meta['__color_magenta__trace'] = meta.trace;
                        delete meta.trace;
                    }


                    var close_color = null;
                    _.each(meta,function(v,k) {
                       if (k.indexOf('__color') !== -1) {
                           close_color = '__close_magenta__';
                       }
                       else if (close_color) {
                           meta[close_color + k] = v;
                           delete meta[k];
                           close_color = null;
                       }

                    });



                    //
                    // capture stack if enabled
                    //
                    //   if (console_cfg.include) {
                    //     var stack = meta.stack;
                    //   if (stack && console_cfg.include.indexOf('stack') !== -1) {
                    //     cmessage += '\n\t' + colors['magenta'][0] + stack + colors['magenta'][1];
                    //   }
                    // }


                    // if (level_config[k].color) {
                    //   var style = colors[level_config[k].color],
                    //     cmessage = style[0] + cmessage + style[1];
                    // }
                    console.log(formatters[level_config[k].fileFormat || 'plain'](message, meta,level_config[k]));
                    break;
                case 'file':


                    var path = level_config[k].path;

                    if (path.indexOf('{target}') !== -1) {
                        path = path.replace('{target}', location || 'process');
                    }

                    if (path.indexOf('{date}') !== -1) {
                        path = path.replace('{date}', moment(new Date()).format(level_config[k].fileDateFormat || 'YYYY-MM-DD'));
                    }


                    var formatted_data = formatters[level_config[k].fileFormat || 'json'](message, meta, level_config[k]);
                    writeToFile(path, formatted_data + ',\n');

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

        var level_config = me.activeConfig[level.toLowerCase()];


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
            _.defaults(return_cfg[t], _.pick(level_config, 'include', 'disabled','exclude'));
            _.defaults(return_cfg[t], _.pick(me._config, 'fileDateFormat', 'format'));
        });


        me.levelCache[level] = return_cfg;


    }

    return return_cfg;
}


function writeToFile(path, data) {

    fs.appendFile(path, data,
        function (err, rsp) {
        });


}

module.exports = Dribble;