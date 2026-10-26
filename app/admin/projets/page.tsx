'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { ProjectItem, ProjectStatus } from '@/types';
import { clientTranslateFields } from '@/lib/translation-service';
import { ImagePickerField, MultiImageGalleryField, MultiVideoListField } from '@/components/admin/MediaSelectorModal';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
  X,
  Upload,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Manual reordering state
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [saveOrderSuccess, setSaveOrderSuccess] = useState<string | null>(null);
  const [saveOrderError, setSaveOrderError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [editingLang, setEditingLang] = useState<'fr' | 'en'>('fr');
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [batchTranslating, setBatchTranslating] = useState(false);
  const [batchTranslateNotice, setBatchTranslateNotice] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<ProjectItem>>({
    title_fr: '',
    title_en: '',
    slug: '',
    excerpt_fr: '',
    excerpt_en: '',
    context_fr: '',
    context_en: '',
    problem_fr: '',
    problem_en: '',
    objectives_fr: '',
    objectives_en: '',
    activities_fr: '',
    activities_en: '',
    expected_results_fr: '',
    expected_results_en: '',
    achieved_results_fr: '',
    achieved_results_en: '',
    beneficiaries_fr: '',
    beneficiaries_en: '',
    intervention_zone: 'Département du Mono',
    communes: ['Comè'],
    period: '2025 – 2027',
    duration: '24 mois',
    partners: ['Mairie de Comè'],
    financial_partner: '',
    status: 'in_progress',
    is_featured: false,
    main_image: '',
    photos: [],
    videos: [],
    documents: [],
  });

  const loadProjects = async () => {
    const list = await supabaseStore.getProjects();
    setProjects(list);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openNewModal = () => {
    setEditingProject(null);
    setForm({
      title_fr: '',
      title_en: '',
      slug: '',
      excerpt_fr: '',
      excerpt_en: '',
      context_fr: '',
      context_en: '',
      problem_fr: '',
      problem_en: '',
      objectives_fr: '',
      objectives_en: '',
      activities_fr: '',
      activities_en: '',
      expected_results_fr: '',
      expected_results_en: '',
      achieved_results_fr: '',
      achieved_results_en: '',
      beneficiaries_fr: '',
      beneficiaries_en: '',
      intervention_zone: 'Département du Mono',
      communes: ['Comè'],
      period: '2026 – 2028',
      duration: '24 mois',
      partners: ['Partenaires institutionnels locaux'],
      financial_partner: '',
      status: 'in_progress',
      is_featured: false,
      main_image: '',
      photos: [],
      videos: [],
      documents: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setForm({ ...p });
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
      slug: editingProject ? prev.slug : slugified,
    }));
  };

  const handleAutoTranslateModal = async () => {
    const toTranslate: Record<string, string> = {};
    if (form.title_fr) toTranslate.title_en = form.title_fr;
    if (form.excerpt_fr) toTranslate.excerpt_en = form.excerpt_fr;
    if (form.context_fr) toTranslate.context_en = form.context_fr;
    if (form.problem_fr) toTranslate.problem_en = form.problem_fr;
    if (form.objectives_fr) toTranslate.objectives_en = form.objectives_fr;
    if (form.activities_fr) toTranslate.activities_en = form.activities_fr;
    if (form.expected_results_fr) toTranslate.expected_results_en = form.expected_results_fr;
    if (form.achieved_results_fr) toTranslate.achieved_results_en = form.achieved_results_fr;
    if (form.beneficiaries_fr) toTranslate.beneficiaries_en = form.beneficiaries_fr;

    if (Object.keys(toTranslate).length === 0) {
      alert('Veuillez d’abord renseigner des champs en français à traduire.');
      return;
    }

    setIsAutoTranslating(true);
    try {
      const translated = await clientTranslateFields(toTranslate, 'project');
      setForm((prev) => ({
        ...prev,
        title_en: translated.title_en || prev.title_en,
        excerpt_en: translated.excerpt_en || prev.excerpt_en,
        context_en: translated.context_en || prev.context_en,
        problem_en: translated.problem_en || prev.problem_en,
        objectives_en: translated.objectives_en || prev.objectives_en,
        activities_en: translated.activities_en || prev.activities_en,
        expected_results_en: translated.expected_results_en || prev.expected_results_en,
        achieved_results_en: translated.achieved_results_en || prev.achieved_results_en,
        beneficiaries_en: translated.beneficiaries_en || prev.beneficiaries_en,
      }));
      setEditingLang('en');
    } catch (err: any) {
      alert(`Erreur de traduction automatique : ${err.message || 'Impossible de contacter le service'}`);
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleBatchTranslateProjects = async () => {
    const incomplete = projects.filter(
      (p) =>
        (!p.context_en || !p.problem_en || !p.objectives_en || !p.title_en) &&
        Boolean(p.context_fr || p.problem_fr || p.objectives_fr || p.title_fr)
    );

    if (incomplete.length === 0) {
      alert('Tous les projets disposent déjà d’une version anglaise complète.');
      return;
    }

    if (!confirm(`Traduire automatiquement en anglais les ${incomplete.length} projet(s) existant(s) dont la version anglaise est incomplète ?`)) {
      return;
    }

    setBatchTranslating(true);
    setBatchTranslateNotice(`Traduction en cours de ${incomplete.length} projet(s)...`);

    try {
      for (let i = 0; i < incomplete.length; i++) {
        const p = incomplete[i];
        setBatchTranslateNotice(`Traduction du projet ${i + 1}/${incomplete.length} : « ${p.title_fr} »...`);
        const toTranslate: Record<string, string> = {};
        if (!p.title_en && p.title_fr) toTranslate.title_en = p.title_fr;
        if (!p.excerpt_en && p.excerpt_fr) toTranslate.excerpt_en = p.excerpt_fr;
        if (!p.context_en && p.context_fr) toTranslate.context_en = p.context_fr;
        if (!p.problem_en && p.problem_fr) toTranslate.problem_en = p.problem_fr;
        if (!p.objectives_en && p.objectives_fr) toTranslate.objectives_en = p.objectives_fr;
        if (!p.activities_en && p.activities_fr) toTranslate.activities_en = p.activities_fr;
        if (!p.expected_results_en && p.expected_results_fr) toTranslate.expected_results_en = p.expected_results_fr;
        if (!p.achieved_results_en && p.achieved_results_fr) toTranslate.achieved_results_en = p.achieved_results_fr;
        if (!p.beneficiaries_en && p.beneficiaries_fr) toTranslate.beneficiaries_en = p.beneficiaries_fr;

        if (Object.keys(toTranslate).length > 0) {
          const trans = await clientTranslateFields(toTranslate, 'project');
          const updated: ProjectItem = {
            ...p,
            title_en: p.title_en || trans.title_en || p.title_fr,
            excerpt_en: p.excerpt_en || trans.excerpt_en || p.excerpt_fr,
            context_en: p.context_en || trans.context_en || p.context_fr,
            problem_en: p.problem_en || trans.problem_en || p.problem_fr,
            objectives_en: p.objectives_en || trans.objectives_en || p.objectives_fr,
            activities_en: p.activities_en || trans.activities_en || p.activities_fr,
            expected_results_en: p.expected_results_en || trans.expected_results_en || p.expected_results_fr,
            achieved_results_en: p.achieved_results_en || trans.achieved_results_en || p.achieved_results_fr,
            beneficiaries_en: p.beneficiaries_en || trans.beneficiaries_en || p.beneficiaries_fr,
            updated_at: new Date().toISOString(),
          };
          await supabaseStore.saveProject(updated);
        }
      }

      await loadProjects();
      setBatchTranslateNotice(`Succès : ${incomplete.length} projet(s) ont été traduits et mis à jour.`);
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
      alert('Veuillez renseigner le titre en français et le slug du projet.');
      return;
    }

    let title_en = (form.title_en || '').trim();
    let excerpt_en = (form.excerpt_en || '').trim();
    let context_en = (form.context_en || '').trim();
    let problem_en = (form.problem_en || '').trim();
    let objectives_en = (form.objectives_en || '').trim();
    let activities_en = (form.activities_en || '').trim();
    let expected_results_en = (form.expected_results_en || '').trim();
    let achieved_results_en = (form.achieved_results_en || '').trim();
    let beneficiaries_en = (form.beneficiaries_en || '').trim();

    // Check if any English fields are missing while French counterparts exist
    const missingFields: Record<string, string> = {};
    if (!title_en && form.title_fr) missingFields.title_en = form.title_fr;
    if (!excerpt_en && form.excerpt_fr) missingFields.excerpt_en = form.excerpt_fr;
    if (!context_en && form.context_fr) missingFields.context_en = form.context_fr;
    if (!problem_en && form.problem_fr) missingFields.problem_en = form.problem_fr;
    if (!objectives_en && form.objectives_fr) missingFields.objectives_en = form.objectives_fr;
    if (!activities_en && form.activities_fr) missingFields.activities_en = form.activities_fr;
    if (!expected_results_en && form.expected_results_fr) missingFields.expected_results_en = form.expected_results_fr;
    if (!achieved_results_en && form.achieved_results_fr) missingFields.achieved_results_en = form.achieved_results_fr;
    if (!beneficiaries_en && form.beneficiaries_fr) missingFields.beneficiaries_en = form.beneficiaries_fr;

    if (Object.keys(missingFields).length > 0) {
      setIsAutoTranslating(true);
      try {
        const translated = await clientTranslateFields(missingFields, 'project');
        if (translated.title_en) title_en = translated.title_en;
        if (translated.excerpt_en) excerpt_en = translated.excerpt_en;
        if (translated.context_en) context_en = translated.context_en;
        if (translated.problem_en) problem_en = translated.problem_en;
        if (translated.objectives_en) objectives_en = translated.objectives_en;
        if (translated.activities_en) activities_en = translated.activities_en;
        if (translated.expected_results_en) expected_results_en = translated.expected_results_en;
        if (translated.achieved_results_en) achieved_results_en = translated.achieved_results_en;
        if (translated.beneficiaries_en) beneficiaries_en = translated.beneficiaries_en;
      } catch (e) {
        console.warn('Auto translation during save failed, falling back to French:', e);
      } finally {
        setIsAutoTranslating(false);
      }
    }

    // Ultimate fallback to French so fields are never blank
    title_en = title_en || form.title_fr || '';
    excerpt_en = excerpt_en || form.excerpt_fr || '';
    context_en = context_en || form.context_fr || '';
    problem_en = problem_en || form.problem_fr || '';
    objectives_en = objectives_en || form.objectives_fr || '';
    activities_en = activities_en || form.activities_fr || '';
    expected_results_en = expected_results_en || form.expected_results_fr || '';
    achieved_results_en = achieved_results_en || form.achieved_results_fr || '';
    beneficiaries_en = beneficiaries_en || form.beneficiaries_fr || '';

    const payload: ProjectItem = {
      id: editingProject?.id || 'proj-' + Date.now(),
      slug: form.slug!,
      title_fr: form.title_fr || '',
      title_en,
      excerpt_fr: form.excerpt_fr || '',
      excerpt_en,
      context_fr: form.context_fr || '',
      context_en,
      problem_fr: form.problem_fr || '',
      problem_en,
      objectives_fr: form.objectives_fr || '',
      objectives_en,
      activities_fr: form.activities_fr || '',
      activities_en,
      expected_results_fr: form.expected_results_fr || '',
      expected_results_en,
      achieved_results_fr: form.achieved_results_fr || '',
      achieved_results_en,
      beneficiaries_fr: form.beneficiaries_fr || '',
      beneficiaries_en,
      intervention_zone: form.intervention_zone || 'Département du Mono',
      communes: typeof form.communes === 'string'
        ? (form.communes as string).split(',').map(s => s.trim())
        : (form.communes || ['Comè']),
      period: form.period || '2026',
      duration: form.duration || '12 mois',
      partners: typeof form.partners === 'string'
        ? (form.partners as string).split(',').map(s => s.trim())
        : (form.partners || []),
      financial_partner: form.financial_partner || '',
      status: form.status as ProjectStatus || 'in_progress',
      is_featured: Boolean(form.is_featured),
      main_image: form.main_image || '',
      photos: form.photos || [],
      videos: form.videos || [],
      documents: form.documents || [],
      created_at: editingProject?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabaseStore.saveProject(payload);
      await loadProjects();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le projet dans Supabase"}`);
    }
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await supabaseStore.deleteProject(projectToDelete.id);
      await loadProjects();
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer le projet dans Supabase"}`);
    }
  };

  // Reordering handlers
  const handleMove = (id: string, direction: 'up' | 'down') => {
    const currentIndex = projects.findIndex((p) => p.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const next = [...projects];
    const temp = next[currentIndex];
    next[currentIndex] = next[targetIndex];
    next[targetIndex] = temp;

    const reordered = next.map((p, idx) => ({ ...p, order_index: idx + 1 }));
    setProjects(reordered);
    setHasOrderChanged(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    const idx = projects.findIndex((p) => p.id === id);
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
    const sourceIndex = projects.findIndex((p) => p.id === sourceId);
    const targetIndex = projects.findIndex((p) => p.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedIndex(null);
      return;
    }

    const next = [...projects];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);

    const reordered = next.map((p, idx) => ({ ...p, order_index: idx + 1 }));
    setProjects(reordered);
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
      const ids = projects.map((p) => p.id);
      const updated = await supabaseStore.saveProjectsOrder(ids);
      setProjects(updated);
      setHasOrderChanged(false);
      setSaveOrderSuccess("L'ordre d'affichage des projets a été enregistré avec succès !");
      setTimeout(() => setSaveOrderSuccess(null), 4000);
    } catch (err: any) {
      console.error("Erreur enregistrement ordre projets:", err);
      setSaveOrderError(
        err?.message || "Impossible d'enregistrer le nouvel ordre dans Supabase."
      );
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCancelReorder = async () => {
    setSavingOrder(true);
    await loadProjects();
    setHasOrderChanged(false);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
    setSavingOrder(false);
  };

  const handleResetChronological = () => {
    const sorted = [...projects].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    }).map((p, idx) => ({ ...p, order_index: idx + 1 }));
    setProjects(sorted);
    setHasOrderChanged(true);
    setSaveOrderSuccess(null);
    setSaveOrderError(null);
  };

  const filtered = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.title_fr.toLowerCase().includes(q) || p.slug.includes(q);
    return matchesStatus && matchesSearch;
  });

  const isFiltered = statusFilter !== 'all' || search.trim() !== '';

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Projets"
        subtitle="Créez, modifiez, réorganisez et gérez les dossiers de projets institutionnels d’APS-BÉNIN"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchTranslateProjects}
              disabled={batchTranslating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors shadow-xs"
              title="Traduire automatiquement tous les projets dont la version anglaise est incomplète"
            >
              {batchTranslating ? (
                <span className="w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-700" />
              )}
              <span>{batchTranslating ? 'Traduction...' : 'Traduire en anglais'}</span>
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
              <span>Nouveau Projet</span>
            </button>
          </div>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* Batch translate notice */}
        {batchTranslateNotice && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{batchTranslateNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBatchTranslateNotice(null)}
              className="text-amber-800 hover:text-amber-950 p-1"
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
                L'ordre d'affichage des projets a été modifié manuellement. Les visiteurs du site verront cet ordre une fois enregistré.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetChronological}
                title="Rétablir le tri par date de création"
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
              Tous ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'in_progress' ? 'bg-[#FF8C00] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              En cours
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'completed' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Terminé
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusFilter === 'upcoming' ? 'bg-[#92278F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              À venir
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre ou slug..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white"
            />
          </div>
        </div>

        {/* Filter warning notice */}
        {isFiltered && (
          <div className="bg-purple-50/60 border border-purple-200 rounded-lg px-4 py-2 text-xs text-purple-900 flex items-center justify-between gap-2">
            <span>
              Filtre actif : la réorganisation manuelle s’effectue sur la liste complète des projets.
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

        {/* Projects Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-32">Ordre</th>
                  <th className="py-3 px-4">Projet</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Zone / Communes</th>
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4">À la une</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((proj) => {
                  const globalIdx = projects.findIndex((p) => p.id === proj.id);
                  const isFirst = globalIdx === 0;
                  const isLast = globalIdx === projects.length - 1;

                  return (
                    <tr
                      key={proj.id}
                      draggable={!isFiltered}
                      onDragStart={(e) => handleDragStart(e, proj.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, proj.id)}
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
                              onClick={() => handleMove(proj.id, 'up')}
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
                              onClick={() => handleMove(proj.id, 'down')}
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
                          src={proj.main_image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1 max-w-md">
                            {proj.title_fr}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            /{proj.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          proj.status === 'in_progress'
                            ? 'bg-orange-100 text-orange-800'
                            : proj.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-[#92278F]'
                        }`}
                      >
                        {proj.status === 'in_progress'
                          ? 'En cours'
                          : proj.status === 'completed'
                          ? 'Terminé'
                          : 'À venir'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">
                        {proj.communes.join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {proj.period}
                    </td>
                    <td className="py-3 px-4">
                      {proj.is_featured ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#92278F] text-white">
                          Oui
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">Non</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/projets/${proj.slug}`}
                          target="_blank"
                          title="Aperçu public"
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEditModal(proj)}
                          title="Modifier"
                          className="p-1.5 rounded hover:bg-purple-50 text-[#92278F]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectToDelete(proj);
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

        {/* Edit / Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  {editingProject ? 'Modifier le projet' : 'Nouveau Projet Institutionnel'}
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
                {/* Titles FR & EN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Titre du Projet (Français) *
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
                      Titre du Projet (Anglais)
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Slug, Status, Featured */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      Statut d'exécution
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none bg-white"
                    >
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="upcoming">À venir</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        className="rounded text-[#92278F] focus:ring-[#92278F] w-4 h-4"
                      />
                      <span className="text-xs font-bold text-gray-800">
                        Projet mis en avant (Accueil)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Main Image URL & Photo Gallery */}
                <div className="space-y-4">
                  <ImagePickerField
                    label="Image principale du projet (Couverture)"
                    value={form.main_image || ''}
                    onChange={(url) => setForm({ ...form, main_image: url })}
                    placeholder="https://... ou choisir dans la médiathèque"
                    helpText="Image de couverture utilisée sur les cartes, listes et en haut de la page détaillée."
                  />

                  <MultiImageGalleryField
                    label="Galerie photos du projet"
                    description="Sélectionnez plusieurs photos de terrain depuis la Médiathèque. Vous pouvez réordonner les images, en retirer ou définir l'une d'elles comme image principale."
                    images={form.photos || []}
                    onChange={(photos) => setForm({ ...form, photos })}
                    onSetMainImage={(url) => setForm({ ...form, main_image: url })}
                    mainImageUrl={form.main_image}
                  />

                  <MultiVideoListField
                    label="Vidéos et reportages associés au projet"
                    description="Associez une ou plusieurs vidéos (YouTube, Vimeo, ou téléversées dans la Médiathèque Supabase) pour documenter ce projet."
                    videos={form.videos || []}
                    onChange={(videos) => setForm({ ...form, videos })}
                    targetModule="projets"
                  />
                </div>

                {/* Excerpt FR & EN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Résumé court (Français)
                    </label>
                    <textarea
                      rows={2}
                      value={form.excerpt_fr}
                      onChange={(e) => setForm({ ...form, excerpt_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Short Excerpt (English)
                    </label>
                    <textarea
                      rows={2}
                      value={form.excerpt_en}
                      onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Language Switcher for Editorial Sections */}
                <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Langue d&apos;édition :
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingLang('fr')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        editingLang === 'fr'
                          ? 'bg-[#92278F] text-white shadow-2xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      🇫🇷 Français (Principal)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLang('en')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        editingLang === 'en'
                          ? 'bg-[#92278F] text-white shadow-2xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      🇬🇧 English (Aperçu / Édition)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoTranslateModal}
                    disabled={isAutoTranslating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    {isAutoTranslating ? (
                      <span className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    <span>{isAutoTranslating ? 'Traduction...' : 'Traduire automatiquement en anglais'}</span>
                  </button>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                  <span className="font-bold shrink-0">✨ Bilinguisme automatique :</span>
                  <span>
                    Rédigez normalement en français. Tout champ anglais laissé vide sera traduit et enregistré automatiquement.
                  </span>
                </div>

                {/* Contexte & Problématique */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label={editingLang === 'fr' ? 'Contexte du projet' : 'Project Context'}
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.context_fr || '' : form.context_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'context_fr' : 'context_en']: html,
                        })
                      }
                      placeholder="Contexte et justification de l'intervention..."
                      minHeight="180px"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label={editingLang === 'fr' ? 'Problématique adressée' : 'Problem Statement'}
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.problem_fr || '' : form.problem_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'problem_fr' : 'problem_en']: html,
                        })
                      }
                      placeholder="Défi majeur et problématiques identifiées sur le terrain..."
                      minHeight="180px"
                    />
                  </div>
                </div>

                {/* Objectifs & Activités */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label={editingLang === 'fr' ? 'Objectifs du projet' : 'Project Objectives'}
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.objectives_fr || '' : form.objectives_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'objectives_fr' : 'objectives_en']: html,
                        })
                      }
                      placeholder="Objectifs généraux et spécifiques (listes à puces recommandées)..."
                      minHeight="200px"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label={editingLang === 'fr' ? 'Activités déployées' : 'Implemented Activities'}
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.activities_fr || '' : form.activities_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'activities_fr' : 'activities_en']: html,
                        })
                      }
                      placeholder="Activités concrètes et plan d'action déployé..."
                      minHeight="200px"
                    />
                  </div>
                </div>

                {/* Résultats attendus & obtenus */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label={editingLang === 'fr' ? 'Résultats Attendus' : 'Expected Results'}
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.expected_results_fr || '' : form.expected_results_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'expected_results_fr' : 'expected_results_en']: html,
                        })
                      }
                      placeholder="Impacts et résultats visés..."
                      minHeight="180px"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label={editingLang === 'fr' ? 'Résultats Obtenus' : 'Results Achieved'}
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.achieved_results_fr || '' : form.achieved_results_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'achieved_results_fr' : 'achieved_results_en']: html,
                        })
                      }
                      placeholder="Réalisations concrètes et indicateurs vérifiés sur le terrain..."
                      minHeight="180px"
                    />
                  </div>
                </div>

                {/* Communes, Période, Partenaires, Bailleur */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Communes (séparées par virgules)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(form.communes) ? form.communes.join(', ') : form.communes}
                      onChange={(e) => setForm({ ...form, communes: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Période (ex: 2025 – 2027)
                    </label>
                    <input
                      type="text"
                      value={form.period}
                      onChange={(e) => setForm({ ...form, period: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Durée (ex: 24 mois)
                    </label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Bailleur / Partenaire Financier
                    </label>
                    <input
                      type="text"
                      value={form.financial_partner}
                      onChange={(e) => setForm({ ...form, financial_partner: e.target.value })}
                      placeholder="Nom du bailleur"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>
                </div>

                {/* Footer buttons */}
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
                    className="px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs flex items-center gap-2"
                  >
                    {isAutoTranslating && (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>
                      {isAutoTranslating
                        ? 'Traduction & Enregistrement...'
                        : editingProject
                        ? 'Enregistrer les modifications'
                        : 'Créer le projet'}
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
          title="Placer ce projet dans la corbeille ?"
          message={`Êtes-vous sûr de vouloir déplacer le projet « ${projectToDelete?.title_fr} » dans la corbeille ? Vous pourrez le restaurer à tout moment.`}
          confirmLabel="Mettre à la corbeille"
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setProjectToDelete(null);
          }}
        />
      </main>
    </AdminAuthGuard>
  );
}
