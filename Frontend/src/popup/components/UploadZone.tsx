import React, { useRef, useState } from 'react';

export interface UploadZoneProps {
  onFilesSelect: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
  '.xlsx',
  '.xls',
];

const isAcceptedFileType = (file: File, accepted: string[]) => {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return accepted.some((pattern) => {
    const normalizedPattern = pattern.trim().toLowerCase();
    if (!normalizedPattern) return false;
    if (normalizedPattern.startsWith('.')) {
      return fileName.endsWith(normalizedPattern);
    }
    return mimeType === normalizedPattern || (normalizedPattern === 'image/jpg' && mimeType === 'image/jpeg');
  });
};

export function UploadZone({
  onFilesSelect,
  acceptedFileTypes = DEFAULT_ACCEPTED_FILE_TYPES,
  maxFiles = 20,
  maxFileSize = 15 * 1024 * 1024,
  disabled = false,
  className = '',
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelection = (selectedFiles: FileList | File[] | null) => {
    if (disabled || !selectedFiles || selectedFiles.length === 0) return;

    const files = Array.from(selectedFiles);

    if (files.length > maxFiles) {
      setError(`Please select up to ${maxFiles} files at a time.`);
      return;
    }

    const invalidFile = files.find((file) => !isAcceptedFileType(file, acceptedFileTypes));
    if (invalidFile) {
      setError(`File "${invalidFile.name}" is not supported. Please choose an image, PDF, or spreadsheet file.`);
      return;
    }

    const oversized = files.find((file) => file.size > maxFileSize);
    if (oversized) {
      setError(`File "${oversized.name}" exceeds the maximum allowed size of ${(maxFileSize / (1024 * 1024)).toFixed(0)} MB.`);
      return;
    }

    setError(null);
    onFilesSelect(files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragOver(false);
    handleSelection(event.dataTransfer.files);
  };

  return (
    <div
      data-testid="upload-zone"
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
          : isDragOver
            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
      } ${className}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) setIsDragOver(false);
      }}
      onDrop={handleDrop}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept={acceptedFileTypes.join(',')}
        onChange={(event) => handleSelection(event.target.files)}
        aria-label="Upload files"
        disabled={disabled}
      />
      <div className="text-2xl mb-2">📁</div>
      <div className="text-sm font-medium">
        {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
      </div>
      <div className="mt-1 text-[11px] text-gray-500">or click to browse</div>
      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-left text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

export default UploadZone;
