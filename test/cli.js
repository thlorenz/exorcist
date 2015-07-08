'use strict';
/*jshint asi: true */

var spawn    = require('child_process').spawn
var test     = require('tap').test
var fs       = require('fs')
var path     = require('path')

var binPath       = path.resolve(__dirname + '/../bin/exorcist.js');
var fixtures      = __dirname + '/fixtures';
var scriptMapfile = fixtures + '/bundle.js.map';
var styleMapfile  = fixtures + '/to.css.map';
var jsOutputFile  = fixtures + '/bundle-cleaned.js'

// This base path is baken into the source maps in the fixtures.
var base = '/Users/thlorenz/dev/projects/exorcist';

function cleanup() {
  if (fs.existsSync(scriptMapfile)) fs.unlinkSync(scriptMapfile);
  if (fs.existsSync(styleMapfile)) fs.unlinkSync(styleMapfile);
  if (fs.existsSync(jsOutputFile)) fs.unlinkSync(jsOutputFile);
}

function exorcist(inputFile, scriptMapfile, outputFile) {
  var exorcistProcess = spawn(process.execPath, [binPath, scriptMapfile, outputFile], {stdio:'pipe'})
  fs.createReadStream(inputFile).pipe(exorcistProcess.stdin)
  return exorcistProcess
}

test('\nwhen output file is not provided, outputs to stdout', function (t) {
  t.on('end', cleanup);

  var data = ''
  var inputFile = fixtures + '/bundle.js'

  exorcist(inputFile, scriptMapfile, '')
    .on('close', function(){

      t.equal(fs.existsSync(jsOutputFile), false, 'output file must not exist')
      t.equal(fs.existsSync(scriptMapfile), true, 'output file must exist')

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
      t.equal(map.sourceRoot, '', 'leaves source root an empty string')

      t.end()

    }).stdout.on('data', function(d){
      data += d+'';
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
      t.equal(lines.pop(), '//# sourceMappingURL=bundle.js.map', 'last line as source map url pointing to .js.map file')

      var map = JSON.parse(fs.readFileSync(scriptMapfile, 'utf8'));
      t.equal(map.file, 'generated.js', 'leaves file name unchanged')
      t.equal(map.sources.length, 4, 'maps 4 source files')
      t.equal(map.sources[0].indexOf(base), 0, 'uses absolute source paths')
      t.equal(map.sourcesContent.length, 4, 'includes 4 source contents')
      t.equal(map.mappings.length, 106, 'maintains mappings')
      t.equal(map.sourceRoot, '', 'leaves source root an empty string')

      t.end()

    })
})
