'use client';

import React, { useState } from 'react';
import { parseVideoUrl, getVideoEmbedUrl } from '@/lib/video-utils';
import { Play, ExternalLink, AlertCircle, Film } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title = 'Vidéo',
  poster,
  className = '',
  autoplay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [hasError, setHasError] = useState(false);

  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }

  const cleanUrl = url.trim();
  const info = parseVideoUrl(cleanUrl);

  if (info.platform === 'unknown') {
    return (
      <div
        className={`w-full aspect-video rounded-xl bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center border border-gray-800 ${className}`}
      >
        <Film className="w-10 h-10 text-[#FF8C00] mb-2" />
        <p className="text-xs font-bold text-gray-200 mb-1">{title}</p>
        <p className="text-[11px] text-gray-400 mb-4 max-w-sm">
          Format vidéo externe non lisible directement en ligne. Vous pouvez ouvrir le lien externe ci-dessous.
        </p>
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors"
        >
          <span>Consulter la vidéo</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // HTML5 native video (Supabase storage or direct video file)
  if (info.platform === 'storage' || info.platform === 'direct') {
    return (
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg ${className}`}>
        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-xs font-bold mb-1">Impossible de charger la vidéo</p>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-300 hover:underline flex items-center gap-1"
            >
              <span>Télécharger ou ouvrir la source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <video
            src={cleanUrl}
            poster={poster || info.defaultThumbnail}
            controls
            playsInline
            onError={() => setHasError(true)}
            className="w-full h-full object-contain"
          >
            Votre navigateur ne prend pas en charge la lecture vidéo.
          </video>
        )}
      </div>
    );
  }

  // Embedded video (YouTube, Vimeo)
  const embedUrl = getVideoEmbedUrl(cleanUrl, isPlaying);

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg ${className}`}>
      {!isPlaying && poster ? (
        <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#92278F] text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-[#FF8C00] transition-all">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-xs p-2 rounded-lg text-white text-xs font-bold truncate">
            {title}
          </div>
        </div>
      ) : (
        <iframe
          src={embedUrl || undefined}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
};
