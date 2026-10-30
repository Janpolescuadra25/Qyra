import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('cross-browser extension API facade', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {
        runtime: { lastError: undefined },
        storage: {
          local: {
            get: vi.fn((_key: string, callback: (result: Record<string, unknown>) => void) => callback({ sample: 'value' })),
            set: vi.fn((_value: Record<string, unknown>, callback: () => void) => callback()),
          },
        },
      },
    });
  });

  it('detects supported vendors from user-agent strings', async () => {
    const { detectBrowserVendor } = await import('../browser');
    expect(detectBrowserVendor('Mozilla/5.0 Firefox/128.0')).toBe('firefox');
    expect(detectBrowserVendor('Mozilla/5.0 Edg/130.0')).toBe('edge');
    expect(detectBrowserVendor('Mozilla/5.0 Chrome/130.0 Safari/537.36')).toBe('chrome');
    expect(detectBrowserVendor('Mozilla/5.0 Version/17.0 Safari/605.1.15')).toBe('safari');
  });

  it('reads and writes extension storage through the facade', async () => {
    const { getStorageItem, setStorageItem } = await import('../browser');
    await expect(getStorageItem<string>('sample')).resolves.toBe('value');
    await expect(setStorageItem('sample', 'next')).resolves.toBeUndefined();
  });

  it('returns unknown when no recognized browser token exists', async () => {
    const { detectBrowserVendor } = await import('../browser');
    expect(detectBrowserVendor('Qyra-Test-Agent')).toBe('unknown');
  });
});
