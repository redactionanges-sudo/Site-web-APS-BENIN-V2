'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabase, isSupabaseConfigured, supabaseStore } from '@/lib/supabase';
import { MediaItem, PhotoAlbum, ProjectItem } from '@/types';
import { ImagePickerField } from '@/components/admin/MediaSelectorModal';
import { UploadProgressBar, UploadProgressData } from '@/components/admin/UploadProgressBar';
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
  Link2,
  Unlink,
  Check,
  Building,
} from 'lucide-react';
import {
  parseVideoUrl,
  validateVideoUrl,
  getVideoThumbnail,
  getVideoPlatformLabel,
  DEFAULT_VIDEO_FALLBACK_POSTER,
} from '@/lib/video-utils';
import {
  MEDIA_CATEGORIES,
  normalizeCategoryName,
  getDefaultCategoryForModule,
} from '@/lib/media-categories';
import { MediaTargetModule } from '@/types';

export default function AdminMediathequePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos' | 'albums'>('all');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('all');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'public' | 'internal'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [heroFilterOnly, setHeroFilterOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Media Modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [uploadData, setUploadData] = useState<UploadProgressData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Video specific management state
  const [videoSourceMode, setVideoSourceMode] = useState<'youtube' | 'vimeo' | 'storage'>('youtube');
  const [customThumbnailMode, setCustomThumbnailMode] = useState(false);
  const [adminPreviewVideo, setAdminPreviewVideo] = useState<MediaItem | null>(null);

  // Album Modal state
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);

  // Album Media Management & Association state
  const [managingAlbum, setManagingAlbum] = useState<PhotoAlbum | null>(null);
  const [albumMediaTab, setAlbumMediaTab] = useState<'all' | 'photo' | 'video'>('all');
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [associateMediaType, setAssociateMediaType] = useState<'all' | 'photo' | 'video'>('all');
  const [associateSearch, setAssociateSearch] = useState('');
  const [selectedMediaIdsToAssociate, setSelectedMediaIdsToAssociate] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [mediaToUnlink, setMediaToUnlink] = useState<MediaItem | null>(null);

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
    show_in_public_gallery: true,
  });

  // Album Form state
  const [albumForm, setAlbumForm] = useState<Partial<PhotoAlbum>>({
    title_fr: '',
    title_en: '',
    slug: '',
    description_fr: '',
    description_en: '',
    cover_image: '',
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
      url: '',
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
      show_in_public_gallery: true,
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
      show_in_public_gallery: item.show_in_public_gallery !== false,
    });
    setMediaModalOpen(true);
  };

  const toggleHeroStatus = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const willShowInHero = !item.show_in_hero;
    let nextHeroOrder = Number(item.hero_order) || 1;

    if (willShowInHero) {
      // Find all currently selected hero items except this one
      const currentHeroItems = mediaList.filter(
        (m) => m.type === 'photo' && m.show_in_hero && m.id !== item.id
      );
      // Next available position: 1, 2, 3...
      const maxOrder = currentHeroItems.reduce(
        (max, m) => Math.max(max, Number(m.hero_order) || 0),
        0
      );
      nextHeroOrder = maxOrder + 1;
    }

    const updated: MediaItem = {
      ...item,
      show_in_hero: willShowInHero,
      is_active: item.is_active !== false,
      hero_order: nextHeroOrder,
    };

    setMediaList((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
    try {
      await supabaseStore.saveMedia(updated);
    } catch (err: any) {
      console.error('Erreur toggle Hero:', err);
      setMediaList((prev) => prev.map((m) => (m.id === item.id ? item : m)));
      setActionFeedback(`Erreur d'enregistrement : ${err.message || 'Impossible de mettre à jour le Hero'}`);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const updateHeroOrder = async (item: MediaItem, newOrder: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanOrder = Math.max(1, Math.min(99, Number(newOrder) || 1));
    const updated: MediaItem = {
      ...item,
      hero_order: cleanOrder,
    };
    setMediaList((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
    try {
      await supabaseStore.saveMedia(updated);
    } catch (err: any) {
      console.error('Erreur updateHeroOrder:', err);
      setMediaList((prev) => prev.map((m) => (m.id === item.id ? item : m)));
    }
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
      cover_image: '',
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

  const openNewMediaModalForAlbum = (type: 'photo' | 'video', albumId: string) => {
    setEditingMedia(null);
    setVideoSourceMode('youtube');
    setCustomThumbnailMode(false);
    setMediaForm({
      title_fr: '',
      title_en: '',
      type,
      url: '',
      thumbnail_url: '',
      album_id: albumId,
      project_id: projects[0]?.id || '',
      category: type === 'video' ? 'Reportages & Vidéos' : 'Activités de terrain',
      date: new Date().toISOString().split('T')[0],
      location: 'Comè, Département du Mono',
      alt_fr: '',
      alt_en: '',
      description_fr: '',
      description_en: '',
      video_platform: 'youtube',
      show_in_hero: false,
      hero_order: mediaList.filter((m) => m.show_in_hero).length + 1,
      is_active: true,
      show_in_public_gallery: true,
    });
    setMediaModalOpen(true);
  };

  const openAssociateModalForAlbum = (album: PhotoAlbum) => {
    setManagingAlbum(album);
    setSelectedMediaIdsToAssociate([]);
    setAssociateSearch('');
    setAssociateMediaType('all');
    setAssociateModalOpen(true);
  };

  const handleAssociateSelectedMedia = async () => {
    if (!managingAlbum || selectedMediaIdsToAssociate.length === 0) return;
    try {
      const itemsToUpdate = mediaList.filter((m) => selectedMediaIdsToAssociate.includes(m.id));
      for (const item of itemsToUpdate) {
        const updated: MediaItem = { ...item, album_id: managingAlbum.id };
        await supabaseStore.saveMedia(updated);
      }
      setMediaList((prev) =>
        prev.map((m) =>
          selectedMediaIdsToAssociate.includes(m.id)
            ? { ...m, album_id: managingAlbum.id }
            : m
        )
      );
      setActionFeedback(
        `${selectedMediaIdsToAssociate.length} média(s) associé(s) à l’album « ${managingAlbum.title_fr} » avec succès.`
      );
      setAssociateModalOpen(false);
      setSelectedMediaIdsToAssociate([]);
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(`Erreur lors de l’association : ${err.message || 'Impossible d’associer les médias'}`);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleUnlinkMediaFromAlbum = (item: MediaItem) => {
    setMediaToUnlink(item);
  };

  const confirmUnlinkMedia = async () => {
    if (!mediaToUnlink) return;
    const item = mediaToUnlink;
    setMediaToUnlink(null);
    try {
      const updated: MediaItem = { ...item, album_id: undefined };
      await supabaseStore.saveMedia(updated);
      setMediaList((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, album_id: undefined } : m))
      );
      setActionFeedback(
        `« ${item.title_fr} » a été retiré de l’album (fichier conservé dans la médiathèque).`
      );
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(`Erreur lors du retrait : ${err.message || 'Impossible de dissocier le média'}`);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadData({
      phase: 'preparing',
      percent: 0,
      fileName: file.name,
      totalBytes: file.size,
      loadedBytes: 0,
      message: 'Préparation du fichier...',
    });

    try {
      const bucket = mediaForm.type === 'video' ? 'videos' : 'images';
      const result = await supabaseStore.uploadFile(file, bucket, 'uploads', (progress) => {
        setUploadData(progress);
      });

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
          thumbnail_url: result.thumbnailUrl || result.publicUrl,
          title_fr: prev.title_fr || generatedTitle,
          title_en: prev.title_en || generatedTitle,
          alt_fr: prev.alt_fr || generatedTitle,
          alt_en: prev.alt_en || generatedTitle,
        }));
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadData({
        phase: 'error',
        percent: 0,
        fileName: file.name,
        error: err.message || 'Impossible d\'envoyer le fichier vers Supabase Storage',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = (mediaForm.title_fr || '').trim();
    const cleanUrl = (mediaForm.url || '').trim();

    if (!cleanTitle || !cleanUrl) {
      setActionFeedback('Veuillez renseigner le titre et l’URL du média.');
      setTimeout(() => setActionFeedback(null), 5000);
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
      show_in_public_gallery: mediaForm.show_in_public_gallery !== false,
    };

    try {
      await supabaseStore.saveMedia(payload);
      await loadData();
      setMediaModalOpen(false);
      setActionFeedback(`Média « ${payload.title_fr} » enregistré avec succès.`);
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le média dans Supabase"}`);
      setTimeout(() => setActionFeedback(null), 6000);
    }
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumForm.title_fr) {
      setActionFeedback('Veuillez renseigner le titre de l’album.');
      setTimeout(() => setActionFeedback(null), 5000);
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
      cover_image: albumForm.cover_image || '',
      date: albumForm.date || new Date().toISOString().split('T')[0],
      project_id: albumForm.project_id || undefined,
      photo_count: editingAlbum?.photo_count || 0,
    };

    try {
      await supabaseStore.saveAlbum(payload);
      // Synchronise automatiquement le project_id sur les médias de cet album s'ils n'en ont pas
      if (payload.project_id) {
        const inThisAlbum = mediaList.filter((m) => m.album_id === payload.id && !m.project_id);
        for (const item of inThisAlbum) {
          try {
            await supabaseStore.saveMedia({ ...item, project_id: payload.project_id });
          } catch {}
        }
      }
      await loadData();
      setAlbumModalOpen(false);
      setManagingAlbum(payload);
      setActionFeedback(
        `Album « ${payload.title_fr} » enregistré avec succès${payload.project_id ? ' et rattaché au projet.' : '.'}`
      );
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      setActionFeedback(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer l'album dans Supabase"}`);
      setTimeout(() => setActionFeedback(null), 6000);
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
      setActionFeedback('Élément supprimé avec succès.');
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(`Erreur de suppression : ${err.message || "Impossible de supprimer l'élément dans Supabase"}`);
      setTimeout(() => setActionFeedback(null), 6000);
    }
  };

  const filteredMedia = mediaList
    .filter((m) => {
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'photos'
          ? m.type === 'photo'
          : m.type === 'video';
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
    })
    .sort((a, b) => {
      if (heroFilterOnly) {
        return (Number(a.hero_order) || 99) - (Number(b.hero_order) || 99);
      }
      return 0;
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
        {actionFeedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-4 h-4 text-[#FF8C00]" />
              <span>Tous les médias ({mediaList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('photos');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
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
              onClick={() => {
                setActiveTab('videos');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
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
              onClick={() => {
                setActiveTab('albums');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
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
                <option value="all">Tous les albums</option>
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

        {/* Active album banner when filtered */}
        {activeTab !== 'albums' && selectedAlbumFilter !== 'all' && (() => {
          const currentFilteredAlbum = albums.find((a) => a.id === selectedAlbumFilter);
          return (
            <div className="p-4 bg-purple-50/90 border border-purple-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#92278F] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Folder className="w-5 h-5 text-[#FF8C00]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm font-heading">
                      Album : {currentFilteredAlbum?.title_fr || selectedAlbumFilter}
                    </span>
                    <span className="text-[11px] text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-100 font-semibold">
                      {filteredMedia.length} {filteredMedia.length > 1 ? 'médias associés' : 'média associé'}
                    </span>
                  </div>
                  {currentFilteredAlbum?.description_fr && (
                    <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">
                      {currentFilteredAlbum.description_fr}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {currentFilteredAlbum && (
                  <>
                    <button
                      type="button"
                      onClick={() => setManagingAlbum(currentFilteredAlbum)}
                      className="px-3 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Folder className="w-3.5 h-3.5 text-[#FF8C00]" />
                      <span>Gérer l’album</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openNewMediaModalForAlbum('photo', currentFilteredAlbum.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-purple-50 text-[#92278F] border border-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FF8C00]" />
                      <span>+ Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openNewMediaModalForAlbum('video', currentFilteredAlbum.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#92278F]" />
                      <span>+ Vidéo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssociateModalForAlbum(currentFilteredAlbum)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5 text-[#92278F]" />
                      <span>Associer</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedAlbumFilter('all')}
                  className="px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:underline font-bold text-xs shrink-0"
                >
                  Tous les albums
                </button>
              </div>
            </div>
          );
        })()}

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
                          {item.type === 'photo' && item.url?.includes('.webp') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white shadow-xs" title="Format WebP optimisé automatiquement">
                              WebP
                            </span>
                          )}
                          {platformInfo && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${platformInfo.color}`}>
                              {platformInfo.label}
                            </span>
                          )}
                        </div>

                        {item.show_in_hero && item.type === 'photo' && (
                          <div
                            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8C00] text-white shadow-xs flex items-center gap-1.5 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Hero #{item.hero_order || 1}</span>
                            <div className="flex items-center gap-0.5 border-l border-white/30 pl-1">
                              <button
                                type="button"
                                title="Monter la priorité (ordre - 1)"
                                disabled={(item.hero_order || 1) <= 1}
                                onClick={(e) => updateHeroOrder(item, (item.hero_order || 1) - 1, e)}
                                className="w-4 h-4 flex items-center justify-center rounded hover:bg-black/25 disabled:opacity-30 transition-colors text-[9px]"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                title="Descendre la priorité (ordre + 1)"
                                onClick={(e) => updateHeroOrder(item, (item.hero_order || 1) + 1, e)}
                                className="w-4 h-4 flex items-center justify-center rounded hover:bg-black/25 transition-colors text-[9px]"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
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
            {albums.map((alb) => {
              const photoCount = mediaList.filter((m) => m.album_id === alb.id && m.type === 'photo').length;
              const videoCount = mediaList.filter((m) => m.album_id === alb.id && m.type === 'video').length;
              const totalCount = photoCount + videoCount;

              return (
                <div
                  key={alb.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs flex flex-col justify-between hover:border-[#92278F] transition-all"
                >
                  <div>
                    <div className="relative h-44 w-full bg-gray-100">
                      <img
                        src={alb.cover_image}
                        alt={alb.title_fr}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs shadow-xs">
                          {totalCount} {totalCount > 1 ? 'médias' : 'média'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-wider block">
                        Album Multimédia
                      </span>
                      <h3 className="font-bold text-sm text-gray-900 font-heading">
                        {alb.title_fr}
                      </h3>
                      {alb.description_fr && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {alb.description_fr}
                        </p>
                      )}

                      {/* Photo and Video counts */}
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 font-bold text-[11px]">
                          <ImageIcon className="w-3.5 h-3.5 text-[#92278F]" />
                          <span>{photoCount} {photoCount > 1 ? 'photos' : 'photo'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 font-bold text-[11px]">
                          <Film className="w-3.5 h-3.5 text-[#FF8C00]" />
                          <span>{videoCount} {videoCount > 1 ? 'vidéos' : 'vidéo'}</span>
                        </span>
                      </div>

                      {/* Associated Project badge if linked */}
                      {alb.project_id && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 line-clamp-1">
                            <Building className="w-3 h-3 text-[#FF8C00] shrink-0" />
                            <span className="truncate">
                              Projet : {projects.find((p) => p.id === alb.project_id)?.title_fr || alb.project_id}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Primary Action Button: Gérer les contenus de l'album */}
                      <button
                        type="button"
                        onClick={() => setManagingAlbum(alb)}
                        className="w-full mt-2 py-2.5 px-3 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <Folder className="w-4 h-4 text-[#FF8C00]" />
                        <span>Gérer les contenus ({totalCount})</span>
                      </button>

                      {/* Secondary quick actions: Ajouter des photos, vidéos ou associer */}
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => openNewMediaModalForAlbum('photo', alb.id)}
                          className="py-1.5 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#92278F] text-[11px] font-bold flex items-center justify-center gap-1 border border-purple-200 transition-colors"
                          title="Téléverser ou ajouter une nouvelle photo à cet album"
                        >
                          <Plus className="w-3 h-3 text-[#FF8C00]" />
                          <span>+ Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openNewMediaModalForAlbum('video', alb.id)}
                          className="py-1.5 px-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 text-[11px] font-bold flex items-center justify-center gap-1 border border-orange-200 transition-colors"
                          title="Ajouter une nouvelle vidéo à cet album"
                        >
                          <Plus className="w-3 h-3 text-[#92278F]" />
                          <span>+ Vidéo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssociateModalForAlbum(alb)}
                          className="py-1.5 px-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-bold flex items-center justify-center gap-1 border border-gray-200 transition-colors"
                          title="Sélectionner des médias existants dans la médiathèque pour les lier à cet album"
                        >
                          <Link2 className="w-3 h-3 text-[#92278F]" />
                          <span>Associer</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono text-[11px]">{alb.date}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlbumFilter(alb.id);
                          setActiveTab('all');
                          setCurrentPage(1);
                        }}
                        className="text-gray-600 hover:text-[#92278F] hover:underline font-semibold text-[11px]"
                      >
                        Filtrer
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => openEditAlbumModal(alb)}
                        className="text-[#92278F] hover:underline font-bold text-[11px]"
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
                        className="text-red-600 hover:underline font-bold text-[11px]"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                      Téléverser une image locale (Supabase Storage) :
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#92278F] file:text-white hover:file:bg-[#741772] disabled:opacity-50 cursor-pointer"
                    />
                    <UploadProgressBar
                      data={uploadData}
                      onReset={() => setUploadData(null)}
                    />
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
                      <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-3">
                        <label className="block text-xs font-semibold text-gray-700">
                          Téléverser un fichier vidéo MP4/WebM (Supabase Storage, bucket videos) :
                        </label>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                        />
                        <UploadProgressBar
                          data={uploadData}
                          onReset={() => setUploadData(null)}
                        />
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
                      value={mediaForm.album_id || ''}
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
                      value={mediaForm.project_id || ''}
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

                  <div className="flex items-center justify-between pt-2 border-t border-purple-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mediaForm.show_in_public_gallery !== false}
                        onChange={(e) =>
                          setMediaForm({ ...mediaForm, show_in_public_gallery: e.target.checked })
                        }
                        className="w-4 h-4 text-[#92278F] rounded border-gray-300 focus:ring-[#92278F]"
                      />
                      <span className="text-xs font-semibold text-gray-800">
                        Visible dans la Médiathèque publique (Accessible à tous les visiteurs)
                      </span>
                    </label>
                    <span className="text-[11px] text-gray-500">
                      {mediaForm.show_in_public_gallery !== false ? 'Public' : 'Réservé'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaModalOpen(false);
                      setUploadData(null);
                    }}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Téléversement en cours...' : 'Enregistrer le média'}
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
                    Projet ou activité associée (optionnel)
                  </label>
                  <select
                    value={albumForm.project_id || ''}
                    onChange={(e) => setAlbumForm({ ...albumForm, project_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white font-medium"
                  >
                    <option value="">Aucun projet (Album général / Institutionnel)</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.publication_type === 'activity' ? '⚡ [Activité] ' : '📁 [Projet] '}
                        {proj.title_fr} ({proj.period || 'En cours'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    En sélectionnant un projet, cet album et l'ensemble de ses médias (photos et vidéos) apparaîtront automatiquement sur la page publique du projet sans devoir les réimporter.
                  </p>
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

        {/* Modal: Gérer les contenus de l'album (Photos et Vidéos) */}
        {managingAlbum && !associateModalOpen && (
          <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn">
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950 via-[#92278F] to-[#2f0d2e] text-white flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                      <Folder className="w-3 h-3 text-[#FF8C00]" />
                      Album photo & vidéo
                    </span>
                    {managingAlbum.project_id && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8C00] text-white flex items-center gap-1 shadow-2xs">
                        <Building className="w-3 h-3 text-white" />
                        <span>Rattaché au projet : {projects.find((p) => p.id === managingAlbum.project_id)?.title_fr || managingAlbum.project_id}</span>
                      </span>
                    )}
                    <span className="text-xs text-purple-200 font-mono">
                      {managingAlbum.date || 'Non daté'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-heading truncate">
                    {managingAlbum.title_fr}
                  </h3>
                  {managingAlbum.description_fr && (
                    <p className="text-xs text-purple-100/90 line-clamp-2 max-w-2xl">
                      {managingAlbum.description_fr}
                    </p>
                  )}
                  <div className="pt-1 flex items-center gap-3 text-xs text-purple-200 font-medium">
                    <span>
                      {mediaList.filter((m) => m.album_id === managingAlbum.id && m.type === 'photo').length} photo(s)
                    </span>
                    <span>•</span>
                    <span>
                      {mediaList.filter((m) => m.album_id === managingAlbum.id && m.type === 'video').length} vidéo(s)
                    </span>
                    <span>•</span>
                    <span className="text-white font-bold">
                      {mediaList.filter((m) => m.album_id === managingAlbum.id).length} média(s) rattaché(s)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setManagingAlbum(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openNewMediaModalForAlbum('photo', managingAlbum.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#92278F] hover:bg-[#7a1f77] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Ajouter une photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openNewMediaModalForAlbum('video', managingAlbum.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF8C00] hover:bg-[#e07b00] text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <Video className="w-3.5 h-3.5" />
                    <span>Ajouter une vidéo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAssociateModalForAlbum(managingAlbum)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold transition-colors shadow-xs"
                  >
                    <Link2 className="w-4 h-4 text-[#92278F]" />
                    <span>Associer des médias existants</span>
                  </button>
                </div>

                {/* Sub-tab filter inside album */}
                <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAlbumMediaTab('all')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      albumMediaTab === 'all'
                        ? 'bg-[#92278F] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tous ({mediaList.filter((m) => m.album_id === managingAlbum.id).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlbumMediaTab('photo')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      albumMediaTab === 'photo'
                        ? 'bg-[#92278F] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Photos ({mediaList.filter((m) => m.album_id === managingAlbum.id && m.type === 'photo').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlbumMediaTab('video')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      albumMediaTab === 'video'
                        ? 'bg-[#92278F] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Vidéos ({mediaList.filter((m) => m.album_id === managingAlbum.id && m.type === 'video').length})
                  </button>
                </div>
              </div>

              {/* Scrollable Media Grid */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-[300px] max-h-[60vh] bg-gray-50/50">
                {(() => {
                  const albumItems = mediaList.filter((m) => {
                    if (m.album_id !== managingAlbum.id) return false;
                    if (albumMediaTab === 'photo') return m.type === 'photo';
                    if (albumMediaTab === 'video') return m.type === 'video';
                    return true;
                  });

                  if (albumItems.length === 0) {
                    return (
                      <div className="py-14 text-center max-w-md mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-[#92278F] flex items-center justify-center mx-auto shadow-inner">
                          <Folder className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-gray-900">
                            Aucun média {albumMediaTab !== 'all' ? (albumMediaTab === 'photo' ? 'photo' : 'vidéo') : ''} dans cet album
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Cet album est actuellement vide. Vous pouvez y ajouter de nouveaux médias ou y rattacher des médias existants de la médiathèque.
                          </p>
                        </div>
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openNewMediaModalForAlbum('photo', managingAlbum.id)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#92278F] text-white text-xs font-bold hover:bg-[#7a1f77] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Ajouter une photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openNewMediaModalForAlbum('video', managingAlbum.id)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF8C00] text-white text-xs font-bold hover:bg-[#e07b00] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Ajouter une vidéo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssociateModalForAlbum(managingAlbum)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-gray-800 border border-gray-300 text-xs font-bold hover:bg-gray-100 transition-colors"
                          >
                            <Link2 className="w-4 h-4 text-[#92278F]" />
                            <span>Choisir dans la médiathèque</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {albumItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                        >
                          <div className="relative aspect-video bg-gray-100 overflow-hidden group">
                            <img
                              src={item.thumbnail_url || item.url}
                              alt={item.title_fr}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              {item.type === 'video' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8C00] text-white flex items-center gap-1 shadow-xs">
                                  <Video className="w-3 h-3" />
                                  Vidéo
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#92278F] text-white flex items-center gap-1 shadow-xs">
                                  <ImageIcon className="w-3 h-3" />
                                  Photo
                                </span>
                              )}
                              {item.category && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs truncate max-w-[120px]">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            {item.type === 'video' && (
                              <button
                                type="button"
                                onClick={() => setAdminPreviewVideo(item)}
                                className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors"
                                title="Lire la vidéo"
                              >
                                <div className="w-10 h-10 rounded-full bg-white/90 text-[#FF8C00] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">
                                {item.title_fr}
                              </h5>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                {item.date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {item.date}
                                  </span>
                                )}
                                {item.location && (
                                  <span className="flex items-center gap-1 truncate max-w-[130px]">
                                    <MapPin className="w-3 h-3 text-gray-400" />
                                    {item.location}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openEditMediaModal(item)}
                                className="text-xs text-[#92278F] hover:text-[#7a1f77] font-bold inline-flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Modifier</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUnlinkMediaFromAlbum(item)}
                                className="text-xs text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                title="Retirer de l’album (le média est conservé dans la médiathèque)"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                                <span>Retirer</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-gray-500 text-[11px]">
                  💡 Les ajouts et retraits sont immédiatement synchronisés avec Supabase.
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlbumFilter(managingAlbum.id);
                      setActiveTab('all');
                      setCurrentPage(1);
                      setManagingAlbum(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Voir dans la vue générale
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagingAlbum(null)}
                    className="px-4 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Associer des médias existants à l'album */}
        {associateModalOpen && managingAlbum && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn">
              {/* Header */}
              <div className="p-5 sm:p-6 bg-[#92278F] text-white flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-[#FF8C00]" />
                    Association de médias existants
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold font-heading truncate">
                    Associer des médias à « {managingAlbum.title_fr} »
                  </h3>
                  <p className="text-xs text-purple-100">
                    Cochez les photos et vidéos de la médiathèque à intégrer à cet album.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAssociateModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={associateSearch}
                    onChange={(e) => setAssociateSearch(e.target.value)}
                    placeholder="Rechercher par titre, catégorie, lieu..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAssociateMediaType('all')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        associateMediaType === 'all'
                          ? 'bg-[#92278F] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssociateMediaType('photo')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        associateMediaType === 'photo'
                          ? 'bg-[#92278F] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssociateMediaType('video')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        associateMediaType === 'video'
                          ? 'bg-[#92278F] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Vidéos
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidates Grid */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-[300px] max-h-[58vh] bg-gray-50/50">
                {(() => {
                  const eligibleItems = mediaList.filter((m) => {
                    // Exclude media already in this album
                    if (m.album_id === managingAlbum.id) return false;
                    if (associateMediaType !== 'all' && m.type !== associateMediaType) return false;
                    if (associateSearch.trim()) {
                      const q = associateSearch.toLowerCase();
                      const matchTitle = (m.title_fr || '').toLowerCase().includes(q) || (m.title_en || '').toLowerCase().includes(q);
                      const matchCat = (m.category || '').toLowerCase().includes(q);
                      const matchLoc = (m.location || '').toLowerCase().includes(q);
                      if (!matchTitle && !matchCat && !matchLoc) return false;
                    }
                    return true;
                  });

                  if (eligibleItems.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-500 space-y-2">
                        <Folder className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-sm font-semibold">Aucun média éligible trouvé</p>
                        <p className="text-xs text-gray-400">
                          {associateSearch ? 'Essayez avec un autre mot-clé de recherche.' : 'Tous les médias de cette catégorie sont déjà associés à cet album.'}
                        </p>
                      </div>
                    );
                  }

                  const allEligibleSelected =
                    eligibleItems.length > 0 &&
                    eligibleItems.every((item) => selectedMediaIdsToAssociate.includes(item.id));

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200 text-xs">
                        <span className="text-gray-600 font-medium">
                          {eligibleItems.length} média(s) disponible(s) •{' '}
                          <span className="font-bold text-[#92278F]">
                            {selectedMediaIdsToAssociate.length} sélectionné(s)
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (allEligibleSelected) {
                                setSelectedMediaIdsToAssociate([]);
                              } else {
                                setSelectedMediaIdsToAssociate(eligibleItems.map((item) => item.id));
                              }
                            }}
                            className="text-xs text-[#92278F] hover:underline font-semibold"
                          >
                            {allEligibleSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {eligibleItems.map((item) => {
                          const isSelected = selectedMediaIdsToAssociate.includes(item.id);
                          const currentAlb = albums.find((a) => a.id === item.album_id);

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedMediaIdsToAssociate((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== item.id)
                                    : [...prev, item.id]
                                );
                              }}
                              className={`cursor-pointer rounded-xl border-2 transition-all p-2 bg-white flex flex-col justify-between gap-2 text-left relative ${
                                isSelected
                                  ? 'border-[#92278F] bg-purple-50/40 ring-2 ring-purple-200'
                                  : 'border-gray-200 hover:border-gray-300 shadow-xs'
                              }`}
                            >
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={item.thumbnail_url || item.url}
                                  alt={item.title_fr}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />

                                <div className="absolute top-1.5 left-1.5">
                                  {item.type === 'video' ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF8C00] text-white">
                                      Vidéo
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#92278F] text-white">
                                      Photo
                                    </span>
                                  )}
                                </div>

                                <div className="absolute top-1.5 right-1.5">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                                      isSelected
                                        ? 'bg-[#92278F] text-white shadow-xs'
                                        : 'bg-white/90 text-gray-400 border border-gray-300'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <h6 className="text-xs font-bold text-gray-900 line-clamp-1">
                                  {item.title_fr}
                                </h6>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-400 truncate max-w-[120px]">
                                    {item.category}
                                  </span>
                                  {currentAlb ? (
                                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded truncate max-w-[130px]" title={`Actuellement dans : ${currentAlb.title_fr}`}>
                                      Album : {currentAlb.title_fr}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">Non classé</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-600 font-semibold">
                  {selectedMediaIdsToAssociate.length} média(s) sélectionné(s)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssociateModalOpen(false);
                      setSelectedMediaIdsToAssociate([]);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={selectedMediaIdsToAssociate.length === 0}
                    onClick={handleAssociateSelectedMedia}
                    className={`px-4 py-1.5 rounded-xl font-bold text-white transition-colors ${
                      selectedMediaIdsToAssociate.length === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#92278F] hover:bg-[#7a1f77] shadow-xs'
                    }`}
                  >
                    Associer la sélection ({selectedMediaIdsToAssociate.length})
                  </button>
                </div>
              </div>
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
          title="Placer ce média dans la corbeille ?"
          message={`Êtes-vous sûr de vouloir déplacer « ${itemToDelete?.title} » dans la corbeille ? Le fichier source est préservé et pourra être restauré à tout moment.`}
          confirmLabel="Mettre à la corbeille"
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
          }}
        />

        {/* Unlink Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(mediaToUnlink)}
          title="Retirer ce média de l’album ?"
          message={`Êtes-vous sûr de vouloir retirer « ${mediaToUnlink?.title_fr} » de cet album ?\n\nLe fichier média est conservé intact dans la médiathèque générale.`}
          confirmLabel="Retirer de l’album"
          onConfirm={confirmUnlinkMedia}
          onCancel={() => setMediaToUnlink(null)}
        />
      </main>
    </AdminAuthGuard>
  );
}
