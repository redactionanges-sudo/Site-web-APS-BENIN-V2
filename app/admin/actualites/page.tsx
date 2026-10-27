'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { NewsItem, NewsStatus } from '@/types';
import { clientTranslateFields } from '@/lib/translation-service';
import { ImagePickerField, MultiImageGalleryField, VideoPickerField } from '@/components/admin/MediaSelectorModal';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  X,
  Globe,
  Tag,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Manual reordering state
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [saveOrderSuccess, setSaveOrderSuccess] = useState<string | null>(null);
  const [saveOrderError, setSaveOrderError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [batchTranslating, setBatchTranslating] = useState(false);
  const [batchTranslateNotice, setBatchTranslateNotice] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<NewsItem>>({
    title_fr: '',
    title_en: '',
    slug: '',
    category_fr: 'Actualité & Plaidoyer',
    category_en: 'News & Advocacy',
    summary_fr: '',
    summary_en: '',
    content_fr: '',
    content_en: '',
    author: 'Cellule Communication APS-BÉNIN',
    main_image: '',
    gallery: [],
    video_url: '',
    status: 'published',
    published_at: '',
    seo_title: '',
    seo_description: '',
  });

  const loadNews = async () => {
    const list = await supabaseStore.getNews();
    setNews(list);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const openNewModal = () => {
    setEditingNews(null);
    setForm({
      title_fr: '',
      title_en: '',
      slug: '',
      category_fr: 'Actualité & Plaidoyer',
      category_en: 'News & Advocacy',
      summary_fr: '',
      summary_en: '',
      content_fr: '',
      content_en: '',
      author: 'Cellule Communication APS-BÉNIN',
      main_image: '',
      gallery: [],
      video_url: '',
      status: 'published',
      published_at: new Date().toISOString().split('T')[0],
      seo_title: '',
      seo_description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingNews(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setForm((prev) => ({
      ...prev,
      title_fr: val,
      slug: editingNews ? prev.slug : slugified,
    }));
  };

  const handleAutoTranslateModal = async () => {
    const toTranslate: Record<string, string> = {};
    if (form.title_fr) toTranslate.title_en = form.title_fr;
    if (form.summary_fr) toTranslate.summary_en = form.summary_fr;
    if (form.content_fr) toTranslate.content_en = form.content_fr;
    if (form.category_fr) toTranslate.category_en = form.category_fr;

    if (Object.keys(toTranslate).length === 0) {
      alert('Veuillez d’abord renseigner des champs en français à traduire.');
      return;
    }

    setIsAutoTranslating(true);
    try {
      const translated = await clientTranslateFields(toTranslate, 'news');
      setForm((prev) => ({
        ...prev,
        title_en: translated.title_en || prev.title_en,
        summary_en: translated.summary_en || prev.summary_en,
        content_en: translated.content_en || prev.content_en,
        category_en: translated.category_en || prev.category_en,
      }));
    } catch (err: any) {
      alert(`Erreur de traduction : ${err.message || 'Impossible de contacter le service'}`);
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleBatchTranslateNews = async () => {
    const incomplete = news.filter(
      (n) =>
        (!n.content_en || !n.summary_en || !n.title_en) &&
        Boolean(n.content_fr || n.summary_fr || n.title_fr)
    );

    if (incomplete.length === 0) {
      alert('Toutes les actualités disposent déjà d’une version anglaise complète.');
      return;
    }

    if (!confirm(`Traduire automatiquement en anglais les ${incomplete.length} actualité(s) dont la version anglaise est incomplète ?`)) {
      return;
    }

    setBatchTranslating(true);
    setBatchTranslateNotice(`Traduction en cours de ${incomplete.length} actualité(s)...`);

    try {
      for (let i = 0; i < incomplete.length; i++) {
        const item = incomplete[i];
        setBatchTranslateNotice(`Traduction de l'actualité ${i + 1}/${incomplete.length} : « ${item.title_fr} »...`);
        const toTranslate: Record<string, string> = {};
        if (!item.title_en && item.title_fr) toTranslate.title_en = item.title_fr;
        if (!item.summary_en && item.summary_fr) toTranslate.summary_en = item.summary_fr;
        if (!item.content_en && item.content_fr) toTranslate.content_en = item.content_fr;
        if (!item.category_en && item.category_fr) toTranslate.category_en = item.category_fr;

        if (Object.keys(toTranslate).length > 0) {
          const trans = await clientTranslateFields(toTranslate, 'news');
          const updated: NewsItem = {
            ...item,
            title_en: item.title_en || trans.title_en || item.title_fr,
            summary_en: item.summary_en || trans.summary_en || item.summary_fr,
            content_en: item.content_en || trans.content_en || item.content_fr,
            category_en: item.category_en || trans.category_en || item.category_fr,
          };
          await supabaseStore.saveNews(updated);
          if (i < incomplete.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }

      await loadNews();
      setBatchTranslateNotice(`Succès : ${incomplete.length} actualité(s) ont été traduites et mises à jour.`);
      setTimeout(() => setBatchTranslateNotice(null), 5000);
    } catch (err: any) {
      alert(`Erreur lors de la traduction en masse : ${err.message}`);
      setBatchTranslateNotice(null);
    } finally {
      setBatchTranslating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_fr || !form.slug) {
      alert('Veuillez renseigner le titre en français et le slug de l’article.');
      return;
    }

    let title_en = (form.title_en || '').trim();
    let summary_en = (form.summary_en || '').trim();
    let content_en = (form.content_en || '').trim();
    let category_en = (form.category_en || '').trim();

    // Check if any English fields are missing while French counterparts exist
    const missingFields: Record<string, string> = {};
    if (!title_en && form.title_fr) missingFields.title_en = form.title_fr;
    if (!summary_en && form.summary_fr) missingFields.summary_en = form.summary_fr;
    if (!content_en && form.content_fr) missingFields.content_en = form.content_fr;
    if (!category_en && form.category_fr) missingFields.category_en = form.category_fr;

    if (Object.keys(missingFields).length > 0) {
      setIsAutoTranslating(true);
      try {
        const translated = await clientTranslateFields(missingFields, 'news');
        if (translated.title_en) title_en = translated.title_en;
        if (translated.summary_en) summary_en = translated.summary_en;
        if (translated.content_en) content_en = translated.content_en;
        if (translated.category_en) category_en = translated.category_en;
      } catch (e) {
        console.warn('Auto translation during save failed, falling back to French:', e);
      } finally {
        setIsAutoTranslating(false);
      }
    }

    // Safe fallbacks so content never blanks
    title_en = title_en || form.title_fr || '';
    summary_en = summary_en || form.summary_fr || '';
    content_en = content_en || form.content_fr || '';
    category_en = category_en || form.category_fr || 'News';

    const payload: NewsItem = {
      id: editingNews?.id || 'news-' + Date.now(),
      slug: form.slug!,
      title_fr: form.title_fr || '',
      title_en,
      summary_fr: form.summary_fr || '',
      summary_en,
      content_fr: form.content_fr || '',
      content_en,
      author: form.author || 'Cellule Communication APS-BÉNIN',
      category_fr: form.category_fr || 'Actualité',
      category_en,
      main_image: form.main_image || '',
      gallery: form.gallery || [],
      video_url: form.video_url || '',
      documents: form.documents || [],
      status: form.status as NewsStatus || 'published',
      published_at: form.published_at || new Date().toISOString(),
      created_at: editingNews?.created_at || new Date().toISOString(),
      seo_title: form.seo_title || form.title_fr,
      seo_description: form.seo_description || form.summary_fr,
    };

    try {
      await supabaseStore.saveNews(payload);
      await loadNews();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer l'actualité dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!newsToDelete) return;
    try {
      await supabaseStore.deleteNews(newsToDelete.id);
      await loadNews();
      setDeleteConfirmOpen(false);
      setNewsToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer l'actualité dans Supabase"}`);
    }
  };

  // Reordering handlers
  const handleMove = (id: string, direction: 'up' | 'down') => {
    const currentIndex = news.findIndex((n) => n.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= news.length) return;

    const next = [...news];
    const temp = next[currentIndex];
    next[currentIndex] = next[targetIndex];
    next[targetIndex] = temp;

    const reordered = next.map((n, idx) => ({ ...n, order_index: idx + 1 }));
    setNews(reordered);
    setHasOrderChanged(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    const idx = news.findIndex((n) => n.id === id);
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setDraggedIndex(null);
      return;
    }
    const sourceIndex = news.findIndex((n) => n.id === sourceId);
    const targetIndex = news.findIndex((n) => n.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedIndex(null);
      return;
    }

    const next = [...news];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);

    const reordered = next.map((n, idx) => ({ ...n, order_index: idx + 1 }));
    setNews(reordered);
    setDraggedIndex(null);
    setHasOrderChanged(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
    try {
      const ids = news.map((n) => n.id);
      const updated = await supabaseStore.saveNewsOrder(ids);
      setNews(updated);
      setHasOrderChanged(false);
      setSaveOrderSuccess("L'ordre d'affichage des actualités a été enregistré avec succès !");
      setTimeout(() => setSaveOrderSuccess(null), 4000);
    } catch (err: any) {
      console.error("Erreur enregistrement ordre actualités:", err);
      setSaveOrderError(
        err?.message || "Impossible d'enregistrer le nouvel ordre dans Supabase."
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCancelReorder = async () => {
    setSavingOrder(true);
    await loadNews();
    setHasOrderChanged(false);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
    setSavingOrder(false);
  };

  const handleResetChronological = () => {
    const sorted = [...news].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at || 0).getTime();
      const dateB = new Date(b.published_at || b.created_at || 0).getTime();
      return dateB - dateA;
    }).map((n, idx) => ({ ...n, order_index: idx + 1 }));
    setNews(sorted);
    setHasOrderChanged(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
  };

  const filtered = news.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title_fr.toLowerCase().includes(q) || item.slug.includes(q);
    return matchesStatus && matchesSearch;
  });

  const isFiltered = statusFilter !== 'all' || search.trim() !== '';

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Actualités (CMS)"
        subtitle="Rédigez, publiez, réorganisez et archivez les articles et communiqués d’APS-BÉNIN"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchTranslateNews}
              disabled={batchTranslating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Générer automatiquement la version anglaise des actualités incomplètes"
            >
              {batchTranslating ? (
                <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{batchTranslating ? 'Traduction en cours...' : 'Traduire en anglais'}</span>
            </button>
            {hasOrderChanged && (
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                {savingOrder ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-white" />
                )}
                <span>Enregistrer l'ordre</span>
              </button>
            )}
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#FF8C00]" />
              <span>Rédiger un Article</span>
            </button>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {batchTranslateNotice && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{batchTranslateNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBatchTranslateNotice(null)}
              className="text-indigo-700 hover:text-indigo-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Success alert */}
        {saveOrderSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveOrderSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveOrderSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error alert */}
        {saveOrderError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveOrderError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveOrder}
                className="text-xs font-bold px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Réessayer
              </button>
              <button
                type="button"
                onClick={() => setSaveOrderError(null)}
                className="text-red-700 hover:text-red-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Sticky/Prominent Pending Order Save Banner */}
        {hasOrderChanged && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>
                L'ordre d'affichage des actualités a été modifié manuellement. Les visiteurs du site verront cet ordre une fois enregistré.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetChronological}
                title="Rétablir le tri par date de parution"
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Par date</span>
              </button>
              <button
                type="button"
                onClick={handleCancelReorder}
                disabled={savingOrder}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="px-4 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2"
              >
                {savingOrder ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sauvegarde en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#FF8C00]" />
                    <span>Enregistrer l'ordre</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'all' ? 'bg-[#92278F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Tous ({news.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'published' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Publiés
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'draft' ? 'bg-[#FF8C00] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Brouillons
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'archived' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Archivés
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white"
            />
          </div>
        </div>

        {/* Filter warning notice */}
        {isFiltered && (
          <div className="bg-purple-50/60 border border-purple-200 rounded-lg px-4 py-2 text-xs text-purple-900 flex items-center justify-between gap-2">
            <span>
              Filtre actif : la réorganisation manuelle s’effectue sur la liste complète des actualités.
            </span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearch('');
              }}
              className="font-bold underline text-[#92278F] hover:text-[#741772] shrink-0"
            >
              Afficher toute la liste pour réorganiser
            </button>
          </div>
        )}

        {/* News Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-32">Ordre</th>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Date de parution</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((item) => {
                  const globalIdx = news.findIndex((n) => n.id === item.id);
                  const isFirst = globalIdx === 0;
                  const isLast = globalIdx === news.length - 1;

                  return (
                    <tr
                      key={item.id}
                      draggable={!isFiltered}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item.id)}
                      className={`hover:bg-purple-50/30 transition-colors ${
                        draggedIndex === globalIdx ? 'opacity-40 bg-purple-100' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title={isFiltered ? "Désactivez le filtre pour glisser-déposer" : "Glisser pour réorganiser"}
                            className={`p-1 rounded text-gray-400 ${
                              isFiltered ? 'cursor-not-allowed opacity-40' : 'cursor-grab hover:text-gray-700 hover:bg-gray-100 active:cursor-grabbing'
                            }`}
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-[#92278F] min-w-[28px] text-center">
                            #{globalIdx + 1}
                          </span>
                          <div className="flex flex-col gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={() => handleMove(item.id, 'up')}
                              disabled={isFirst}
                              title="Monter"
                              className={`p-0.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors ${
                                isFirst ? 'opacity-20 cursor-not-allowed' : ''
                              }`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(item.id, 'down')}
                              disabled={isLast}
                              title="Descendre"
                              className={`p-0.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors ${
                                isLast ? 'opacity-20 cursor-not-allowed' : ''
                              }`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.main_image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1 max-w-md">
                            {item.title_fr}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            /{item.slug} • Par {item.author}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#92278F]">
                      {item.category_fr}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'draft'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status === 'published'
                          ? 'Publié'
                          : item.status === 'draft'
                          ? 'Brouillon'
                          : 'Archivé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono">
                      {new Date(item.published_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/actualites/${item.slug}`}
                          target="_blank"
                          title="Aperçu public"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Modifier"
                          className="p-1.5 rounded hover:bg-purple-50 text-[#92278F]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewsToDelete(item);
                            setDeleteConfirmOpen(true);
                          }}
                          title="Supprimer"
                          className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit / Create News Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  {editingNews ? 'Modifier l’article' : 'Rédiger une nouvelle actualité'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Bilingual Helper Banner */}
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>Système bilingue automatique :</strong> Rédigez sereinement en français. Les champs anglais sont auto-générés à l'enregistrement s'ils sont laissés vides.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoTranslateModal}
                    disabled={isAutoTranslating || !form.title_fr}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0 disabled:opacity-50 transition-colors shadow-xs"
                    title="Pré-remplir immédiatement les champs anglais à partir des textes français saisis"
                  >
                    {isAutoTranslating ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isAutoTranslating ? 'Traduction en cours...' : 'Pré-remplir l’anglais'}</span>
                  </button>
                </div>

                {/* Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre de l’article (Français) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title_fr}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre de l’article (Anglais)
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Slug, Category, Status, Date */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      value={form.category_fr}
                      onChange={(e) => setForm({ ...form, category_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as NewsStatus })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="published">Publié</option>
                      <option value="draft">Brouillon</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Auteur
                    </label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Main Image URL & Video */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <ImagePickerField
                      label="Image principale (Couverture)"
                      value={form.main_image || ''}
                      onChange={(url) => setForm({ ...form, main_image: url })}
                      placeholder="https://... ou choisir dans la médiathèque"
                      helpText="Image mise en avant sur le blog, les listes et en tête de l'article."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <VideoPickerField
                      label="Vidéo associée à l'actualité"
                      value={form.video_url || ''}
                      onChange={(url) => setForm({ ...form, video_url: url })}
                      helpText="Prend en charge YouTube, Vimeo ou les fichiers vidéo téléversés dans la Médiathèque Supabase."
                    />
                  </div>
                </div>

                {/* Photo Gallery */}
                <div>
                  <MultiImageGalleryField
                    label="Galerie photos de l’actualité"
                    description="Sélectionnez plusieurs photos depuis la Médiathèque pour enrichir le reportage visuel de cet article."
                    images={form.gallery || []}
                    onChange={(gallery) => setForm({ ...form, gallery })}
                    onSetMainImage={(url) => setForm({ ...form, main_image: url })}
                    mainImageUrl={form.main_image}
                  />
                </div>

                {/* Summaries */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Chapeau / Résumé (Français)
                    </label>
                    <textarea
                      rows={2}
                      value={form.summary_fr}
                      onChange={(e) => setForm({ ...form, summary_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Summary (English)
                    </label>
                    <textarea
                      rows={2}
                      value={form.summary_en}
                      onChange={(e) => setForm({ ...form, summary_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Content FR & EN with WYSIWYG Rich Text Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label="Contenu complet de l’article"
                      langTag="FR"
                      value={form.content_fr || ''}
                      onChange={(html) => setForm({ ...form, content_fr: html })}
                      placeholder="Rédigez le contenu complet en français avec mise en forme..."
                      minHeight="280px"
                      helpText="Titres H2-H4, gras, listes, liens, citations, police Open Sans/Montserrat."
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label="Full Article Content"
                      langTag="EN"
                      value={form.content_en || ''}
                      onChange={(html) => setForm({ ...form, content_en: html })}
                      placeholder="Write the full English content with rich formatting..."
                      minHeight="280px"
                      helpText="Headings, bold, lists, hyperlinks, blockquotes, Open Sans/Montserrat."
                    />
                  </div>
                </div>

                {/* SEO Settings */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                    Paramètres SEO & Référencement
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Balise Titre SEO
                      </label>
                      <input
                        type="text"
                        value={form.seo_title}
                        onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                        placeholder="Laisser vide pour reprendre le titre"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Meta Description SEO
                      </label>
                      <input
                        type="text"
                        value={form.seo_description}
                        onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                        placeholder="Laisser vide pour reprendre le résumé"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isAutoTranslating}
                    className="px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAutoTranslating && (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>
                      {isAutoTranslating
                        ? 'Traduction & enregistrement...'
                        : editingNews
                        ? 'Enregistrer les modifications'
                        : 'Publier l’article'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Placer cette actualité dans la corbeille ?"
          message={`Êtes-vous sûr de vouloir déplacer l’article « ${newsToDelete?.title_fr} » dans la corbeille ? Vous pourrez le restaurer à tout moment.`}
          confirmLabel="Mettre à la corbeille"
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setNewsToDelete(null);
          }}
        />
      </main>
    </AdminAuthGuard>
  );
}
