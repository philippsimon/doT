/// <reference path="../typings/tsd.d.ts" />

import assert = require('assert');
import doT = require('../lib/doT');
doT.templateSettings.with = false;
import DotCore = require('../lib/DotCore');

var encodeHTML = doT.encodeHTMLSource(true);

describe('doT', function() {

  describe('#compile', function() {
    return it('returns a function', function() {
      return assert.equal('function', typeof doT.compile(''));
    });
  });

  describe('calling compiled function', function() {
    return it('renders the template', function() {
      var str, tmpl;
      str = "<div>{{! it.foo || '' }}</div>";
      tmpl = doT.compile(str);
      assert.equal('<div>http</div>', tmpl({
        foo: 'http'
      }));
      assert.equal('<div>http:&#47;&#47;abc.com</div>', tmpl({
        foo: 'http://abc.com'
      }));
      return assert.equal('<div></div>', tmpl({}));
    });
  });

  context('with caching', function() {
    var include1 = {
      '_dynamic': {
        'content': {
          'name': 'body1'
        }
      }
    };
    var include2 = {
      '_dynamic': {
        'content': {
          'name': 'body2'
        }
      }
    };

    beforeEach(function() {
      doT.autoload = DotCore.autoloadFail;
      doT.addCached('layout1', doT.compile('<html>{{@@content(it)}}</html>'));
      doT.addCached('layout2', doT.compile('<xml>{{@@content(it)}}</xml>'));
      doT.addCached('body1', doT.compile('data1'));
      doT.addCached('body2', doT.compile('data2 {{@partial(it)}}'));
      doT.addCached('partial', doT.compile('partial'));
    });

    it('renders partial', function() {
      assert.equal('data2 partial', doT.render('body2', {}));
    });

    it('renders using dynamic includes', function() {
      assert.equal('<html>data1</html>', doT.render('layout1', include1));
      assert.equal('<html>data2 partial</html>', doT.render('layout1', include2));
      assert.equal('<xml>data1</xml>', doT.render('layout2', include1));
      assert.equal('<xml>data2 partial</xml>', doT.render('layout2', include2));
    });

    describe('#getCached', function() {
      it('returns template function', function() {
        assert.equal('data1', doT.getCached('body1')({}));
      });
      it('returns object with template functions', function() {
        assert.equal('data1', doT.getCached().body1({}));
      });
    });

    describe('#setCached', function() {
      it('sets all cached functions', function() {
        var cache;
        cache = doT.getCached();
        doT.setCached({});
        assert.throws(function() {
          return doT.render('body1', {});
        });
        doT.setCached(cache);
        assert.equal('data1', doT.render('body1', {}));
      });
    });

    describe('#exportCached', function() {
      it('exports js object with template functions', function() {
        var obj, str;
        str = doT.exportCached();
        obj = null;
        eval("obj = " + str);
        assert.equal('data1', obj.body1({}));
      });
    });
  });

  context('#templateSettings.strip', function() {
    describe('= true', function() {
      it('should replace new lines with space', function() {
        doT.templateSettings.strip = true;
        assert.equal('a b c', doT.compile('  a\r\n\t b\nc  \t')());
      })
    })
    describe('= false', function() {
      it('should keep new lines', function() {
        doT.templateSettings.strip = false;
        assert.equal('a\nb\n', doT.compile('a\nb\n')());
        assert.equal('a\nb\n', doT.compile('{{= "a" }}\n{{= "b" }}\n')());
      })
    })
  });

  context('tag', function() {

    describe('content_for', function() {
      it('returns map', function() {
        doT.templateSettings.with = true;
        var result = doT.compile('{{>title}}{{=val2}}{{>}}{{=val1}}{{>footer}}{{=val3}}{{>}}{{? false}}{{?}} end')({
          val1: 'content',
          val2: 'title',
          val3: 'footer'
        });
        doT.templateSettings.with = false;
        assert.deepEqual({
          _content: 'content end',
          title: 'title',
          footer: 'footer'
        }, result);
      });
    });

    describe('define', function() {
      it('works', function() {
        var str, tmpl;
        str = "{{##def.tmp:<div>{{!it.foo || ''}}</div>#}}{{#def.tmp}}";
        tmpl = doT.compile(str);
        assert.equal('<div>http</div>', tmpl({
          foo: 'http'
        }));
        assert.equal('<div>http:&#47;&#47;abc.com</div>', tmpl({
          foo: 'http://abc.com'
        }));
        assert.equal('<div></div>', tmpl({}));
      });
    });

    describe('interpolate', function() {
      it('works without spaces', function() {
        assert.equal('a', doT.compile('{{=it}}')('a'));
      });
      it('works with some spaces', function() {
        assert.equal('b', doT.compile('{{ =it }}')('b'));
      });
      it('works with a lot spaces', function() {
        assert.equal('c', doT.compile('{{ = it }}')('c'));
      });
    });

    describe('encode', function() {
      it('works without spaces', function() {
        assert.equal(encodeHTML('<'), doT.compile('{{!it}}')('<'));
      });
      it('works with some spaces', function() {
        assert.equal(encodeHTML('>'), doT.compile('{{ !it }}')('>'));
      });
      it('works with a lot spaces', function() {
        assert.equal(encodeHTML('<<'), doT.compile('{{ ! it }}')('<<'));
      });
    });

    describe('conditional', function() {
      it('works without spaces', function() {
        assert.equal('a', doT.compile('{{?it}}a{{?}}')(true));
      });
      it('works with spaces', function() {
        assert.equal('b', doT.compile('{{ ? it }}b{{ ? }}')(true));
      });
      it('elsecase works', function() {
        assert.equal('c', doT.compile('{{ ?it }}a{{ ?? }}c{{?}}')(false));
      });
      it('else-elsecase works', function() {
        assert.equal('d', doT.compile('{{ ? it }}a{{ ?? false }}b{{ ?? }}d{{ ? }}')(false));
      });
      it('inverse condition works', function() {
        assert.equal('e', doT.compile('{{ ? !it }}e{{ ? }}')(false));
      });
    });

    describe('iterate', function() {
      it('works without spaces & key', function() {
        assert.equal('abc', doT.compile('{{~it:value}}{{=value}}{{~}}')(['a', 'b', 'c']));
      });
      it('works without spaces, with key', function() {
        assert.equal('0a1b2c', doT.compile('{{~it:key=>value}}{{=key}}{{=value}}{{~}}')(['a', 'b', 'c']));
      });
      it('works with spaces, without key', function() {
        assert.equal('abc', doT.compile('{{ ~ it : value }}{{=value}}{{ ~ }}')(['a', 'b', 'c']));
      });
      it('works with spaces & key', function() {
        assert.equal('0a1b2c', doT.compile('{{ ~ it : key => value }}{{=key}}{{=value}}{{ ~ }}')(['a', 'b', 'c']));
      });
    });

    describe('iterateFor', function() {
      it('works without spaces & key', function() {
        assert.equal('123', doT.compile('{{:it:x}}{{=x}}{{:}}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('works without spaces, with key', function() {
        assert.equal('a1b2c3', doT.compile('{{:it:x=>y}}{{=x}}{{=y}}{{:}}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('works with spaces, without key', function() {
        assert.equal('123', doT.compile('{{ : it : x }}{{=x}}{{ : }}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('works with spaces & key', function() {
        assert.equal('a1b2c3', doT.compile('{{ : it : x => y }}{{=x}}{{=y}}{{ : }}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('iterates through inline object', function() {
        assert.equal('test', doT.compile('{{:{x:"test"} :k => v}}{{=v}}{{:}}')({}));
      });
      it('iterates through complex inline object but without spaces', function() {
        assert.equal('test', doT.compile('{{: {x:"test",y:{z:{}}} :k => v}}{{=v}}{{break}}{{:}}')({}));
      });
    });
  });

  describe('tags combination', function() {
    it('works', function() {
      doT.templateSettings.with = true;
      var fn = doT.compile('{{ =a }}{{ !b }}{{ ?true }}c{{?}}{{ ~d:x}}{{=x}}{{~}}{{ :e:x}}{{=x}}{{:}}{{ var v = f}}{{=v}}');
      doT.templateSettings.with = false;

      assert.equal('abcdef', fn({
        a: 'a',
        b: 'b',
        c: 'c',
        d: ['d'],
        e: {
          key: 'e'
        },
        f: 'f'
      }));
    });
  });

});