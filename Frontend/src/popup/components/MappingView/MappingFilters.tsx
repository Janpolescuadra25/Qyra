import React from 'react';
import type { SelectOption } from '../SearchableSelect';

interface LocationOption {
  id: string;
  name: string;
}

interface Props {
  locId: string;
  locations: LocationOption[];
  onLocationChange: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
  onAISuggest: () => void;
  suggesting?: boolean;
  onApplyTemplate: (template: string) => void;
  onOpenPresets?: () => void;
  onSavePreset?: () => void;
  onSyncLists: () => void;
  listsLoading: boolean;
  accountsLoaded: boolean;
  showImportButton?: boolean;
  disablePresets?: boolean;
}

const TEMPLATE_NAMES = ['Standard Daily', 'Full Service', 'Quick Service'] as const;

export default function MappingFilters({
  locId,
  locations,
  onLocationChange,
  onExport,
  onImport,
  onAISuggest,
  suggesting,
  onApplyTemplate,
  onOpenPresets,
  onSavePreset,
  onSyncLists,
  listsLoading,
  accountsLoaded,
  showImportButton,
  disablePresets,
}: Props) {
  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExport}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-1.5 rounded border border-slate-600 whitespace-nowrap transition-colors"
        >
          📤 Export
        </button>
        {showImportButton !== false && (
          <button
            type="button"
            onClick={onImport}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-1.5 rounded border border-slate-600 whitespace-nowrap transition-colors"
          >
            📥 Import
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={onOpenPresets}
          className="text-xs bg-slate-700 text-slate-100 px-3 py-1.5 rounded border border-slate-600 transition-colors hover:bg-slate-600"
        >
          📚 Presets
        </button>
        <button
          type="button"
          onClick={onSavePreset}
          className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded transition-colors hover:bg-emerald-600"
        >
          💾 Save as Preset
        </button>
        <button
          type="button"
          onClick={onAISuggest}
          disabled={suggesting}
          className={`text-xs bg-sky-700 text-white px-3 py-1.5 rounded transition-colors ${suggesting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sky-600'}`}
        >
          {suggesting ? 'Suggesting…' : '🤖 AI Suggest'}
        </button>
        {TEMPLATE_NAMES.map((template) => (
          <button
            key={template}
            onClick={disablePresets ? undefined : () => onApplyTemplate(template)}
            title={disablePresets ? 'Presets are designed for POS scans' : undefined}
            className={`text-xs bg-slate-700 text-slate-100 px-3 py-1.5 rounded border border-slate-600 transition-colors ${disablePresets ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'}`}
          >
            📋 {template}
          </button>
        ))}
        <button
          onClick={onSyncLists}
          disabled={listsLoading}
          className="text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-100 px-3 py-1.5 rounded border border-slate-600 transition-colors ml-auto"
          title="Refresh QB lists"
        >
          {listsLoading ? '…' : '↻'}
        </button>
      </div>

      {!accountsLoaded && (
        <div className="bg-amber-50 border border-amber-700 text-amber-600 text-xs rounded-lg px-3 py-2">
          ⚠️ QB accounts not loaded. Make sure QuickBooks is connected in Settings.
        </div>
      )}
    </>
  );
}
