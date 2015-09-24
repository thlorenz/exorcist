'use strict';

var mold = require('mold-source-map')
  , path = require('path')
  , fs = require('fs');

function separate(src, url, root, base) {
  src.sourceRoot(root || '');
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
 * - `missing-map` emitted if no map was found in the stream
 *   (the src is still piped through in this case, but no map file is written)
 *
 * @name exorcist
 * @function
 * @param {String|Object} fileOrStream full path to the map file to which to write the extracted source map
 *                        or Stream to write source map to (must provide url when providing a stream)
 * @param {String=} url full URL to the map file, set as `sourceMappingURL` in the streaming output (default: file)
 * @param {String=} root root URL for loading relative source paths, set as `sourceRoot` in the source map (default: '')
 * @param {String=} base base path for calculating relative source paths (default: use absolute paths)
 * @return {TransformStream} transform stream into which to pipe the code containing the source map
 */
function exorcist(fileOrStream, url, root, base) {
  var stream = mold.transform(function(src, write) {
    if (!src.sourcemap) {
      stream.emit(
        'missing-map'
        ,   'The code that you piped into exorcist contains no source map!\n'
          + 'Therefore it was piped through as is and no external map file generated.'
      );
      return write(src.source);
    }

    if ('object' === typeof fileOrStream && 'string' !== typeof url) {
      stream.emit('error', new Error('When specifying a stream to write source map to you must specify a url.'));
      return;
    }

    url = url || path.basename(fileOrStream)
    var separated = separate(src, url, root, base);

    if ('object' === typeof fileOrStream) {
      fileOrStream.end(separated.json, 'utf8', done);
    } else {
      fs.writeFile(fileOrStream, separated.json, 'utf8', done);
    }
    
    function done(error) {
      if (error) {
        stream.emit('error', error);
        return;
      }
      write(separated.comment);
    }
  });

  return stream;
}
