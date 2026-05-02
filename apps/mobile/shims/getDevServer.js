'use strict';
// Expo Go compat: index.native.js in expo-router does `.default` on this
// module at import time. In some Expo Go environments the native layer returns
// an object instead of a function, crashing with "getDevServer is not a function".
// This shim re-implements the same logic so `.default` is always a callable.

let _cachedDevServerURL;
let _cachedFullBundleURL;
const FALLBACK = 'http://localhost:8081/';

function getDevServer() {
  if (_cachedDevServerURL === undefined) {
    try {
      const NativeModules = require('react-native').NativeModules;
      const scriptURL =
        NativeModules.SourceCode?.scriptURL ??
        NativeModules.RCTSourceCode?.scriptURL ??
        null;
      if (scriptURL) {
        const match = scriptURL.match(/^https?:\/\/.*?\//);
        _cachedDevServerURL = match ? match[0] : null;
        _cachedFullBundleURL = match ? scriptURL : null;
      } else {
        _cachedDevServerURL = null;
        _cachedFullBundleURL = null;
      }
    } catch (_) {
      _cachedDevServerURL = null;
      _cachedFullBundleURL = null;
    }
  }
  return {
    url: _cachedDevServerURL ?? FALLBACK,
    fullBundleUrl: _cachedFullBundleURL,
    bundleLoadedFromServer: _cachedDevServerURL !== null,
  };
}

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = getDevServer;
module.exports = exports;
module.exports.default = getDevServer;
