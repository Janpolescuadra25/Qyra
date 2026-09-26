import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScanProvider, STORAGE_KEY, useScanContext, type ScanContextState } from '../ScanContext';
import type { ScanEntry } from '../../../types';

const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
};

let latestContext: ScanContextState | null = null;
let root: Root | null = null;

function TestHarness() {
  latestContext = useScanContext();
  return null;
}

const renderProvider = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(
      <ScanProvider>
        <TestHarness />
      </ScanProvider>,
    );
  });
};

beforeEach(() => {
  vi.stubGlobal('chrome', {
    storage: {
      local: mockStorage,
    },
  });

  mockStorage.get.mockImplementation((_keys: unknown, callback: (result: Record<string, unknown>) => void) => {
    callback({});
  });
  mockStorage.set.mockImplementation(() => undefined);
  mockStorage.remove.mockImplementation(() => undefined);
  latestContext = null;
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  document.body.innerHTML = '';
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('ScanContext queue state management', () => {
  it('starts with an empty queue and zero batch progress', () => {
    renderProvider();

    expect(latestContext).not.toBeNull();
    expect(latestContext!.scanEntries).toEqual([]);
    expect(latestContext!.isBatchProcessing).toBe(false);
    expect(latestContext!.batchProgress).toBe(0);
  });

  it('enqueues multiple entries with queued status', () => {
    renderProvider();

    const newEntries: Partial<ScanEntry>[] = [
      { id: 'entry-1', source: 'pos', header: { vendor: 'Acme' }, lineItems: [{ description: 'Paper' }], fileName: 'invoice-1.pdf', fileSize: 1234 },
      { id: 'entry-2', source: 'excel', header: { payee: 'Contoso' }, lineItems: [{ description: 'Ink' }], fileName: 'invoice-2.pdf', fileSize: 4567 },
    ];

    act(() => {
      latestContext!.enqueueScanEntries(newEntries);
    });

    expect(latestContext!.scanEntries).toHaveLength(2);
    expect(latestContext!.scanEntries[0]).toMatchObject({ id: 'entry-1', queueStatus: 'queued', fileName: 'invoice-1.pdf' });
    expect(latestContext!.scanEntries[1]).toMatchObject({ id: 'entry-2', queueStatus: 'queued', fileName: 'invoice-2.pdf' });
  });

  it('updates queue status and stores an error timestamp for failed items', () => {
    renderProvider();

    act(() => {
      latestContext!.enqueueScanEntries([{ id: 'entry-3', source: 'image', header: {}, lineItems: [] }]);
    });

    act(() => {
      latestContext!.updateQueueStatus('entry-3', 'scanning');
    });
    expect(latestContext!.scanEntries[0].queueStatus).toBe('scanning');
    expect(latestContext!.scanEntries[0].processedAt).toBeDefined();

    act(() => {
      latestContext!.updateQueueStatus('entry-3', 'failed', 'OCR failed');
    });

    expect(latestContext!.scanEntries[0].queueStatus).toBe('failed');
    expect(latestContext!.scanEntries[0].error).toBe('OCR failed');
    expect(latestContext!.scanEntries[0].processedAt).toBeDefined();
  });

  it('removes a specific queue entry', () => {
    renderProvider();

    act(() => {
      latestContext!.enqueueScanEntries([
        { id: 'keep', source: 'pos', header: {}, lineItems: [] },
        { id: 'remove-me', source: 'excel', header: {}, lineItems: [] },
      ]);
    });

    act(() => {
      latestContext!.removeQueueEntry('remove-me');
    });

    expect(latestContext!.scanEntries.map((entry) => entry.id)).toEqual(['keep']);
  });

  it('persists updated scan entries to chrome.storage.local', async () => {
    renderProvider();

    await act(async () => {
      latestContext!.enqueueScanEntries([{ id: 'persisted-entry', source: 'pos', header: {}, lineItems: [] }]);
      await Promise.resolve();
    });

    expect(mockStorage.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [STORAGE_KEY]: expect.objectContaining({
          scanEntries: expect.arrayContaining([
            expect.objectContaining({ id: 'persisted-entry', queueStatus: 'queued' }),
          ]),
        }),
      }),
    );
  });
});
