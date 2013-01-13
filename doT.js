// Generated by CoffeeScript 1.4.0

/*
  doT.js
  2011, Laura Doktorova, https://github.com/olado/doT
  
  doT.js is an open source component of http://bebedo.com
  Licensed under the MIT license.
*/


(function() {
  "use strict";

  var cache, doT, resolveDefs, sid, skip, startend, tags, unescape;

  startend = {
    append: {
      start: "'+(",
      end: ")+'",
      endEncode: ").encodeHTML()+'"
    },
    split: {
      start: "';out+=(",
      end: ");out+='",
      endEncode: ").encodeHTML();out+='"
    }
  };

  doT = {
    version: '0.2.0',
    templateSettings: {
      use: /\{\{#([\s\S]+?)\}\}/g,
      define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
      varname: 'it',
      strip: true,
      "with": true,
      dynamicList: 'it._dynamic',
      startend: startend.append
    },
    startend: startend,
    tags: {}
  };

  cache = {};

  sid = 0;

  skip = /$^/;

  tags = doT.tags;

  tags.interpolate = {
    regex: /\{\{=([\s\S]+?)\}\}/g,
    func: function(m, code) {
      var cse;
      cse = doT.templateSettings.startend;
      return cse.start + unescape(code) + cse.end;
    }
  };

  tags.encode = {
    regex: /\{\{!([\s\S]+?)\}\}/g,
    func: function(m, code) {
      var cse;
      cse = doT.templateSettings.startend;
      return cse.start + unescape(code) + cse.endEncode;
    }
  };

  tags.conditional = {
    regex: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
    func: function(m, elsecase, code) {
      if (elsecase) {
        if (code) {
          return "' ; } else if ( " + (unescape(code)) + " ) { out += '";
        } else {
          return "'; } else { out += '";
        }
      } else {
        if (code) {
          return "'; if ( " + (unescape(code)) + " ) { out += '";
        } else {
          return "'; } out += '";
        }
      }
    }
  };

  tags.iterate = {
    regex: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
    func: function(m, iterate, vname, iname) {
      var indv;
      if (!iterate) {
        return "'; } } out += '";
      }
      sid += 1;
      indv = iname || 'i' + sid;
      iterate = unescape(iterate);
      return "';      var arr" + sid + " = " + iterate + ";      if( arr" + sid + " ) {        var " + vname + ", " + indv + " = -1, l" + sid + " = arr" + sid + ".length-1;        while( " + indv + " < l" + sid + " ){          " + vname + " = arr" + sid + "[" + indv + " += 1];          out += '";
    }
  };

  tags.iterateFor = {
    regex: /\{\{:\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
    func: function(m, iterate, vname, iname) {
      var inpname;
      if (!iterate) {
        return "'; } } out += '";
      }
      sid += 1;
      inpname = 'iter' + sid;
      return "';      var " + inpname + " = " + iterate + ";      if ( " + inpname + " ) {        var " + vname + ", " + iname + ";        for (" + iname + " in " + inpname + " ) {          " + vname + " = " + inpname + "[ " + iname + " ];          out += '";
    }
  };

  tags.content_for = {
    regex: /\{\{>\s*([\s\S]*?)\s*\}\}/g,
    func: function(m, id) {
      this.multiple_contents = true;
      if (id) {
        return "';      contents[current_out] = out;      out_stack.push(current_out);      current_out='" + (unescape(id)) + "'.trim();      out = contents[current_out] = '";
      } else {
        return "';      contents[current_out] = out;      out = contents[current_out = out_stack.pop()] += '";
      }
    }
  };

  tags.xx_includeDynamic = {
    regex: /\{\{@@([\S]+?)\([\s]*([\s\S]*?)[\s]*\)\}\}/g,
    func: function(m, tmpl, args) {
      var vname;
      sid += 1;
      vname = 'tmpl' + sid;
      return "';      var " + vname + " = " + doT.templateSettings.dynamicList + "[ '" + (unescape(tmpl)) + "' ];      if ('string' === typeof " + vname + ") " + vname + " = {name: " + vname + "};      out += doT.render({name: " + vname + ".name, args: " + vname + ".args || arguments}) + '";
    }
  };

  tags.xy_render = {
    regex: /\{\{@([\S]+?)\([\s]*([\s\S]*?)[\s]*\)\}\}/g,
    func: function(m, tmpl, args) {
      return "' + doT.render( '" + tmpl + "' " + (args ? "," + (unescape(args)) : '') + " ) + '";
    }
  };

  tags.zz_evaluate = {
    regex: /\{\{([\s\S]+?)\}\}/g,
    func: function(m, code) {
      return "'; " + (unescape(code)) + "; out += '";
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = doT;
  } else if (typeof define === 'function' && define.amd) {
    define(function() {
      return doT;
    });
  } else {
    this.doT = doT;
  }

  (function() {
    var match, rules;
    rules = {
      "&": "&#38;",
      "<": "&#60;",
      ">": "&#62;",
      '"': '&#34;',
      "'": '&#39;',
      "/": '&#47;'
    };
    match = /&(?!#?\w+;)|<|>|"|'|\//g;
    return String.prototype.encodeHTML = function() {
      return this.replace(match, function(m) {
        return rules[m] || m;
      });
    };
  })();

  unescape = function(code) {
    return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, ' ');
  };

  doT.unescape = unescape;

  resolveDefs = function(c, block, def) {
    return (typeof block === "string" ? block : block.toString()).replace(c.define || skip, function(m, code, assign, value) {
      if (code.indexOf("def.") === 0) {
        code = code.substring(4);
      }
      if (!(code in def)) {
        if (assign === ":") {
          if (c.defineParams) {
            value.replace(c.defineParams, function(m, param, v) {
              return def[code] = {
                arg: param,
                text: v
              };
            });
          }
          if (!(code in def)) {
            def[code] = value;
          }
        } else {
          new Function("def", "def['" + code + "']=" + value)(def);
        }
      }
      return "";
    }).replace(c.use || skip, function(m, code) {
      var v;
      if (c.useParams) {
        code = code.replace(c.useParams, function(m, s, d, param) {
          var rw;
          if (def[d] && def[d].arg && param) {
            rw = (d + ":" + param).replace(/'|\\/g, "_");
            def.__exp = def.__exp || {};
            def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
            return s + ("def.__exp['" + rw + "']");
          }
        });
      }
      v = new Function("def", "return " + code)(def);
      if (v) {
        return resolveDefs(c, v, def);
      } else {
        return v;
      }
    });
  };

  doT.compile = function(tmpl, def) {
    var c, compile_params, str, t_id, t_name, taglist;
    c = doT.templateSettings;
    str = c.use || c.define ? resolveDefs(c, tmpl, def || {}) : tmpl;
    compile_params = {};
    if (c.strip) {
      str = str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g, ' ').replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, '');
    }
    str = str.replace(/'|\\/g, '\\$&');
    taglist = Object.keys(doT.tags).sort();
    for (t_id in taglist) {
      t_name = taglist[t_id];
      str = str.replace(doT.tags[t_name].regex, function() {
        return doT.tags[t_name].func.apply(compile_params, arguments);
      });
    }
    str = (compile_params.multiple_contents ? str = "        var out_stack = [], contents = {}, current_out = '_content';        var out = '" + str + "';        contents[current_out] = out;        return contents;      " : " var out = '" + str + "';        return out;      ").replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r').replace(/(\s|;|}|^|{)out\+='';/g, '$1').replace(/\+''/g, '').replace(/(\s|;|}|^|{)out\+=''\+/g, '$1out+=');
    if (c["with"]) {
      str = "with(" + (true === c["with"] ? c.varname : c["with"]) + ") {" + str + "}";
    }
    try {
      return new Function(c.varname, str);
    } catch (e) {
      throw "" + e + " in " + str;
    }
  };

  doT.template = doT.compile;

  doT.getCached = function() {
    return cache;
  };

  doT.setCached = function(fns) {
    return cache = fns;
  };

  doT.exportCached = function() {
    var f, id, str;
    str = "";
    for (id in cache) {
      f = cache[id];
      str += ",\"" + id + "\": " + (f.toString());
    }
    return "{" + (str.substring(1)) + "}";
  };

  doT.addCached = function(id, fn) {
    var f, i;
    if ('object' === typeof id) {
      for (i in id) {
        f = id[i];
        doT.addCached(i, f);
      }
      return;
    }
    return cache[id] = fn;
  };

  doT.render = function(tmpl) {
    var src;
    ('object' !== typeof tmpl) && (tmpl = {
      name: tmpl
    });
    if (!cache[tmpl.name]) {
      src = doT.autoload(tmpl.name);
      if (false === src) {
        throw "Template not found: " + tmpl.name;
      }
      doT.addCached(tmpl.name, doT.compile(src));
    }
    return cache[tmpl.name].apply(this, tmpl.args || Array.prototype.slice.call(arguments, 1));
  };

  doT.autoloadDOM = function(opts) {
    return function(name) {
      var src;
      src = document.getElementById(name);
      if (!src || !src.type || 'text/x-dot-tmpl' !== src.type) {
        return false;
      } else {
        return src.innerHTML;
      }
    };
  };

  doT.autoloadFS = function(opts) {
    return function(name) {
      try {
        return opts.fs.readFileSync("" + opts.root + "/" + (name.replace('.', '/')) + ".tmpl");
      } catch (e) {
        return false;
      }
    };
  };

  doT.autoloadFail = function() {
    return false;
  };

  doT.autoload = doT.autoloadDOM();

}).call(this);
