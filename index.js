'use strict';

var convert = require('convert-source-map')
  , path = require('path')
  , fs = require('fs')
  , through = require('through2');

function separate(src, file, root, url) {
  var inlined = convert.fromSource(src);

  if (!inlined) return null;

  var json = inlined
    .setProperty('sourceRoot', root || '')
    .toJSON(2);

  if ( !url ) {
    if ( typeof file === 'string' ) {
      url = path.basename(file);
    } else {
      throw new Error("exorcist: url argument must be passed if file is not a file path string");
    }
  }

  var newSrc = convert.removeComments(src);
  var comment = '//# sourceMappingURL=' + url;

  return { json: json, src: newSrc + '\n' + comment }
}

var go = module.exports =

/**
 * Transforms the incoming stream of code by removing the inlined source map and writing it to an external map file.
 * Additionally it adds a source map url that points to the extracted map file.
 *
 * #### Events (other than all stream events like `error`)
 *
 *  - `missing-map` emitted if no map was found in the stream (the src still is piped through in this case, but no map file is written)
 *
 * @name exorcist
 * @function
 * @param {String} file full path to the map file to which to write the extracted source map
 * @param {String=} url  allows overriding the url at which the map file is found (default: name of map file)
 * @param {String=} root allows adjusting the source maps `sourceRoot` field (default: '')
 * @return {TransformStream} transform stream into which to pipe the code containing the source map
 */
function exorcist(file, url, root) {
  var src = '';

  function ondata(d, _, cb) { src += d; cb(); }
  function onend(cb) {
    var self = this,
        separated;
    try {
      separated = separate(src, file, root, url);
    } catch (err) {
      self.emit('error', err);
      return cb();
    }
    if (!separated) {
      self.emit(
          'missing-map'
        ,   'The code that you piped into exorcist contains no source map!\n'
          + 'Therefore it was piped through as is and no external map file generated.'
      );
      self.push(src);
      return cb();
    }
    self.push(separated.src);

    if ( typeof file === 'object' && typeof file.write === 'function' && typeof file.end === 'function' && typeof file.on === 'function' ) {
      // Does it look like a writableStream? If so, pipe data into it and end the stream.
      file.on('error', function(err) {
        self.emit('error', err);
        cb();
        // Make sure we only run the callback once
        cb = function() {};
      });
      file.end(separated.json, 'utf8', function() {
        cb();
        // Make sure we only run the callback once
        cb = function() {};
      });
    } else if ( typeof file === 'string' ) {
      // If it's a string, consider it a filename and then write to the file
      fs.writeFile(file, separated.json, 'utf8', function(err) {
        if ( err ) {
          self.emit('error', err);
        }
        cb();
      });
    } else {
      self.emit('error', new Error('The file given to exorcist was an unknown type.'));
      cb();
    }
  }

  return through(ondata, onend);
}
