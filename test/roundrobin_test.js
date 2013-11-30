var assert = require('assert'),
    argo = require('argo'),
    Stream = require('stream'),
    roundrobin = require('../'),
    util = require('util');

function Request() {
  this.headers = {};
  this.chunks = [];
  Stream.Duplex.call(this);
}
util.inherits(Request, Stream.Duplex);

Request.prototype._read = function(size) {
  var chunk = this.chunks.length ? this.chunks.shift() : null;
  this.push(chunk);
};

Request.prototype._write = function(chunk, encoding, callback) {
  this.chunks.push(chunk);
  callback();
};

function Response() {
  this.headers = {};
  this.statusCode = 0;
  this.body = null;
  this.chunks = [];
  Stream.Duplex.call(this);
}
util.inherits(Response, Stream.Duplex);

Response.prototype._read = function(size) {
  var chunk = this.chunks.length ? this.chunks.shift() : null;
  this.push(chunk);
};

Response.prototype._write = function(chunk, encoding, callback) {
  this.chunks.push(chunk);
  callback();
};

Response.prototype.setHeader = function(k, v) {
  this.headers[k] = v;
};

Response.prototype.writeHead = function(s, h) {
  this.statusCode = s;
  this.headers = h;
};

Response.prototype.getHeader = function(k) {
  return this.headers[k];
};

Response.prototype.end = function(b) {
  this.body = b;
};

function _getEnv() {
  return { 
    request: new Request(),
    response: new Response(),
    target: {},
    argo: {}
  };
}

describe('round robin proxying', function(){
  it('selects the first item of the array for proxying.', function(done) {
    var server = argo();
    var endpoints = ['http://example.com/1.json','http://example.com/2.json','http://example.com/3.json'];
    server.use(roundrobin(endpoints));
    server.use(function(handle) {
      handle('request', function(env, next) {
        assert.equal(env.target.url, 'http://example.com/1.json');
        done();
      });
    })
    .call(_getEnv());
  });

  it('properly shifts through the array on each request.', function(done) {
    var _http = {};
    _http.IncomingMessage = Request;
    _http.ServerResponse = Response;
    _http.Agent = function() {};
    var server = argo(_http);
    var endpoints = ['http://example.com/1.json','http://example.com/2.json','http://example.com/3.json'];
    var count = 0;
    server.use(roundrobin(endpoints));
    server.use(function(handle) {
      handle('request', function(env, next) {
        if(count == 0) {
          assert.equal(env.target.url, 'http://example.com/1.json');
          env.target.skip = true;
          next(env);
        } else if(count == 1) {
          assert.equal(env.target.url, 'http://example.com/2.json');
          env.target.skip = true;
          next(env);
        } else if(count == 2) {
          assert.equal(env.target.url, 'http://example.com/3.json');
          done();
        }
        count++;
      });
    });

    var app = server.build();
    app.flow(_getEnv());
    app.flow(_getEnv());
    app.flow(_getEnv());
  });

});
