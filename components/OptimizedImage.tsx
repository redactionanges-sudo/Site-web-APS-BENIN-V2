'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { resolveMediaUrl } from '@/lib/supabase';

export interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
  objectFit?: 'cover' | 'contain';
  fallbackSrc?: string;
  onClick?: () => void;
}

/**
 * OptimizedImage - Composant universel haute performance pour APS-BÉNIN
 * Respecte scrupuleusement la charte institutionnelle : aucune image fictive ni Unsplash en fallback.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  containerClassName = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  aspectRatio = 'auto',
  objectFit = 'cover',
  fallbackSrc = '',
  onClick,
}) => {
  const [useRawImg, setUseRawImg] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Réinitialiser les états si la source change dynamiquement
  useEffect(() => {
    setUseRawImg(false);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const rawSrc = resolveMediaUrl(src);
  const effectiveSrc = hasError || !rawSrc ? (fallbackSrc ? resolveMediaUrl(fallbackSrc) : '') : rawSrc;

  // Déterminer les classes de conteneur d'aspect ratio
  let ratioClass = '';
  switch (aspectRatio) {
    case 'video':
      ratioClass = 'aspect-video';
      break;
    case 'square':
      ratioClass = 'aspect-square';
      break;
    case 'portrait':
      ratioClass = 'aspect-[3/4]';
      break;
    case 'auto':
    default:
      ratioClass = '';
      break;
  }

  // Détection des URLs locales relatives vs distantes
  const isRemote = effectiveSrc.startsWith('http://') || effectiveSrc.startsWith('https://');
  const isSupabaseOrUnsplashOrPicsum =
    effectiveSrc.includes('supabase.co') ||
    effectiveSrc.includes('images.unsplash.com') ||
    effectiveSrc.includes('picsum.photos');

  // Si l'image est distante mais hors domaines configurés, on utilise unoptimized={true} pour éviter les blocages Next.js
  const shouldUnoptimize = !isSupabaseOrUnsplashOrPicsum && isRemote;

  // Emplacement neutre, discret et institutionnel lorsqu'aucun média réel n'est renseigné
  if (!effectiveSrc) {
    if (fill) {
      return (
        <div
          className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-purple-50/70 via-gray-50 to-orange-50/40 border border-purple-100/50 flex items-center justify-center ${ratioClass} ${containerClassName}`}
          onClick={onClick}
          role="img"
          aria-label={alt || 'APS-BÉNIN'}
        >
          <div className="text-center p-4">
            <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-[#92278F]/10 text-[#92278F] flex items-center justify-center border border-[#92278F]/20">
              <span className="font-extrabold text-[11px] tracking-wider">APS</span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 line-clamp-1">{alt || 'APS-BÉNIN'}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50/70 via-gray-50 to-orange-50/40 border border-purple-100/50 ${ratioClass} ${containerClassName}`}
        style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '180px' }}
        onClick={onClick}
        role="img"
        aria-label={alt || 'APS-BÉNIN'}
      >
        <div className="text-center p-3">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-[#92278F]/10 text-[#92278F] flex items-center justify-center border border-[#92278F]/20">
            <span className="font-extrabold text-[10px] tracking-wider">APS</span>
          </div>
          <p className="text-[10px] font-medium text-gray-500 line-clamp-1">{alt || 'APS-BÉNIN'}</p>
        </div>
      </div>
    );
  }

  // Fallback direct <img> natif si le proxy Next.js a rencontré un problème sur l'URL source réelle
  if (useRawImg && !hasError && rawSrc) {
    if (fill) {
      return (
        <div
          className={`relative w-full h-full overflow-hidden ${ratioClass} ${containerClassName}`}
          onClick={onClick}
        >
          <img
            src={rawSrc}
            alt={alt || 'APS-BÉNIN'}
            className={`w-full h-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        </div>
      );
    }

    return (
      <div
        className={`relative inline-block overflow-hidden ${ratioClass} ${containerClassName}`}
        onClick={onClick}
      >
        <img
          src={rawSrc}
          alt={alt || 'APS-BÉNIN'}
          width={width || 600}
          height={height || 400}
          className={`w-full h-auto ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  if (fill) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden ${ratioClass} ${containerClassName}`}
        onClick={onClick}
      >
        <Image
          src={effectiveSrc}
          alt={alt || 'APS-BÉNIN'}
          fill
          priority={priority}
          sizes={sizes}
          className={`${priority ? '' : 'transition-opacity duration-300'} ${
            priority || isLoaded ? 'opacity-100' : 'opacity-0'
          } ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
          referrerPolicy="no-referrer"
          unoptimized={shouldUnoptimize}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            if (!useRawImg && rawSrc && rawSrc !== fallbackSrc) {
              setUseRawImg(true);
            } else {
              setHasError(true);
            }
          }}
        />
        {!isLoaded && !priority && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block overflow-hidden ${ratioClass} ${containerClassName}`}
      onClick={onClick}
    >
      <Image
        src={effectiveSrc}
        alt={alt || 'APS-BÉNIN'}
        width={width || 600}
        height={height || 400}
        priority={priority}
        sizes={sizes}
        className={`${priority ? '' : 'transition-opacity duration-300'} ${
          priority || isLoaded ? 'opacity-100' : 'opacity-0'
        } ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
        referrerPolicy="no-referrer"
        unoptimized={shouldUnoptimize}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!useRawImg && rawSrc && rawSrc !== fallbackSrc) {
            setUseRawImg(true);
          } else {
            setHasError(true);
          }
        }}
      />
      {!isLoaded && !priority && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
