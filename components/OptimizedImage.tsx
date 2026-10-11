'use client';

import React, { useState } from 'react';
import Image from 'next/image';

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

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80';

/**
 * OptimizedImage - Composant universel haute performance pour APS-BÉNIN
 *
 * Fonctionnalités clés :
 * 1. Priorisation intelligente : LCP / Hero chargé en priority={true} (eager, pré-chargé).
 * 2. Chargement différé natif (loading="lazy") pour tout le contenu hors écran.
 * 3. Formats modernes (WebP/AVIF) avec dimensions optimisées automatiques et responsive `sizes`.
 * 4. Prévention du CLS (Cumulative Layout Shift) grâce à la réservation stricte de ratio d'affichage.
 * 5. Gestion robuste des erreurs de chargement avec fallback élégant sans casser la mise en page.
 * 6. Protection referrerPolicy="no-referrer" exigée par l'environnement.
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
  fallbackSrc = DEFAULT_FALLBACK,
  onClick,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const effectiveSrc = (hasError || !src) ? fallbackSrc : src;

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

  if (fill) {
    return (
      <div
        className={`relative overflow-hidden ${ratioClass} ${containerClassName}`}
        onClick={onClick}
      >
        <Image
          src={effectiveSrc}
          alt={alt || 'APS-BÉNIN'}
          fill
          priority={priority}
          sizes={sizes}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
          referrerPolicy="no-referrer"
          unoptimized={shouldUnoptimize}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        {!isLoaded && (
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
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
        referrerPolicy="no-referrer"
        unoptimized={shouldUnoptimize}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
