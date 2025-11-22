
import React, { useCallback, useRef, useState } from 'react';
import { fetchImageFromUrl } from '../services/geminiService';
import { Button, Spinner } from './Components';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  subLabel?: string;
  compact?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ 
  onFileSelect, 
  accept = "image/png, image/jpeg, image/webp",
  label = "Click or drag image to upload",
  subLabel = "Support for JPG, PNG, WebP",
  compact = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string|null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl) return;
    setUrlLoading(true);
    setUrlError(null);
    try {
      const file = await fetchImageFromUrl(imageUrl);
      onFileSelect(file);
      setImageUrl("");
    } catch (e: any) {
      setUrlError(e.message || "Failed to load image from URL");
    } finally {
      setUrlLoading(false);
    }
  };

  const containerClasses = compact 
    ? "w-full h-32 rounded-lg border-2 border-dashed border-slate-700 hover:border-primary-500 bg-slate-800/20 hover:bg-slate-800/40 flex flex-col items-center justify-center"
    : "w-full h-64 rounded-xl border-2 border-dashed border-slate-600 hover:border-primary-500 bg-slate-800/30 hover:bg-slate-800/50 flex flex-col items-center justify-center";

  const iconSize = compact ? "w-6 h-6" : "w-8 h-8";
  const paddingIcon = compact ? "p-2 mb-2" : "p-4 mb-4";
  const textSize = compact ? "text-sm" : "text-lg";
  const subTextSize = compact ? "text-xs" : "text-sm";

  return (
    <div className="space-y-4">
      <div 
        className={`relative group cursor-pointer transition-all duration-300 ${containerClasses}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept={accept} 
          onChange={handleChange} 
        />
        
        <div className={`${paddingIcon} rounded-full bg-slate-800 border border-slate-700 group-hover:scale-110 transition-transform duration-300`}>
          <svg className={`${iconSize} text-primary-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <p className={`${textSize} font-medium text-slate-200 mb-1 text-center`}>{label}</p>
        {!compact && <p className={`${subTextSize} text-slate-400`}>{subLabel}</p>}
      </div>

      {!compact && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Or paste image URL here..." 
              className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-primary-500 transition-colors"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button variant="secondary" onClick={handleUrlSubmit} disabled={!imageUrl || urlLoading}>
              {urlLoading ? "Loading..." : "Load URL"}
            </Button>
          </div>
          {urlError && <p className="text-xs text-red-400 px-1">{urlError}</p>}
        </div>
      )}
    </div>
  );
};
