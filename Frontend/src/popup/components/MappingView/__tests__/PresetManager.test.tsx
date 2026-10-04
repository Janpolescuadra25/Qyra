import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import PresetManagerModal from '../PresetManagerModal';
import type { LocalMapping } from '../index';

let root: Root | null = null;

const sampleMappings: LocalMapping[] = [
  {
    localId: 'm1',
    remoteId: 'm1',
    sourceField: 'sales',
    accountId: 'acct-1',
    postingType: 'Credit',
    description: 'Sales',
    classId: '',
    taxCodeId: '',
    entityType: '',
    entityId: '',
    amountRule: 'Direct Amount',
    keepSeparate: false,
    isDirty: false,
    expanded: false,
    priority: 10,
    conditions: null,
  },
];

const renderModal = (props: Partial<React.ComponentProps<typeof PresetManagerModal>> = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const defaultProps: React.ComponentProps<typeof PresetManagerModal> = {
    isOpen: true,
    onClose: vi.fn(),
    jwt: 'jwt-123',
    locationId: 'loc-1',
    currentMappings: sampleMappings,
    onApplyPreset: vi.fn(),
    hasUnsavedChanges: false,
    encodeToApi: (mapping) => ({
      sourceField: mapping.sourceField,
      targetAccount: mapping.accountId,
      postingType: mapping.postingType,
      keepSeparate: mapping.keepSeparate,
      targetClass: mapping.classId || undefined,
      targetDescription: mapping.description || undefined,
      priority: mapping.priority,
      conditions: mapping.conditions ?? null,
    }),
    ...props,
  };

  act(() => {
    root = createRoot(container);
    root.render(<PresetManagerModal {...defaultProps} />);
  });

  return { container, root: container, props: defaultProps };
};

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('PresetManagerModal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('renders built-in and custom badges', async () => {
    vi.spyOn(api, 'getPresets').mockResolvedValue([
      { id: 'preset-built', name: 'Retail', isBuiltIn: true, mappings: [], locationId: null },
      { id: 'preset-custom', name: 'My Custom', isBuiltIn: false, mappings: [], locationId: 'loc-1' },
    ]);

    const { container } = renderModal();
    await flush();

    expect(container.textContent).toContain('Retail');
    expect(container.textContent).toContain('Built-in');
    expect(container.textContent).toContain('My Custom');
    expect(container.textContent).toContain('Custom');
  });

  it('requires confirmation before applying a preset that would overwrite unsaved changes', async () => {
    vi.spyOn(api, 'getPresets').mockResolvedValue([
      { id: 'preset-1', name: 'Retail', isBuiltIn: true, mappings: [], locationId: null },
    ]);

    const { container } = renderModal({ hasUnsavedChanges: true });
    await flush();

    const applyButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Apply'));
    expect(applyButton).not.toBeUndefined();

    act(() => {
      applyButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('overwrite your unsaved mapping changes');
  });

  it('calls clonePreset with a preset id and locationId', async () => {
    vi.spyOn(api, 'getPresets').mockResolvedValue([
      { id: 'preset-1', name: 'Retail', isBuiltIn: true, mappings: [], locationId: null },
    ]);
    const cloneSpy = vi.spyOn(api, 'clonePreset').mockResolvedValue({
      id: 'preset-2',
      name: 'Retail (Copy)',
      isBuiltIn: false,
      mappings: [],
      locationId: 'loc-1',
    });

    const { container } = renderModal();
    await flush();

    const cloneButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Clone'));
    expect(cloneButton).not.toBeUndefined();

    act(() => {
      cloneButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await flush();
    expect(cloneSpy).toHaveBeenCalledWith('jwt-123', 'preset-1', 'loc-1');
  });

  it('saves a current mapping set as a custom preset using the location id and serialized mapping payload', async () => {
    vi.spyOn(api, 'getPresets').mockResolvedValue([]);
    const createSpy = vi.spyOn(api, 'createPreset').mockResolvedValue({
      id: 'preset-2',
      name: 'My Save',
      isBuiltIn: false,
      mappings: [],
      locationId: 'loc-1',
    });

    const { container } = renderModal({ initialTab: 'save' });
    await flush();

    const nameInput = container.querySelector('input[name="preset-name"]') as HTMLInputElement | null;
    expect(nameInput).not.toBeNull();
    await act(async () => {
      nameInput!.value = 'My Save';
      nameInput!.dispatchEvent(new Event('input', { bubbles: true }));
      await Promise.resolve();
    });

    const saveButton = container.querySelector('[data-testid="preset-modal-save-action"]') as HTMLButtonElement | null;
    expect(saveButton).not.toBeNull();
    await act(async () => {
      saveButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    await flush();

    expect(createSpy).toHaveBeenCalledWith('jwt-123', expect.objectContaining({
      name: 'My Save',
      locationId: 'loc-1',
      mappings: expect.arrayContaining([
        expect.objectContaining({ sourceField: 'sales', targetAccount: 'acct-1' }),
      ]),
    }));
  });

  it('shows a banner when fetching presets fails', async () => {
    vi.spyOn(api, 'getPresets').mockRejectedValue(new Error('Forbidden'));

    const { container } = renderModal();
    await flush();

    expect(container.textContent).toContain('Forbidden');
  });

  it('copies preset JSON to the clipboard', async () => {
    vi.spyOn(api, 'getPresets').mockResolvedValue([
      { id: 'preset-1', name: 'Retail', isBuiltIn: true, mappings: [], locationId: null },
    ]);
    const copySpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    const { container } = renderModal();
    await flush();

    const copyButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Copy JSON'));
    expect(copyButton).not.toBeUndefined();

    act(() => {
      copyButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await flush();
    expect(copySpy).toHaveBeenCalled();
    const payload = copySpy.mock.calls[0][0] as string;
    expect(payload).toContain('Retail');
  });

  it('imports a valid JSON preset file and creates a custom preset', async () => {
    vi.spyOn(api, 'getPresets').mockResolvedValue([]);
    const createSpy = vi.spyOn(api, 'createPreset').mockResolvedValue({
      id: 'preset-import',
      name: 'Imported',
      isBuiltIn: false,
      mappings: [],
      locationId: 'loc-1',
    });

    const { container } = renderModal();
    await flush();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    const validJson = JSON.stringify({
      version: '1.0',
      name: 'Imported',
      description: 'Imported preset',
      industry: 'retail',
      mappings: [
        { sourceField: 'sales', targetAccount: 'Sales Revenue', postingType: 'Credit', priority: 10 },
      ],
    });
    const file = new File([validJson], 'import.json', { type: 'application/json' });

    Object.defineProperty(fileInput!, 'files', { value: [file], configurable: true });
    act(() => {
      fileInput!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await flush();

    expect(createSpy).toHaveBeenCalledWith('jwt-123', expect.objectContaining({
      name: 'Imported',
      locationId: 'loc-1',
      mappings: expect.arrayContaining([
        expect.objectContaining({ sourceField: 'sales' }),
      ]),
    }));
  });
});
