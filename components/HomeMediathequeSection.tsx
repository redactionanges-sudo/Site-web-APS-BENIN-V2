'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { MediaItem } from '@/types';
import {
  parseVideoUrl,
  getVideoThumbnail,
  getVideoPlatformLabel,
  getVideoEmbedUrl,
} from '@/lib/video-utils';
import {
  Play,
  Image as ImageIcon,
  ArrowRight,
  X,
  Calendar,
  MapPin,
  Film,
  Sparkles,
  Video,
} from 'lucide-react';

export const HomeMediathequeSection: React.FC = () => {
  const { language, t } = useLanguage();
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<MediaItem | null>(null);

  const loadMedia = () => {
    supabaseStore.getMedia().then((items) => {
      setMediaList(items || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadMedia();

    const handleSync = () => {
      loadMedia();
    };

    window.addEventListener('aps_media_changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('aps_media_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filter only published / active media items
  const publishedVideos = useMemo(() => {
    return mediaList
      .filter((m) => m.type === 'video' && m.is_active !== false)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [mediaList]);

  const publishedPhotos = useMemo(() => {
    return mediaList
      .filter((m) => m.type === 'photo' && m.is_active !== false)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [mediaList]);

  // Featured video is the latest published video
  const featuredVideo = publishedVideos.length > 0 ? publishedVideos[0] : null;

  // Up to 2 recent published photos
  const featuredPhotos = useMemo(() => {
    return publishedPhotos.slice(0, 2);
  }, [publishedPhotos]);

  // Video embed info when modal is open
  const playingEmbedUrl = useMemo(() => {
    if (!playingVideo) return null;
    return getVideoEmbedUrl(playingVideo.url, true);
  }, [playingVideo]);

  const playingInfo = useMemo(() => {
    if (!playingVideo) return null;
    return parseVideoUrl(playingVideo.url);
  }, [playingVideo]);

  return (
    <section className="py-20 bg-gray-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF8C00]">
              {t('media.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 font-heading">
              {t('media.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mt-2">
              {t('media.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/mediatheque/photos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>{t('media.view_photos')}</span>
            </Link>
            <Link
              href="/mediatheque/videos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>{t('media.view_videos')}</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Media Grid: 2 Real Photos + 1 Real Video Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Photo 1 */}
          {featuredPhotos[0] ? (
            <Link
              href="/mediatheque/photos"
              className="group relative rounded-2xl overflow-hidden bg-gray-800 h-64 border border-gray-700/80 block"
            >
              <motion.img
                src={featuredPhotos[0].url}
                alt={
                  language === 'en'
                    ? featuredPhotos[0].alt_en || featuredPhotos[0].title_en
                    : featuredPhotos[0].alt_fr || featuredPhotos[0].title_fr
                }
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5">
                {featuredPhotos[0].category && (
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    {featuredPhotos[0].category}
                  </span>
                )}
                <h4 className="font-bold text-sm text-white line-clamp-2">
                  {language === 'en'
                    ? featuredPhotos[0].title_en || featuredPhotos[0].title_fr
                    : featuredPhotos[0].title_fr}
                </h4>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 h-64 flex flex-col items-center justify-center p-6 text-center">
              <ImageIcon className="w-10 h-10 text-gray-500 mb-2" />
              <p className="text-xs text-gray-400">
                {language === 'en'
                  ? 'Official photo gallery being updated.'
                  : 'Galerie photo officielle en cours d’actualisation.'}
              </p>
            </div>
          )}

          {/* Photo 2 */}
          {featuredPhotos[1] ? (
            <Link
              href="/mediatheque/photos"
              className="group relative rounded-2xl overflow-hidden bg-gray-800 h-64 border border-gray-700/80 block"
            >
              <motion.img
                src={featuredPhotos[1].url}
                alt={
                  language === 'en'
                    ? featuredPhotos[1].alt_en || featuredPhotos[1].title_en
                    : featuredPhotos[1].alt_fr || featuredPhotos[1].title_fr
                }
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5">
                {featuredPhotos[1].category && (
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    {featuredPhotos[1].category}
                  </span>
                )}
                <h4 className="font-bold text-sm text-white line-clamp-2">
                  {language === 'en'
                    ? featuredPhotos[1].title_en || featuredPhotos[1].title_fr
                    : featuredPhotos[1].title_fr}
                </h4>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 h-64 flex flex-col items-center justify-center p-6 text-center">
              <ImageIcon className="w-10 h-10 text-gray-500 mb-2" />
              <p className="text-xs text-gray-400">
                {language === 'en'
                  ? 'Official photo gallery being updated.'
                  : 'Galerie photo officielle en cours d’actualisation.'}
              </p>
            </div>
          )}

          {/* Real Published Video Card */}
          {featuredVideo ? (
            (() => {
              const videoThumb = getVideoThumbnail(
                featuredVideo.url,
                featuredVideo.thumbnail_url
              );
              const platformLabel = getVideoPlatformLabel(
                featuredVideo.video_platform || parseVideoUrl(featuredVideo.url).platform
              );

              return (
                <div className="group relative rounded-2xl overflow-hidden bg-gray-800 h-64 border border-gray-700/80 flex flex-col justify-between">
                  {videoThumb ? (
                    <motion.img
                      src={videoThumb}
                      alt={
                        language === 'en'
                          ? featuredVideo.alt_en || featuredVideo.title_en
                          : featuredVideo.alt_fr || featuredVideo.title_fr
                      }
                      className="absolute inset-0 w-full h-full object-cover"
                      whileHover={{ scale: 1.06 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#370e36] to-gray-950" />
                  )}

                  {/* Top Badge: Platform label */}
                  <div className="relative z-10 p-4 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${platformLabel.color}`}
                    >
                      {platformLabel.label}
                    </span>
                    {featuredVideo.date && (
                      <span className="text-[11px] text-white/80 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#FF8C00]" />
                        {featuredVideo.date}
                      </span>
                    )}
                  </div>

                  {/* Centered Play Trigger Button */}
                  <div className="absolute inset-0 z-10 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setPlayingVideo(featuredVideo)}
                      className="w-14 h-14 rounded-full bg-[#92278F] hover:bg-[#741772] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform border-2 border-[#FF8C00] cursor-pointer"
                      aria-label={
                        language === 'en'
                          ? `Watch video: ${featuredVideo.title_en || featuredVideo.title_fr}`
                          : `Regarder la vidéo : ${featuredVideo.title_fr}`
                      }
                    >
                      <Play className="w-6 h-6 fill-current ml-1 text-white" />
                    </button>
                  </div>

                  {/* Bottom Caption */}
                  <div className="relative z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-5 pt-8">
                    <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-wider mb-1 block">
                      {featuredVideo.category ||
                        (language === 'en' ? 'Featured Video' : 'Vidéo à la une')}
                    </span>
                    <h4 className="font-bold text-sm text-white line-clamp-1">
                      {language === 'en'
                        ? featuredVideo.title_en || featuredVideo.title_fr
                        : featuredVideo.title_fr}
                    </h4>
                  </div>
                </div>
              );
            })()
          ) : (
            /* Sober institutional placeholder when no video is published — Zero fake video */
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/50 h-64 flex flex-col justify-between p-6">
              <div className="flex items-center gap-2 text-orange-400">
                <Video className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {language === 'en' ? 'Video Reportages' : 'Reportages Vidéo'}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-300 leading-relaxed">
                  {language === 'en'
                    ? 'Official video reports and field testimonies are being prepared by the APS-BENIN communications team.'
                    : 'Les reportages vidéo et témoignages de terrain sont en cours de mise en ligne par l’équipe de communication APS-BÉNIN.'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {language === 'en'
                    ? 'Discover all photo albums in our official media library.'
                    : 'Consultez l’ensemble des albums photos dans notre médiathèque officielle.'}
                </p>
              </div>

              <Link
                href="/mediatheque/photos"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#FF8C00] hover:text-orange-300 transition-colors"
              >
                <span>{language === 'en' ? 'Browse photo albums' : 'Explorer les albums photos'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Accessible On-Demand Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setPlayingVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl relative"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-950">
                <div className="flex items-center gap-2.5 truncate mr-4">
                  <Film className="w-4 h-4 text-[#FF8C00] shrink-0" />
                  <span className="font-bold text-sm text-white truncate">
                    {language === 'en'
                      ? playingVideo.title_en || playingVideo.title_fr
                      : playingVideo.title_fr}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayingVideo(null)}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Fermer le lecteur vidéo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* On-Demand Player Frame */}
              <div className="relative aspect-video w-full bg-black">
                {playingEmbedUrl ? (
                  <iframe
                    src={playingEmbedUrl}
                    title={playingVideo.title_fr}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : playingInfo?.platform === 'direct' ||
                  playingInfo?.platform === 'storage' ? (
                  <video
                    src={playingVideo.url}
                    controls
                    autoPlay
                    className="w-full h-full"
                  >
                    Votre navigateur ne prend pas en charge la lecture vidéo.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-sm text-gray-300 mb-4">
                      {language === 'en'
                        ? 'Playback directly in the page is unavailable for this link.'
                        : 'La lecture intégrée n’est pas disponible pour ce format de lien.'}
                    </p>
                    <a
                      href={playingVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-semibold"
                    >
                      <span>{language === 'en' ? 'Open video externally' : 'Ouvrir la vidéo sur la plateforme'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Footer Description */}
              {(playingVideo.description_fr || playingVideo.location) && (
                <div className="p-4 bg-gray-950/70 border-t border-gray-800 text-xs text-gray-300 flex items-center justify-between gap-4">
                  <p className="line-clamp-2">
                    {language === 'en'
                      ? playingVideo.description_en || playingVideo.description_fr
                      : playingVideo.description_fr}
                  </p>
                  {playingVideo.location && (
                    <span className="shrink-0 flex items-center gap-1 text-orange-400 text-[11px]">
                      <MapPin className="w-3 h-3" />
                      {playingVideo.location}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
