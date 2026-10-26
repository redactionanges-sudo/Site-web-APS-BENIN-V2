'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage, getLocalizedText } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { PhotoAlbum, MediaItem } from '@/types';
import { Image as ImageIcon, Calendar, MapPin, X, ZoomIn, Folder, Camera, Film } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function PhotosMediathequePage() {
  const { language, t } = useLanguage();
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [activePhoto, setActivePhoto] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabaseStore.getAlbums(),
      supabaseStore.getPublicGalleryPhotos(),
    ])
      .then(([albumList, publicPhotos]) => {
        setAlbums(albumList);
        setMediaItems(publicPhotos);
      })
      .catch((err) => {
        console.error('Erreur chargement médiathèque publique:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter albums that actually contain public photos
  const availableAlbums = albums.filter((alb) =>
    mediaItems.some((m) => m.album_id === alb.id)
  );

  const filteredPhotos =
    selectedAlbumId === 'all'
      ? mediaItems
      : mediaItems.filter((m) => m.album_id === selectedAlbumId);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20">
                {language === 'en' ? 'Visual Archive' : 'Médiathèque Institutionnelle'}
              </span>
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10 text-xs">
                <span className="px-3 py-1 rounded-md bg-[#92278F] text-white font-bold flex items-center gap-1.5 shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Photos' : 'Photos'}</span>
                </span>
                <Link
                  href="/mediatheque/videos"
                  className="px-3 py-1 rounded-md text-gray-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Videos' : 'Vidéos'}</span>
                </Link>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Photo Albums & Galleries' : 'Albums & Galeries Photos'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'High-resolution field photographs documenting our initiatives, workshops, and community mobilization.'
                : 'Revivez en images les moments forts, les ateliers de terrain et l’engagement citoyen d’APS-BÉNIN à Comè et dans le Mono.'}
            </p>
          </div>
        </section>

        {/* Albums Filter Bar */}
        <section className="py-6 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                Albums :
              </span>
              <button
                type="button"
                onClick={() => setSelectedAlbumId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedAlbumId === 'all'
                    ? 'bg-[#92278F] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('common.filter_all')} ({mediaItems.length})
              </button>
              {availableAlbums.map((alb) => {
                const count = mediaItems.filter((m) => m.album_id === alb.id).length;
                return (
                  <button
                    key={alb.id}
                    type="button"
                    onClick={() => setSelectedAlbumId(alb.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selectedAlbumId === alb.id
                        ? 'bg-[#92278F] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {language === 'en' ? alb.title_en : alb.title_fr} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Photos Grid */}
        <section className="py-16 bg-white min-h-[400px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {loading ? (
              <div className="text-center py-20 text-gray-500 text-sm">
                Chargement de la médiathèque...
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 max-w-2xl mx-auto p-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#92278F] flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-900 font-heading mb-1.5">
                  {selectedAlbumId === 'all'
                    ? language === 'en'
                      ? 'No public photos published yet'
                      : 'Aucune photographie publique pour le moment'
                    : language === 'en'
                    ? 'No photos in this album'
                    : 'Aucune photographie répertoriée dans cet album'}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
                  {selectedAlbumId === 'all'
                    ? language === 'en'
                      ? 'The visual archive is currently curated. New field activities and community albums will be showcased shortly.'
                      : 'Les photographies de terrain et les albums d’activités communautaires autorisés pour la médiathèque publique seront publiés ici prochainement.'
                    : language === 'en'
                    ? 'Please select another album or view all photos.'
                    : 'Sélectionnez un autre album ou affichez toutes les photos.'}
                </p>
                {selectedAlbumId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAlbumId('all')}
                    className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-[#92278F] text-white hover:bg-[#741772] transition-colors"
                  >
                    Voir toutes les photos ({mediaItems.length})
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredPhotos.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    whileHover="hover"
                    onClick={() => setActivePhoto(item)}
                    className="group relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="h-64 w-full overflow-hidden relative">
                      <OptimizedImage
                        src={item.thumbnail_url || item.url}
                        alt={item.alt_fr || item.title_fr}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <motion.div
                      variants={{
                        hover: { opacity: 1, y: 0 },
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 text-white"
                    >
                      <div className="flex items-center justify-between text-xs text-orange-300 mb-1">
                        <span className="font-semibold">{item.category}</span>
                        <motion.div
                          variants={{
                            hover: { scale: 1.15, rotate: 5 },
                          }}
                          transition={{ duration: 0.2 }}
                          className="p-1.5 rounded-full bg-white/20 backdrop-blur-xs text-white"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </motion.div>
                      </div>
                      <h3 className="font-bold text-base text-white line-clamp-2 font-heading leading-tight mb-2">
                        {getLocalizedText(item.title_fr, item.title_en, language)}
                      </h3>
                      <div className="flex items-center gap-4 text-[11px] text-gray-300 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#FF8C00]" />
                          {item.date}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[#FF8C00]" />
                            {item.location}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Photo Lightbox Modal */}
        <AnimatePresence>
          {activePhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePhoto(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-2xl overflow-hidden max-w-4xl w-full border border-gray-800 shadow-2xl relative"
              >
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="max-h-[70vh] w-full bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.alt_fr || activePhoto.title_fr}
                    className="max-h-[70vh] w-auto max-w-full object-contain"
                  />
                </div>

                <div className="p-6 text-white bg-gray-900 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs text-[#FF8C00] font-semibold mb-2">
                    <span>{activePhoto.category}</span>
                    <span className="font-mono text-gray-400">{activePhoto.date}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-heading mb-2">
                    {getLocalizedText(activePhoto.title_fr, activePhoto.title_en, language)}
                  </h3>
                  {(activePhoto.description_fr || activePhoto.description_en) && (
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">
                      {getLocalizedText(activePhoto.description_fr, activePhoto.description_en, language)}
                    </p>
                  )}
                  {activePhoto.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
                      <span>{activePhoto.location}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
