const webpack = require('webpack');

module.exports = function override(config) {
  // Cesium 1.138+ uses import.meta which breaks at runtime in non-module scripts.
  // Use BannerPlugin to inject a polyfill at the top of the problematic chunk,
  // and use module.parser to prevent webpack from choking on it during compilation.

  config.plugins.push(
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify('/cesium'),
    })
  );

  // Add a loader that replaces `import.meta` with a safe object in cesium files
  config.module.rules.push({
    test: /\.js$/,
    include: /node_modules[\\/](cesium|@cesium|@zip\.js|zustand)/,
    loader: require.resolve('./import-meta-loader.js'),
  });

  return config;
};
