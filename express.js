// Generated by CoffeeScript 1.4.0
(function() {
  var dot;

  dot = require('doT');

  module.exports = dot;

  (function() {
    this.compile = dot.render;
    return {
      this.__express: function(filename, options, cb) {
        try {
          return cb(null, dot.render);
        } catch (err) {
          return cb(err);
        }
      }
    };
  }).call(dot);

}).call(this);