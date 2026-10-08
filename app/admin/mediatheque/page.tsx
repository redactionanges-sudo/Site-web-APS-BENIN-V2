'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabase, isSupabaseConfigured, supabaseStore } from '@/lib/supabase';
import { MediaItem, PhotoAlbum, ProjectItem } from '@/types';
import { ImagePickerField } from '@/components/admin/MediaSelectorModal';
import {
  Upload,
  Plus,
  Search,
  Edit,
  Trash2,
  Folder,
  Image as ImageIcon,
  Play,
  Film,
  Video,
  X,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import {
  parseVideoUrl,
  validateVideoUrl,
  getVideoThumbnail,
  getVideoPlatformLabel,
  DEFAULT_VIDEO_FALLBACK_POSTER,
} from '@/lib/video-utils';

export default function AdminMediathequePage() {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'albums'>('photos');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('all');
  const [heroFilterOnly, setHeroFilterOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Media Modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Video specific management state
  const [videoSourceMode, setVideoSourceMode] = useState<'youtube' | 'vimeo' | 'storage'>('youtube');
  const [customThumbnailMode, setCustomThumbnailMode] = useState(false);
  const [adminPreviewVideo, setAdminPreviewVideo] = useState<MediaItem | null>(null);

  // Album Modal state
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string; type: 'media' | 'album' } | null>(null);

  // Media Form state
  const [mediaForm, setMediaForm] = useState<Partial<MediaItem>>({
    title_fr: '',
    title_en: '',
    type: 'photo',
    url: '',
    thumbnail_url: '',
    album_id: '',
    project_id: '',
    category: 'Activités de terrain',
    date: '',
    location: 'Comè, Département du Mono',
    alt_fr: '',
    alt_en: '',
    description_fr: '',
    description_en: '',
    video_platform: 'youtube',
    show_in_hero: false,
    hero_order: 1,
    is_active: true,
  });

  // Album Form state
  const [albumForm, setAlbumForm] = useState<Partial<PhotoAlbum>>({
    title_fr: '',
    title_en: '',
    slug: '',
    description_fr: '',
    description_en: '',
    cover_image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80',
    date: '',
    project_id: '',
  });

  const loadData = async () => {
    const [m, a, p] = await Promise.all([
      supabaseStore.getMedia(),
      supabaseStore.getAlbums(),
      supabaseStore.getProjects(),
    ]);
    setMediaList(m);
    setAlbums(a);
    setProjects(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewMediaModal = (type: 'photo' | 'video' = 'photo') => {
    setEditingMedia(null);
    setVideoSourceMode('youtube');
    setCustomThumbnailMode(false);
    setMediaForm({
      title_fr: '',
      title_en: '',
      type,
      url: type === 'photo'
        ? 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80'
        : '',
      thumbnail_url: '',
      album_id: albums[0]?.id || '',
      project_id: projects[0]?.id || '',
      category: type === 'video' ? 'Reportages & Vidéos' : 'Activités de terrain',
      date: new Date().toISOString().split('T')[0],
      location: 'Comè, Mono',
      alt_fr: '',
      alt_en: '',
      description_fr: '',
      description_en: '',
      video_platform: 'youtube',
      show_in_hero: false,
      hero_order: mediaList.filter(m => m.show_in_hero).length + 1,
      is_active: true,
    });
    setMediaModalOpen(true);
  };

  const openEditMediaModal = (item: MediaItem) => {
    setEditingMedia(item);
    if (item.type === 'video') {
      const parsed = parseVideoUrl(item.url);
      if (parsed.platform === 'vimeo') {
        setVideoSourceMode('vimeo');
      } else if (parsed.platform === 'storage' || parsed.platform === 'direct') {
        setVideoSourceMode('storage');
      } else {
        setVideoSourceMode('youtube');
      }
      const isCustom =
        item.thumbnail_url &&
        !item.thumbnail_url.includes('img.youtube.com') &&
        !item.thumbnail_url.includes('youtu.be') &&
        !item.thumbnail_url.includes('youtube.com');
      setCustomThumbnailMode(Boolean(isCustom));
    }
    setMediaForm({
      ...item,
      show_in_hero: !!item.show_in_hero,
      hero_order: item.hero_order || 1,
      is_active: item.is_active !== false,
    });
    setMediaModalOpen(true);
  };

  const toggleHeroStatus = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: MediaItem = {
      ...item,
      show_in_hero: !item.show_in_hero,
      is_active: item.is_active !== false,
      hero_order: item.hero_order || 1,
    };
    await supabaseStore.saveMedia(updated);
    setMediaList((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
  };

  const toggleActiveStatus = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentActive = item.is_active !== false;
    const updated: MediaItem = {
      ...item,
      is_active: !currentActive,
    };
    await supabaseStore.saveMedia(updated);
    setMediaList((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
  };

  const openNewAlbumModal = () => {
    setEditingAlbum(null);
    setAlbumForm({
      title_fr: '',
      title_en: '',
      slug: '',
      description_fr: '',
      description_en: '',
      cover_image: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80',
      date: new Date().toISOString().split('T')[0],
      project_id: '',
    });
    setAlbumModalOpen(true);
  };

  const openEditAlbumModal = (alb: PhotoAlbum) => {
    setEditingAlbum(alb);
    setAlbumForm({ ...alb });
    setAlbumModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    try {
      const bucket = mediaForm.type === 'video' ? 'videos' : 'images';
      const result = await supabaseStore.uploadFile(file, bucket);

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || 'Erreur lors du téléversement vers Supabase Storage');
      }

      const generatedTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();

      if (mediaForm.type === 'video') {
        setMediaForm((prev) => ({
          ...prev,
          url: result.publicUrl,
          video_platform: 'storage',
          title_fr: prev.title_fr || generatedTitle,
          title_en: prev.title_en || generatedTitle,
          alt_fr: prev.alt_fr || generatedTitle,
          alt_en: prev.alt_en || generatedTitle,
        }));
      } else {
        setMediaForm((prev) => ({
          ...prev,
          url: result.publicUrl,
          thumbnail_url: result.publicUrl,
          title_fr: prev.title_fr || generatedTitle,
          title_en: prev.title_en || generatedTitle,
          alt_fr: prev.alt_fr || generatedTitle,
          alt_en: prev.alt_en || generatedTitle,
        }));
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Erreur de téléversement : ${err.message || 'Impossible d\'envoyer le fichier vers Supabase Storage'}`);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = (mediaForm.title_fr || '').trim();
    const cleanUrl = (mediaForm.url || '').trim();

    if (!cleanTitle || !cleanUrl) {
      alert('Veuillez renseigner le titre et l’URL du média.');
      return;
    }

    let finalPlatform = mediaForm.video_platform || 'youtube';
    let finalThumbnail = (mediaForm.thumbnail_url || '').trim();

    if (mediaForm.type === 'video') {
      const parsed = parseVideoUrl(cleanUrl);
      if (parsed.platform !== 'unknown') {
        finalPlatform = parsed.platform;
      }
      finalThumbnail = getVideoThumbnail(cleanUrl, customThumbnailMode ? finalThumbnail : null);
    } else {
      finalThumbnail = finalThumbnail || cleanUrl;
    }

    const payload: MediaItem = {
      id: editingMedia?.id || 'med-' + Date.now(),
      title_fr: cleanTitle,
      title_en: (mediaForm.title_en || cleanTitle).trim(),
      type: mediaForm.type as 'photo' | 'video',
      url: cleanUrl,
      thumbnail_url: finalThumbnail,
      album_id: mediaForm.album_id || undefined,
      project_id: mediaForm.project_id || undefined,
      category: mediaForm.category || (mediaForm.type === 'video' ? 'Reportages & Vidéos' : 'Médiathèque'),
      date: mediaForm.date || new Date().toISOString().split('T')[0],
      location: mediaForm.location || 'Comè, Département du Mono',
      alt_fr: mediaForm.alt_fr || cleanTitle,
      alt_en: mediaForm.alt_en || mediaForm.title_en || cleanTitle,
      description_fr: mediaForm.description_fr || '',
      description_en: mediaForm.description_en || '',
      video_platform: finalPlatform as any,
      show_in_hero: !!mediaForm.show_in_hero,
      hero_order: Number(mediaForm.hero_order) || 1,
      is_active: mediaForm.is_active !== false,
    };

    try {
      await supabaseStore.saveMedia(payload);
      await loadData();
      setMediaModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le média dans Supabase"}`);
    }
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumForm.title_fr) {
      alert('Veuillez renseigner le titre de l’album.');
      return;
    }

    const slug = albumForm.slug || albumForm.title_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload: PhotoAlbum = {
      id: editingAlbum?.id || 'alb-' + Date.now(),
      slug,
      title_fr: albumForm.title_fr,
      title_en: albumForm.title_en || albumForm.title_fr,
      description_fr: albumForm.description_fr || '',
      description_en: albumForm.description_en || '',
      cover_image: albumForm.cover_image || 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80',
      date: albumForm.date || new Date().toISOString().split('T')[0],
      project_id: albumForm.project_id || undefined,
      photo_count: editingAlbum?.photo_count || 0,
    };

    try {
      await supabaseStore.saveAlbum(payload);
      await loadData();
      setAlbumModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer l'album dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'media') {
        await supabaseStore.deleteMedia(itemToDelete.id);
      } else if (itemToDelete.type === 'album') {
        await supabaseStore.deleteAlbum(itemToDelete.id);
      }
      await loadData();
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer l'élément dans Supabase"}`);
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    const matchesTab = activeTab === 'photos' ? m.type === 'photo' : m.type === 'video';
    const matchesAlbum = selectedAlbumFilter === 'all' || m.album_id === selectedAlbumFilter;
    const matchesHero = !heroFilterOnly || (m.type === 'photo' && m.show_in_hero);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.title_fr.toLowerCase().includes(q) ||
      m.title_en.toLowerCase().includes(q) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.location && m.location.toLowerCase().includes(q));

    return matchesTab && matchesAlbum && matchesHero && matchesSearch;
  });

  const totalPages = Math.ceil(filteredMedia.length / ITEMS_PER_PAGE) || 1;
  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Médiathèque Multimédia"
        subtitle="Téléversement, organisation en albums et gestion des métadonnées photos/vidéos"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openNewMediaModal(activeTab === 'videos' ? 'video' : 'photo')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>{activeTab === 'videos' ? 'Ajouter une Vidéo' : 'Ajouter une Photo'}</span>
            </button>
            <button
              type="button"
              onClick={openNewAlbumModal}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors border border-gray-300"
            >
              <Folder className="w-4 h-4 text-[#92278F]" />
              <span>Nouvel Album</span>
            </button>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* Navigation Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'photos'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#FF8C00]" />
              <span>Photos ({mediaList.filter(m => m.type === 'photo').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'videos'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Play className="w-4 h-4 text-[#FF8C00]" />
              <span>Vidéos ({mediaList.filter(m => m.type === 'video').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('albums')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'albums'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Folder className="w-4 h-4 text-[#FF8C00]" />
              <span>Albums ({albums.length})</span>
            </button>
          </div>

          {activeTab !== 'albums' && (
            <div className="flex items-center gap-3">
              {activeTab === 'photos' && (
                <button
                  type="button"
                  onClick={() => setHeroFilterOnly(!heroFilterOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    heroFilterOnly
                      ? 'bg-[#FF8C00] text-white border-[#FF8C00] shadow-xs'
                      : 'bg-orange-50 text-[#FF8C00] border-orange-200 hover:bg-orange-100'
                  }`}
                  title="Filtrer uniquement les photos sélectionnées pour le carrousel d'accueil"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hero ({mediaList.filter((m) => m.type === 'photo' && m.show_in_hero).length})</span>
                </button>
              )}

              <select
                value={selectedAlbumFilter}
                onChange={(e) => setSelectedAlbumFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-800"
              >
                <option value="all">
                  {activeTab === 'videos' ? 'Toutes les activités' : 'Tous les albums'}
                </option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title_fr}
                  </option>
                ))}
              </select>

              <div className="relative w-48 sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1 & 2: Media Grid (Photos / Videos) */}
        {activeTab !== 'albums' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedMedia.map((item) => {
                const isVideo = item.type === 'video';
                const thumbUrl = isVideo
                  ? getVideoThumbnail(item.url, item.thumbnail_url)
                  : item.url;
                const platformInfo = isVideo
                  ? getVideoPlatformLabel(item.video_platform || parseVideoUrl(item.url).platform)
                  : null;
                const linkedAlbum = item.album_id ? albums.find((a) => a.id === item.album_id) : null;
                const linkedProject = item.project_id ? projects.find((p) => p.id === item.project_id) : null;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl overflow-hidden border shadow-xs hover:border-[#92278F] transition-all flex flex-col justify-between group ${
                      item.is_active === false ? 'opacity-65 border-gray-200' : 'border-gray-200/90'
                    }`}
                  >
                    <div>
                      <div
                        className="relative h-44 w-full bg-gray-900 overflow-hidden cursor-pointer"
                        onClick={() => {
                          if (isVideo) {
                            setAdminPreviewVideo(item);
                          }
                        }}
                      >
                        <img
                          src={thumbUrl}
                          alt={item.title_fr}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_VIDEO_FALLBACK_POSTER;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {isVideo && (
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                            <div className="w-11 h-11 rounded-full bg-[#92278F] group-hover:bg-[#FF8C00] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap max-w-[85%]">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#92278F] text-white shadow-xs">
                            {item.category}
                          </span>
                          {platformInfo && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${platformInfo.color}`}>
                              {platformInfo.label}
                            </span>
                          )}
                        </div>

                        {item.show_in_hero && item.type === 'photo' && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8C00] text-white shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Hero #{item.hero_order || 1}
                          </span>
                        )}

                        {item.is_active === false && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900/85 text-gray-200">
                            Inactif / Masqué
                          </span>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-2 font-heading group-hover:text-[#92278F] transition-colors">
                          {item.title_fr}
                        </h3>

                        {/* Associated Album and Project badges */}
                        {(linkedAlbum || linkedProject) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

                        {item.location && (
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FF8C00] shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </p>
                        )}
                        {item.description_fr && (
                          <p className="text-[11px] text-gray-600 line-clamp-2">
                            {item.description_fr}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.date}
                      </span>
                      <div className="flex items-center gap-1">
                        {isVideo && (
                          <button
                            type="button"
                            onClick={() => setAdminPreviewVideo(item)}
                            title="Tester la lecture vidéo"
                            className="p-1.5 rounded hover:bg-purple-100 text-[#92278F] transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {item.type === 'photo' && (
                          <button
                            type="button"
                            onClick={(e) => toggleHeroStatus(item, e)}
                            title={
                              item.show_in_hero
                                ? "Retirer du carrousel d'accueil Hero"
                                : "Mettre en avant dans le carrousel d'accueil Hero"
                            }
                            className={`p-1.5 rounded transition-colors ${
                              item.show_in_hero
                                ? 'bg-orange-100 text-[#FF8C00] hover:bg-orange-200'
                                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => toggleActiveStatus(item, e)}
                          title={
                            item.is_active === false
                              ? 'Média actuellement masqué (cliquer pour activer)'
                              : 'Média actif (cliquer pour masquer)'
                          }
                          className={`p-1.5 rounded transition-colors ${
                            item.is_active === false
                              ? 'bg-gray-200 text-gray-500'
                              : 'text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {item.is_active === false ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditMediaModal(item)}
                          title="Modifier les informations"
                          className="p-1.5 rounded hover:bg-purple-100 text-[#92278F] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete({ id: item.id, title: item.title_fr, type: 'media' });
                            setDeleteConfirmOpen(true);
                          }}
                          title="Supprimer"
                          className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Contrôles de pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-gray-200 text-xs text-gray-600 mt-6">
              <span>
                Affichage de <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> à <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredMedia.length)}</strong> sur <strong>{filteredMedia.length}</strong> médias
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold"
                >
                  Précédent
                </button>
                <span className="font-bold text-gray-800 px-2">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-semibold"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
        )}

        {/* Tab 3: Albums List */}
        {activeTab === 'albums' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((alb) => (
              <div
                key={alb.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-gray-100">
                    <img
                      src={alb.cover_image}
                      alt={alb.title_fr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-wider block">
                      Album Photo
                    </span>
                    <h3 className="font-bold text-sm text-gray-900 font-heading">
                      {alb.title_fr}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {alb.description_fr}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono text-[11px]">{alb.date}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditAlbumModal(alb)}
                      className="text-[#92278F] hover:underline font-bold"
                    >
                      Modifier
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setItemToDelete({ id: alb.id, title: alb.title_fr, type: 'album' });
                        setDeleteConfirmOpen(true);
                      }}
                      className="text-red-600 hover:underline font-bold"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Media Create / Edit */}
        {mediaModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  {editingMedia ? 'Modifier le média' : 'Ajouter un nouveau média'}
                </h3>
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMedia} className="space-y-4">
                {/* Photo Upload */}
                {mediaForm.type === 'photo' && (
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                    <label className="block text-xs font-bold text-gray-800">
                      Téléverser une image (Supabase Storage ou Fichier local)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#92278F] file:text-white hover:file:bg-[#741772]"
                      />
                      {uploadProgress && (
                        <span className="text-xs text-[#92278F] font-bold animate-pulse">
                          Traitement en cours...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Photo Direct URL */}
                {mediaForm.type === 'photo' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      URL directe de l'image *
                    </label>
                    <input
                      type="text"
                      required
                      value={mediaForm.url || ''}
                      onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                )}

                {/* Specialized Video Source & Player Preview */}
                {mediaForm.type === 'video' && (
                  <div className="space-y-3 p-4 bg-gray-50/90 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-[#92278F]" />
                        <span>Source de la vidéo *</span>
                      </label>
                      <span className="text-[11px] text-gray-500 font-medium">
                        Priorité aux hébergeurs YouTube / Vimeo
                      </span>
                    </div>

                    {/* Source mode selector buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoSourceMode('youtube');
                          setMediaForm((prev) => ({ ...prev, video_platform: 'youtube' }));
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          videoSourceMode === 'youtube'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>YouTube (Recommandé)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVideoSourceMode('vimeo');
                          setMediaForm((prev) => ({ ...prev, video_platform: 'vimeo' }));
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          videoSourceMode === 'vimeo'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Vimeo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVideoSourceMode('storage');
                          setMediaForm((prev) => ({ ...prev, video_platform: 'storage' }));
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          videoSourceMode === 'storage'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Fichier / Supabase</span>
                      </button>
                    </div>

                    {/* File upload option for storage mode */}
                    {videoSourceMode === 'storage' && (
                      <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                        <label className="block text-xs font-semibold text-gray-700">
                          Téléverser un fichier vidéo MP4/WebM (Supabase Storage, bucket videos) :
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={handleFileUpload}
                            className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                          />
                          {uploadProgress && (
                            <span className="text-xs text-emerald-600 font-bold animate-pulse">
                              Téléversement en cours...
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Ou saisissez directement l'URL d'un fichier vidéo hébergé ci-dessous :
                        </p>
                      </div>
                    )}

                    {/* URL Input */}
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">
                        {videoSourceMode === 'youtube'
                          ? 'URL de la vidéo YouTube *'
                          : videoSourceMode === 'vimeo'
                          ? 'URL de la vidéo Vimeo *'
                          : 'URL directe de la vidéo (MP4, WebM) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={mediaForm.url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMediaForm((prev) => ({ ...prev, url: val }));
                        }}
                        placeholder={
                          videoSourceMode === 'youtube'
                            ? 'https://www.youtube.com/watch?v=... ou https://youtu.be/...'
                            : videoSourceMode === 'vimeo'
                            ? 'https://vimeo.com/... ou https://player.vimeo.com/video/...'
                            : 'https://.../video.mp4'
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none font-mono"
                      />
                    </div>

                    {/* Live detection & validation badge */}
                    {(() => {
                      if (!mediaForm.url?.trim()) return null;
                      const parsed = parseVideoUrl(mediaForm.url);
                      if (parsed.platform === 'youtube' && parsed.videoId) {
                        return (
                          <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                              <span>
                                <strong>Vidéo YouTube détectée</strong> (ID : <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-green-200 font-bold">{parsed.videoId}</code>)
                              </span>
                            </div>
                            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded shadow-2xs">
                              YouTube
                            </span>
                          </div>
                        );
                      }
                      if (parsed.platform === 'vimeo' && parsed.videoId) {
                        return (
                          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                              <span>
                                <strong>Vidéo Vimeo détectée</strong> (ID : <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold">{parsed.videoId}</code>)
                              </span>
                            </div>
                            <span className="text-[10px] bg-sky-500 text-white font-bold px-2 py-0.5 rounded shadow-2xs">
                              Vimeo
                            </span>
                          </div>
                        );
                      }
                      if (parsed.platform === 'storage' || parsed.platform === 'direct') {
                        return (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                <strong>Fichier vidéo direct reconnu</strong>
                              </span>
                            </div>
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded shadow-2xs">
                              Vidéo MP4 / Direct
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Format en cours de saisie. Formats acceptés : YouTube (watch, youtu.be, shorts), Vimeo ou lien vidéo direct MP4.
                          </span>
                        </div>
                      );
                    })()}

                    {/* Live Player Preview inside the form */}
                    {(() => {
                      if (!mediaForm.url?.trim()) return null;
                      const parsed = parseVideoUrl(mediaForm.url);
                      if (!parsed.embedUrl) return null;
                      return (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5 text-[#FF8C00]" />
                            Prévisualisation immédiate du lecteur
                          </span>
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-gray-300">
                            {parsed.platform === 'youtube' || parsed.platform === 'vimeo' ? (
                              <iframe
                                src={parsed.embedUrl}
                                title="Prévisualisation vidéo"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full border-0"
                              />
                            ) : (
                              <video
                                src={parsed.embedUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Video Thumbnail Configuration */}
                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">
                          Miniature de la vidéo
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600">
                          <input
                            type="checkbox"
                            checked={customThumbnailMode}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCustomThumbnailMode(checked);
                              if (!checked) {
                                setMediaForm((prev) => ({ ...prev, thumbnail_url: '' }));
                              }
                            }}
                            className="rounded border-gray-300 text-[#92278F] focus:ring-[#92278F]"
                          />
                          <span>Personnaliser la miniature (optionnel)</span>
                        </label>
                      </div>

                      {/* Display current active thumbnail */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-200">
                        <img
                          src={getVideoThumbnail(mediaForm.url || '', customThumbnailMode ? mediaForm.thumbnail_url : null)}
                          alt="Aperçu miniature"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_VIDEO_FALLBACK_POSTER;
                          }}
                          className="w-24 h-16 rounded-lg object-cover border border-gray-200 bg-gray-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-xs font-bold text-gray-800 block">
                            {customThumbnailMode && mediaForm.thumbnail_url
                              ? 'Miniature personnalisée active'
                              : parseVideoUrl(mediaForm.url || '').platform === 'youtube'
                              ? 'Miniature officielle YouTube générée automatiquement'
                              : 'Image de couverture par défaut'}
                          </span>
                          <p className="text-[11px] text-gray-500">
                            Cette image sert d'affiche avant la lecture publique.
                          </p>
                        </div>
                      </div>

                      {/* Custom Thumbnail Picker if enabled */}
                      {customThumbnailMode && (
                        <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                          <ImagePickerField
                            label="Sélectionner ou téléverser une miniature personnalisée"
                            value={mediaForm.thumbnail_url || ''}
                            onChange={(url) => setMediaForm((prev) => ({ ...prev, thumbnail_url: url }))}
                            placeholder="https://... ou choisir dans la médiathèque"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMediaForm((prev) => ({ ...prev, thumbnail_url: '' }));
                              setCustomThumbnailMode(false);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 font-semibold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Rétablir la miniature automatique</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre / Légende (Français) *
                    </label>
                    <input
                      type="text"
                      required
                      value={mediaForm.title_fr}
                      onChange={(e) => setMediaForm({ ...mediaForm, title_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre (Anglais)
                    </label>
                    <input
                      type="text"
                      value={mediaForm.title_en}
                      onChange={(e) => setMediaForm({ ...mediaForm, title_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      value={mediaForm.category}
                      onChange={(e) => setMediaForm({ ...mediaForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(mediaForm.type === 'video'
                        ? ['Reportages & Vidéos', 'Témoignage', 'Plaidoyer', 'Sensibilisation', 'Formation']
                        : ['Activités de terrain', 'Formations', 'Sensibilisation', 'Célébrations', 'Autonomisation']
                      ).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setMediaForm({ ...mediaForm, category: c })}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                            mediaForm.category === c
                              ? 'bg-[#92278F] text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={mediaForm.date}
                      onChange={(e) => setMediaForm({ ...mediaForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Lieu (Commune / Ville)
                    </label>
                    <input
                      type="text"
                      value={mediaForm.location}
                      onChange={(e) => setMediaForm({ ...mediaForm, location: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Album rattaché
                    </label>
                    <select
                      value={mediaForm.album_id}
                      onChange={(e) => setMediaForm({ ...mediaForm, album_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="">Aucun album</option>
                      {albums.map((alb) => (
                        <option key={alb.id} value={alb.id}>
                          {alb.title_fr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Projet rattaché
                    </label>
                    <select
                      value={mediaForm.project_id}
                      onChange={(e) => setMediaForm({ ...mediaForm, project_id: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="">Aucun projet</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.title_fr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Alt text & description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Texte alternatif (Alt text SEO & Accessibilité)
                  </label>
                  <input
                    type="text"
                    value={mediaForm.alt_fr}
                    onChange={(e) => setMediaForm({ ...mediaForm, alt_fr: e.target.value })}
                    placeholder="Description textuelle de l'image..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description détaillée du contexte
                  </label>
                  <textarea
                    rows={2}
                    value={mediaForm.description_fr}
                    onChange={(e) => setMediaForm({ ...mediaForm, description_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                  />
                </div>

                {/* Hero Configuration & Active Visibility */}
                <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mediaForm.show_in_hero || false}
                        onChange={(e) => setMediaForm({ ...mediaForm, show_in_hero: e.target.checked })}
                        className="w-4 h-4 text-[#92278F] rounded border-gray-300 focus:ring-[#92278F]"
                      />
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF8C00]" />
                        Afficher dans le carrousel Hero (Accueil)
                      </span>
                    </label>

                    {mediaForm.show_in_hero && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-700">
                          Ordre :
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={mediaForm.hero_order || 1}
                          onChange={(e) =>
                            setMediaForm({
                              ...mediaForm,
                              hero_order: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-16 px-2 py-1 text-xs text-center font-bold rounded-md border border-gray-300 focus:ring-[#92278F] outline-none bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-purple-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mediaForm.is_active !== false}
                        onChange={(e) =>
                          setMediaForm({ ...mediaForm, is_active: e.target.checked })
                        }
                        className="w-4 h-4 text-[#92278F] rounded border-gray-300 focus:ring-[#92278F]"
                      />
                      <span className="text-xs font-semibold text-gray-800">
                        Média actif et publié sur le site
                      </span>
                    </label>
                    <span className="text-[11px] text-gray-500">
                      {mediaForm.is_active !== false ? 'Actif' : 'Masqué'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs"
                  >
                    Enregistrer le média
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Album Create / Edit */}
        {albumModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-gray-900 font-heading">
                  {editingAlbum ? 'Modifier l’album' : 'Créer un nouvel album'}
                </h3>
                <button
                  type="button"
                  onClick={() => setAlbumModalOpen(false)}
                  className="p-1 rounded text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAlbum} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Titre de l’album (Français) *
                  </label>
                  <input
                    type="text"
                    required
                    value={albumForm.title_fr}
                    onChange={(e) => setAlbumForm({ ...albumForm, title_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                  />
                </div>

                <div>
                  <ImagePickerField
                    label="Image de couverture de l’album"
                    value={albumForm.cover_image || ''}
                    onChange={(url) => setAlbumForm({ ...albumForm, cover_image: url })}
                    placeholder="https://... ou choisir dans la médiathèque"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description de l’activité / album
                  </label>
                  <textarea
                    rows={3}
                    value={albumForm.description_fr}
                    onChange={(e) => setAlbumForm({ ...albumForm, description_fr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAlbumModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
                  >
                    Enregistrer l’album
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Video Player Preview Modal for Administrators */}
        {adminPreviewVideo && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setAdminPreviewVideo(null)}
          >
            <div
              className="bg-gray-950 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8C00]">
                    Aperçu vidéo administrateur • {adminPreviewVideo.category}
                  </span>
                  <h3 className="text-sm font-bold text-white truncate">
                    {adminPreviewVideo.title_fr}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminPreviewVideo(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black">
                {(() => {
                  const info = parseVideoUrl(adminPreviewVideo.url);
                  if (info.platform === 'youtube' && info.embedUrl) {
                    return (
                      <iframe
                        src={info.embedUrl}
                        title={adminPreviewVideo.title_fr}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    );
                  }
                  if (info.platform === 'vimeo' && info.embedUrl) {
                    return (
                      <iframe
                        src={info.embedUrl}
                        title={adminPreviewVideo.title_fr}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    );
                  }
                  return (
                    <video
                      src={adminPreviewVideo.url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                })()}
              </div>

              <div className="p-4 bg-gray-900 text-xs text-gray-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {adminPreviewVideo.date && <span>Date : {adminPreviewVideo.date}</span>}
                  {adminPreviewVideo.location && <span>• {adminPreviewVideo.location}</span>}
                </div>
                <a
                  href={adminPreviewVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#FF8C00] hover:underline font-bold"
                >
                  <span>Ouvrir sur la plateforme source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Supprimer ce média ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement « ${itemToDelete?.title} » ?`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
          }}
        />
      </main>
    </AdminAuthGuard>
  );
}
