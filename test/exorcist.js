'use strict';
/*jshint asi: true */

var test     = require('tap').test
var fs       = require('fs');
var through  = require('through2');
var proxyquire = require('proxyquire');
var exorcist = require('../')

var fixtures = __dirname + '/fixtures';
var scriptMapfile = fixtures + '/bundle.js.map';
var styleMapfile = fixtures + '/to.css.map';

// This base path is baken into the source maps in the fixtures.
var base = '/Users/thlorenz/dev/projects/exorcist';

function cleanup() {
  if (fs.existsSync(scriptMapfile)) fs.unlinkSync(scriptMapfile);
  if (fs.existsSync(styleMapfile)) fs.unlinkSync(styleMapfile);
}


test('\nwhen piping a bundle generated with browserify through exorcist without adjusting properties', function (t) {
  t.on('end', cleanup);
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(scriptMapfile))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=bundle.js.map', 'last line as source map url pointing to .js.map file')

      var map = JSON.parse(fs.readFileSync(scriptMapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sources[0].indexOf(base), 0, 'uses absolute source paths')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, '', 'if source root missing, use empty string')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify through exorcist and adjusting url', function (t) {
  t.on('end', cleanup);
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(scriptMapfile, 'http://my.awseome.site/bundle.js.map'))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=http://my.awseome.site/bundle.js.map', 'last line as source map url pointing to .js.map file at url set to supplied url')

      var map = JSON.parse(fs.readFileSync(scriptMapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, '', 'if source root missing, use empty string')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify through exorcist and adjusting root and url', function (t) {
  t.on('end', cleanup);
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(scriptMapfile, 'http://my.awseome.site/bundle.js.map', 'http://my.awesome.site/src'))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=http://my.awseome.site/bundle.js.map', 'last line as source map url pointing to .js.map file at url set to supplied url')

      var map = JSON.parse(fs.readFileSync(scriptMapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, 'http://my.awesome.site/src', 'adapts source root')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify through exorcist and adjusting root, url, and base', function (t) {
  t.on('end', cleanup);
  var data = ''
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(scriptMapfile, 'http://my.awseome.site/bundle.js.map', 'http://my.awesome.site/src', base))
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      lines.pop(); // Trailing newline
      t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
      t.equal(lines.pop(), '//# sourceMappingURL=http://my.awseome.site/bundle.js.map', 'last line as source map url pointing to .js.map file at url set to supplied url')

      var map = JSON.parse(fs.readFileSync(scriptMapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sources[0].indexOf(base), -1, 'uses relative source paths')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, 'http://my.awesome.site/src', 'adapts source root')

      cb();
      t.end()
    }
})

test('\nwhen piping a bundle generated with browserify to a map file in a directory that does not exist', function (t) {
  t.on('end', cleanup);
  var badPathScriptMapfile = fixtures + '/noexists/bundle.js.map';
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(badPathScriptMapfile))
    .on('error', t.end)
    .on('end', function () {
      var map = JSON.parse(fs.readFileSync(badPathScriptMapfile, 'utf8'));
      t.ok(map);
      fs.unlinkSync(badPathScriptMapfile);
      t.end();
    })
})

test('\nwhen piping a bundle generated with browserify and the write fails', function (t) {
  t.on('end', cleanup);
  var expectedErr = new Error('File write failed')
  var ex = proxyquire('../', {
    fs: {
      writeFile: function (file, content, enc, callback) {
        callback(expectedErr)
      }
    }
  })
  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(ex(scriptMapfile))
    .on('error', function (err) {
      t.equal(err, expectedErr)
      t.end();
    })
})

test('\nwhen piping a bundle generated with browserify thats missing a map through exorcist and errorOnMissing is truthy' , function (t) {
  t.on('end', cleanup);
  var data = ''
  fs.createReadStream(fixtures + '/bundle.nomap.js')
    .pipe(exorcist(scriptMapfile, undefined, undefined, undefined, true))
    .on('error', onerror);

  function onerror(err) {
    t.type(err, 'Error');
    t.end();
  }
})

