'use strict';

module.exports = DotCore;
function DotCore(settings) {
  settings = settings || {};
  this.autoload = DotCore.autoloadDOM();
  this.cache = {};

  this.templateSettings = {};
  for (var key in settings) {
    this.templateSettings[key] = settings[key];
  }
}
DotCore.version = '1.0.1';
DotCore.autoload = DotCore.autoloadFail;

DotCore.prototype.encodeHTMLSource = function(doNotSkipEncoded) {
  var encodeHTMLRules = {
    '&': '&#38;',
    '<': '&#60;',
    '>': '&#62;',
    '"': '&#34;',
    '\'': '&#39;',
    '/': '&#47;'
  };
  var matchHTML = doNotSkipEncoded && /[&<>"'\/]/g ||
    /&(?!#?\w+;)|<|>|"|'|\//g;
  return function encodeHTML(code) {
    return code ? code.toString().replace(matchHTML, function(m) {
      return encodeHTMLRules[m] || m;
    }) : '';
  };
};

// template compilation
DotCore.prototype.compile = function(tmpl, compileParams) {
  compileParams = compileParams || {};
  compileParams.def || (compileParams.def = {});
  compileParams.doT || (compileParams.doT = this);
  var mangles_list = Object.keys(this.templateSettings.mangles).sort();
  for (var m_id in mangles_list) {
    var m_name = mangles_list[m_id];
    tmpl = this.templateSettings.mangles[m_name]
      .call(this.templateSettings, tmpl, compileParams);
  }
  return tmpl;
};

// cache functions
DotCore.prototype.getCached = function(tmpl) {
  if (!tmpl) {
    return this.cache;
  }
  if (!this.cache[tmpl]) {
    throw new Error('Template not found: ' + tmpl);
  }
  return this.cache[tmpl];
};

DotCore.prototype.setCached = function(cache) {

  this.cache = cache;
};

DotCore.prototype.exportCached = function() {
  var str = '';
  var ref = this.cache;
  for (var id in ref) {
    var f = ref[id];
    str += ',"' + id + '": ' + (f.toString());
  }
  return '{' + str.slice(1) + '}';
};

DotCore.prototype.addCached = function(id, fn) {
  if ('object' === typeof id) {
    for (var i in id) {
      var f = id[i];
      this.cache[i] = f;
    }
  } else {
    this.cache[id] = fn;
  }
  return this;
};

DotCore.prototype.render = function(arg0) {
  var name;
  var args;
  if (typeof arg0 === 'object') {
    name = arg0.name;
    args = arg0.args;

  } else {
    name = arg0;
    args = Array.prototype.slice.call(arguments, 1);
  }
  var fn = this.cache[name];
  if (!fn) {
    var src = this.autoload(name);
    if (typeof src !== 'string') {
      throw new Error('Template not found: ' + JSON.stringify(name));
    }
    fn = this.compile(src);
    this.addCached(name, fn);
  }
  return fn.apply(this, args);
};

// autoload implementations
DotCore.autoloadDOM = function(opts) {
  return function(name) {
    var src = document.getElementById(name);
    if ((src != null ? src.type : void 0) !== 'text/x-dot-tmpl') {
      return;
    }
    return src.innerHTML;
  };
};

DotCore.autoloadFS = function(opts) {
  opts.fs || (opts.fs = require('fs'));
  return function(name) {
    try {
      return opts.fs.readFileSync(opts.root + '/' +
        (name.replace('.', '/')) + '.tmpl');
    } catch (e) {
      return;
    }
  };
};

DotCore.autoloadFail = function(name) {
  return;
};
