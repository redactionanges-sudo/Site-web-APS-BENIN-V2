'use client';

import React, { useState } from 'react';
import { MediaSelectorModal, SelectedMedia } from './MediaSelectorModal';
import {
  parseVideoUrl,
  getVideoThumbnail,
  getVideoPlatformLabel,
  getVideoEmbedUrl,
} from '@/lib/video-utils';
import {
  Film,
  Play,
  X,
  Plus,
  ArrowLeft,
  ArrowRight,
  Trash2,
  ExternalLink,
  Video,
} from 'lucide-react';

export interface VideoPickerFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
}

export const VideoPickerField: React.FC<VideoPickerFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  helpText = 'Lien YouTube, Vimeo ou URL d’une vidéo hébergée dans la Médiathèque.',
  placeholder = 'https://www.youtube.com/watch?v=... ou choisir dans la médiathèque',
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const cleanVal = (value || '').trim();
  const parsed = parseVideoUrl(cleanVal);
  const thumbnail = cleanVal ? getVideoThumbnail(cleanVal) : null;
  const platformLabel = cleanVal ? getVideoPlatformLabel(cleanVal) : null;
  const embedUrl = cleanVal ? getVideoEmbedUrl(cleanVal, false) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {cleanVal && (
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
        {cleanVal ? (
          <div className="relative group shrink-0 w-14 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-900 shadow-2xs flex items-center justify-center">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt="Aperçu vidéo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Video className="w-5 h-5 text-gray-400" />
            )}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              title="Tester la lecture"
              className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setModalOpen(true)}
            className="w-14 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#92278F] flex items-center justify-center text-gray-400 hover:text-[#92278F] cursor-pointer shrink-0 transition-colors bg-gray-50"
            title="Choisir une vidéo de la médiathèque"
          >
            <Film className="w-5 h-5" />
          </div>
        )}

        {/* Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
          />
          {platformLabel && (
            <span className={`absolute right-2.5 top-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${platformLabel.color}`}>
              {platformLabel.label}
            </span>
          )}
        </div>

        {/* Button to open Mediatheque modal */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#92278F] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Médiathèque</span>
        </button>
      </div>

      {helpText && <p className="text-[11px] text-gray-500">{helpText}</p>}

      {/* Modal Médiathèque Vidéos */}
      <MediaSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentUrl={value}
        allowedTypes={['video']}
        title="Sélectionner une vidéo de la Médiathèque"
        onSelect={(media) => {
          onChange(media.url);
          setModalOpen(false);
        }}
      />

      {/* Video Preview Modal */}
      {previewOpen && cleanVal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <Film className="w-4 h-4 text-[#FF8C00]" />
                Aperçu de la vidéo
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {parsed.platform === 'youtube' || parsed.platform === 'vimeo' ? (
                embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <p className="text-xs text-white">Impossible de charger le lecteur.</p>
                )
              ) : (
                <video
                  src={cleanVal}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Votre navigateur ne supporte pas la lecture de cette vidéo.
                </video>
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[11px] text-gray-600 truncate max-w-md">
                {cleanVal}
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-3 py-1 text-xs font-bold bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface MultiVideoPickerFieldProps {
  label?: string;
  description?: string;
  videos: string[];
  onChange: (videos: string[]) => void;
  maxVideos?: number;
}

export const MultiVideoPickerField: React.FC<MultiVideoPickerFieldProps> = ({
  label = 'Vidéos associées',
  description = 'Ajoutez une ou plusieurs vidéos (YouTube, Vimeo, ou vidéos de la Médiathèque) pour enrichir cette publication.',
  videos = [],
  onChange,
  maxVideos,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [previewingVideo, setPreviewingVideo] = useState<string | null>(null);

  const safeVideos = Array.isArray(videos) ? videos : [];

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (safeVideos.includes(trimmed)) {
      setUrlInput('');
      return;
    }
    const updated = [...safeVideos, trimmed];
    onChange(maxVideos ? updated.slice(0, maxVideos) : updated);
    setUrlInput('');
  };

  const handleModalConfirm = (selected: SelectedMedia[]) => {
    const newUrls = selected
      .map((s) => s.url)
      .filter((url) => !safeVideos.includes(url));
    const merged = [...safeVideos, ...newUrls];
    onChange(maxVideos ? merged.slice(0, maxVideos) : merged);
    setModalOpen(false);
  };

  const moveVideo = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= safeVideos.length) return;
    const nextList = [...safeVideos];
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;
    onChange(nextList);
  };

  const removeVideo = (index: number) => {
    onChange(safeVideos.filter((_, i) => i !== index));
  };

  const previewEmbedUrl = previewingVideo ? getVideoEmbedUrl(previewingVideo, false) : null;
  const previewParsed = previewingVideo ? parseVideoUrl(previewingVideo) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-gray-700">
            {label}
            {safeVideos.length > 0 && (
              <span className="ml-1 text-[11px] font-normal text-purple-700">
                ({safeVideos.length} vidéo{safeVideos.length > 1 ? 's' : ''})
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#92278F] text-xs font-bold transition-colors shrink-0 self-start sm:self-auto"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Choisir depuis la Médiathèque</span>
        </button>
      </div>

      {/* Direct URL input bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          placeholder="Ou coller une URL vidéo (YouTube, Vimeo, MP4)..."
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="px-3 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Videos List */}
      {safeVideos.length === 0 ? (
        <div
          onClick={() => setModalOpen(true)}
          className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-purple-50/20"
        >
          <Film className="w-6 h-6 text-gray-300 mx-auto mb-1" />
          <p className="text-xs font-semibold text-gray-600">
            Aucune vidéo associée pour l’instant
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Cliquez pour importer depuis la Médiathèque ou collez un lien ci-dessus.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeVideos.map((videoUrl, idx) => {
            const thumb = getVideoThumbnail(videoUrl);
            const platform = getVideoPlatformLabel(videoUrl);
            return (
              <div
                key={`${videoUrl}-${idx}`}
                className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 bg-white hover:border-purple-200 shadow-2xs transition-all group"
              >
                {/* Thumbnail */}
                <div className="relative shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={`Vidéo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="w-5 h-5 text-gray-400" />
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewingVideo(videoUrl)}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Lire la vidéo"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs ${platform.color}`}>
                      {platform.label}
                    </span>
                    <span className="text-[10px] text-gray-400">Vidéo #{idx + 1}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-800 truncate mt-0.5">
                    {videoUrl}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewingVideo(videoUrl)}
                    title="Tester la lecture"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#92278F] hover:bg-purple-50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => moveVideo(idx, -1)}
                      title="Déplacer vers le haut"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  )}
                  {idx < safeVideos.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveVideo(idx, 1)}
                      title="Déplacer vers le bas"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeVideo(idx)}
                    title="Retirer cette vidéo"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Médiathèque Video Picker Modal */}
      <MediaSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        allowedTypes={['video']}
        multiple={true}
        initialSelectedUrls={safeVideos}
        title="Sélectionner des vidéos depuis la Médiathèque"
        onSelectMultiple={handleModalConfirm}
      />

      {/* Video Preview Modal */}
      {previewingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <Film className="w-4 h-4 text-[#FF8C00]" />
                Aperçu de la vidéo
              </span>
              <button
                type="button"
                onClick={() => setPreviewingVideo(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              {previewParsed?.platform === 'youtube' || previewParsed?.platform === 'vimeo' ? (
                previewEmbedUrl ? (
                  <iframe
                    src={previewEmbedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <p className="text-xs text-white">Impossible de charger le lecteur.</p>
                )
              ) : (
                <video
                  src={previewingVideo}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Votre navigateur ne supporte pas la lecture de cette vidéo.
                </video>
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[11px] text-gray-600 truncate max-w-md">
                {previewingVideo}
              </span>
              <button
                type="button"
                onClick={() => setPreviewingVideo(null)}
                className="px-3 py-1 text-xs font-bold bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
