'use strict';
// Expo Go compat shim for react-native/Libraries/Core/Devtools/getDevServer.
//
// expo-router v6 does `.default` on this module at import time. In some Expo Go
// environments the native layer returns an object instead of a function, so we
// replace the whole module with a shim whose `.default` is always a callable.
//
// We mirror the original logic exactly: use NativeSourceCode.getConstants()
// (the TurboModule path, correct for RN 0.76+) rather than the old bridge
// NativeModules.SourceCode.scriptURL. Without this, @expo/metro-runtime's
// messageSocket throws "Cannot create devtools websocket connections in
// embedded environments" because bundleLoadedFromServer returns false.

let _cachedDevServerURL;
let _cachedFullBundleURL;
const FALLBACK = 'http://localhost:8081/';

function getDevServer() {
  if (_cachedDevServerURL === undefined) {
    try {
      // Same access pattern as the original getDevServer.js in react-native.
      const NativeSourceCode = require('react-native/Libraries/NativeModules/specs/NativeSourceCode');
      // Handle both ES-module (has .default) and CommonJS shapes.
      const ns = (NativeSourceCode && NativeSourceCode.default) || NativeSourceCode;
      const scriptURL = ns && (ns.getConstants ? ns.getConstants().scriptURL : ns.scriptURL);
      if (scriptURL) {
        const match = String(scriptURL).match(/^https?:\/\/.*?\//);
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
    url: _cachedDevServerURL != null ? _cachedDevServerURL : FALLBACK,
    fullBundleUrl: _cachedFullBundleURL,
    bundleLoadedFromServer: _cachedDevServerURL !== null,
  };
}

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = getDevServer;
module.exports = exports;
module.exports.default = getDevServer;
