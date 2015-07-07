'use strict';
/*jshint asi: true */

var spawn    = require('child_process').spawn
var test     = require('tap').test
var fs       = require('fs')

var binPath       = path.resolve(__dirname + '../bin/exorcist.js');
var fixtures      = __dirname + '/fixtures';
var scriptMapfile = fixtures + '/bundle.js.map';
var styleMapfile  = fixtures + '/to.css.map';


function cleanup() {
  if (fs.existsSync(scriptMapfile)) fs.unlinkSync(scriptMapfile);
  if (fs.existsSync(styleMapfile)) fs.unlinkSync(styleMapfile);
}

function exorcist(inputFile, scriptMapfile, outputFile) {
  var exorcistProcess = spawn(process.execPath, [binPath, scriptMapfile, outputFile])
  fs.createReadStream(inputFile).pipe(exorcistProcess.stdin)
  return exorcistProcess
}

test('\nwhen output file is not provided, outputs to stdout', function (t) {
  t.on('end', cleanup);

  var data = ''
  exorcist(fixtures + '/bundle.js', scriptMapfile)
    .on('data', function(d){
      data += d+'';
    })
    .on('close', function(){

      t.equal(fs.existsSync(outputFile), false, 'output file must not exist')
      t.equal(fs.existsSync(scriptMapfile), true, 'output file must exist')

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

      t.end()

    })
})

test('\nwhen output file is provided, outputs to a file', function (t) {
  t.on('end', cleanup);

  var outputFile = fixtures + '/bundle-cleaned.js';
  exorcist(fixtures + '/bundle.js', scriptMapfile, outputFile)
    .on('close', function(){

      t.equal(fs.existsSync(outputFile), true, 'output file must exist')
      t.equal(fs.existsSync(scriptMapfile), true, 'output file must exist')

      var lines = fs.readFileSync(outputFile).toString().split('\n')
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

      t.end()

    })
})
