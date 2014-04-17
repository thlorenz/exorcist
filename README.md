# exorcist [![build status](https://secure.travis-ci.org/thlorenz/exorcist.png)](http://travis-ci.org/thlorenz/exorcist)

Externalizes the source map found inside a stream to an external `.js.map` file

```js
var browserify = require('browserify')
  , path       = require('path')
  , fs         = require('fs')
  , exorcist   = require('exorcist')
  , mapfile    = path.join(__dirname, 'bundle.js.map')

browserify()
  .require(require.resolve('./main'), { entry: true })
  .bundle({ debug: true })
  .pipe(exorcist(mapfile))
  .pipe(fs.createWriteStream(path.join(__dirname, 'bundle.js'), 'utf8'))
```

### command line example

```
browserify main.js --debug | exorcist bundle.js.map > bundle.js 
```

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Usage](#usage)
- [Installation](#installation)
- [API](#api)
- [Integration with other tools](#integration-with-other-tools)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

```
exorcist <mapfile> <exorcist-options>

  Externalizes the source map of a file that is streamed into it by pointing it's source map url to the <mapfile>.
  The original source map is written to the <mapfile> as json.
  
OPTIONS:

  --root -r   The path to the original source to be included in the source map.   (default '')
  --url  -u   The path to the source map to which to point the sourceMappingURL.  (default <mapfile>)

EXAMPLE:

  Bundle main.js with browserify into bundle.js and externalize the map to bundle.js.map

    browserify main.js --debug | exorcist bundle.js.map > bundle.js 
```

## Installation

    npm install exorcist

## API


<!-- START docme generated API please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN docme TO UPDATE -->

<div>
<div class="jsdoc-githubify">
<section>
<article>
<div class="container-overview">
<dl class="details">
</dl>
</div>
<dl>
<dt>
<h4 class="name" id="exorcist"><span class="type-signature"></span>exorcist<span class="signature">(file, <span class="optional">url</span>, <span class="optional">root</span>)</span><span class="type-signature"> &rarr; {TransformStream}</span></h4>
</dt>
<dd>
<div class="description">
<p>Transforms the incoming stream of code by removing the inlined source map and writing it to an external map file.
Additionally it adds a source map url that points to the extracted map file.</p>
<h4>Events (other than all stream events like <code>error</code>)</h4>
<ul>
<li><code>missing-map</code> emitted if no map was found in the stream (the src still is piped through in this case, but no map file is written)</li>
</ul>
</div>
<h5>Parameters:</h5>
<table class="params">
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th>Argument</th>
<th class="last">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td class="name"><code>file</code></td>
<td class="type">
<span class="param-type">String</span>
</td>
<td class="attributes">
</td>
<td class="description last"><p>full path to the map file to which to write the extracted source map</p></td>
</tr>
<tr>
<td class="name"><code>url</code></td>
<td class="type">
<span class="param-type">String</span>
</td>
<td class="attributes">
&lt;optional><br>
</td>
<td class="description last"><p>allows overriding the url at which the map file is found (default: name of map file)</p></td>
</tr>
<tr>
<td class="name"><code>root</code></td>
<td class="type">
<span class="param-type">String</span>
</td>
<td class="attributes">
&lt;optional><br>
</td>
<td class="description last"><p>allows adjusting the source maps <code>sourceRoot</code> field (default: '')</p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/thlorenz/exorcist/blob/master/index.js">index.js</a>
<span>, </span>
<a href="https://github.com/thlorenz/exorcist/blob/master/index.js#L27">lineno 27</a>
</li>
</ul></dd>
</dl>
<h5>Returns:</h5>
<div class="param-desc">
<p>transform stream into which to pipe the code containing the source map</p>
</div>
<dl>
<dt>
Type
</dt>
<dd>
<span class="param-type">TransformStream</span>
</dd>
</dl>
</dd>
</dl>
</article>
</section>
</div>

*generated with [docme](https://github.com/thlorenz/docme)*
</div>
<!-- END docme generated API please keep comment here to allow auto update -->

## Integration with other tools

- [using exorcist with gulp](https://github.com/thlorenz/exorcist/wiki/Recipes#gulp)

## License

MIT
