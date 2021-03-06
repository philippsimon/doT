var doT = require('./doT');
module.exports = doT;

function express_setup() {
  this.compile = this.render;
  return this.__express = (function(_this) {
    return function(filename, options, cb) {
      var err;
      try {
        return cb(null, _this.render);
      } catch (_error) {
        err = _error;
        return cb(err);
      }
    };
  })(this);
}

express_setup.call(doT);
