'use strict';

var mold = require('mold-source-map')
  , path = require('path')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , isStream = require('is-stream')
  , fs = require('fs');

function separate(src, url, root, base) {
  src.sourceRoot(root || src.sourcemap.getProperty('sourceRoot') || '');
  if (base) {
    src.mapSources(mold.mapPathRelativeTo(base));
  }

  var json = src.toJSON(2);

  var comment = '';
  var commentRx = /^\s*\/(\/|\*)[@#]\s+sourceMappingURL/mg;
  var commentMatch = commentRx.exec(src.source);
  var commentBlock = (commentMatch && commentMatch[1] === '*');

  if (commentBlock) {
    comment = '/*# sourceMappingURL=' + url + ' */';
  } else {
    comment = '//# sourceMappingURL=' + url;
  }

  return { json: json, comment: comment }
}

var go = module.exports =

/**
 *
 * Externalizes the source map of the file streamed in.
 *
 * The source map is written as JSON to `file`, and the original file is streamed out with its
 * `sourceMappingURL` set to the path of `file` (or to the value of `url`).
 *
 * #### Events (in addition to stream events)
 *
 * - `missing-map` emitted if no map was found in the stream and errorOnMissing is falsey
 *   (the src is still piped through in this case, but no map file is written)
 *
 * @name exorcist
 * @function
 * @param {String|Object} input file path or writable stream where the source map will be written
 * @param {String=} url full URL to the map file, set as `sourceMappingURL` in the streaming output (default: file)
 * @param {String=} root root URL for loading relative source paths, set as `sourceRoot` in the source map (default: '')
 * @param {String=} base base path for calculating relative source paths (default: use absolute paths)
 * @param {Boolean=} errorOnMissing when truthy, causes 'error' to be emitted instead of 'missing-map' if no map was found in the stream (default: falsey)
 * @return {TransformStream} transform stream into which to pipe the code containing the source map
 */

function exorcist(input, url, root, base, errorOnMissing) {
  var missingMapMsg = "The code that you piped into exorcist contains no source map!";

  var stream = mold.transform(function(src, write) {
    if (!src.sourcemap) {
      if (errorOnMissing) return stream.emit('error', new Error(missingMapMsg));
      stream.emit(
        'missing-map'
        ,   missingMapMsg + '\n'
          + 'Therefore it was piped through as is and no external map file generated.'
      );
      return write(src.source);
    }

    if (isStream(input) && isStream.writable(stream)) {
      return stream.emit('error', new Error('Must provide a writable stream'));
    }

    if (isStream(input) && typeof url !== 'string') {
      return stream.emit('error', new Error('map file URL is required when using stream output'));
    }

    url = url || path.basename(input)
    var separated = separate(src, url, root, base);

    if (isStream(input)) {
      return input.end(separated.json, 'utf8', done);
    }

    mkdirp(path.dirname(input), function (err) {
      if (err) return done(err);
      fs.writeFile(input, separated.json, 'utf8', done);
    });

    function done(err) {
      if (err) return stream.emit('error', err);
      write(separated.comment);
    }
  });

  return stream;
}
