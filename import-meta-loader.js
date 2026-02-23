/**
 * Webpack loader that replaces import.meta with a safe polyfill object.
 * Needed because Cesium 1.138+ uses import.meta which crashes in non-module scripts.
 */
module.exports = function importMetaLoader(source) {
  // Replace import.meta.url with window.location.href (or CESIUM_BASE_URL for Cesium)
  // Replace import.meta.env with a safe empty object
  // Replace standalone import.meta with a polyfill object
  return source
    .replace(/import\.meta\.url/g, '(window.CESIUM_BASE_URL || window.location.href)')
    .replace(/import\.meta\.env/g, '({})')
    .replace(/import\.meta/g, '({ url: window.CESIUM_BASE_URL || window.location.href })');
};
