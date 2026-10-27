'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { supabaseStore, StorageBucket } from '@/lib/supabase';
import { MediaItem } from '@/types';

export interface QueuedUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  percent: number;
  error?: string;
  uploadedUrl?: string;
  thumbnailUrl?: string;
  mediaItem?: MediaItem;
}

export interface BatchImageUploaderProps {
  multiple?: boolean;
  bucket?: StorageBucket;
  folder?: string;
  targetModule?: string;
  albumId?: string;
  category?: string;
  autoSaveToMediaLibrary?: boolean;
  onUploadComplete?: (uploadedItems: {
    publicUrl: string;
    thumbnailUrl?: string;
    fileName: string;
    title: string;
    mediaItem?: MediaItem;
  }[]) => void;
  onSingleUploadComplete?: (uploadedItem: {
    publicUrl: string;
    thumbnailUrl?: string;
    fileName: string;
    title: string;
    mediaItem?: MediaItem;
  }) => void;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  className?: string;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
  return `${Math.round(bytes / 1024)} Ko`;
}

export const BatchImageUploader: React.FC<BatchImageUploaderProps> = ({
  multiple = true,
  bucket = 'images',
  folder = 'uploads',
  targetModule,
  albumId,
  category = 'Médiathèque publique',
  autoSaveToMediaLibrary = true,
  onUploadComplete,
  onSingleUploadComplete,
  title,
  subtitle,
  buttonLabel,
  className = '',
}) => {
  const [queue, setQueue] = useState<QueuedUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [queue]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length === 0) return;

    setGlobalError(null);

    // Filter valid image files
    const validImageFiles = selectedFiles.filter((file) => {
      return file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
    });

    if (validImageFiles.length === 0) {
      setGlobalError('Veuillez sélectionner des fichiers image valides (JPG, PNG, WebP, GIF, SVG).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setQueue((prevQueue) => {
      if (!multiple) {
        // If single image mode: revoke previous preview and replace
        prevQueue.forEach((item) => {
          if (item.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
        });
        const firstFile = validImageFiles[0];
        return [
          {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            file: firstFile,
            previewUrl: URL.createObjectURL(firstFile),
            name: firstFile.name,
            size: firstFile.size,
            status: 'pending',
            percent: 0,
          },
        ];
      }

      // Multiple mode: cumulative addition without duplicate files
      const existingKeys = new Set(
        prevQueue.map((item) => `${item.name}-${item.size}-${item.file.lastModified}`)
      );

      const newItems: QueuedUploadItem[] = [];
      for (const file of validImageFiles) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            status: 'pending',
            percent: 0,
          });
        }
      }

      return [...prevQueue, ...newItems];
    });

    // Reset input value so same files can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prevQueue) => {
      const itemToRemove = prevQueue.find((i) => i.id === id);
      if (itemToRemove?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prevQueue.filter((i) => i.id !== id);
    });
  };

  const handleClearQueue = () => {
    if (isProcessing) return;
    queue.forEach((item) => {
      if (item.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
    });
    setQueue([]);
    setGlobalError(null);
  };

  const startBatchUpload = async () => {
    const pendingItems = queue.filter((i) => i.status === 'pending' || i.status === 'error');
    if (pendingItems.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setGlobalError(null);

    const newlyUploadedList: {
      publicUrl: string;
      thumbnailUrl?: string;
      fileName: string;
      title: string;
      mediaItem?: MediaItem;
    }[] = [];

    for (const item of pendingItems) {
      // Mark as uploading
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', percent: 10 } : q))
      );

      try {
        const result = await supabaseStore.uploadFile(
          item.file,
          bucket,
          folder,
          (progress) => {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      percent: Math.max(10, Math.round(progress.percent)),
                    }
                  : q
              )
            );
          }
        );

        if (!result.success || !result.publicUrl) {
          throw new Error(result.error || 'Échec du téléversement vers Supabase Storage');
        }

        const generatedTitle = item.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .trim();

        let createdMedia: MediaItem | undefined = undefined;

        if (autoSaveToMediaLibrary) {
          createdMedia = {
            id: 'med-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            title_fr: generatedTitle,
            title_en: generatedTitle,
            type: 'photo',
            url: result.publicUrl,
            thumbnail_url: result.thumbnailUrl || result.publicUrl,
            category: category || 'Médiathèque publique',
            target_module: (targetModule as any) || undefined,
            album_id: albumId || undefined,
            show_in_public_gallery: false,
            date: new Date().toISOString().split('T')[0],
            location: 'APS-BÉNIN',
            alt_fr: generatedTitle,
            alt_en: generatedTitle,
            is_active: true,
          };

          try {
            await supabaseStore.saveMedia(createdMedia);
          } catch (saveErr) {
            console.warn('Could not save media record in Supabase DB:', saveErr);
          }
        }

        const uploadedItemInfo = {
          publicUrl: result.publicUrl,
          thumbnailUrl: result.thumbnailUrl || result.publicUrl,
          fileName: item.name,
          title: generatedTitle,
          mediaItem: createdMedia,
        };

        newlyUploadedList.push(uploadedItemInfo);

        if (!multiple && onSingleUploadComplete) {
          onSingleUploadComplete(uploadedItemInfo);
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'success',
                  percent: 100,
                  uploadedUrl: result.publicUrl,
                  thumbnailUrl: result.thumbnailUrl || result.publicUrl,
                  mediaItem: createdMedia,
                }
              : q
          )
        );
      } catch (err: any) {
        console.error(`Upload error for ${item.name}:`, err);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  percent: 0,
                  error: err.message || 'Erreur lors de l’envoi du fichier',
                }
              : q
          )
        );
      }
    }

    setIsProcessing(false);

    if (newlyUploadedList.length > 0 && onUploadComplete) {
      onUploadComplete(newlyUploadedList);
    }
  };

  const totalCount = queue.length;
  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const successCount = queue.filter((i) => i.status === 'success').length;
  const errorCount = queue.filter((i) => i.status === 'error').length;
  const uploadingCount = queue.filter((i) => i.status === 'uploading').length;

  const overallPercent =
    totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone / Dropzone card */}
      <div className="border-2 border-dashed border-[#92278F]/30 hover:border-[#92278F] rounded-2xl p-6 sm:p-7 bg-purple-50/25 transition-all text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 text-[#92278F] flex items-center justify-center mb-3 shadow-2xs">
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#FF8C00]" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <h4 className="text-sm font-bold text-gray-900 font-heading mb-1">
          {title ||
            (multiple
              ? 'Sélectionner et importer des images'
              : 'Sélectionner et importer une image')}
        </h4>
        <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
          {subtitle ||
            (multiple
              ? 'Sélectionnez plusieurs photos en une seule opération depuis votre ordinateur. Vous pouvez aussi ajouter d’autres photos en plusieurs fois.'
              : 'Formats acceptés : PNG, JPG, WebP, GIF, SVG. Hébergement sécurisé sur Supabase Storage.')}
        </p>

        {/* Global error message */}
        {globalError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 max-w-md mx-auto text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFilesSelected}
            disabled={isProcessing}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#92278F] hover:bg-[#7a1f77] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {multiple ? <Plus className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            <span>
              {buttonLabel ||
                (queue.length > 0
                  ? 'Ajouter d’autres photos'
                  : multiple
                  ? 'Choisir des images sur l’ordinateur'
                  : 'Choisir une image sur l’ordinateur')}
            </span>
          </button>

          {queue.length > 0 && !isProcessing && (
            <button
              type="button"
              onClick={handleClearQueue}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Vider la sélection</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Items Queue */}
      {queue.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
          {/* Queue Header & Global Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#92278F]" />
              <h5 className="text-xs font-bold text-gray-900 font-heading">
                File d’importation ({totalCount} fichier{totalCount > 1 ? 's' : ''})
              </h5>
              <div className="flex items-center gap-1.5 ml-2">
                {successCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    {successCount} importé{successCount > 1 ? 's' : ''}
                  </span>
                )}
                {uploadingCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#92278F]">
                    {uploadingCount} en cours
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {pendingCount} en attente
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {errorCount} échec{errorCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Launch upload button if pending items exist */}
            {(pendingCount > 0 || errorCount > 0) && (
              <button
                type="button"
                onClick={startBatchUpload}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#92278F] to-[#FF8C00] text-white text-xs font-bold hover:opacity-95 transition-all shadow-xs disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importation en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      Lancer l’importation ({pendingCount + errorCount}{' '}
                      {pendingCount + errorCount > 1 ? 'fichiers' : 'fichier'})
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Overall Progress Bar during batch upload */}
          {isProcessing && (
            <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5 text-[#92278F]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF8C00]" />
                  <span>Envoi groupé vers Supabase Storage...</span>
                </span>
                <span>
                  {successCount} / {totalCount} ({overallPercent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-purple-200/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#92278F] to-[#FF8C00] transition-all duration-300"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Grid of queued items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {queue.map((item) => {
              return (
                <div
                  key={item.id}
                  className={`relative p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                    item.status === 'success'
                      ? 'border-green-200 bg-green-50/30'
                      : item.status === 'uploading'
                      ? 'border-purple-200 bg-purple-50/30'
                      : item.status === 'error'
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-gray-200 bg-gray-50/40 hover:bg-gray-50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {item.status === 'success' && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Info & Status */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-xs font-bold text-gray-900 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {formatBytes(item.size)}
                    </p>

                    {/* Status Badge */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {item.status === 'pending' && (
                        <span className="text-[10px] font-semibold text-gray-600 px-2 py-0.5 rounded-md bg-gray-200/80">
                          En attente
                        </span>
                      )}
                      {item.status === 'uploading' && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#92278F]">
                          <Loader2 className="w-3 h-3 animate-spin text-[#FF8C00]" />
                          <span>{item.percent}%</span>
                        </div>
                      )}
                      {item.status === 'success' && (
                        <span className="text-[10px] font-bold text-green-700 px-2 py-0.5 rounded-md bg-green-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>Importé</span>
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span
                          className="text-[10px] font-bold text-red-700 px-2 py-0.5 rounded-md bg-red-100 flex items-center gap-1 truncate max-w-[130px]"
                          title={item.error}
                        >
                          <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                          <span className="truncate">{item.error || 'Échec'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  {!isProcessing && item.status !== 'uploading' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      title="Retirer de la file d’attente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
