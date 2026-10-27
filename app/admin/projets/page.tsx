'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { PhotoAlbum, ProjectItem, ProjectStatus, ActivityCategory, PublicationType } from '@/types';
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
  Zap,
  FolderKanban,
  Image as ImageIcon,
  Users,
  ChevronRight,
  ListFilter,
} from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'project' | 'activity'>('all');

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
    publication_type: 'project',
    activity_category: 'Sensibilisation',
    related_project_id: '',
    related_project_title: '',
    participants_count: '',
    observations_fr: '',
    observations_en: '',
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
    const [projList, albumList] = await Promise.all([
      supabaseStore.getProjects(),
      supabaseStore.getAlbums(),
    ]);
    setProjects(projList);
    setAlbums(albumList);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openNewProjectModal = () => {
    setEditingProject(null);
    setForm({
      publication_type: 'project',
      activity_category: 'Sensibilisation',
      related_project_id: '',
      related_project_title: '',
      participants_count: '',
      observations_fr: '',
      observations_en: '',
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
    setEditingLang('fr');
    setModalOpen(true);
  };

  const openNewActivityModal = (parentProjectId?: string) => {
    setEditingProject(null);
    const parent = parentProjectId ? projects.find((p) => p.id === parentProjectId) : null;
    setForm({
      publication_type: 'activity',
      activity_category: 'Atelier',
      related_project_id: parent?.id || '',
      related_project_title: parent?.title_fr || '',
      participants_count: '',
      observations_fr: '',
      observations_en: '',
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
      intervention_zone: parent?.intervention_zone || 'Département du Mono',
      communes: parent?.communes || ['Comè'],
      period: new Date().getFullYear().toString(),
      duration: '1 journée',
      partners: parent?.partners || [],
      financial_partner: parent?.financial_partner || '',
      status: 'completed',
      is_featured: false,
      main_image: '',
      photos: [],
      videos: [],
      documents: [],
    });
    setEditingLang('fr');
    setModalOpen(true);
  };

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setForm({
      ...p,
      publication_type: p.publication_type || 'project',
      activity_category: p.activity_category || 'Sensibilisation',
      related_project_id: p.related_project_id || '',
      related_project_title: p.related_project_title || '',
      participants_count: p.participants_count || '',
      observations_fr: p.observations_fr || '',
      observations_en: p.observations_en || '',
    });
    setEditingLang('fr');
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
    if (form.observations_fr) toTranslate.observations_en = form.observations_fr;

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
        observations_en: translated.observations_en || prev.observations_en,
      }));
      setEditingLang('en');
    } catch (err: any) {
      alert(`Erreur de traduction automatique : ${err.message || 'Impossible de contacter le service'}`);
    } finally {
      setIsAutoTranslating(false);
    }
  };

  const handleBatchTranslateProjects = async () => {
    const isFieldMissingOrUntranslated = (en?: string, fr?: string) => {
      if (!fr || !fr.trim()) return false;
      if (!en || !en.trim()) return true;
      return en.trim() === fr.trim();
    };

    const incomplete = projects.filter(
      (p) =>
        isFieldMissingOrUntranslated(p.title_en, p.title_fr) ||
        isFieldMissingOrUntranslated(p.excerpt_en, p.excerpt_fr) ||
        isFieldMissingOrUntranslated(p.context_en, p.context_fr) ||
        isFieldMissingOrUntranslated(p.problem_en, p.problem_fr) ||
        isFieldMissingOrUntranslated(p.objectives_en, p.objectives_fr) ||
        isFieldMissingOrUntranslated(p.activities_en, p.activities_fr) ||
        isFieldMissingOrUntranslated(p.expected_results_en, p.expected_results_fr) ||
        isFieldMissingOrUntranslated(p.achieved_results_en, p.achieved_results_fr) ||
        isFieldMissingOrUntranslated(p.beneficiaries_en, p.beneficiaries_fr)
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
        if (isFieldMissingOrUntranslated(p.title_en, p.title_fr)) toTranslate.title_en = p.title_fr;
        if (isFieldMissingOrUntranslated(p.excerpt_en, p.excerpt_fr)) toTranslate.excerpt_en = p.excerpt_fr;
        if (isFieldMissingOrUntranslated(p.context_en, p.context_fr)) toTranslate.context_en = p.context_fr;
        if (isFieldMissingOrUntranslated(p.problem_en, p.problem_fr)) toTranslate.problem_en = p.problem_fr;
        if (isFieldMissingOrUntranslated(p.objectives_en, p.objectives_fr)) toTranslate.objectives_en = p.objectives_fr;
        if (isFieldMissingOrUntranslated(p.activities_en, p.activities_fr)) toTranslate.activities_en = p.activities_fr;
        if (isFieldMissingOrUntranslated(p.expected_results_en, p.expected_results_fr)) toTranslate.expected_results_en = p.expected_results_fr;
        if (isFieldMissingOrUntranslated(p.achieved_results_en, p.achieved_results_fr)) toTranslate.achieved_results_en = p.achieved_results_fr;
        if (isFieldMissingOrUntranslated(p.beneficiaries_en, p.beneficiaries_fr)) toTranslate.beneficiaries_en = p.beneficiaries_fr;

        if (Object.keys(toTranslate).length > 0) {
          const trans = await clientTranslateFields(toTranslate, 'project');
          const updated: ProjectItem = {
            ...p,
            title_en: trans.title_en || p.title_en || p.title_fr,
            excerpt_en: trans.excerpt_en || p.excerpt_en || p.excerpt_fr,
            context_en: trans.context_en || p.context_en || p.context_fr,
            problem_en: trans.problem_en || p.problem_en || p.problem_fr,
            objectives_en: trans.objectives_en || p.objectives_en || p.objectives_fr,
            activities_en: trans.activities_en || p.activities_en || p.activities_fr,
            expected_results_en: trans.expected_results_en || p.expected_results_en || p.expected_results_fr,
            achieved_results_en: trans.achieved_results_en || p.achieved_results_en || p.achieved_results_fr,
            beneficiaries_en: trans.beneficiaries_en || p.beneficiaries_en || p.beneficiaries_fr,
            updated_at: new Date().toISOString(),
          };
          await supabaseStore.saveProject(updated);
          // Small delay between projects to respect Gemini API Free Tier limits
          if (i < incomplete.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
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
      alert('Veuillez renseigner le titre en français et le slug du projet/activité.');
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
    let observations_en = (form.observations_en || '').trim();

    // Check if any English fields are missing or duplicates of French while French counterparts exist
    const isUntranslated = (en?: string, fr?: string) => {
      if (!fr || !fr.trim()) return false;
      if (!en || !en.trim()) return true;
      return en.trim() === fr.trim();
    };

    const missingFields: Record<string, string> = {};
    if (form.title_fr && isUntranslated(title_en, form.title_fr)) missingFields.title_en = form.title_fr;
    if (form.excerpt_fr && isUntranslated(excerpt_en, form.excerpt_fr)) missingFields.excerpt_en = form.excerpt_fr;
    if (form.context_fr && isUntranslated(context_en, form.context_fr)) missingFields.context_en = form.context_fr;
    if (form.problem_fr && isUntranslated(problem_en, form.problem_fr)) missingFields.problem_en = form.problem_fr;
    if (form.objectives_fr && isUntranslated(objectives_en, form.objectives_fr)) missingFields.objectives_en = form.objectives_fr;
    if (form.activities_fr && isUntranslated(activities_en, form.activities_fr)) missingFields.activities_en = form.activities_fr;
    if (form.expected_results_fr && isUntranslated(expected_results_en, form.expected_results_fr)) missingFields.expected_results_en = form.expected_results_fr;
    if (form.achieved_results_fr && isUntranslated(achieved_results_en, form.achieved_results_fr)) missingFields.achieved_results_en = form.achieved_results_fr;
    if (form.beneficiaries_fr && isUntranslated(beneficiaries_en, form.beneficiaries_fr)) missingFields.beneficiaries_en = form.beneficiaries_fr;
    if (form.observations_fr && isUntranslated(observations_en, form.observations_fr)) missingFields.observations_en = form.observations_fr;

    if (Object.keys(missingFields).length > 0) {
      setIsAutoTranslating(true);
      try {
        const translated = await clientTranslateFields(missingFields, 'project');
        if (translated.title_en && translated.title_en !== form.title_fr) title_en = translated.title_en;
        if (translated.excerpt_en && translated.excerpt_en !== form.excerpt_fr) excerpt_en = translated.excerpt_en;
        if (translated.context_en && translated.context_en !== form.context_fr) context_en = translated.context_en;
        if (translated.problem_en && translated.problem_en !== form.problem_fr) problem_en = translated.problem_en;
        if (translated.objectives_en && translated.objectives_en !== form.objectives_fr) objectives_en = translated.objectives_en;
        if (translated.activities_en && translated.activities_en !== form.activities_fr) activities_en = translated.activities_en;
        if (translated.expected_results_en && translated.expected_results_en !== form.expected_results_fr) expected_results_en = translated.expected_results_en;
        if (translated.achieved_results_en && translated.achieved_results_en !== form.achieved_results_fr) achieved_results_en = translated.achieved_results_en;
        if (translated.beneficiaries_en && translated.beneficiaries_en !== form.beneficiaries_fr) beneficiaries_en = translated.beneficiaries_en;
        if (translated.observations_en && translated.observations_en !== form.observations_fr) observations_en = translated.observations_en;
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
    observations_en = observations_en || form.observations_fr || '';

    // Derive parent project title if linked
    let parentTitle = form.related_project_title;
    if (form.related_project_id) {
      const parent = projects.find((p) => p.id === form.related_project_id);
      if (parent) parentTitle = parent.title_fr;
    }

    const payload: ProjectItem = {
      id: editingProject?.id || 'proj-' + Date.now(),
      publication_type: form.publication_type || 'project',
      activity_category: form.publication_type === 'activity' ? (form.activity_category || 'Sensibilisation') : undefined,
      related_project_id: form.publication_type === 'activity' ? (form.related_project_id || undefined) : undefined,
      related_project_title: form.publication_type === 'activity' ? (parentTitle || undefined) : undefined,
      participants_count: form.publication_type === 'activity' ? (form.participants_count || undefined) : undefined,
      observations_fr: form.observations_fr || '',
      observations_en,
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
        ? (form.communes as string).split(',').map((s) => s.trim())
        : (form.communes || ['Comè']),
      period: form.period || '2026',
      duration: form.duration || '12 mois',
      partners: typeof form.partners === 'string'
        ? (form.partners as string).split(',').map((s) => s.trim())
        : (form.partners || []),
      financial_partner: form.financial_partner || '',
      status: (form.status as ProjectStatus) || 'in_progress',
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
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'activity' ? p.publication_type === 'activity' : p.publication_type !== 'activity');
    const q = search.toLowerCase();
    const matchesSearch = !q || p.title_fr.toLowerCase().includes(q) || p.slug.includes(q);
    return matchesStatus && matchesType && matchesSearch;
  });

  const isFiltered = statusFilter !== 'all' || typeFilter !== 'all' || search.trim() !== '';

  const parentProjectOptions = projects.filter((p) => p.publication_type !== 'activity' && p.id !== form.id);
  const editingProjectAlbums = editingProject ? albums.filter((a) => a.project_id === editingProject.id) : [];
  const editingProjectActivities = editingProject
    ? projects.filter((p) => p.publication_type === 'activity' && p.related_project_id === editingProject.id)
    : [];

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Projets & Activités"
        subtitle="Créez, modifiez, réorganisez et gérez les projets institutionnels et les activités phares d’APS-BÉNIN"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchTranslateProjects}
              disabled={batchTranslating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors shadow-xs"
              title="Traduire automatiquement tous les contenus dont la version anglaise est incomplète"
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
              onClick={() => openNewActivityModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs"
              title="Ajouter une activité de terrain spécifique (atelier, sensibilisation, formation...)"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Nouvelle Activité</span>
            </button>
            <button
              type="button"
              onClick={openNewProjectModal}
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
                L'ordre d'affichage des projets et activités a été modifié manuellement. Les visiteurs du site verront cet ordre une fois enregistré.
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
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Type Filter */}
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  typeFilter === 'all' ? 'bg-[#92278F] text-white shadow-2xs' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Tous ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('project')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  typeFilter === 'project' ? 'bg-[#92278F] text-white shadow-2xs' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 text-purple-200" />
                <span>Projets ({projects.filter((p) => p.publication_type !== 'activity').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('activity')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  typeFilter === 'activity' ? 'bg-amber-500 text-white shadow-2xs' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-200" />
                <span>Activités ({projects.filter((p) => p.publication_type === 'activity').length})</span>
              </button>
            </div>

            {/* Status Filter */}
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  statusFilter === 'all' ? 'bg-white font-bold text-gray-900 shadow-2xs' : 'text-gray-600'
                }`}
              >
                Statut: Tous
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  statusFilter === 'in_progress' ? 'bg-orange-50 font-bold text-orange-800 shadow-2xs' : 'text-gray-600'
                }`}
              >
                En cours
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  statusFilter === 'completed' ? 'bg-emerald-50 font-bold text-emerald-800 shadow-2xs' : 'text-gray-600'
                }`}
              >
                Terminé
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  statusFilter === 'upcoming' ? 'bg-purple-50 font-bold text-purple-800 shadow-2xs' : 'text-gray-600'
                }`}
              >
                À venir
              </button>
            </div>
          </div>

          <div className="relative w-full lg:w-72">
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
              Filtre actif ({filtered.length} affiché(s)) : la réorganisation manuelle s’effectue sur la liste complète des publications.
            </span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setSearch('');
              }}
              className="font-bold underline text-[#92278F] hover:text-[#741772] shrink-0"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Projects & Activities Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-28">Ordre</th>
                  <th className="py-3 px-4 w-32">Type</th>
                  <th className="py-3 px-4">Titre & Détails</th>
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
                  const isActivity = proj.publication_type === 'activity';
                  const childActivities = projects.filter(
                    (p) => p.publication_type === 'activity' && p.related_project_id === proj.id
                  );
                  const linkedAlbums = albums.filter((a) => a.project_id === proj.id);

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
                        {isActivity ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Zap className="w-3 h-3 text-amber-600" />
                              <span>Activité</span>
                            </span>
                            {proj.activity_category && (
                              <p className="text-[10px] text-amber-700 font-semibold">
                                {proj.activity_category}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#92278F] border border-purple-200">
                              <FolderKanban className="w-3 h-3 text-[#92278F]" />
                              <span>Projet</span>
                            </span>
                            {(childActivities.length > 0 || linkedAlbums.length > 0) && (
                              <div className="text-[9px] text-gray-400 font-medium">
                                {childActivities.length > 0 && <span>{childActivities.length} act. </span>}
                                {linkedAlbums.length > 0 && <span>• {linkedAlbums.length} alb.</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={proj.main_image || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300'}
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
                            {isActivity && (proj.related_project_title || proj.related_project_id) && (
                              <p className="text-[10px] text-purple-700 font-medium flex items-center gap-1 mt-0.5">
                                <span>↳ Rattachée à :</span>
                                <span className="font-semibold underline">
                                  {proj.related_project_title ||
                                    projects.find((p) => p.id === proj.related_project_id)?.title_fr ||
                                    'Projet parent'}
                                </span>
                              </p>
                            )}
                            {isActivity && proj.participants_count && (
                              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3 text-gray-400" />
                                <span>{proj.participants_count}</span>
                              </p>
                            )}
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
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${form.publication_type === 'activity' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-[#92278F]'}`}>
                    {form.publication_type === 'activity' ? <Zap className="w-5 h-5" /> : <FolderKanban className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-heading">
                      {editingProject
                        ? form.publication_type === 'activity'
                          ? "Modifier l'activité phare"
                          : 'Modifier le projet'
                        : form.publication_type === 'activity'
                        ? 'Nouvelle Activité Phare de Terrain'
                        : 'Nouveau Projet Institutionnel'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {form.publication_type === 'activity'
                        ? 'Fiche de capitalisation d’une intervention de terrain (atelier, formation, sensibilisation...)'
                        : 'Dossier de projet cadre pluriannuel d’APS-BÉNIN'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Publication Type Switcher */}
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-gray-700">Type de publication :</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, publication_type: 'project' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      form.publication_type !== 'activity'
                        ? 'bg-[#92278F] text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>📁 Projet Institutionnel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, publication_type: 'activity', activity_category: form.activity_category || 'Atelier' })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      form.publication_type === 'activity'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Activité Phare</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Activity specific selector: Category & Parent Project */}
                {form.publication_type === 'activity' && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>Paramètres spécifiques de l'activité de terrain</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Catégorie d'activité *
                        </label>
                        <select
                          value={form.activity_category || 'Atelier'}
                          onChange={(e) => setForm({ ...form, activity_category: e.target.value as ActivityCategory })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                          <option value="Atelier">Atelier / Session de travail</option>
                          <option value="Formation">Formation & Renforcement de capacités</option>
                          <option value="Sensibilisation">Sensibilisation & Mobilisation communautaire</option>
                          <option value="Campagne">Campagne d'action / Dépistage</option>
                          <option value="Plaidoyer">Plaidoyer & Dialogue politique</option>
                          <option value="Distribution">Distribution de kits & Matériels</option>
                          <option value="Réunion">Réunion institutionnelle / Comité</option>
                          <option value="Autre">Autre activité de terrain</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Projet cadre de rattachement
                        </label>
                        <select
                          value={form.related_project_id || ''}
                          onChange={(e) => {
                            const pId = e.target.value;
                            const parent = parentProjectOptions.find((p) => p.id === pId);
                            setForm({
                              ...form,
                              related_project_id: pId,
                              related_project_title: parent ? parent.title_fr : '',
                              intervention_zone: parent ? parent.intervention_zone : form.intervention_zone,
                              communes: parent && parent.communes.length > 0 ? parent.communes : form.communes,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                          <option value="">(Activité autonome — sans projet parent)</option>
                          {parentProjectOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              📁 {p.title_fr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Participants / Bénéficiaires directs
                        </label>
                        <input
                          type="text"
                          value={form.participants_count || ''}
                          onChange={(e) => setForm({ ...form, participants_count: e.target.value })}
                          placeholder="Ex: 85 participants dont 52 femmes"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Titles FR & EN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {form.publication_type === 'activity' ? "Intitulé de l'Activité (Français) *" : 'Titre du Projet (Français) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title_fr}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder={form.publication_type === 'activity' ? 'Ex: Atelier de formation des leaders communautaires...' : 'Ex: Projet d’Appui à la Santé Reproductive...'}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {form.publication_type === 'activity' ? "Activity Title (English)" : 'Project Title (English)'}
                    </label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                      placeholder="Traduit automatiquement si laissé vide"
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
                      <option value="completed">Terminé / Réalisé</option>
                      <option value="upcoming">À venir / Programmé</option>
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
                        Mettre en avant (Page d'accueil)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Main Image URL & Photo Gallery */}
                <div className="space-y-4">
                  <ImagePickerField
                    label={form.publication_type === 'activity' ? "Photo principale de l'activité (Couverture)" : "Image principale du projet (Couverture)"}
                    value={form.main_image || ''}
                    onChange={(url) => setForm({ ...form, main_image: url })}
                    placeholder="https://... ou choisir dans la médiathèque"
                    helpText="Image de couverture utilisée sur les cartes, listes et en haut de la page détaillée."
                  />

                  <MultiImageGalleryField
                    label={form.publication_type === 'activity' ? "Photos de terrain de l'activité" : "Galerie photos du projet"}
                    description="Sélectionnez plusieurs photos de terrain depuis la Médiathèque. Vous pouvez réordonner les images, en retirer ou définir l'une d'elles comme image principale."
                    images={form.photos || []}
                    onChange={(photos) => setForm({ ...form, photos })}
                    onSetMainImage={(url) => setForm({ ...form, main_image: url })}
                    mainImageUrl={form.main_image}
                  />

                  <MultiVideoListField
                    label={form.publication_type === 'activity' ? "Vidéos de l'activité" : "Vidéos et reportages associés au projet"}
                    description="Associez une ou plusieurs vidéos (YouTube, Vimeo, ou téléversées dans la Médiathèque Supabase) pour documenter cette publication."
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

                {/* If Project and has linked albums or activities, show live info sections */}
                {editingProject && form.publication_type !== 'activity' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Linked Albums Box */}
                    <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-[#92278F]" />
                          <span>Albums Médiathèque associés ({editingProjectAlbums.length})</span>
                        </span>
                        <a
                          href="/admin/mediatheque"
                          target="_blank"
                          className="text-[11px] font-bold text-[#92278F] hover:underline"
                        >
                          Gérer dans Médiathèque →
                        </a>
                      </div>
                      {editingProjectAlbums.length === 0 ? (
                        <p className="text-[11px] text-gray-500">
                          Aucun album n'est actuellement rattaché à ce projet. Ouvrez la Médiathèque pour créer ou associer un album photos/vidéos.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {editingProjectAlbums.map((alb) => (
                            <div key={alb.id} className="p-2 rounded-lg bg-white border border-purple-100 flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-800 line-clamp-1">{alb.title_fr}</span>
                              <span className="text-[10px] text-purple-700 font-mono font-bold">{alb.media_count || alb.photo_count || 0} médias</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Linked Activities Box */}
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-600" />
                          <span>Activités phares rattachées ({editingProjectActivities.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => openNewActivityModal(editingProject.id)}
                          className="text-[11px] font-bold text-amber-700 hover:underline"
                        >
                          + Ajouter une activité
                        </button>
                      </div>
                      {editingProjectActivities.length === 0 ? (
                        <p className="text-[11px] text-gray-500">
                          Aucune activité phare enregistrée pour ce projet. Vous pouvez en créer une en cliquant sur "+ Ajouter une activité".
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {editingProjectActivities.map((act) => (
                            <div key={act.id} className="p-2 rounded-lg bg-white border border-amber-100 flex items-center justify-between text-xs">
                              <div className="line-clamp-1">
                                <span className="font-semibold text-gray-800">{act.title_fr}</span>
                                <span className="text-[10px] text-amber-700 ml-2">({act.activity_category})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => openEditModal(act)}
                                className="text-[11px] font-bold text-purple-700 hover:underline shrink-0 ml-2"
                              >
                                Modifier
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                {/* If Project: Context & Problem Statement */}
                {form.publication_type !== 'activity' && (
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
                )}

                {/* Objectifs & Activités / Actions concrètes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <RichTextEditor
                      label={
                        editingLang === 'fr'
                          ? form.publication_type === 'activity'
                            ? "Objectifs spécifiques de l'activité"
                            : 'Objectifs du projet'
                          : form.publication_type === 'activity'
                          ? 'Specific Activity Objectives'
                          : 'Project Objectives'
                      }
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.objectives_fr || '' : form.objectives_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'objectives_fr' : 'objectives_en']: html,
                        })
                      }
                      placeholder="Objectifs visés par cette intervention..."
                      minHeight="180px"
                    />
                  </div>

                  <div>
                    <RichTextEditor
                      label={
                        editingLang === 'fr'
                          ? form.publication_type === 'activity'
                            ? 'Déroulement & Actions réalisées'
                            : 'Activités déployées'
                          : form.publication_type === 'activity'
                          ? 'Implementation & Actions Taken'
                          : 'Implemented Activities'
                      }
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.activities_fr || '' : form.activities_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'activities_fr' : 'activities_en']: html,
                        })
                      }
                      placeholder="Description détaillée des actions menées sur le terrain..."
                      minHeight="180px"
                    />
                  </div>
                </div>

                {/* Résultats attendus & obtenus */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {form.publication_type !== 'activity' && (
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
                  )}

                  <div className={form.publication_type === 'activity' ? 'lg:col-span-2' : ''}>
                    <RichTextEditor
                      label={
                        editingLang === 'fr'
                          ? form.publication_type === 'activity'
                            ? 'Résultats concrets obtenus & Retombées immédiates'
                            : 'Résultats Obtenus'
                          : form.publication_type === 'activity'
                          ? 'Concrete Results & Immediate Impact'
                          : 'Results Achieved'
                      }
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.achieved_results_fr || '' : form.achieved_results_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'achieved_results_fr' : 'achieved_results_en']: html,
                        })
                      }
                      placeholder="Chiffres clés, taux de participation, acquis vérifiés..."
                      minHeight="180px"
                    />
                  </div>
                </div>

                {/* Bénéficiaires */}
                <div>
                  <RichTextEditor
                    label={editingLang === 'fr' ? 'Bénéficiaires Directs & Indirects' : 'Direct & Indirect Beneficiaries'}
                    langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                    value={editingLang === 'fr' ? form.beneficiaries_fr || '' : form.beneficiaries_en || ''}
                    onChange={(html) =>
                      setForm({
                        ...form,
                        [editingLang === 'fr' ? 'beneficiaries_fr' : 'beneficiaries_en']: html,
                      })
                    }
                    placeholder="Décrivez les bénéficiaires touchés (ex: 85 femmes artisanes formées, 3 comités de suivi installés...)"
                    minHeight="120px"
                  />
                </div>

                {/* Observations & Perspectives (particulièrement utile pour les activités) */}
                {form.publication_type === 'activity' && (
                  <div>
                    <RichTextEditor
                      label={editingLang === 'fr' ? 'Observations, Recommandations & Perspectives' : 'Observations, Lessons Learned & Next Steps'}
                      langTag={editingLang.toUpperCase() as 'FR' | 'EN'}
                      value={editingLang === 'fr' ? form.observations_fr || '' : form.observations_en || ''}
                      onChange={(html) =>
                        setForm({
                          ...form,
                          [editingLang === 'fr' ? 'observations_fr' : 'observations_en']: html,
                        })
                      }
                      placeholder="Points forts constatés, difficultés rencontrées, recommandations pour les prochaines étapes..."
                      minHeight="140px"
                    />
                  </div>
                )}

                {/* Communes, Période, Partenaires, Bailleur */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Communes d'intervention
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(form.communes) ? form.communes.join(', ') : form.communes}
                      onChange={(e) => setForm({ ...form, communes: e.target.value.split(',').map((s) => s.trim()) })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {form.publication_type === 'activity' ? "Date / Période (ex: Mars 2026)" : "Période (ex: 2025 – 2027)"}
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
                      {form.publication_type === 'activity' ? "Durée (ex: 2 jours)" : "Durée (ex: 24 mois)"}
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
                      Partenaire / Bailleur
                    </label>
                    <input
                      type="text"
                      value={form.financial_partner}
                      onChange={(e) => setForm({ ...form, financial_partner: e.target.value })}
                      placeholder="Nom du partenaire"
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
                        : form.publication_type === 'activity'
                        ? "Créer l'activité"
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
