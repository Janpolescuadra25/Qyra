import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ScanData, ScanEntry, ScanQueueStatus, ScanSource, Template } from '../../types';

export interface ScanContextState {
  scanData: ScanData | null;
  scanRecordId: string | null;
  scanEntries: ScanEntry[];
  activeScanEntryId: string | null;
  scanMode: ScanSource;
  selectedLocationId: string;
  selectedTemplateForScan: Template | null;
  isBatchProcessing: boolean;
  batchProgress: number;
  setScanData: React.Dispatch<React.SetStateAction<ScanData | null>>;
  setScanRecordId: React.Dispatch<React.SetStateAction<string | null>>;
  setScanEntries: React.Dispatch<React.SetStateAction<ScanEntry[]>>;
  setActiveScanEntryId: React.Dispatch<React.SetStateAction<string | null>>;
  setScanMode: React.Dispatch<React.SetStateAction<ScanSource>>;
  setSelectedLocationId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedTemplateForScan: React.Dispatch<React.SetStateAction<Template | null>>;
  setIsBatchProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setBatchProgress: React.Dispatch<React.SetStateAction<number>>;
  enqueueScanEntries: (entries: Partial<ScanEntry>[]) => void;
  updateQueueStatus: (id: string, status: ScanQueueStatus, error?: string) => void;
  removeQueueEntry: (id: string) => void;
  clearScanSession: () => void;
  isRestoring: boolean;
}

interface PersistedScanState {
  scanData: ScanData | null;
  scanRecordId: string | null;
  scanEntries: ScanEntry[];
  activeScanEntryId: string | null;
  scanMode: ScanSource;
  selectedLocationId: string;
  selectedTemplateForScan: Template | null;
  isBatchProcessing: boolean;
  batchProgress: number;
}

export const STORAGE_KEY = 'qyra_scan_session_v1';

const defaultScanState: PersistedScanState = {
  scanData: null,
  scanRecordId: null,
  scanEntries: [],
  activeScanEntryId: null,
  scanMode: 'pos',
  selectedLocationId: '',
  selectedTemplateForScan: null,
  isBatchProcessing: false,
  batchProgress: 0,
};

const isStorageAvailable = () => typeof chrome !== 'undefined' && !!chrome.storage?.local;

const isValidScanMode = (value: unknown): value is ScanSource => value === 'pos' || value === 'excel' || value === 'image';

async function readPersistedScanState(): Promise<PersistedScanState | null> {
  if (!isStorageAvailable()) return null;

  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const persisted = result[STORAGE_KEY];
      if (!persisted || typeof persisted !== 'object') {
        resolve(null);
        return;
      }

      const nextState: PersistedScanState = {
        ...defaultScanState,
        ...(persisted as Partial<PersistedScanState>),
      };

      if (!Array.isArray(nextState.scanEntries)) {
        resolve(null);
        return;
      }

      if (typeof nextState.isBatchProcessing !== 'boolean') {
        nextState.isBatchProcessing = false;
      }

      if (typeof nextState.batchProgress !== 'number' || Number.isNaN(nextState.batchProgress)) {
        nextState.batchProgress = 0;
      }

      if (nextState.scanData !== null && typeof nextState.scanData !== 'object') {
        resolve(null);
        return;
      }

      if (!isValidScanMode(nextState.scanMode)) {
        nextState.scanMode = 'pos';
      }

      if (typeof nextState.selectedLocationId !== 'string') {
        nextState.selectedLocationId = '';
      }

      if (nextState.scanRecordId !== null && typeof nextState.scanRecordId !== 'string') {
        nextState.scanRecordId = null;
      }

      if (nextState.activeScanEntryId !== null && typeof nextState.activeScanEntryId !== 'string') {
        nextState.activeScanEntryId = null;
      }

      resolve(nextState);
    });
  });
}

