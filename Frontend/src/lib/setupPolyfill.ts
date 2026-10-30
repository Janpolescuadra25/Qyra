import browserPolyfill from 'webextension-polyfill';

const extensionGlobal = globalThis as typeof globalThis & {
  browser?: typeof browserPolyfill;
  chrome?: typeof chrome;
};

// webextension-polyfill provides a consistent Promise API for new code. The
// callback-compatible `chrome` namespace remains available to legacy Qyra code.
if (!extensionGlobal.browser) extensionGlobal.browser = browserPolyfill;
if (!extensionGlobal.chrome) extensionGlobal.chrome = browserPolyfill as unknown as typeof chrome;
