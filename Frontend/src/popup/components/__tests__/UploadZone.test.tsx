import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UploadZone from '../UploadZone';

let root: Root | null = null;

const renderUploadZone = (props: Partial<React.ComponentProps<typeof UploadZone>> = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onFilesSelect = vi.fn();

  act(() => {
    root = createRoot(container);
    root.render(<UploadZone onFilesSelect={onFilesSelect} {...props} />);
  });

  return { container, onFilesSelect, root: container };
};

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  root = null;
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('UploadZone', () => {
  it('renders the drag-and-drop prompt and hidden file input', () => {
    const { container } = renderUploadZone();

    expect(container.textContent).toContain('Drag & drop files here');
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('accepts valid image and PDF files and calls onFilesSelect with the selected files', () => {
    const { container, onFilesSelect } = renderUploadZone();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const first = new File(['image'], 'receipt.png', { type: 'image/png' });
    const second = new File(['pdf'], 'statement.pdf', { type: 'application/pdf' });

    Object.defineProperty(input, 'files', {
      value: [first, second],
      configurable: true,
    });

    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onFilesSelect).toHaveBeenCalledTimes(1);
    expect(onFilesSelect.mock.calls[0][0]).toEqual([first, second]);
  });

  it('keeps single-file selection as a one-item array for compatibility', () => {
    const { container, onFilesSelect } = renderUploadZone();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['single'], 'single.pdf', { type: 'application/pdf' });

    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });

    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onFilesSelect).toHaveBeenCalledWith([file]);
  });

  it('rejects files above the max size and displays an error', () => {
    const { container, onFilesSelect } = renderUploadZone({ maxFileSize: 10 });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(20)], 'large.png', { type: 'image/png' });

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      configurable: true,
    });

    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onFilesSelect).not.toHaveBeenCalled();
    expect(container.textContent).toContain('exceeds the maximum allowed size');
  });

  it('rejects invalid file extensions and displays an error', () => {
    const { container, onFilesSelect } = renderUploadZone();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['bad'], 'notes.txt', { type: 'text/plain' });

    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      configurable: true,
    });

    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onFilesSelect).not.toHaveBeenCalled();
    expect(container.textContent).toContain('not supported');
  });

  it('ignores pointer and drag events when disabled', () => {
    const { container, onFilesSelect } = renderUploadZone({ disabled: true });
    const button = container.querySelector('[data-testid="upload-zone"]') as HTMLDivElement;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'example.png', { type: 'image/png' });

    act(() => {
      button.dispatchEvent(new Event('dragover', { bubbles: true }));
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onFilesSelect).not.toHaveBeenCalled();
  });
});
