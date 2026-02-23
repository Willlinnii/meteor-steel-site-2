const webpack = require('webpack');

module.exports = function override(config) {
  // Cesium 1.138+ uses import.meta which CRA's webpack config doesn't handle.
  // Replace the standalone import.meta references so they don't crash at runtime.
  config.plugins.push(
    new webpack.DefinePlugin({
      CESIUM_BASE_URL: JSON.stringify('/cesium'),
    })
  );

  // Tell webpack to treat import.meta as a global-like expression
  // instead of failing on it in non-module scripts.
  config.module = config.module || {};
  config.module.parser = {
    ...config.module.parser,
    javascript: {
      ...config.module.parser?.javascript,
      importMeta: false,
    },
  };

  return config;
};
