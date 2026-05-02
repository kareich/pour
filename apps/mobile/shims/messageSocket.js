'use strict';
// No-op shim for @expo/metro-runtime's messageSocket module.
// The real module opens a WebSocket to Metro for RSC hot-reload — this app has
// no React Server Components, and Expo Go's sandbox blocks WebSocket/URL
// constructors before the JS runtime is ready, crashing startup.
module.exports = { connect: function () {} };
