'use strict';
// Expo Go compat shim for react-native/Libraries/Core/Devtools/getDevServer.
//
// Two consumers with different require shapes must both work:
//   1. expo-router/build/getDevServer/index.native.js:
//        exports.getDevServer = require('...getDevServer').default   ← needs .default
//   2. @expo/metro-runtime/src/messageSocket.native.ts:
//        const getDevServer = require('...getDevServer');
//        const devServer = getDevServer();                           ← needs direct call
//
// Solution: export the function as module.exports (satisfies case 2)
// AND attach .default to the function object (satisfies case 1).
// Functions are objects in JS so property assignment is safe.
//
// NativeSourceCode access: use getConstants() (TurboModule path, RN 0.76+).
// Deep-import deprecation warning is harmless — it still resolves at runtime.

let _cachedDevServerURL;
let _cachedFullBundleURL;
const FALLBACK = 'http://localhost:8081/';

function getDevServer() {
  if (_cachedDevServerURL === undefined) {
    try {
      const NativeSourceCode = require('react-native/Libraries/NativeModules/specs/NativeSourceCode');
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

// Export as a callable default AND expose .default for ES-module consumers.
getDevServer.default = getDevServer;
module.exports = getDevServer;
