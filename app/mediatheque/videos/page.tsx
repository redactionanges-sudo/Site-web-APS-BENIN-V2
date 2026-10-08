'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { MediaItem, PhotoAlbum, ProjectItem } from '@/types';
import {
  parseVideoUrl,
  getVideoThumbnail,
  getVideoPlatformLabel,
  DEFAULT_VIDEO_FALLBACK_POSTER,
} from '@/lib/video-utils';
import {
  Play,
  Calendar,
  MapPin,
  Film,
  Search,
  Filter,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Camera,
  FolderOpen,
  Folder,
} from 'lucide-react';

export default function VideosMediathequePage() {
  const { language, t } = useLanguage();
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected video for modal playback (on-demand loading)
  const [playingVideo, setPlayingVideo] = useState<MediaItem | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    Promise.all([
      supabaseStore.getMedia(),
      supabaseStore.getAlbums(),
      supabaseStore.getProjects(),
    ]).then(([mediaItems, albumItems, projectItems]) => {
      // Only active videos
      const vidItems = mediaItems.filter(
        (m) => m.type === 'video' && m.is_active !== false
      );
      setVideos(vidItems);
      setAlbums(albumItems);
      setProjects(projectItems);
      setLoading(false);
    });
  }, []);

  // Filtered video list
  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      // Search query
      const matchesSearch =
        !search ||
        vid.title_fr.toLowerCase().includes(search.toLowerCase()) ||
        (vid.title_en && vid.title_en.toLowerCase().includes(search.toLowerCase())) ||
        (vid.description_fr && vid.description_fr.toLowerCase().includes(search.toLowerCase())) ||
        (vid.category && vid.category.toLowerCase().includes(search.toLowerCase())) ||
        (vid.location && vid.location.toLowerCase().includes(search.toLowerCase()));

      // Album filter
      const matchesAlbum =
        selectedAlbum === 'all' || vid.album_id === selectedAlbum;

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || vid.category === selectedCategory;

      return matchesSearch && matchesAlbum && matchesCategory;
    });
  }, [videos, search, selectedAlbum, selectedCategory]);

  // Categories present in videos
  const availableCategories = useMemo(() => {
    return Array.from(new Set(videos.map((v) => v.category).filter(Boolean)));
  }, [videos]);

  // Parsed info of currently playing video
  const playingInfo = useMemo(() => {
    if (!playingVideo) return null;
    return parseVideoUrl(playingVideo.url);
  }, [playingVideo]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20">
                {language === 'en' ? 'Médiathèque • Audiovisual' : 'Médiathèque • Audiovisuel'}
              </span>
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10 text-xs">
                <Link
                  href="/mediatheque/photos"
                  className="px-3 py-1 rounded-md text-gray-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Photos' : 'Photos'}</span>
                </Link>
                <span className="px-3 py-1 rounded-md bg-[#92278F] text-white font-bold flex items-center gap-1.5 shadow-xs">
                  <Film className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Videos' : 'Vidéos'}</span>
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Documentaries & Video Stories' : 'Reportages & Vidéos'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3 leading-relaxed">
              {language === 'en'
                ? 'Watch field testimonies, community campaigns, and impact stories across our intervention zones in Benin.'
                : 'Découvrez les témoignages des bénéficiaires, les plaidoyers pour les droits des femmes et la couverture de nos actions de terrain.'}
            </p>
          </div>
        </section>

        {/* Toolbar: Search & Filters */}
        <section className="py-6 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search videos by title or topic...' : 'Rechercher une vidéo par titre, sujet...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:border-[#92278F] outline-none shadow-2xs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {albums.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-500">
                      {language === 'en' ? 'Activity / Album:' : 'Activité / Album :'}
                    </span>
                    <select
                      value={selectedAlbum}
                      onChange={(e) => setSelectedAlbum(e.target.value)}
                      className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer max-w-[180px] truncate"
                    >
                      <option value="all">{language === 'en' ? 'All activities' : 'Toutes les activités'}</option>
                      {albums.map((alb) => (
                        <option key={alb.id} value={alb.id}>
                          {alb.title_fr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {availableCategories.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-500">
                      {language === 'en' ? 'Category:' : 'Catégorie :'}
                    </span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                    >
                      <option value="all">{language === 'en' ? 'All' : 'Toutes'}</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <span className="text-xs font-bold text-gray-500">
                  {filteredVideos.length} {language === 'en' ? 'video(s)' : 'vidéo(s)'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Video Grid (Lazy Loading: Only thumbnails are loaded initially, player on click) */}
        <section className="py-16 bg-white min-h-[450px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-3 border-[#92278F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-500">
                  {language === 'en' ? 'Loading videos...' : 'Chargement des productions vidéo...'}
                </p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-gray-50 border border-gray-200 max-w-xl mx-auto">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 font-heading mb-1">
                  {language === 'en' ? 'No video found' : 'Aucune vidéo trouvée'}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {search || selectedAlbum !== 'all' || selectedCategory !== 'all'
                    ? language === 'en'
                      ? 'No video matches your filter criteria. Try resetting filters.'
                      : 'Aucune vidéo ne correspond à vos filtres. Essayez de réinitialiser la recherche.'
                    : language === 'en'
                      ? 'Videos will be published shortly.'
                      : 'Les productions audiovisuelles seront publiées très prochainement.'}
                </p>
                {(search || selectedAlbum !== 'all' || selectedCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSelectedAlbum('all');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors"
                  >
                    {language === 'en' ? 'Reset filters' : 'Réinitialiser les filtres'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVideos.map((vid) => {
                  const info = parseVideoUrl(vid.url);
                  const thumb = getVideoThumbnail(vid.url, vid.thumbnail_url);
                  const platformBadge = getVideoPlatformLabel(vid.video_platform || info.platform);
                  const linkedAlbum = vid.album_id ? albums.find((a) => a.id === vid.album_id) : null;
                  const linkedProject = vid.project_id ? projects.find((p) => p.id === vid.project_id) : null;

                  return (
                    <div
                      key={vid.id}
                      onClick={() => setPlayingVideo(vid)}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-lg bg-white flex flex-col justify-between"
                    >
                      <div>
                        {/* Video Thumbnail with Hover Play Button */}
                        <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                          <img
                            src={thumb}
                            alt={vid.title_fr}
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_VIDEO_FALLBACK_POSTER;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          />

                          {/* Dark overlay with animated Play button */}
                          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-[#92278F] group-hover:bg-[#FF8C00] text-white flex items-center justify-center shadow-lg border-2 border-white/90 group-hover:scale-110 transition-all duration-300">
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            </div>
                          </div>

                          {/* Platform and Category badges */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[85%]">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#92278F] text-white shadow-xs">
                              {vid.category || 'Vidéo'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${platformBadge.color}`}>
                              {platformBadge.label}
                            </span>
                          </div>
                        </div>

                        {/* Video Metadata */}
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-[#FF8C00]" />
                              <span>{vid.date}</span>
                            </span>
                            {vid.location && (
                              <span className="flex items-center gap-1 truncate max-w-[140px]">
                                <MapPin className="w-3 h-3 text-[#92278F]" />
                                <span className="truncate">{vid.location}</span>
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-base text-gray-900 font-heading leading-snug group-hover:text-[#92278F] transition-colors line-clamp-2">
                            {language === 'en' ? vid.title_en || vid.title_fr : vid.title_fr}
                          </h3>

                          {/* Linked Album and Project badges */}
                          {(linkedAlbum || linkedProject) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {linkedAlbum && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-[#92278F] px-2 py-0.5 rounded-md border border-purple-100 max-w-[200px] truncate">
                                  <Folder className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{linkedAlbum.title_fr}</span>
                                </span>
                              )}
                              {linkedProject && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 max-w-[200px] truncate">
                                  <Layers className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{linkedProject.title_fr}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {vid.description_fr && (
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {language === 'en' ? vid.description_en || vid.description_fr : vid.description_fr}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          type="button"
                          className="w-full py-2 rounded-xl bg-purple-50 group-hover:bg-[#92278F] text-[#92278F] group-hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{language === 'en' ? 'Watch video' : 'Regarder la vidéo'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Modal Player on Demand (Loads Iframe/Video only when playingVideo is set) */}
        {playingVideo && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
            onClick={() => setPlayingVideo(null)}
          >
            <div
              className="bg-gray-950 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-gray-800 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8C00]">
                      {playingVideo.category} • {playingVideo.date}
                    </span>
                    {playingVideo.album_id && albums.find((a) => a.id === playingVideo.album_id) && (
                      <span className="text-[10px] font-semibold bg-white/10 text-purple-200 px-2 py-0.5 rounded">
                        {albums.find((a) => a.id === playingVideo.album_id)?.title_fr}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white truncate font-heading">
                    {language === 'en' ? playingVideo.title_en || playingVideo.title_fr : playingVideo.title_fr}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayingVideo(null)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
                  title={language === 'en' ? 'Close' : 'Fermer'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Display */}
              <div className="aspect-video w-full bg-black relative">
                {playingInfo?.platform === 'youtube' && playingInfo.embedUrl ? (
                  <iframe
                    src={playingInfo.embedUrl}
                    title={playingVideo.title_fr}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : playingInfo?.platform === 'vimeo' && playingInfo.embedUrl ? (
                  <iframe
                    src={playingInfo.embedUrl}
                    title={playingVideo.title_fr}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : playingInfo?.platform === 'storage' || playingInfo?.platform === 'direct' ? (
                  <video
                    src={playingVideo.url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
                    <p className="text-sm mb-3">
                      Le lecteur intégré n’a pas pu charger la vidéo directement.
                    </p>
                    <a
                      href={playingVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <span>Ouvrir la vidéo sur la plateforme</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Modal Details */}
              {(playingVideo.description_fr || playingVideo.location) && (
                <div className="p-4 sm:p-5 bg-gray-900/90 text-xs text-gray-300 space-y-2 max-h-40 overflow-y-auto">
                  {playingVideo.location && (
                    <p className="flex items-center gap-1 text-gray-400">
                      <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
                      <span>{playingVideo.location}</span>
                    </p>
                  )}
                  {playingVideo.description_fr && (
                    <p className="leading-relaxed">
                      {language === 'en' ? playingVideo.description_en || playingVideo.description_fr : playingVideo.description_fr}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
