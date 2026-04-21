"use client";
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface CourtImageUploadProps {
  value: string;
  localPreview?: string | null;
  yPosition?: number;
  onUrlChange: (url: string, yPos?: number) => void;
  onFileSelect?: (file: File) => void;
  onRemove: () => void;
  hasLocalFile?: boolean;
}

export const CourtImageUpload: React.FC<CourtImageUploadProps> = ({ 
  value, 
  localPreview,
  yPosition = 0,
  onUrlChange,
  onFileSelect,
  onRemove,
  hasLocalFile
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentYPosition, setCurrentYPosition] = useState(yPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startPosition, setStartPosition] = useState(0);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = localPreview || value;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no puede superar 5MB');
      e.target.value = '';
      return;
    }

    setUploadError(null);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleUrlChange = (url: string) => {
    onUrlChange(url, currentYPosition);
    setUploadError(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!displayImage) return;
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartPosition(currentYPosition);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !imageContainerRef.current) return;
    
    const containerHeight = imageContainerRef.current.clientHeight;
    const imageHeight = imageContainerRef.current.scrollHeight;
    const maxMovement = Math.max(0, imageHeight - containerHeight);
    
    const deltaY = startY - e.clientY;
    const newPosition = Math.max(-maxMovement, Math.min(0, startPosition + deltaY));
    
    setCurrentYPosition(newPosition);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onUrlChange(displayImage, currentYPosition);
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startPosition, currentYPosition, displayImage]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">Imagen de la Cancha</label>
      
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'upload' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4" />
          Subir
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'url' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          URL
        </button>
      </div>

      {activeTab === 'url' ? (
        <div className="space-y-2">
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-200 outline-none"
            value={value || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
          />
          {displayImage && (
            <div 
              ref={imageContainerRef}
              className="relative mt-2 w-full h-40 overflow-hidden rounded-lg bg-slate-100 cursor-move select-none"
              onMouseDown={handleMouseDown}
            >
              <img 
                src={displayImage} 
                alt="Preview" 
                className="w-full h-full object-cover pointer-events-none"
                style={{ transform: `translateY(${currentYPosition}px)` }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/e2e8f0/64748b?text=Imagen+no+disponible';
                }}
              />
              {isDragging && (
                <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none" />
              )}
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white">
                Arrastra para ajustar
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="court-image-upload"
          />
          
          {!displayImage ? (
            <label
              htmlFor="court-image-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
            >
              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">Haz clic para subir una imagen</span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG hasta 5MB</span>
            </label>
          ) : (
            <div 
              ref={imageContainerRef}
              className="relative w-full h-40 overflow-hidden rounded-lg bg-slate-100 cursor-move select-none"
              onMouseDown={handleMouseDown}
            >
              <img 
                src={displayImage} 
                alt="Preview" 
                className="w-full h-full object-cover pointer-events-none"
                style={{ transform: `translateY(${currentYPosition}px)` }}
              />
              {isDragging && (
                <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none" />
              )}
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white">
                Arrastra para ajustar
              </div>
            </div>
          )}

          {hasLocalFile && (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="text-emerald-500">✓</span>
              Imagen seleccionada - Se subirá al guardar
            </p>
          )}

          {uploadError && (
            <p className="text-sm text-red-500">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Configuración de Cloudinary no encontrada');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'reservaloya/courts');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Error al subir la imagen a Cloudinary');
  }

  const data = await response.json();
  
  const optimizedUrl = data.secure_url.replace('/upload/', '/upload/c_fill,w_800,h_600,q_auto:low,f_auto/');
  
  return optimizedUrl;
};