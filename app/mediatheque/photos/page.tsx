'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { PhotoAlbum, MediaItem } from '@/types';
import { Image as ImageIcon, Calendar, MapPin, X, ZoomIn, Folder } from 'lucide-react';

export default function PhotosMediathequePage() {
  const { language, t } = useLanguage();
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [activePhoto, setActivePhoto] = useState<MediaItem | null>(null);

  useEffect(() => {
    supabaseStore.getAlbums().then(setAlbums);
    supabaseStore.getMedia().then((items) => {
      setMediaItems(items.filter((m) => m.type === 'photo'));
    });
  }, []);

  const filteredPhotos = selectedAlbumId === 'all'
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
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Visual Archive' : 'Médiathèque Institutionnelle'}
            </span>
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
              {albums.map((alb) => (
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
                  {language === 'en' ? alb.title_en : alb.title_fr}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Photos Grid */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {filteredPhotos.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-base text-gray-600 font-medium">
                  {language === 'en'
                    ? 'No photos found in this album.'
                    : 'Aucune photographie répertoriée dans cet album pour le moment.'}
                </p>
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
                      <motion.img
                        src={item.url}
                        alt={item.alt_fr || item.title_fr}
                        className="w-full h-full object-cover"
                        variants={{
                          hover: { scale: 1.08 },
                        }}
                        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                        loading="lazy"
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
                      <h3 className="font-bold text-sm line-clamp-2">
                        {language === 'en' ? item.title_en : item.title_fr}
                      </h3>
                      {item.location && (
                        <p className="text-[11px] text-gray-300 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#FF8C00]" />
                          <span>{item.location}</span>
                        </p>
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {activePhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActivePhoto(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]"
              >
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-[#FF8C00] transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex-1 overflow-hidden bg-black flex items-center justify-center p-2">
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.alt_fr || activePhoto.title_fr}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>

                <div className="p-6 bg-gray-900 text-white space-y-2 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs text-orange-400">
                    <span className="font-bold uppercase tracking-wider">{activePhoto.category}</span>
                    <span>{activePhoto.date}</span>
                  </div>
                  <h2 className="text-lg font-bold">
                    {language === 'en' ? activePhoto.title_en : activePhoto.title_fr}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {language === 'en' ? activePhoto.description_en : activePhoto.description_fr}
                  </p>
                  {activePhoto.location && (
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
                      <span>Lieu : {activePhoto.location}</span>
                    </p>
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
