'use client';

import React, { useState } from 'react';
import { MediaSelectorModal, SelectedMedia } from './MediaSelectorModal';
import {
  Image as ImageIcon,
  Plus,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Star,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface MultiImageGalleryFieldProps {
  label?: string;
  description?: string;
  images: string[];
  onChange: (images: string[]) => void;
  onSetMainImage?: (url: string) => void;
  mainImageUrl?: string;
  maxImages?: number;
}

/**
 * Reusable Component for Managing Multi-Image Galleries.
 * Allows adding multiple images from the Médiathèque, reordering them,
 * removing them from the association without deleting from Storage,
 * and setting any gallery image as the main/cover image.
 */
export const MultiImageGalleryField: React.FC<MultiImageGalleryFieldProps> = ({
  label = 'Galerie d’images supplémentaires',
  description = 'Sélectionnez plusieurs images depuis la Médiathèque pour enrichir ce contenu. Les fichiers ne sont jamais dupliqués.',
  images = [],
  onChange,
  onSetMainImage,
  mainImageUrl,
  maxImages,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalConfirm = (selected: SelectedMedia[]) => {
    const currentList = Array.isArray(images) ? images : [];
    const newUrls = selected
      .map((s) => s.url)
      .filter((url) => !currentList.includes(url));
    const merged = [...currentList, ...newUrls];
    onChange(maxImages ? merged.slice(0, maxImages) : merged);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const nextList = [...images];
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;
    onChange(nextList);
  };

  const removeImage = (index: number) => {
    const nextList = images.filter((_, i) => i !== index);
    onChange(nextList);
  };

  const safeImages = Array.isArray(images) ? images : [];

  return (
    <div className="space-y-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5 font-heading">
            <Layers className="w-4 h-4 text-[#92278F]" />
            <span>{label}</span>
            {safeImages.length > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-[#92278F] font-bold">
                {safeImages.length} {safeImages.length > 1 ? 'photos' : 'photo'}
              </span>
            )}
          </label>
          {description && (
            <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter depuis la Médiathèque</span>
        </button>
      </div>

      {/* Grid of gallery images */}
      {safeImages.length === 0 ? (
        <div
          onClick={() => setModalOpen(true)}
          className="border-2 border-dashed border-gray-300 hover:border-[#92278F] rounded-xl p-6 text-center cursor-pointer transition-colors bg-white group"
        >
          <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-[#92278F] mx-auto mb-2 transition-colors" />
          <p className="text-xs font-bold text-gray-700 group-hover:text-[#92278F] transition-colors">
            Aucune image supplémentaire dans la galerie
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
            Cliquez pour ouvrir la Médiathèque et sélectionner plusieurs photos à associer à ce contenu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {safeImages.map((url, idx) => {
            const isMain = mainImageUrl && mainImageUrl === url;
            return (
              <div
                key={`${url}-${idx}`}
                className={`group relative rounded-xl border bg-white overflow-hidden shadow-2xs flex flex-col transition-all ${
                  isMain
                    ? 'border-[#92278F] ring-2 ring-[#92278F]/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={url}
                    alt={`Galerie ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Order badge */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[10px] font-mono font-bold shadow-xs">
                    #{idx + 1}
                  </div>

                  {/* Is main badge */}
                  {isMain && (
                    <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-[#92278F] text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-yellow-300" />
                      <span>Couverture</span>
                    </div>
                  )}

                  {/* External link preview */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    title="Voir l'image originale"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Toolbar controls */}
                <div className="p-2 bg-white flex items-center justify-between border-t border-gray-100 gap-1">
                  {/* Reorder buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, -1)}
                      title="Déplacer vers la gauche"
                      className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === safeImages.length - 1}
                      onClick={() => moveImage(idx, 1)}
                      title="Déplacer vers la droite"
                      className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {onSetMainImage && !isMain && (
                      <button
                        type="button"
                        onClick={() => onSetMainImage(url)}
                        title="Définir comme image principale de couverture"
                        className="p-1 rounded text-gray-500 hover:text-[#92278F] hover:bg-purple-50 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      title="Retirer de la galerie (le fichier reste conservé dans la Médiathèque)"
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multiple Selector Modal */}
      <MediaSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        multiple={true}
        initialSelectedUrls={safeImages}
        onSelectMultiple={handleModalConfirm}
        title="Sélectionner des images pour la galerie"
      />
    </div>
  );
};
