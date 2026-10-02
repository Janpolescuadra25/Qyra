import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Mapping, MappingPreset } from '../../../types';
import { api } from '../../lib/api';
import type { LocalMapping } from './index';

export interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  jwt: string;
  locationId: string;
  currentMappings: LocalMapping[];
  onApplyPreset: (preset: MappingPreset) => void;
  hasUnsavedChanges?: boolean;
  encodeToApi: (mapping: LocalMapping) => Mapping;
  initialTab?: 'catalog' | 'save';
}

const INDUSTRIES = ['retail', 'restaurant', 'professional-services', 'construction', 'other'];

export default function PresetManagerModal({
  isOpen,
  onClose,
  jwt,
  locationId,
  currentMappings,
  onApplyPreset,
  hasUnsavedChanges = false,
  encodeToApi,
  initialTab = 'catalog',
}: PresetManagerModalProps) {
  const [presets, setPresets] = useState<MappingPreset[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<'catalog' | 'save'>(initialTab);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [showConfirmApply, setShowConfirmApply] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<MappingPreset | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const industrySelectRef = useRef<HTMLSelectElement | null>(null);

  const loadPresets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPresets(jwt);
      setPresets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presets');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    if (!isOpen) return;
    void loadPresets();
  }, [isOpen, loadPresets]);

  const filteredPresets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter((preset) => {
      const haystack = `${preset.name} ${preset.industry ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [presets, query]);

  const createPresetFromCurrent = async () => {
    const resolvedName = (nameInputRef.current?.value ?? name).trim();
    const resolvedDescription = (descriptionInputRef.current?.value ?? description).trim();
    const resolvedIndustry = (industrySelectRef.current?.value ?? industry).trim();

    if (!resolvedName) {
      setError('Preset name is required');
      return;
    }

    const serialized: Mapping[] = currentMappings.map((mapping) => ({
      ...encodeToApi(mapping),
      id: mapping.remoteId ?? mapping.localId,
      locationId,
      createdAt: new Date().toISOString(),
    }));

    try {
      setError(null);
      await api.createPreset(jwt, {
        name: resolvedName,
        description: resolvedDescription || undefined,
        industry: resolvedIndustry || undefined,
        mappings: serialized,
        locationId,
      });
      setStatus('Preset saved successfully');
      setName('');
      setDescription('');
      setIndustry('');
      if (nameInputRef.current) nameInputRef.current.value = '';
      if (descriptionInputRef.current) descriptionInputRef.current.value = '';
      if (industrySelectRef.current) industrySelectRef.current.value = '';
      setTab('catalog');
      await loadPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create preset');
    }
  };

  const handleApply = (preset: MappingPreset) => {
    if (hasUnsavedChanges) {
      setPendingPreset(preset);
      setShowConfirmApply(true);
      return;
    }
    onApplyPreset(preset);
    setStatus(`Preset '${preset.name}' applied successfully`);
    setTimeout(() => setStatus(null), 2500);
  };

  const confirmApply = () => {
    if (!pendingPreset) return;
    setShowConfirmApply(false);
    onApplyPreset(pendingPreset);
    setPendingPreset(null);
    setStatus(`Preset '${pendingPreset.name}' applied successfully`);
    setTimeout(() => setStatus(null), 2500);
  };

  const handleClone = async (preset: MappingPreset) => {
    try {
      setError(null);
      const cloned = await api.clonePreset(jwt, preset.id, locationId);
      setStatus(`Created '${cloned.name}' for this location`);
      await loadPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone preset');
    }
  };

  const handleDelete = async (preset: MappingPreset) => {
    if (preset.isBuiltIn) {
      setError('Built-in presets cannot be modified');
      return;
    }
    try {
      setError(null);
      await api.deletePreset(jwt, preset.id);
      setStatus(`Deleted '${preset.name}'`);
      await loadPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preset');
    }
  };

  const exportPreset = (preset: MappingPreset) => {
    const payload = {
      version: '1.0',
      name: preset.name,
      description: preset.description ?? '',
      industry: preset.industry ?? '',
      mappings: preset.mappings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${preset.name.toLowerCase().replace(/\s+/g, '-')}-preset.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatus(`Exported '${preset.name}'`);
    setTimeout(() => setStatus(null), 1800);
  };

  const copyPresetJson = async (preset: MappingPreset) => {
    const payload = JSON.stringify({
      version: '1.0',
      name: preset.name,
      description: preset.description ?? '',
      industry: preset.industry ?? '',
      mappings: preset.mappings,
    }, null, 2);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = payload;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setStatus('Copied to clipboard!');
      setTimeout(() => setStatus(null), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copy failed');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { name?: string; mappings?: Mapping[]; description?: string | null; industry?: string | null };
      if (!parsed.name || !Array.isArray(parsed.mappings)) {
        throw new Error('Preset JSON must include a name and a mappings array');
      }

      await api.createPreset(jwt, {
        name: parsed.name,
        description: parsed.description ?? undefined,
        industry: parsed.industry ?? undefined,
        mappings: parsed.mappings,
        locationId,
      });
      setStatus(`Imported '${parsed.name}'`);
      await loadPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
      <div className="w-full max-w-4xl bg-white rounded-xl border border-gray-200 shadow-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div>
            <div className="text-sm font-semibold text-gray-900">Mapping Presets</div>
            <div className="text-[11px] text-gray-500">Location scoped presets</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-gray-200 flex gap-2 px-4 py-3 bg-white">
          <button
            type="button"
            data-testid="preset-modal-catalog-tab"
            onClick={() => setTab('catalog')}
            className={`text-xs px-3 py-1.5 rounded ${tab === 'catalog' ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Catalog
          </button>
          <button
            type="button"
            data-testid="preset-modal-save-tab"
            onClick={() => setTab('save')}
            className={`text-xs px-3 py-1.5 rounded ${tab === 'save' ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Save preset
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {status && (
          <div className="mx-4 mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {status}
          </div>
        )}

        {tab === 'catalog' ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search presets"
                className="w-full bg-[#F5F5F7] border border-gray-200 text-gray-900 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 cursor-pointer bg-gray-100 border border-gray-200 rounded px-2 py-1.5">
                  Import JSON
                  <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
                </label>
              </div>
            </div>

            {loading ? (
              <div className="text-xs text-gray-600">Loading presets…</div>
            ) : filteredPresets.length === 0 ? (
              <div className="text-xs text-gray-600">No presets found.</div>
            ) : (
              <div className="grid gap-3">
                {filteredPresets.map((preset) => (
                  <div key={preset.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="flex justify-between gap-3 items-start">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900 truncate">{preset.name}</span>
                          <span className={`text-[10px] rounded px-1.5 py-0.5 ${preset.isBuiltIn ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {preset.isBuiltIn ? 'Built-in' : 'Custom'}
                          </span>
                          {preset.industry && (
                            <span className="text-[10px] rounded px-1.5 py-0.5 bg-gray-100 text-gray-600">{preset.industry}</span>
                          )}
                        </div>
                        {preset.description && <div className="text-[11px] text-gray-600 mt-1">{preset.description}</div>}
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleApply(preset)}
                          className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded px-2 py-1.5"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleClone(preset)}
                          className="text-xs bg-gray-200 hover:bg-gray-100 text-gray-700 rounded px-2 py-1.5"
                        >
                          Clone
                        </button>
                        <button
                          type="button"
                          onClick={() => exportPreset(preset)}
                          className="text-xs bg-gray-200 hover:bg-gray-100 text-gray-700 rounded px-2 py-1.5"
                        >
                          Export
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyPresetJson(preset)}
                          className="text-xs bg-gray-200 hover:bg-gray-100 text-gray-700 rounded px-2 py-1.5"
                        >
                          Copy JSON
                        </button>
                        {!preset.isBuiltIn && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(preset)}
                            className="text-xs bg-red-600 hover:bg-red-500 text-white rounded px-2 py-1.5"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs text-gray-600">
                Name
                <input
                  ref={nameInputRef}
                  name="preset-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full bg-[#F5F5F7] border border-gray-200 text-gray-900 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                  placeholder="My custom preset"
                />
              </label>

              <label className="text-xs text-gray-600">
                Industry
                <select
                  ref={industrySelectRef}
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  className="mt-1 w-full bg-[#F5F5F7] border border-gray-200 text-gray-900 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-gray-600">
                Description
                <textarea
                  ref={descriptionInputRef}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-1 w-full bg-[#F5F5F7] border border-gray-200 text-gray-900 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                  placeholder="Optional notes"
                />
              </label>
            </div>

            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              Saving {currentMappings.length} mapping{currentMappings.length === 1 ? '' : 's'} for location {locationId}.
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs bg-gray-200 hover:bg-gray-100 text-gray-700 rounded px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="preset-modal-save-action"
                onClick={() => void createPresetFromCurrent()}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded px-3 py-1.5"
              >
                Save preset
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirmApply && pendingPreset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="w-96 bg-white rounded-lg border border-gray-200 p-4 shadow-xl">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Overwrite unsaved changes?</h3>
            <p className="text-xs text-gray-600 mb-4">
              Applying this preset will overwrite your unsaved mapping changes. Do you want to continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmApply(false);
                  setPendingPreset(null);
                }}
                className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApply}
                className="text-xs px-3 py-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-600"
              >
                Apply anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
