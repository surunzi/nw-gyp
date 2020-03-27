/* eslint-disable node/no-deprecated-api */

'use strict'

const semver = require('semver')
const url = require('url')
const path = require('path')
const log = require('npmlog')

// Captures all the logic required to determine download URLs, local directory and
// file names. Inputs come from command-line switches (--target, --dist-url),
// `process.version` and `process.release` where it exists.
function processRelease (argv, gyp) {
  var version = (semver.valid(argv[0]) && argv[0]) || gyp.opts.target
  var versionSemver = semver.parse(version)
  var overrideDistUrl = gyp.opts['dist-url'] || gyp.opts.disturl
  var distBaseUrl
  var baseUrl
  var libUrl32
  var libUrl64
  var nodeLibUrl32
  var nodeLibUrl64
  var tarballUrl

  if (!versionSemver) {
    // not a valid semver string, nothing we can do
    return { version: version }
  }
  // flatten version into String
  version = versionSemver.version

  // nw-gyp: `overrideDistUrl` should be redirected to NW.js by default
  if (!overrideDistUrl) {
    overrideDistUrl = 'http://node-webkit.s3.amazonaws.com'
  }

  if (overrideDistUrl) {
    log.verbose('download', 'using dist-url', overrideDistUrl)
  }

  distBaseUrl = overrideDistUrl.replace(/\/+$/, '')
  distBaseUrl += '/v' + version + '/'

  baseUrl = distBaseUrl
  nodeLibUrl32 = resolveLibUrl('node', baseUrl, 'ia32')
  nodeLibUrl64 = resolveLibUrl('node', baseUrl, 'x64')
  libUrl32 = resolveLibUrl('nw', baseUrl, 'ia32')
  libUrl64 = resolveLibUrl('nw', baseUrl, 'x64')
  tarballUrl = url.resolve(baseUrl, 'nw-headers-v' + version + '.tar.gz')

  return {
    version: version,
    semver: versionSemver,
    name: 'nw',
    baseUrl: baseUrl,
    tarballUrl: tarballUrl,
    shasumsUrl: url.resolve(baseUrl, 'SHASUMS256.txt'),
    versionDir: version,
    ia32: {
      libUrl: libUrl32,
      nodeLibUrl: nodeLibUrl32,
      libPath: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl32).path)),
      nodeLibPath: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(nodeLibUrl32).path))
    },
    x64: {
      libUrl: libUrl64,
      nodeLibUrl: nodeLibUrl64,
      libPath: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl64).path)),
      nodeLibPath: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(nodeLibUrl64).path))
    }
  }
}

function normalizePath (p) {
  return path.normalize(p).replace(/\\/g, '/')
}

function resolveLibUrl (name, defaultUrl, arch) {
  if (arch === 'ia32') {
    return url.resolve(defaultUrl, name + '.lib')
  } else {
    return url.resolve(defaultUrl, arch + '/' + name + '.lib')
  }
}

module.exports = processRelease
