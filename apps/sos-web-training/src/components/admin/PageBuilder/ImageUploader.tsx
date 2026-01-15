'use client';

import { useRef, useState, useCallback } from 'react';
import { Button, Spinner } from '@heroui/react';
import { FiUpload, FiX, FiImage, FiLink } from 'react-icons/fi';

interface ImageUploaderProps {
  value: string;
  onChange: (base64: string) => void;
  label?: string;
  maxSizeMB?: number;
}

/**
 * Convert file to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Check if a string is a base64 image data URL
 */
const isBase64Image = (str: string): boolean => {
  return str?.startsWith('data:image/');
};

/**
 * Check if a string is a valid URL
 */
const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

export function ImageUploader({ value, onChange, label = 'Image', maxSizeMB = 5 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch (err) {
      setError('Failed to process image');
      console.error('Error converting file to base64:', err);
    } finally {
      setIsLoading(false);
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange, maxSizeMB]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setError(null);
    
    if (!file.type.startsWith('image/')) {
      setError('Please drop an image file');
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch (err) {
      setError('Failed to process image');
      console.error('Error converting file to base64:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, maxSizeMB]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleRemove = useCallback(() => {
    onChange('');
    setError(null);
  }, [onChange]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      if (isValidUrl(urlInput.trim()) || urlInput.trim().startsWith('/')) {
        onChange(urlInput.trim());
        setUrlInput('');
        setShowUrlInput(false);
        setError(null);
      } else {
        setError('Please enter a valid URL');
      }
    }
  }, [urlInput, onChange]);

  const hasImage = value && (isBase64Image(value) || isValidUrl(value) || value.startsWith('/'));

  return (
    <div className="space-y-2">
      <label className="text-sm text-text font-medium">{label}</label>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {hasImage ? (
        /* Preview */
        <div className="relative rounded-lg overflow-hidden border border-border bg-background">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="flat"
              className="bg-white/90 text-black"
              onPress={() => fileInputRef.current?.click()}
            >
              Change
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              className="bg-white/90"
              isIconOnly
              onPress={handleRemove}
            >
              <FiX />
            </Button>
          </div>
          {isBase64Image(value) && (
            <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
              Uploaded
            </div>
          )}
        </div>
      ) : (
        /* Upload zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer bg-background"
          onClick={() => !showUrlInput && fileInputRef.current?.click()}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Spinner size="sm" />
              <span className="text-sm text-default-500">Processing...</span>
            </div>
          ) : showUrlInput ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-text focus:outline-none focus:border-primary"
                autoFocus
              />
              <div className="flex gap-2 justify-center">
                <Button size="sm" color="primary" onPress={handleUrlSubmit}>
                  Add URL
                </Button>
                <Button size="sm" variant="flat" onPress={() => setShowUrlInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <FiImage className="text-default-400" size={24} />
              <div className="text-sm text-default-500">
                <span className="text-primary font-medium">Click to upload</span>
                {' '}or drag and drop
              </div>
              <div className="text-xs text-default-400">
                PNG, JPG, GIF up to {maxSizeMB}MB
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-default-400">or</span>
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<FiLink size={14} />}
                  onPress={(e) => {
                    setShowUrlInput(true);
                  }}
                >
                  Add URL
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

