/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../lib/DotCore.ts" />
/// <reference path="../lib/DotCore.d.ts" />
var sid = 0;
var re_skip = /$^/;
var tags = {
    interpolate: {
        regex: /\{\{\s*=\s*([\s\S]+?)\s*\}\}/g,
        func: function (m, code) {
            var settings = this;
            var cse = settings.append ? settings.startend.append : settings.startend.split;
            return cse.start + unescape(code) + cse.end;
        }
    },
    encode: {
        regex: /\{\{\s*!\s*([\s\S]+?)\s*\}\}/g,
        func: function (m, code) {
            var settings = this;
            var cse = settings.append ? settings.startend.append : settings.startend.split;
            return cse.startencode + unescape(code) + cse.end;
        }
    },
    conditional: {
        regex: /\{\{\s*\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
        func: function (m, elsecase, code) {
            if (elsecase) {
                if (code) {
                    return "' ; } else if ( " + (unescape(code)) + " ) { out += '";
                }
                else {
                    return "'; } else { out += '";
                }
            }
            else {
                if (code) {
                    return "'; if ( " + (unescape(code)) + " ) { out += '";
                }
                else {
                    return "'; } out += '";
                }
            }
        }
    },
    iterate: {
        regex: /\{\{\s*~\s*(?:(\S+?)\s*\:\s*([\w$]+)\s*(?:=>\s*([\w$]+))?\s*)?\}\}/g,
        func: function (m, iterate, iname, vname) {
            if (!iterate) {
                return "'; } } out += '";
            }
            if (!vname) {
                vname = iname;
                iname = "i" + (++sid);
            }
            iterate = unescape(iterate);
            return "'; var arr" + sid + " = " + iterate + "; if( arr" + sid + " ) { var "
                + vname + ", " + iname + " = -1, l" + sid + " = arr" + sid + ".length-1; while( "
                + iname + " < l" + sid + " ){ " + vname + " = arr" + sid + "[" + iname + " += 1]; out += '";
        }
    },
    iterateFor: {
        regex: /\{\{\s*:\s*(?:(\S+?)\s*\:\s*([\w$]+)\s*(?:=>\s*([\w$]+))?\s*)?\}\}/g,
        func: function (m, iterate, iname, vname) {
            if (!iterate) {
                return "'; } } out += '";
            }
            var inpname = "i" + (++sid);
            if (!vname) {
                vname = iname;
                iname = "i" + (++sid);
            }
            return "'; var " + inpname + " = " + iterate + "; if ( " + inpname
                + " ) { var " + vname + ", " + iname + "; for (" + iname + " in "
                + inpname + " ) { " + vname + " = " + inpname + "[ " + iname + " ]; out += '";
        }
    },
    content_for: {
        regex: /\{\{>([\s\S]*?)\}\}/g,
        func: function (m, id, compileParams) {
            compileParams.multiple_contents = true;
            if (id) {
                return "'; contents[current_out] = out; out_stack.push(current_out); current_out='"
                    + (unescape(id).trim()) + "'; out = contents[current_out] = '";
            }
            else {
                return "'; contents[current_out] = out; out = contents[current_out = out_stack.pop()] += '";
            }
        }
    },
    xx_includeDynamic: {
        regex: /\{\{@@\s*(\S+?)\(([\s\S]*?)\)\s*\}\}/g,
        func: function (m, tmpl, args) {
            var settings = this;
            var vname;
            sid += 1;
            vname = 'tmpl' + sid;
            return "'; var " + vname + " = " + settings.dynamicList + "[ '"
                + (unescape(tmpl)) + "' ]; if ('string' === typeof " + vname + ") "
                + vname + " = {name: " + vname + "}; out += this.render({name: "
                + vname + ".name, args: " + vname + ".args || arguments}) + '";
        }
    },
    xy_render: {
        regex: /\{\{@\s*(\S+?)\(([\s\S]*?)\)\s*\}\}/g,
        func: function (m, tmpl, args) {
            return "' + this.render( '" + tmpl + "' " + (args ? ","
                + (unescape(args)) : '') + " ) + '";
        }
    },
    zz_evaluate: {
        regex: /\{\{([\s\S]*?)\}\}/g,
        func: function (m, code) {
            return "'; " + (unescape(code)) + "; out += '";
        }
    }
};
var resolveDefs = (function () {
    function resolveDefs(block, compileParams) {
        if (!(resolveDefs.use || resolveDefs.define)) {
            return block;
        }
        var that = this;
        var def = compileParams.def || {};
        return block.toString().replace(resolveDefs.define || re_skip, function (m, code, assign, value) {
            if (code.indexOf("def.") === 0) {
                code = code.substring(4);
            }
            if (!(code in def)) {
                if (assign === ":") {
                    if (that.defineParams) {
                        value.replace(that.defineParams, function (m, param, v) {
                            def[code] = {
                                arg: param,
                                text: v
                            };
                            return '';
                        });
                    }
                    if (!(code in def)) {
                        def[code] = value;
                    }
                }
                else {
                    new Function("def", "def['" + code + "'] = " + value)(def);
                }
            }
            return '';
        }).replace(resolveDefs.use || re_skip, function (m, code) {
            if (that.useParams) {
                code = code.replace(that.useParams, function (m, s, d, param) {
                    if (def[d] && def[d].arg && param) {
                        var rw = (d + ":" + param).replace(/'|\\/g, "_");
                        def.__exp = def.__exp || {};
                        def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])"
                            + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
                        return s + ("def.__exp['" + rw + "']");
                    }
                });
            }
            var v = new Function("def", "return " + code)(def);
            if (v) {
                return resolveDefs.call(that, v, compileParams);
            }
            else {
                return v;
            }
        });
    }
    resolveDefs.use = /\{\{#([\s\S]+?)\}\}/g;
    resolveDefs.define = /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g;
    return resolveDefs;
})();
function strip(str, compileParams) {
    var settings = this;
    if (!settings.strip) {
        return str;
    }
    return str
        .replace(/\s+/g, ' ')
        .replace(/^\s+/, '')
        .replace(/\s+$/, '');
}
function escape_quotes(str, compileParams) {
    return str.replace(/'|\\/g, '\\$&');
}
function execute_tags(str, compileParams) {
    var settings = this;
    var t_id, t_name, tag, taglist;
    taglist = Object.keys(settings.tags).sort();
    for (t_id in taglist) {
        t_name = taglist[t_id];
        tag = settings.tags[t_name];
        str = str.replace(tag.regex, function () {
            var args = Array.prototype.slice.call(arguments, 0, -2);
            args.push(compileParams);
            return tag.func.apply(settings, args);
        });
    }
    return str;
}
function escape_spaces(str, compileParams) {
    return str
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r');
}
function cleanup(str, compileParams) {
    return str
        .replace(/(;|}|^|{)\s*out\s*\+=\s*'';/g, '$1')
        .replace(/\s*\+\s*''/g, '')
        .replace(/var out = ''; out \+=/, 'var out =')
        .replace(/var out = ([^;]*); return out;/, 'return $1;');
}
function function_basics(str, compileParams) {
    if (compileParams.multiple_contents) {
        return "var out_stack = [], contents = {}, current_out = '_content'; var out = '"
            + str + "'; contents[current_out] = out; return contents;";
    }
    else {
        return " var out = '" + str + "'; return out;";
    }
}
function add_with(str, compileParams) {
    var settings = this;
    if (!settings["with"]) {
        return str;
    }
    return "with(" + (true === settings["with"]
        ? settings.varname
        : settings["with"]) + ") {" + str + "}";
}
function functionize(str, compileParams) {
    var settings = this;
    if (!settings.selfcontained) {
        if (global && !('encodeHTML' in global)) {
            global['encodeHTML'] = compileParams.doT.encodeHTMLSource(settings.doNotSkipEncoded);
        }
    }
    else {
        str = "var encodeHTML = (" + compileParams.doT.encodeHTMLSource.toString()
            + "(" + (settings.doNotSkipEncoded || '') + "));" + str;
    }
    try {
        return new Function(settings.varname, str);
    }
    catch (e) {
        throw new Error(e + " in `new Function '" + settings.varname + "', \"" + str + "\"`");
    }
}
function unescape(code) {
    return code
        .replace(/\\('|\\)/g, '$1')
        .replace(/[\r\t\n]/g, ' ');
}
var settings = {
    mangles: {
        '05_define': resolveDefs,
        '10_strip': strip,
        '20_escape_quotes': escape_quotes,
        '50_tags': execute_tags,
        '70_escape_spaces': escape_spaces,
        '80_function_basics': function_basics,
        '80_with': add_with,
        '90_cleanup': cleanup,
        '95_functionize': functionize
    },
    tags: tags,
    varname: 'it',
    strip: true,
    "with": true,
    dynamicList: 'it._dynamic',
    append: false,
    startend: {
        append: {
            start: "' + ( ",
            end: " ) + '",
            startencode: "' + encodeHTML( "
        },
        split: {
            start: "';out += ( ",
            end: " ); out += '",
            startencode: "'; out += encodeHTML( "
        }
    },
    unescape: unescape,
    resolveDefs: resolveDefs,
    doNotSkipEncoded: false
};
module.exports = settings;
//# sourceMappingURL=original.js.map