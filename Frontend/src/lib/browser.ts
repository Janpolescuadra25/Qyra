/**
 * Cross-browser WebExtension API facade.
 *
 * Qyra retains the callback-compatible API surface used by its existing
 * Chrome implementation while resolving the equivalent namespace exposed by
 * Firefox and Safari. The build injects setupPolyfill.ts in every bundle.
 */

type BrowserApi = typeof chrome;

const extensionGlobal = globalThis as typeof globalThis & {
  browser?: BrowserApi;
  chrome?: BrowserApi;
};

export const browser: BrowserApi = new Proxy({} as BrowserApi, {
  get(_target, property) {
    const activeApi = extensionGlobal.chrome ?? extensionGlobal.browser;
    return activeApi?.[property as keyof BrowserApi];
  },
});

export type BrowserVendor = 'chrome' | 'firefox' | 'edge' | 'safari' | 'unknown';

export function detectBrowserVendor(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent): BrowserVendor {
  const normalized = userAgent.toLowerCase();
  if (normalized.includes('edg/')) return 'edge';
  if (normalized.includes('firefox/') || normalized.includes('fxios/')) return 'firefox';
  if (normalized.includes('safari/') && !normalized.includes('chrome/') && !normalized.includes('chromium/')) return 'safari';
  if (normalized.includes('chrome/') || normalized.includes('chromium/')) return 'chrome';
  return 'unknown';
}

export function getStorageItem<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    if (!browser.storage?.local) return resolve(null);
    browser.storage.local.get(key, (result) => resolve((result[key] as T | undefined) ?? null));
  });
}

export function setStorageItem<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!browser.storage?.local) return resolve();
    browser.storage.local.set({ [key]: value }, () => {
      const error = browser.runtime?.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

export default browser;
