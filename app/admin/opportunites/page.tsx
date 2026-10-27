'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { OpportunityItem, OpportunityStatus, OpportunityType } from '@/types';
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
  Clock,
  Briefcase,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Manual reordering state
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [saveOrderSuccess, setSaveOrderSuccess] = useState<string | null>(null);
  const [saveOrderError, setSaveOrderError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<OpportunityItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [oppToDelete, setOppToDelete] = useState<OpportunityItem | null>(null);

  // Translation states
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [batchTranslating, setBatchTranslating] = useState(false);
  const [batchTranslateNotice, setBatchTranslateNotice] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<OpportunityItem>>({
    title_fr: '',
    title_en: '',
    slug: '',
    type: 'recruitment',
    description_fr: '',
    description_en: '',
    organization: 'AGISSONS POUR SAUVER – APS-BÉNIN',
    published_at: '',
    deadline: '',
    location_fr: 'Djacoṭé-Comè (Département du Mono)',
    location_en: 'Djacoṭé-Comè (Mono Department)',
    conditions_fr: '',
    conditions_en: '',
    documents_required_fr: '',
    documents_required_en: '',
    pdf_url: '',
    contact_email: 'contact@apsbeninong.org',
    status: 'open',
    main_image: '',
    gallery: [],
    video_url: '',
  });

  const loadOpportunities = async () => {
    const list = await supabaseStore.getOpportunities();
    setOpportunities(list);
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const openNewModal = () => {
    setEditingOpp(null);
    setForm({
      title_fr: '',
      title_en: '',
      slug: '',
      type: 'recruitment',
      description_fr: '',
      description_en: '',
      organization: 'AGISSONS POUR SAUVER – APS-BÉNIN',
      published_at: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      location_fr: 'Djacoṭé-Comè (Département du Mono)',
      location_en: 'Djacoṭé-Comè (Mono Department)',
      conditions_fr: '',
      conditions_en: '',
      documents_required_fr: '',
      documents_required_en: '',
      pdf_url: '',
      contact_email: 'contact@apsbeninong.org',
      status: 'open',
      main_image: '',
      gallery: [],
      video_url: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (item: OpportunityItem) => {
    setEditingOpp(item);
    setForm({
      ...item,
      published_at: item.published_at.split('T')[0],
      deadline: item.deadline.split('T')[0],
      main_image: item.main_image || '',
      gallery: item.gallery || [],
      video_url: item.video_url || '',
    });
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
      slug: editingOpp ? prev.slug : slugified,
    }));
  };

  const handleAutoTranslateModal = async () => {
    if (!form.title_fr) {
      alert('Veuillez au moins saisir le titre en français avant de traduire.');
      return;
    }
    const toTranslate: Record<string, string> = {
      title_en: form.title_fr,
    };
    if (form.description_fr) toTranslate.description_en = form.description_fr;
    if (form.location_fr) toTranslate.location_en = form.location_fr;
    if (form.conditions_fr) toTranslate.conditions_en = form.conditions_fr;
    if (form.documents_required_fr) toTranslate.documents_required_en = form.documents_required_fr;

    setIsAutoTranslating(true);
    try {
      const translated = await clientTranslateFields(toTranslate, 'opportunity');
      setForm((prev) => ({
        ...prev,
        title_en: translated.title_en || prev.title_en,
        description_en: translated.description_en || prev.description_en,
        location_en: translated.location_en || prev.location_en,
        conditions_en: translated.conditions_en || prev.conditions_en,
        documents_required_en: translated.documents_required_en || prev.documents_required_en,
      }));
    } catch (err: any) {
      alert(`Erreur de traduction : ${err.message || 'Impossible de contacter le service'}`);
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleBatchTranslateOpportunities = async () => {
    const incomplete = opportunities.filter(
      (o) =>
        (!o.description_en || !o.title_en || !o.conditions_en) &&
        Boolean(o.description_fr || o.title_fr || o.conditions_fr)
    );

    if (incomplete.length === 0) {
      alert('Toutes les opportunités disposent déjà d’une version anglaise complète.');
      return;
    }

    if (!confirm(`Traduire automatiquement en anglais les ${incomplete.length} opportunité(s) dont la version anglaise est incomplète ?`)) {
      return;
    }

    setBatchTranslating(true);
    setBatchTranslateNotice(`Traduction en cours de ${incomplete.length} opportunité(s)...`);

    try {
      for (let i = 0; i < incomplete.length; i++) {
        const item = incomplete[i];
        setBatchTranslateNotice(`Traduction de l'opportunité ${i + 1}/${incomplete.length} : « ${item.title_fr} »...`);
        const toTranslate: Record<string, string> = {};
        if (!item.title_en && item.title_fr) toTranslate.title_en = item.title_fr;
        if (!item.description_en && item.description_fr) toTranslate.description_en = item.description_fr;
        if (!item.location_en && item.location_fr) toTranslate.location_en = item.location_fr;
        if (!item.conditions_en && item.conditions_fr) toTranslate.conditions_en = item.conditions_fr;
        if (!item.documents_required_en && item.documents_required_fr) toTranslate.documents_required_en = item.documents_required_fr;

        if (Object.keys(toTranslate).length > 0) {
          const trans = await clientTranslateFields(toTranslate, 'opportunity');
          const updated: OpportunityItem = {
            ...item,
            title_en: item.title_en || trans.title_en || item.title_fr,
            description_en: item.description_en || trans.description_en || item.description_fr,
            location_en: item.location_en || trans.location_en || item.location_fr,
            conditions_en: item.conditions_en || trans.conditions_en || item.conditions_fr,
            documents_required_en: item.documents_required_en || trans.documents_required_en || item.documents_required_fr,
          };
          await supabaseStore.saveOpportunity(updated);
          if (i < incomplete.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }

      await loadOpportunities();
      setBatchTranslateNotice(`Succès : ${incomplete.length} opportunité(s) ont été traduites et mises à jour.`);
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
      alert('Veuillez renseigner le titre et le slug de l’opportunité.');
      return;
    }

    let title_en = (form.title_en || '').trim();
    let description_en = (form.description_en || '').trim();
    let location_en = (form.location_en || '').trim();
    let conditions_en = (form.conditions_en || '').trim();
    let documents_required_en = (form.documents_required_en || '').trim();

    // Check if any English fields are missing while French counterparts exist
    const missingFields: Record<string, string> = {};
    if (!title_en && form.title_fr) missingFields.title_en = form.title_fr;
    if (!description_en && form.description_fr) missingFields.description_en = form.description_fr;
    if (!location_en && form.location_fr) missingFields.location_en = form.location_fr;
    if (!conditions_en && form.conditions_fr) missingFields.conditions_en = form.conditions_fr;
    if (!documents_required_en && form.documents_required_fr) missingFields.documents_required_en = form.documents_required_fr;

    if (Object.keys(missingFields).length > 0) {
      setIsAutoTranslating(true);
      try {
        const translated = await clientTranslateFields(missingFields, 'opportunity');
        if (translated.title_en) title_en = translated.title_en;
        if (translated.description_en) description_en = translated.description_en;
        if (translated.location_en) location_en = translated.location_en;
        if (translated.conditions_en) conditions_en = translated.conditions_en;
        if (translated.documents_required_en) documents_required_en = translated.documents_required_en;
      } catch (e) {
        console.warn('Auto translation during opportunity save failed, falling back to French:', e);
      } finally {
        setIsAutoTranslating(false);
      }
    }

    // Reliable fallback so no field ever renders null
    title_en = title_en || form.title_fr || '';
    description_en = description_en || form.description_fr || '';
    location_en = location_en || form.location_fr || 'Comè';
    conditions_en = conditions_en || form.conditions_fr || '';
    documents_required_en = documents_required_en || form.documents_required_fr || '';

    const payload: OpportunityItem = {
      id: editingOpp?.id || 'opp-' + Date.now(),
      slug: form.slug!,
      title_fr: form.title_fr || '',
      title_en: title_en,
      type: form.type as OpportunityType || 'recruitment',
      description_fr: form.description_fr || '',
      description_en: description_en,
      organization: form.organization || 'AGISSONS POUR SAUVER – APS-BÉNIN',
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : new Date().toISOString(),
      location_fr: form.location_fr || 'Comè',
      location_en: location_en,
      conditions_fr: form.conditions_fr || '',
      conditions_en: conditions_en,
      documents_required_fr: form.documents_required_fr || '',
      documents_required_en: documents_required_en,
      pdf_url: form.pdf_url || '',
      contact_email: form.contact_email || 'contact@apsbeninong.org',
      status: form.status as OpportunityStatus || 'open',
      main_image: form.main_image || '',
      gallery: form.gallery || [],
      video_url: form.video_url || '',
    };

    try {
      await supabaseStore.saveOpportunity(payload);
      await loadOpportunities();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer l'opportunité dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!oppToDelete) return;
    try {
      await supabaseStore.deleteOpportunity(oppToDelete.id);
      await loadOpportunities();
      setDeleteConfirmOpen(false);
      setOppToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer l'opportunité dans Supabase"}`);
    }
  };

  // Reordering handlers
  const handleMove = (id: string, direction: 'up' | 'down') => {
    const currentIndex = opportunities.findIndex((o) => o.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= opportunities.length) return;

    const next = [...opportunities];
    const temp = next[currentIndex];
    next[currentIndex] = next[targetIndex];
    next[targetIndex] = temp;

    const reordered = next.map((o, idx) => ({ ...o, order_index: idx + 1 }));
    setOpportunities(reordered);
    setHasOrderChanged(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    const idx = opportunities.findIndex((o) => o.id === id);
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
    const sourceIndex = opportunities.findIndex((o) => o.id === sourceId);
    const targetIndex = opportunities.findIndex((o) => o.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedIndex(null);
      return;
    }

    const next = [...opportunities];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);

    const reordered = next.map((o, idx) => ({ ...o, order_index: idx + 1 }));
    setOpportunities(reordered);
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
      const ids = opportunities.map((o) => o.id);
      const updated = await supabaseStore.saveOpportunitiesOrder(ids);
      setOpportunities(updated);
      setHasOrderChanged(false);
      setSaveOrderSuccess("L'ordre d'affichage des opportunités a été enregistré avec succès !");
      setTimeout(() => setSaveOrderSuccess(null), 4000);
    } catch (err: any) {
      console.error("Erreur enregistrement ordre opportunités:", err);
      setSaveOrderError(
        err?.message || "Impossible d'enregistrer le nouvel ordre dans Supabase."
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCancelReorder = async () => {
    setSavingOrder(true);
    await loadOpportunities();
    setHasOrderChanged(false);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
    setSavingOrder(false);
  };

  const handleResetChronological = () => {
    const sorted = [...opportunities].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at || 0).getTime();
      const dateB = new Date(b.published_at || b.created_at || 0).getTime();
      return dateB - dateA;
    }).map((o, idx) => ({ ...o, order_index: idx + 1 }));
    setOpportunities(sorted);
    setHasOrderChanged(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
  };

  const filtered = opportunities.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title_fr.toLowerCase().includes(q) || item.slug.includes(q);
    return matchesStatus && matchesSearch;
  });

  const isFiltered = statusFilter !== 'all' || search.trim() !== '';

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Opportunités"
        subtitle="Publiez, réorganisez et gérez les avis de recrutement, stages, volontariat et appels d’offres"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchTranslateOpportunities}
              disabled={batchTranslating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Générer automatiquement la version anglaise des opportunités incomplètes"
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
              <span>Nouvelle Opportunité</span>
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
                L'ordre d'affichage des opportunités a été modifié manuellement. Les candidats et visiteurs verront cet ordre une fois enregistré.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetChronological}
                title="Rétablir le tri par date de publication"
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
              Toutes ({opportunities.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'open' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Ouvertes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'closed' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Clôturées
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une offre..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white"
            />
          </div>
        </div>

        {/* Filter warning notice */}
        {isFiltered && (
          <div className="bg-purple-50/60 border border-purple-200 rounded-lg px-4 py-2 text-xs text-purple-900 flex items-center justify-between gap-2">
            <span>
              Filtre actif : la réorganisation manuelle s’effectue sur la liste complète des opportunités.
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

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-32">Ordre</th>
                  <th className="py-3 px-4">Intitulé</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Date Limite</th>
                  <th className="py-3 px-4">Lieu</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((item) => {
                  const globalIdx = opportunities.findIndex((o) => o.id === item.id);
                  const isFirst = globalIdx === 0;
                  const isLast = globalIdx === opportunities.length - 1;

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
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        {item.main_image ? (
                          <img
                            src={item.main_image}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0 bg-gray-50">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="line-clamp-1 max-w-md">{item.title_fr}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-400">/{item.slug}</span>
                            {item.gallery && item.gallery.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-[#92278F] font-semibold">
                                +{item.gallery.length} photos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#92278F] border border-purple-100 capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status === 'open' ? 'Ouverte' : 'Clôturée'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#92278F]">
                      {new Date(item.deadline).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.location_fr}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/opportunites/${item.slug}`}
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
                            setOppToDelete(item);
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

        {/* Modal Create/Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  {editingOpp ? 'Modifier l’opportunité' : 'Publier une nouvelle opportunité'}
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
                      <strong>Système bilingue automatique :</strong> Rédigez en français. Les champs anglais sont auto-générés à l'enregistrement s'ils sont laissés vides.
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Intitulé de l’opportunité (Français) *
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
                      Title (English)
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

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
                      Type d'opportunité
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityType })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="recruitment">Recrutement</option>
                      <option value="internship">Stage</option>
                      <option value="volunteering">Volontariat</option>
                      <option value="call_for_tenders">Appel d'offres</option>
                      <option value="consultation">Consultation</option>
                      <option value="call_for_eoi">Appel à manifestation d'intérêt</option>
                      <option value="other">Autre opportunité</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Statut
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as OpportunityStatus })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="open">Ouverte (Candidatures acceptées)</option>
                      <option value="closed">Clôturée</option>
                      <option value="archived">Archivée</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Date Limite de dépôt *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.deadline}
                      onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Lieu d'affectation (Français)
                    </label>
                    <input
                      type="text"
                      value={form.location_fr}
                      onChange={(e) => setForm({ ...form, location_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Location (English)
                    </label>
                    <input
                      type="text"
                      value={form.location_en}
                      onChange={(e) => setForm({ ...form, location_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email de réception des candidatures
                    </label>
                    <input
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Visuals: Main Image & Multi-Image Gallery */}
                <div className="space-y-4">
                  <ImagePickerField
                    label="Image principale de l’opportunité (Couverture)"
                    value={form.main_image || ''}
                    onChange={(url) => setForm({ ...form, main_image: url })}
                    placeholder="https://... ou choisir dans la médiathèque"
                    helpText="Image de couverture utilisée sur les listes, les cartes et dans l'en-tête de l'offre."
                  />

                  <MultiImageGalleryField
                    label="Galerie d’images de l’opportunité"
                    description="Sélectionnez plusieurs photos depuis la Médiathèque pour illustrer les activités, les missions ou les locaux."
                    images={form.gallery || []}
                    onChange={(gallery) => setForm({ ...form, gallery })}
                    onSetMainImage={(url) => setForm({ ...form, main_image: url })}
                    mainImageUrl={form.main_image}
                  />

                  <VideoPickerField
                    label="Vidéo de présentation de l’opportunité (optionnel)"
                    value={form.video_url || ''}
                    onChange={(url) => setForm({ ...form, video_url: url })}
                    helpText="Associez une vidéo descriptive (YouTube, Vimeo, ou téléversée dans la médiathèque) pour cette opportunité."
                    targetModule="opportunites"
                  />
                </div>

                {/* Description FR & EN */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label="Description de la mission (Français)"
                      langTag="FR"
                      value={form.description_fr || ''}
                      onChange={(html) => setForm({ ...form, description_fr: html })}
                      placeholder="Détail de la mission, responsabilités, contexte..."
                      minHeight="180px"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label="Description (English)"
                      langTag="EN"
                      value={form.description_en || ''}
                      onChange={(html) => setForm({ ...form, description_en: html })}
                      placeholder="Mission overview, responsibilities, context..."
                      minHeight="180px"
                    />
                  </div>
                </div>

                {/* Conditions & Profil FR / EN */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label="Profil recherché & Conditions (Français)"
                      langTag="FR"
                      value={form.conditions_fr || ''}
                      onChange={(html) => setForm({ ...form, conditions_fr: html })}
                      placeholder="Critères d'éligibilité, compétences requises, lieu..."
                      minHeight="160px"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label="Profile & Requirements (English)"
                      langTag="EN"
                      value={form.conditions_en || ''}
                      onChange={(html) => setForm({ ...form, conditions_en: html })}
                      placeholder="Eligibility criteria, skills, requirements..."
                      minHeight="160px"
                    />
                  </div>
                </div>

                {/* Dossier & Pièces à fournir FR / EN */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label="Dossier / Pièces à fournir (Français)"
                      langTag="FR"
                      value={form.documents_required_fr || ''}
                      onChange={(html) => setForm({ ...form, documents_required_fr: html })}
                      placeholder="Liste des documents : CV, lettre de motivation, attestations..."
                      minHeight="160px"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label="Required Documents (English)"
                      langTag="EN"
                      value={form.documents_required_en || ''}
                      onChange={(html) => setForm({ ...form, documents_required_en: html })}
                      placeholder="Application pack: Resume, Cover Letter, Certificates..."
                      minHeight="160px"
                    />
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
                        : editingOpp
                        ? 'Enregistrer les modifications'
                        : 'Créer l’opportunité'}
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
          title="Placer cette opportunité dans la corbeille ?"
          message={`Êtes-vous sûr de vouloir déplacer l'opportunité « ${oppToDelete?.title_fr} » dans la corbeille ? Vous pourrez la restaurer à tout moment.`}
          confirmLabel="Mettre à la corbeille"
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setOppToDelete(null);
          }}
        />
      </main>
    </AdminAuthGuard>
  );
}
