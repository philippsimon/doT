var expect = require('chai').expect;
var doT = require('../lib/doT');
doT.templateSettings.with = false;
var DotCore = require('../lib/DotCore');

var encodeHTML = doT.encodeHTMLSource(true);

describe('doT', function() {

  describe('#compile', function() {
    it('returns a function', function() {
      expect('function').to.equal(typeof doT.compile(''));
    });
  });

  describe('calling compiled function', function() {
    it('renders the template', function() {
      var str = '<div>{{! it.foo || \'\' }}</div>';
      var tmpl = doT.compile(str);
      expect('<div>http</div>').to.equal(tmpl({
        foo: 'http'
      }));
      expect('<div>http:&#47;&#47;abc.com</div>', tmpl({
        foo: 'http://abc.com'
      }));
      expect('<div></div>').to.equal(tmpl({}));
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
      expect('data2 partial', doT.render('body2', {}));
    });

    it('renders using dynamic includes', function() {
      expect('<html>data1</html>').to.equal(doT.render('layout1', include1));
      expect('<html>data2 partial</html>').to.equal(
        doT.render('layout1', include2));
      expect('<xml>data1</xml>').to.equal(doT.render('layout2', include1));
      expect('<xml>data2 partial</xml>').to.equal(
        doT.render('layout2', include2));
    });

    describe('#getCached', function() {
      it('returns template function', function() {
        expect('data1').to.equal(doT.getCached('body1')({}));
      });
      it('returns object with template functions', function() {
        expect('data1').to.equal(doT.getCached().body1({}));
      });
    });

    describe('#setCached', function() {
      it('sets all cached functions', function() {
        var cache = doT.getCached();
        doT.setCached({});
        expect(function() {
          return doT.render('body1', {});
        }).to.throw(Error);
        doT.setCached(cache);
        expect('data1').to.equal(doT.render('body1', {}));
      });
    });

    describe('#exportCached', function() {
      it('exports js object with template functions', function() {
        var str = doT.exportCached();
        var obj = null;
        eval('obj = ' + str);
        expect('data1').to.equal(obj.body1({}));
      });
    });
  });

  context('#templateSettings.strip', function() {
    describe('= true', function() {
      it('should replace new lines with space', function() {
        doT.templateSettings.strip = true;
        expect('a b c').to.equal(doT.compile('  a\r\n\t b\nc  \t')());
      });
    });
    describe('= false', function() {
      it('should keep new lines', function() {
        doT.templateSettings.strip = false;
        expect('a\nb\n').to.equal(doT.compile('a\nb\n')());
        expect('a\nb\n').to.equal(doT.compile('{{= "a" }}\n{{= "b" }}\n')());
      });
    });
  });

  context('tag', function() {

    describe('content_for', function() {
      it('returns map', function() {
        doT.templateSettings.with = true;
        var result = doT.compile('{{>title}}{{=val2}}{{>}}{{=val1}}' +
          '{{>footer}}{{=val3}}{{>}}{{? false}}{{?}} end')({
          val1: 'content',
          val2: 'title',
          val3: 'footer'
        });
        doT.templateSettings.with = false;
        expect({
          _content: 'content end',
          title: 'title',
          footer: 'footer'
        }).to.deep.equal(result);
      });
    });

    describe('define', function() {
      it('works', function() {
        var str = '{{##def.tmp:<div>{{!it.foo || \'\'}}</div>#}}{{#def.tmp}}';
        var tmpl = doT.compile(str);
        expect('<div>http</div>').to.equal(tmpl({
          foo: 'http'
        }));
        expect('<div>http:&#47;&#47;abc.com</div>').to.equal(tmpl({
          foo: 'http://abc.com'
        }));
        expect('<div></div>').to.equal(tmpl({}));
      });
    });

    describe('interpolate', function() {
      it('works without spaces', function() {
        expect('a').to.equal(doT.compile('{{=it}}')('a'));
      });
      it('works with some spaces', function() {
        expect('b').to.equal(doT.compile('{{ =it }}')('b'));
      });
      it('works with a lot spaces', function() {
        expect('c').to.equal(doT.compile('{{ = it }}')('c'));
      });
    });

    describe('encode', function() {
      it('works without spaces', function() {
        expect(encodeHTML('<')).to.equal(doT.compile('{{!it}}')('<'));
      });
      it('works with some spaces', function() {
        expect(encodeHTML('>')).to.equal(doT.compile('{{ !it }}')('>'));
      });
      it('works with a lot spaces', function() {
        expect(encodeHTML('<<')).to.equal(doT.compile('{{ ! it }}')('<<'));
      });
    });

    describe('conditional', function() {
      it('works without spaces', function() {
        expect('a').to.equal(doT.compile('{{?it}}a{{?}}')(true));
      });
      it('works with spaces', function() {
        expect('b').to.equal(doT.compile('{{ ? it }}b{{ ? }}')(true));
      });
      it('elsecase works', function() {
        expect('c').to.equal(doT.compile('{{ ?it }}a{{ ?? }}c{{?}}')(false));
      });
      it('else-elsecase works', function() {
        expect('d').to.equal(
          doT.compile('{{ ? it }}a{{ ?? false }}b{{ ?? }}d{{ ? }}')(false));
      });
      it('inverse condition works', function() {
        expect('e').to.equal(doT.compile('{{ ? !it }}e{{ ? }}')(false));
      });
    });

    describe('iterate', function() {
      it('works without spaces & key', function() {
        expect('abc').to.equal(doT.compile('{{~it:value}}{{=value}}{{~}}')(
          ['a', 'b', 'c']));
      });
      it('works without spaces, with key', function() {
        expect('0a1b2c').to.equal(doT.compile('{{~it:key=>value}}{{=key}}' +
          '{{=value}}{{~}}')(['a', 'b', 'c']));
      });
      it('works with spaces, without key', function() {
        expect('abc').to.equal(
          doT.compile('{{ ~ it : value }}{{=value}}{{ ~ }}')(
          ['a', 'b', 'c']));
      });
      it('works with spaces & key', function() {
        expect('0a1b2c').to.equal(doT.compile('{{ ~ it : key => value }}' +
          '{{=key}}{{=value}}{{ ~ }}')(['a', 'b', 'c']));
      });
      it('works with old style', function() {
        expect('0a1b2c').to.equal(
          doT.compile('{{~it :value:key}}{{=key}}' +
          '{{=value}}{{~}}')(['a', 'b', 'c']));
      });
    });

    describe('iterateFor', function() {
      it('works without spaces & key', function() {
        expect('123').to.equal(doT.compile('{{:it:x}}{{=x}}{{:}}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('works without spaces, with key', function() {
        expect('a1b2c3').to.equal(
          doT.compile('{{:it:x=>y}}{{=x}}{{=y}}{{:}}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('works with spaces, without key', function() {
        expect('123').to.equal(doT.compile('{{ : it : x }}{{=x}}{{ : }}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('works with spaces & key', function() {
        expect('a1b2c3').to.equal(
          doT.compile('{{ : it : x => y }}{{=x}}{{=y}}{{ : }}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
      it('iterates through inline object', function() {
        expect('test',
          doT.compile('{{:{x:"test"} :k => v}}{{=v}}{{:}}')({}));
      });
      it('iterates through complex inline object but without spaces',
        function() {
        expect('test').to.equal(doT.compile('{{: {x:"test",' +
          'y:{z:{}}} :k => v}}{{=v}}{{break}}{{:}}')({}));
      });
      it('works with old style', function() {
        expect('a1b2c3').to.equal(
          doT.compile('{{:it :y:x}}{{=x}}{{=y}}{{:}}')({
          a: 1,
          b: 2,
          c: 3
        }));
      });
    });
  });

  describe('tags combination', function() {
    it('works', function() {
      doT.templateSettings.with = true;
      var fn = doT.compile('{{ =a }}{{ !b }}{{ ?true }}c{{?}}{{ ~d:x}}' +
        '{{=x}}{{~}}{{ :e:x}}{{=x}}{{:}}{{ var v = f}}{{=v}}');
      doT.templateSettings.with = false;

      expect('abcdef').to.equal(fn({
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
