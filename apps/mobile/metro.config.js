const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Expo Go compat: native layer returns an object for this module rather than a
  // function, causing "getDevServer is not a function" at startup.
  if (moduleName === 'react-native/Libraries/Core/Devtools/getDevServer') {
    return {
      filePath: path.resolve(projectRoot, 'shims/getDevServer.js'),
      type: 'sourceFile',
    };
  }

  // Expo Go compat: @expo/metro-runtime's messageSocket.native.ts runs
  // createWebSocketConnection() at module load time, which crashes in Expo Go's
  // sandbox with "constructor is not callable" (URL/WebSocket not ready). This
  // app has no React Server Components so the RSC hot-reload socket is unused.
  if (
    moduleName === './messageSocket' &&
    context.originModulePath.includes('@expo/metro-runtime')
  ) {
    return {
      filePath: path.resolve(projectRoot, 'shims/messageSocket.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