test('\nwhen piping a bundle generated with browserify thats missing a map through exorcist and errorOnMissing is falsey' , function (t) {
  t.on('end', cleanup);
  var data = ''
  var missingMapEmitted = false;
  fs.createReadStream(fixtures + '/bundle.nomap.js')
    .pipe(exorcist(scriptMapfile))
    .on('missing-map', function () { missingMapEmitted = true })
    .pipe(through(onread, onflush));

    function onread(d, _, cb) { data += d; cb(); }

    function onflush(cb) {
      var lines = data.split('\n')
      t.equal(lines.length, 25, 'pipes entire bundle including prelude')
      t.ok(missingMapEmitted, 'emits missing-map event')

      cb();
      t.end()
    }
})

test('\nwhen performing a stylish exorcism', function (t) {
  t.on('end', cleanup);
  var data = ''
  fs.createReadStream(fixtures + '/to.css')
    .pipe(exorcist(styleMapfile))
    .pipe(through(onread, onflush));

  function onread(d, _, cb) { data += d; cb(); }

  function onflush(cb) {
    var lines = data.split('\n')
    t.equal(lines.length, 22, 'pipes entire style including prelude, sources and source map url')
    t.equal(lines.pop(), '/*# sourceMappingURL=to.css.map */', 'last line as source map url pointing to .css.map file')

    var map = JSON.parse(fs.readFileSync(styleMapfile, 'utf8'));
    t.equal(map.file, 'to.css', 'leaves file name unchanged')
    t.equal(map.sources.length, 2, 'maps 4 source files')
    t.equal(map.sourcesContent.length, 2, 'includes 4 source contents')
    t.equal(map.mappings.length, 214, 'maintains mappings')
    t.equal(map.sourceRoot, '', 'if source root missing, use empty string')

    cb();
    t.end();
  }
})

test('\nwhen piping a bundle generated with browserify with preexisting source root', function(t) {
  t.on('end', cleanup);

  fs.createReadStream(fixtures + '/bundle.withroot.js')
    .pipe(exorcist(scriptMapfile))
    .pipe(through(onread, onflush));

    function onread(_, __, cb) { cb(); }

    function onflush(cb) {
      var map = JSON.parse(fs.readFileSync(scriptMapfile, 'utf8'));
      t.equal(map.sourceRoot, base, 'leaves source root value in place')

      cb();
      t.end();
    }
});

test('\nwhen piping a bundle generated with browserify through exorcist without adjusting properties and sending source map to stream', function (t) {
  t.on('end', cleanup);
  var data = ''
  var map = ''

  fs.createReadStream(fixtures + '/bundle.js')
    .pipe(exorcist(through(onreadMap, onflushMap), 'bundle.js.map'))
    .pipe(through(onread, onflush));

  function onread(d, _, cb) { data += d; cb(); }

  function onflush(cb) {
    var lines = data.split('\n')
    lines.pop(); // Trailing newline
    t.equal(lines.length, 25, 'pipes entire bundle including prelude, sources and source map url')
    t.equal(lines.pop(), '//# sourceMappingURL=bundle.js.map', 'last line as source map url pointing to .js.map file')

    cb();
    t.end()
  }

  function onreadMap(d, _, cb) { map += d; cb(); }

  function onflushMap(cb) {
    map = JSON.parse(map);
    t.equal(map.file, 'generated.js', 'leaves file name unchanged')
    t.equal(map.sources.length, 4, 'maps 4 source files')
    t.equal(map.sources[0].indexOf(base), 0, 'uses absolute source paths')
    t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
    t.equal(map.mappings.length, 106, 'maintains mappings')
    t.equal(map.sourceRoot, '', 'leaves source root an empty string')

    cb();
  }

})

test('\nwhen piping a browserify bundle thru exorcist sending source map to a stream with missing required url', function (t) {
  t.on('end', cleanup);

  var exorcistStream =
    exorcist(through(onread)) // this is missing the URL as second argument
      .on('error', function (err) {
        t.ok(/map file URL is required/.test(err.message));
        t.end();
      })
      .on('end', function () {
        t.fail('should have emitted an error about missing url');
      });

  fs.createReadStream(fixtures + '/bundle.js').pipe(exorcistStream);

  function onread(d, _, cb) { cb(); }
})
