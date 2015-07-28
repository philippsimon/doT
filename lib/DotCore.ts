/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./DotCore.d.ts" />

"use strict";

export = DotCore;
class DotCore {
  static version = '1.0.1';

  public mangles: any;
  public cache: any;
  public autoload = DotCore.autoloadFail;
  public templateSettings: DotCore.settings;

  constructor(settings?: DotCore.settings) {
    settings = settings || {};
    this.autoload = DotCore.autoloadDOM();
    this.cache = {};

    this.templateSettings = {};
    for (var key in settings) {
      this.templateSettings[key] = settings[key];
    }
  }

	public encodeHTMLSource(doNotSkipEncoded: boolean) {
		var encodeHTMLRules = {
        "&": "&#38;",
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "/": "&#47;"
      };
			var matchHTML = doNotSkipEncoded
        ? /[&<>"'\/]/g
        : /&(?!#?\w+;)|<|>|"|'|\//g;
		return function encodeHTML(code: string) {
			return code ? code.toString().replace(matchHTML, function(m) {
        return encodeHTMLRules[m] || m;
      }) : "";
		};
	}

  // template compilation
  public compile(
    tmpl: string,
    compileParams?: any
  ): any {
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
  }

  // cache functions
  public getCached(tmpl?: string) {
    if (!tmpl) {
      return this.cache;
    }
    if (!this.cache[tmpl]) {
      throw new Error("Template not found: " + tmpl);
    }
    return this.cache[tmpl];
  };

  public setCached(cache) {

    this.cache = cache;
  };

  public exportCached() {
    var f, id, ref, str;
    str = "";
    ref = this.cache;
    for (id in ref) {
      f = ref[id];
      str += ",\"" + id + "\": " + (f.toString());
    }
    return "{" + str.slice(1) + "}";
  };

  public addCached(id, fn) {
    var f, i;
    if ('object' === typeof id) {
      for (i in id) {
        f = id[i];
        this.cache[i] = f;
      }
    } else {
      this.cache[id] = fn;
    }
    return this;
  };

  // render() for transparent autoloding & caching
  public render(tmpl: DotCore.render_args.tmpl): string|any
  public render(name: string, ...args: any[]): string|any
  public render(arg0: any): string|any {
    var name: string;
    var args: any[];
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
        throw new Error("Template not found: " + JSON.stringify(name));
      }
      fn = this.compile(src);
      this.addCached(name, fn);
    }
    return fn.apply(this, args);
  };

  // autoload implementations
  static autoloadDOM(opts?): (name: string) => string {
    return function(name) {
      var src;
      src = document.getElementById(name);
      if ((src != null ? src.type : void 0) !== 'text/x-dot-tmpl') {
        return;
      }
      return src.innerHTML;
    };
  };

  static autoloadFS(opts): (name: string) => string {
    opts.fs || (opts.fs = require('fs'));
    return function(name) {
      try {
        return opts.fs.readFileSync(opts.root + "/" + (name.replace('.', '/')) + ".tmpl");
      } catch (e) {
        return;
      }
    };
  };

  static autoloadFail(name: string): string {
    return;
  };
}
