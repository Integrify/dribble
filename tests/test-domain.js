///
///  Test basic query
///
var dribble = require('../index.js'),
    config = require('./dribble-config.json'),
    domain = require('domain'),
    assert = require('assert'),
    http = require('http');


server_port = 3005;


function whatsMyPath(url) {

  dribble.info('bar concurs - url is:' + url);
}


function handleRequest(req, res) {

  dribble.group('new foo');

  dribble.info('foo\'s url is - ' + req.url);
  setTimeout(whatsMyPath.bind(this, req.url, function () {
    dribble.groupEnd('new foo');
  }), 300);


}


dribble.config(config);


http.createServer(function (req, res) {
  var d = domain.create();

  d.on('error', function (er) {
    dribble.error(err.message, er);
    assert.ifError(err);
  });

  d.run(function () {
    handleRequest(req, res);
  });
}).listen(server_port);


http.get('http://127.0.0.1:' + server_port);
http.get('http://127.0.0.1:' + server_port + '/?test');
http.get('http://127.0.0.1:' + server_port + '/?test3');


setTimeout(function() {
  dribble.console('Domain tests passed');
  process.exit();
}, 3000
);
