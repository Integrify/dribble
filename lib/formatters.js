var _ = require('underscore'),
    util = require('util'),
    colors = require('./colors.js'),
    yaml = require('js-yaml');


var formatters = {
  'json': function(msg,meta,config) {
    var entry = {msg:msg};
      var date = _.indexOf(config.exclude,'date') === -1 ? new Date() : null;


    if (meta) {
     entry =  _.defaults(entry,meta);
    }

    if (date) {
      entry.date = date;
    }

    return JSON.stringify(entry);
  },
    'plain': function(msg,meta,config) {

       var date = _.indexOf(config.exclude,'date') === -1 ? new Date() : null;

       var date_str =  date ? JSON.stringify(date).substr(1, 24) : null;
       var entry = util.format('%s%s',date_str ? date_str + ': ' : '',msg);

       if (meta) {

          var formatted_meta = yaml.safeDump(meta,{skipInvalid: true}); //JSON.stringify(meta,null,2).replace(/([\{\}]\n|,\n|\\n)/g,'\n').replace(/("|[\s]*\})/g,'');


           entry += '\n    ' + formatted_meta.replace(/\n/g,'\n    ');
       }
        var open_color = null;
        if (entry.indexOf('__color_')) {
            _.each(colors,function(v,k) {
                if (entry.indexOf('__color_' + k + '__') !== -1) {
                    entry = entry.replace('__color_' + k + '__',v[0]);
                    open_color = k;
                }
                 if (entry.indexOf('__close_' + k + '__') !== -1) {
                    entry = entry.replace('__close_' + k + '__',v[1]);
                    open_color = null;
                }
            });
        }

        //if color not closed, close it
        if (open_color) {
            entry += colors[open_color][1];
        }

       return entry;
    }

};

module.exports = formatters;
