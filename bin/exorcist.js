#!/usr/bin/env node
'use strict';

var minimist = require('minimist')
  , fs       = require('fs')
  , path     = require('path')
  , exorcist = require('../')
  ;

function onerror(err) {
  console.error(err.toString());
  process.exit(err.errno || 1);
}

function usage() {
  var usageFile = path.join(__dirname, 'usage.txt');
  fs.createReadStream(usageFile).pipe(process.stdout);
  return;
}

(function damnYouEsprima() {

var argv = minimist(process.argv.slice(2)
  , { boolean: [ 'h', 'help', 'e', 'error-on-missing' ]
    , string: [ 'url', 'u', 'root', 'r', 'base', 'b' ]
  });

if (argv.h || argv.help) return usage();


var mapfile = argv._.shift();
if (!mapfile) {
  console.error('Missing map file');
  return usage();
}

var url            = argv.url            || argv.u
  , root           = argv.root           || argv.r
  , base           = argv.base           || argv.b
  , errorOnMissing = argv.errorOnMissing || argv.e || argv['error-on-missing'];

mapfile = path.resolve(mapfile);

process.stdin
  .pipe(exorcist(mapfile, url, root, base, errorOnMissing))
  .on('error', onerror)
  .on('missing-map', console.error.bind(console))
  .pipe(process.stdout);

})()