const ScanContext = createContext<ScanContextState | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [scanData, setScanData] = useState<ScanData | null>(defaultScanState.scanData);
  const [scanRecordId, setScanRecordId] = useState<string | null>(defaultScanState.scanRecordId);
  const [scanEntries, setScanEntries] = useState<ScanEntry[]>(defaultScanState.scanEntries);
  const [activeScanEntryId, setActiveScanEntryId] = useState<string | null>(defaultScanState.activeScanEntryId);
  const [scanMode, setScanMode] = useState<ScanSource>(defaultScanState.scanMode);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultScanState.selectedLocationId);
  const [selectedTemplateForScan, setSelectedTemplateForScan] = useState<Template | null>(defaultScanState.selectedTemplateForScan);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void readPersistedScanState().then((persisted) => {
      if (!isMounted) return;

      if (persisted) {
        setScanData(persisted.scanData);
        setScanRecordId(persisted.scanRecordId);
        setScanEntries(persisted.scanEntries);
        setActiveScanEntryId(persisted.activeScanEntryId);
        setScanMode(persisted.scanMode);
        setSelectedLocationId(persisted.selectedLocationId);
        setSelectedTemplateForScan(persisted.selectedTemplateForScan);
        setIsBatchProcessing(persisted.isBatchProcessing);
        setBatchProgress(persisted.batchProgress);
      }

      setIsRestoring(false);
    }).catch(() => {
      if (isMounted) {
        setIsRestoring(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const persistPayload = useMemo<PersistedScanState>(() => ({
    scanData,
    scanRecordId,
    scanEntries,
    activeScanEntryId,
    scanMode,
    selectedLocationId,
    selectedTemplateForScan,
    isBatchProcessing,
    batchProgress,
  }), [scanData, scanRecordId, scanEntries, activeScanEntryId, scanMode, selectedLocationId, selectedTemplateForScan, isBatchProcessing, batchProgress]);

  useEffect(() => {
    if (isRestoring || !isStorageAvailable()) return;

    const hasAnySessionData = !!(
      (scanData !== null)
      || scanRecordId !== null
      || scanEntries.length > 0
      || activeScanEntryId !== null
      || scanMode !== 'pos'
      || selectedLocationId !== ''
      || selectedTemplateForScan !== null
      || isBatchProcessing
      || batchProgress > 0
    );

    if (!hasAnySessionData) {
      chrome.storage.local.remove([STORAGE_KEY]);
      return;
    }

    chrome.storage.local.set({ [STORAGE_KEY]: persistPayload });
  }, [activeScanEntryId, batchProgress, isBatchProcessing, isRestoring, persistPayload, scanData, scanEntries.length, scanMode, scanRecordId, selectedLocationId, selectedTemplateForScan]);

  const clearScanSession = useCallback(() => {
    setScanData(null);
    setScanRecordId(null);
    setScanEntries([]);
    setActiveScanEntryId(null);
    setScanMode('pos');
    setSelectedLocationId('');
    setSelectedTemplateForScan(null);
    setIsBatchProcessing(false);
    setBatchProgress(0);

    if (isStorageAvailable()) {
      chrome.storage.local.remove([STORAGE_KEY]);
    }
  }, []);

  const enqueueScanEntries = useCallback((entries: Partial<ScanEntry>[]) => {
    const queuedEntries: ScanEntry[] = entries.map((entry, index) => ({
      id: typeof entry.id === 'string' && entry.id ? entry.id : `scan-entry-${Date.now()}-${index}`,
      source: (entry.source ?? 'pos') as ScanEntry['source'],
      type: entry.type,
      fileName: entry.fileName,
      fileSize: entry.fileSize,
      rowNumber: entry.rowNumber,
      thumbnail: entry.thumbnail,
      header: entry.header ?? {},
      lineItems: Array.isArray(entry.lineItems) ? entry.lineItems : [],
      scanRecordId: entry.scanRecordId,
      queueStatus: 'queued',
      error: undefined,
      processedAt: undefined,
    }));

    setScanEntries((current) => [...current, ...queuedEntries]);
  }, []);

  const updateQueueStatus = useCallback((id: string, status: ScanQueueStatus, error?: string) => {
    setScanEntries((current) => current.map((entry) => {
      if (entry.id !== id) return entry;

      return {
        ...entry,
        queueStatus: status,
        error: error ?? entry.error,
        processedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const removeQueueEntry = useCallback((id: string) => {
    setScanEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const value = useMemo<ScanContextState>(() => ({
    scanData,
    scanRecordId,
    scanEntries,
    activeScanEntryId,
    scanMode,
    selectedLocationId,
    selectedTemplateForScan,
    isBatchProcessing,
    batchProgress,
    setScanData,
    setScanRecordId,
    setScanEntries,
    setActiveScanEntryId,
    setScanMode,
    setSelectedLocationId,
    setSelectedTemplateForScan,
    setIsBatchProcessing,
    setBatchProgress,
    enqueueScanEntries,
    updateQueueStatus,
    removeQueueEntry,
    clearScanSession,
    isRestoring,
  }), [scanData, scanRecordId, scanEntries, activeScanEntryId, scanMode, selectedLocationId, selectedTemplateForScan, isBatchProcessing, batchProgress, enqueueScanEntries, updateQueueStatus, removeQueueEntry, clearScanSession, isRestoring]);

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScanContext(): ScanContextState {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScanContext must be used within a ScanProvider');
  }
  return context;
}
