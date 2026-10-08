'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabaseStore } from '@/lib/supabase';
import { MediaItem, PhotoAlbum } from '@/types';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Check,
  X,
  Folder,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface SelectedMedia {
  url: string;
  alt_fr?: string;
  title_fr?: string;
}

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (media: SelectedMedia) => void;
  onSelectMultiple?: (media: SelectedMedia[]) => void;
  multiple?: boolean;
  title?: string;
  currentUrl?: string;
  initialSelectedUrls?: string[];
  allowedTypes?: ('photo' | 'video')[];
}

const DEFAULT_ALLOWED_TYPES: ('photo' | 'video')[] = ['photo'];

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  multiple = false,
  title = 'Sélectionner une image dans la Médiathèque',
  currentUrl = '',
  initialSelectedUrls,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Currently picked item inside modal (single selection)
  const [selectedItem, setSelectedItem] = useState<SelectedMedia | null>(
    currentUrl ? { url: currentUrl } : null
  );

  // Selected items inside modal (multiple selection)
  const [selectedItems, setSelectedItems] = useState<SelectedMedia[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Stable key for allowed types to avoid reference instability on re-renders
  const allowedTypesKey = (allowedTypes || DEFAULT_ALLOWED_TYPES).join(',');
  const initialUrlsKey = (initialSelectedUrls || []).join(',');

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        supabaseStore.getMedia(),
        supabaseStore.getAlbums(),
      ]);
      const currentAllowed = allowedTypesKey ? allowedTypesKey.split(',') : ['photo'];
      setMediaList(m.filter((item) => currentAllowed.includes(item.type)));
      setAlbums(a);
    } catch (err) {
      console.error('Failed to load media items for selector:', err);
    } finally {
      setLoading(false);
    }
  }, [allowedTypesKey]);

  // Load media only when modal opens or allowedTypesKey changes
  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, loadMedia]);

  // Synchronize selection when modal opens or inputs change, without reloading media data
  useEffect(() => {
    if (isOpen) {
      if (multiple) {
        const urls = initialUrlsKey ? initialUrlsKey.split(',') : [];
        setSelectedItems(urls.map((u) => ({ url: u })));
      } else {
        setSelectedItem(currentUrl ? { url: currentUrl } : null);
      }
    }
  }, [isOpen, currentUrl, multiple, initialUrlsKey]);

  const handleItemClick = (item: MediaItem) => {
    if (multiple) {
      setSelectedItems((prev) => {
        const exists = prev.some((s) => s.url === item.url);
        if (exists) {
          return prev.filter((s) => s.url !== item.url);
        } else {
          return [
            ...prev,
            {
              url: item.url,
              alt_fr: item.alt_fr || item.title_fr,
              title_fr: item.title_fr,
            },
          ];
        }
      });
    } else {
      setSelectedItem({
        url: item.url,
        alt_fr: item.alt_fr || item.title_fr,
        title_fr: item.title_fr,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const result = await supabaseStore.uploadFile(file, 'images');
      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || 'Erreur lors du téléversement vers Supabase Storage.');
      }

      const generatedTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();

      // Persist as a MediaItem in database so it is saved in library
      const newMedia: MediaItem = {
        id: 'med-' + Date.now(),
        title_fr: generatedTitle,
        title_en: generatedTitle,
        type: 'photo',
        url: result.publicUrl,
        thumbnail_url: result.publicUrl,
        category: 'Médiathèque',
        date: new Date().toISOString().split('T')[0],
        location: 'APS-BÉNIN',
        alt_fr: generatedTitle,
        alt_en: generatedTitle,
        is_active: true,
      };

      try {
        await supabaseStore.saveMedia(newMedia);
      } catch (saveErr) {
        console.warn('Could not save media record:', saveErr);
      }

      setMediaList((prev) => [newMedia, ...prev]);
      if (multiple) {
        setSelectedItems((prev) => [
          ...prev,
          {
            url: result.publicUrl,
            alt_fr: generatedTitle,
            title_fr: generatedTitle,
          },
        ]);
      } else {
        setSelectedItem({
          url: result.publicUrl,
          alt_fr: generatedTitle,
          title_fr: generatedTitle,
        });
      }

      // Switch back to browse tab with new item selected
      setActiveTab('browse');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Échec du téléversement vers Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const categories = Array.from(
    new Set(mediaList.map((m) => m.category).filter(Boolean))
  );

  const filtered = mediaList.filter((m) => {
    const matchesSearch =
      !search ||
      m.title_fr?.toLowerCase().includes(search.toLowerCase()) ||
      m.description_fr?.toLowerCase().includes(search.toLowerCase());
    const matchesAlbum = selectedAlbum === 'all' || m.album_id === selectedAlbum;
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesAlbum && matchesCat;
  });

  const handleConfirm = () => {
    if (multiple) {
      if (selectedItems.length > 0) {
        if (onSelectMultiple) {
          onSelectMultiple(selectedItems);
        } else if (onSelect) {
          onSelect(selectedItems[0]);
        }
        onClose();
      }
    } else {
      if (selectedItem) {
        if (onSelect) {
          onSelect(selectedItem);
        }
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 font-heading flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#92278F]" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choisissez une ressource parmi les photos de la médiathèque ou importez un nouveau fichier
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 px-4 sm:px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'browse'
                ? 'border-[#92278F] text-[#92278F]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Médiathèque ({mediaList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'border-[#92278F] text-[#92278F]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Téléverser vers Supabase Storage</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[360px]">
          {activeTab === 'browse' ? (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par titre..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                  />
                </div>

                <div>
                  <select
                    value={selectedAlbum}
                    onChange={(e) => setSelectedAlbum(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                  >
                    <option value="all">Tous les albums</option>
                    {albums.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        {alb.title_fr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                  >
                    <option value="all">Toutes catégories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#92278F] animate-spin mb-3" />
                  <p className="text-xs text-gray-500 font-semibold">Chargement des médias...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-xl p-8">
                  <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">Aucun média trouvé</p>
                  <p className="text-[11px] text-gray-500 mt-1 mb-4">
                    Essayez de modifier vos filtres ou téléversez un nouveau fichier.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Téléverser une image</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.map((item) => {
                    const isSelected = multiple
                      ? selectedItems.some((s) => s.url === item.url)
                      : selectedItem?.url === item.url;
                    const itemOrder = multiple
                      ? selectedItems.findIndex((s) => s.url === item.url)
                      : -1;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-gray-100 ${
                          isSelected
                            ? 'border-[#92278F] ring-2 ring-[#92278F]/30 shadow-md scale-[1.02]'
                            : 'border-transparent hover:border-purple-300 hover:shadow-xs'
                        }`}
                      >
                        <img
                          src={item.thumbnail_url || item.url}
                          alt={item.title_fr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Selected badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 min-w-6 h-6 px-1.5 rounded-full bg-[#92278F] text-white flex items-center justify-center shadow-md text-[11px] font-bold">
                            {multiple ? (
                              <span>#{itemOrder + 1}</span>
                            ) : (
                              <Check className="w-4 h-4 stroke-[3]" />
                            )}
                          </div>
                        )}

                        {/* Title overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                          <p className="text-[11px] font-semibold truncate leading-tight">
                            {item.title_fr}
                          </p>
                          {item.category && (
                            <p className="text-[9px] text-gray-300 truncate">
                              {item.category}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Upload tab */
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="border-2 border-dashed border-[#92278F]/40 hover:border-[#92278F] rounded-2xl p-8 bg-purple-50/30 transition-colors">
                <div className="w-14 h-14 mx-auto rounded-full bg-purple-100 text-[#92278F] flex items-center justify-center mb-4">
                  {uploading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-gray-900 font-heading mb-1">
                  {uploading ? 'Téléversement vers Supabase...' : 'Téléverser un nouveau visuel'}
                </h4>
                <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">
                  Formats acceptés : PNG, JPG, WebP, GIF. Le fichier sera hébergé directement sur Supabase Storage.
                </p>

                {uploadError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-left">
                    {uploadError}
                  </div>
                )}

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold cursor-pointer shadow-md transition-all">
                  <Upload className="w-4 h-4 text-[#FF8C00]" />
                  <span>Sélectionner un fichier sur l’appareil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {multiple ? (
              selectedItems.length > 0 ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2 overflow-hidden shrink-0">
                    {selectedItems.slice(0, 4).map((item, idx) => (
                      <img
                        key={idx}
                        src={item.url}
                        alt="Miniature"
                        className="inline-block h-8 w-8 rounded-lg object-cover ring-2 ring-white shadow-2xs"
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {selectedItems.length} image{selectedItems.length > 1 ? 's' : ''} sélectionnée{selectedItems.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      Prêtes à être associées à la galerie
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-500 italic">
                  Cliquez sur les photos pour les sélectionner
                </span>
              )
            ) : selectedItem?.url ? (
              <>
                <img
                  src={selectedItem.url}
                  alt="Aperçu"
                  className="w-10 h-10 rounded-lg object-cover border border-gray-300 shrink-0 bg-white"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {selectedItem.title_fr || 'Image sélectionnée'}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate max-w-xs font-mono">
                    {selectedItem.url}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic">
                Aucune image sélectionnée
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={multiple ? selectedItems.length === 0 : !selectedItem?.url}
              className="px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>
                {multiple
                  ? `Valider la sélection (${selectedItems.length})`
                  : 'Valider la sélection'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string, alt?: string) => void;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
}

/**
 * Reusable Form Control that pairs an image preview, text URL input,
 * and button to open the MediaSelectorModal.
 */
export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  helpText,
  placeholder = 'https://... ou choisir dans la médiathèque',
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-gray-400 hover:text-red-600 transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Thumbnail Preview */}
        {value ? (
          <div className="relative group shrink-0">
            <img
              src={value}
              alt="Aperçu"
              className="w-12 h-12 rounded-lg object-contain p-0.5 border border-gray-200 bg-white shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity text-[10px] font-bold"
            >
              Changer
            </button>
          </div>
        ) : (
          <div
            onClick={() => setModalOpen(true)}
            className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#92278F] flex items-center justify-center text-gray-400 hover:text-[#92278F] cursor-pointer shrink-0 transition-colors bg-gray-50"
          >
            <ImageIcon className="w-5 h-5" />
          </div>
        )}

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
        />

        {/* Button to open Mediatheque modal */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#92278F] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Médiathèque</span>
        </button>
      </div>

      {helpText && <p className="text-[11px] text-gray-500">{helpText}</p>}

      {/* Modal */}
      <MediaSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentUrl={value}
        allowedTypes={DEFAULT_ALLOWED_TYPES}
        onSelect={(media) => {
          onChange(media.url, media.alt_fr);
        }}
      />
    </div>
  );
};

export { MultiImageGalleryField } from './MultiImageGalleryField';
export type { MultiImageGalleryFieldProps } from './MultiImageGalleryField';

