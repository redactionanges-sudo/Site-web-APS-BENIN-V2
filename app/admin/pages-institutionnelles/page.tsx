'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MediaSelectorModal, SelectedMedia } from '@/components/admin/MediaSelectorModal';
import { supabaseStore } from '@/lib/supabase';
import {
  InstitutionalPage,
  InstitutionalPageSlug,
  InstitutionalPageImage,
  InstitutionalPageBlock,
  HistoryMilestone,
} from '@/types';
import {
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Info,
  Calendar,
  ShieldCheck,
  Compass,
  FileText,
  Clock,
  RotateCcw,
  Check,
} from 'lucide-react';

interface TabDefinition {
  slug: InstitutionalPageSlug;
  label: string;
  badge: string;
  publicUrl: string;
  description: string;
}

const PAGE_TABS: TabDefinition[] = [
  {
    slug: 'presentation',
    label: "Présentation de l'organisation",
    badge: 'Identité & Histoire',
    publicUrl: '/organisation/presentation',
    description: 'Textes de fondation, vision, principes fondateurs et photographies officielles de terrain et du siège.',
  },
  {
    slug: 'histoire',
    label: 'Notre histoire & Trajectoire',
    badge: 'Chronologie',
    publicUrl: '/organisation/histoire',
    description: 'En-tête, sous-titres, citations et gestion directe de la chronologie historique.',
  },
  {
    slug: 'mission-vision-valeurs',
    label: 'Mission, Vision & Valeurs',
    badge: 'Socle Éthique',
    publicUrl: '/organisation/mission-vision-valeurs',
    description: 'Piliers éthiques, mission statutaire et vision sociétale pour le Bénin.',
  },
];

const AVAILABLE_ICONS = [
  'Scale',
  'Heart',
  'CheckCircle2',
  'Users',
  'ShieldAlert',
  'Compass',
  'ShieldCheck',
  'Sparkles',
];

export default function AdminInstitutionalPages() {
  const [pages, setPages] = useState<InstitutionalPage[]>([]);
  const [activeSlug, setActiveSlug] = useState<InstitutionalPageSlug>('presentation');
  const [currentPage, setCurrentPage] = useState<InstitutionalPage | null>(null);

  // History timeline state for the "Chronologie" tab
  const [milestones, setMilestones] = useState<HistoryMilestone[]>([]);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [newMilestoneFormOpen, setNewMilestoneFormOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Partial<HistoryMilestone>>({
    year: '',
    title_fr: '',
    title_en: '',
    description_fr: '',
    description_en: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('Modifications enregistrées avec succès dans Supabase !');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active language tab for bilingual editing in admin
  const [editingLang, setEditingLang] = useState<'fr' | 'en'>('fr');

  // Media selector modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{
    type: 'hero' | 'page_image';
    imageId?: string;
  } | null>(null);

  // Load all institutional pages and milestones from Supabase
  const loadData = React.useCallback(async (targetSlug?: InstitutionalPageSlug) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedPages, fetchedHistory] = await Promise.all([
        supabaseStore.getInstitutionalPages(),
        supabaseStore.getHistory(),
      ]);

      setPages(fetchedPages);
      setMilestones(fetchedHistory);

      const slugToFind = targetSlug || activeSlug;
      const found = fetchedPages.find((p) => p.slug === slugToFind);
      if (found) {
        setCurrentPage(JSON.parse(JSON.stringify(found)));
      } else {
        // Fallback default structure if not yet in list
        const fallback = {
          id: `page-${slugToFind}`,
          slug: slugToFind,
          title_fr: slugToFind === 'histoire' ? 'Notre Histoire & Évolution' : (slugToFind === 'mission-vision-valeurs' ? 'Mission, Vision & Valeurs' : 'Présentation Institutionnelle'),
          title_en: slugToFind === 'histoire' ? 'Our History & Evolution' : (slugToFind === 'mission-vision-valeurs' ? 'Mission, Vision & Values' : 'Overview & Identity'),
          badge_fr: slugToFind === 'histoire' ? 'Notre Trajectoire' : (slugToFind === 'mission-vision-valeurs' ? 'Identité Institutionnelle' : "L'Organisation"),
          badge_en: slugToFind === 'histoire' ? 'Our Trajectory' : (slugToFind === 'mission-vision-valeurs' ? 'Institutional Identity' : 'The Organization'),
          subtitle_fr: '',
          subtitle_en: '',
          quote_fr: '',
          quote_en: '',
          intro_fr: '',
          intro_en: '',
          body_html_fr: '',
          body_html_en: '',
          hero_image: '',
          images: [],
          blocks: [],
          is_published: true,
        };
        setCurrentPage(fallback);
      }
    } catch (err: any) {
      console.error('Erreur chargement pages institutionnelles:', err);
      setErrorMessage('Impossible de charger les données des pages institutionnelles depuis Supabase.');
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  // Load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // When active slug changes
  const handleSelectTab = (slug: InstitutionalPageSlug) => {
    setActiveSlug(slug);
    setSaveSuccess(false);
    setErrorMessage(null);

    const found = pages.find((p) => p.slug === slug);
    if (found) {
      setCurrentPage(JSON.parse(JSON.stringify(found)));
    } else {
      // Reload specifically for this slug
      loadData(slug);
    }
  };

  // Save changes for current institutional page
  const handleSavePage = async () => {
    if (!currentPage) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const saved = await supabaseStore.saveInstitutionalPage(currentPage);
      // Re-fetch all pages from Supabase to confirm real persistence
      const freshPages = await supabaseStore.getInstitutionalPages();
      setPages(freshPages);
      const freshCurrent = freshPages.find((p) => p.slug === saved.slug) || saved;
      setCurrentPage(JSON.parse(JSON.stringify(freshCurrent)));

      setSuccessMessage(`Page « ${activeTabDef?.label || currentPage.title_fr} » enregistrée et synchronisée avec succès !`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      console.error('Erreur enregistrement page:', err);
      setErrorMessage(err?.message || "Une erreur est survenue lors de l'enregistrement dans Supabase.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // GESTION CHRONOLOGIE / HISTOIRE
  // -------------------------------------------------------------
  const handleUpdateMilestone = (id: string, field: keyof HistoryMilestone, value: any) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleMoveMilestone = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const list = [...milestones];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // re-assign order_index
    const reordered = list.map((m, idx) => ({ ...m, order_index: idx + 1 }));
    setMilestones(reordered);
  };

  const handleSaveAllMilestones = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      // First save page header data if changed
      if (currentPage) {
        await supabaseStore.saveInstitutionalPage(currentPage);
      }
      // Save milestones array
      const savedHistory = await supabaseStore.saveHistory(milestones);
      setMilestones(savedHistory);

      setSuccessMessage('Chronologie historique mise à jour et synchronisée avec succès dans Supabase !');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      console.error('Erreur enregistrement chronologie:', err);
      setErrorMessage(err?.message || 'Impossible d’enregistrer la chronologie dans Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.year || !newMilestone.title_fr) {
      alert('Veuillez renseigner au moins l’année ou date et le titre français.');
      return;
    }

    const created: HistoryMilestone = {
      id: `hist-${Date.now()}`,
      year: newMilestone.year || '',
      title_fr: newMilestone.title_fr || '',
      title_en: newMilestone.title_en || newMilestone.title_fr || '',
      description_fr: newMilestone.description_fr || '',
      description_en: newMilestone.description_en || newMilestone.description_fr || '',
      order_index: milestones.length + 1,
    };

    const updated = [...milestones, created];
    setMilestones(updated);
    setNewMilestone({
      year: '',
      title_fr: '',
      title_en: '',
      description_fr: '',
      description_en: '',
    });
    setNewMilestoneFormOpen(false);

    try {
      await supabaseStore.saveHistory(updated);
      setSuccessMessage('Nouvelle étape chronologique ajoutée et enregistrée !');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l’ajout de l’étape.');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    const toDelete = milestones.find((m) => m.id === id);
    if (!window.confirm(`Supprimer définitivement l'étape « ${toDelete?.title_fr || id} » de la chronologie ?`)) {
      return;
    }

    try {
      const updated = await supabaseStore.deleteHistoryMilestone(id);
      setMilestones(updated);
      setSuccessMessage('Étape chronologique supprimée avec succès.');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      console.error('Erreur suppression étape:', err);
      setErrorMessage(err.message || 'Impossible de supprimer cette étape.');
    }
  };

  // -------------------------------------------------------------
  // GESTION BLOCS (VALEURS / PRINCIPES DU SOCLE ÉTHIQUE)
  // -------------------------------------------------------------
  const handleAddBlock = (type: InstitutionalPageBlock['type']) => {
    if (!currentPage) return;
    const isVal = activeSlug === 'mission-vision-valeurs';
    const newBlock: InstitutionalPageBlock = {
      id: `blk-${Date.now()}`,
      type,
      title_fr: isVal ? 'Nouvelle valeur / principe' : (type === 'pillar' ? 'Nouveau principe' : 'Nouveau paragraphe'),
      title_en: isVal ? 'New value / principle' : (type === 'pillar' ? 'New principle' : 'New paragraph'),
      content_fr: '',
      content_en: '',
      icon_name: 'Scale',
      order_index: (currentPage.blocks || []).length + 1,
    };
    setCurrentPage({
      ...currentPage,
      blocks: [...(currentPage.blocks || []), newBlock],
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    if (!currentPage) return;
    setCurrentPage({
      ...currentPage,
      blocks: (currentPage.blocks || []).filter((b) => b.id !== blockId),
    });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!currentPage || !currentPage.blocks) return;
    const newBlocks = [...currentPage.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    newBlocks.forEach((b, i) => {
      b.order_index = i + 1;
    });
    setCurrentPage({ ...currentPage, blocks: newBlocks });
  };

  // -------------------------------------------------------------
  // GESTION DES IMAGES
  // -------------------------------------------------------------
  const handleOpenHeroPicker = () => {
    setMediaTarget({ type: 'hero' });
    setMediaModalOpen(true);
  };

  const handleOpenPageImagePicker = (imageId: string) => {
    setMediaTarget({ type: 'page_image', imageId });
    setMediaModalOpen(true);
  };

  const handleAddPageImage = () => {
    if (!currentPage) return;
    const newImage: InstitutionalPageImage = {
      id: `img-${Date.now()}`,
      slot_key: `image_${(currentPage.images || []).length + 1}`,
      label_fr: 'Nouvelle image illustrative',
      label_en: 'New illustrative image',
      url: '',
      alt_fr: 'Photographie descriptive APS-BÉNIN',
      alt_en: 'Descriptive photography APS-BENIN',
      caption_fr: '',
      caption_en: '',
      order_index: (currentPage.images || []).length + 1,
    };
    setCurrentPage({
      ...currentPage,
      images: [...(currentPage.images || []), newImage],
    });
  };

  const handleRemovePageImage = (id: string) => {
    if (!currentPage) return;
    setCurrentPage({
      ...currentPage,
      images: (currentPage.images || []).filter((img) => img.id !== id),
    });
  };

  const handleMediaSelect = (media: SelectedMedia) => {
    if (!currentPage || !mediaTarget) return;

    if (mediaTarget.type === 'hero') {
      setCurrentPage({
        ...currentPage,
        hero_image: media.url,
        hero_image_alt_fr: media.alt_fr || currentPage.hero_image_alt_fr || media.title_fr,
      });
    } else if (mediaTarget.type === 'page_image' && mediaTarget.imageId) {
      const updated: InstitutionalPageImage[] = (currentPage.images || []).map((img) => {
        if (img.id === mediaTarget.imageId) {
          return {
            ...img,
            url: media.url,
            alt_fr: media.alt_fr || img.alt_fr || media.title_fr || '',
            alt_en: img.alt_en || 'APS-BÉNIN photo',
            caption_fr: img.caption_fr || media.title_fr || '',
          };
        }
        return img;
      });
      setCurrentPage({ ...currentPage, images: updated });
    }

    setMediaModalOpen(false);
    setMediaTarget(null);
  };

  const activeTabDef = PAGE_TABS.find((t) => t.slug === activeSlug);

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Pages Institutionnelles"
        subtitle="Gérez l'identité officielle, la chronologie des jalons et le socle éthique de l'ONG APS-BÉNIN"
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(activeSlug)}
              disabled={loading || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
              title="Recharger depuis Supabase"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {activeTabDef && (
              <Link
                href={activeTabDef.publicUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span className="hidden sm:inline">Voir la page publique</span>
              </Link>
            )}

            <button
              type="button"
              onClick={activeSlug === 'histoire' ? handleSaveAllMilestones : handleSavePage}
              disabled={saving || !currentPage}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 text-[#FF8C00] ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer tout'}</span>
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-8 space-y-6 max-w-7xl">
        {/* Messages de retour */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-xs text-green-900 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              Synchronisé
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3 Onglets officiels : Présentation, Chronologie, Socle Éthique */}
        <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-2xs flex flex-wrap gap-2">
          {PAGE_TABS.map((tab) => {
            const isSelected = activeSlug === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => handleSelectTab(tab.slug)}
                className={`flex-1 min-w-[220px] text-left p-3.5 rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-purple-50/90 border-[#92278F] text-[#92278F] shadow-xs'
                    : 'bg-white border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#92278F] text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    /{tab.slug}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 line-clamp-1 font-heading">
                  {tab.label}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Language selector & Publication status toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">
              Langue d&apos;édition :
            </span>
            <button
              type="button"
              onClick={() => setEditingLang('fr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                editingLang === 'fr'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🇫🇷 Français (Principal)
            </button>
            <button
              type="button"
              onClick={() => setEditingLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                editingLang === 'en'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🇬🇧 English (International)
            </button>
          </div>

          <div className="flex items-center gap-4">
            {currentPage && (
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPage.is_published}
                  onChange={(e) =>
                    setCurrentPage({ ...currentPage, is_published: e.target.checked })
                  }
                  className="rounded border-gray-300 text-[#92278F] focus:ring-[#92278F] w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  {currentPage.is_published ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-700 font-bold">Publiée en ligne</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-700 font-bold">Brouillon interne</span>
                    </>
                  )}
                </span>
              </label>
            )}

            <button
              type="button"
              onClick={activeSlug === 'histoire' ? handleSaveAllMilestones : handleSavePage}
              disabled={saving || !currentPage}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#FF8C00] hover:bg-[#e07b00] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? '...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>

        {loading || !currentPage ? (
          <div className="p-16 bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-gray-500">
            <div className="w-8 h-8 border-3 border-[#92278F] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold">Chargement des données de la rubrique...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ============================================================== */}
            {/* 1. SECTION EN-TÊTE / HERO DE LA PAGE (COMMUN AUX 3 RUBRIQUES)   */}
            {/* ============================================================== */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#92278F]" />
                    <span>En-tête & Visuel Principal de la Page</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Titre H1, sur-titre, citation d&apos;accroche et visuel de couverture pour « {activeTabDef?.label} ».
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Badge / Etiquette */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Badge de sur-titre ({editingLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={
                      editingLang === 'fr'
                        ? currentPage.badge_fr || ''
                        : currentPage.badge_en || ''
                    }
                    onChange={(e) => {
                      if (editingLang === 'fr') {
                        setCurrentPage({ ...currentPage, badge_fr: e.target.value });
                      } else {
                        setCurrentPage({ ...currentPage, badge_en: e.target.value });
                      }
                    }}
                    placeholder={editingLang === 'fr' ? activeTabDef?.badge : 'The Organization'}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                  />
                </div>

                {/* Titre Principal */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Titre Principal H1 ({editingLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={
                      editingLang === 'fr'
                        ? currentPage.title_fr || ''
                        : currentPage.title_en || ''
                    }
                    onChange={(e) => {
                      if (editingLang === 'fr') {
                        setCurrentPage({ ...currentPage, title_fr: e.target.value });
                      } else {
                        setCurrentPage({ ...currentPage, title_en: e.target.value });
                      }
                    }}
                    placeholder="Titre de la page"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                  />
                </div>

                {/* Citation ou Devise */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Citation ou Devise mise en avant ({editingLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={
                      editingLang === 'fr'
                        ? currentPage.quote_fr || ''
                        : currentPage.quote_en || ''
                    }
                    onChange={(e) => {
                      if (editingLang === 'fr') {
                        setCurrentPage({ ...currentPage, quote_fr: e.target.value });
                      } else {
                        setCurrentPage({ ...currentPage, quote_en: e.target.value });
                      }
                    }}
                    placeholder="Pour un monde plus juste et égalitaire"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden italic"
                  />
                </div>

                {/* Sous-titre descriptif (ou vision pour mission-vision-valeurs) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {activeSlug === 'mission-vision-valeurs'
                      ? `Vision prospective (${editingLang.toUpperCase()})`
                      : `Sous-titre descriptif (${editingLang.toUpperCase()})`}
                  </label>
                  <textarea
                    rows={2}
                    value={
                      editingLang === 'fr'
                        ? currentPage.subtitle_fr || ''
                        : currentPage.subtitle_en || ''
                    }
                    onChange={(e) => {
                      if (editingLang === 'fr') {
                        setCurrentPage({ ...currentPage, subtitle_fr: e.target.value });
                      } else {
                        setCurrentPage({ ...currentPage, subtitle_en: e.target.value });
                      }
                    }}
                    placeholder={
                      activeSlug === 'mission-vision-valeurs'
                        ? 'Un Bénin et une Afrique où chaque femme, chaque jeune fille...'
                        : "Brève phrase d'introduction sous le titre..."
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Image Hero */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Image d&apos;ambiance du bandeau supérieur (Hero)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {currentPage.hero_image ? (
                    <div className="relative w-44 h-24 rounded-xl overflow-hidden border border-gray-300 shadow-2xs group">
                      <img
                        src={currentPage.hero_image}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenHeroPicker}
                          className="p-1.5 rounded-lg bg-white/90 text-gray-900 hover:bg-white text-xs"
                          title="Remplacer"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage({ ...currentPage, hero_image: '' })}
                          className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs"
                          title="Retirer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-44 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">Aucun visuel</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <button
                      type="button"
                      onClick={handleOpenHeroPicker}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-50 text-[#92278F] hover:bg-[#92278F] hover:text-white border border-purple-200 text-xs font-bold transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-[#FF8C00]" />
                      <span>Choisir depuis la Médiathèque</span>
                    </button>
                    <p className="text-[11px] text-gray-500">
                      Sélectionnez une photographie officielle de votre Médiathèque pour cette rubrique.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* SPÉCIFIQUE 1 : IDENTITÉ ET HISTOIRE (PRÉSENTATION)             */}
            {/* ============================================================== */}
            {activeSlug === 'presentation' && (
              <>
                {/* Textes et Paragraphes de Présentation */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#92278F]" />
                      <span>Textes Institutionnels & Ancrage Territorial</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Paragraphe introductif et historique légal détaillé de l&apos;ONG.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Paragraphe d&apos;introduction / Chapô ({editingLang.toUpperCase()})
                      </label>
                      <textarea
                        rows={3}
                        value={
                          editingLang === 'fr'
                            ? currentPage.intro_fr || ''
                            : currentPage.intro_en || ''
                        }
                        onChange={(e) => {
                          if (editingLang === 'fr') {
                            setCurrentPage({ ...currentPage, intro_fr: e.target.value });
                          } else {
                            setCurrentPage({ ...currentPage, intro_en: e.target.value });
                          }
                        }}
                        placeholder="Paragraphe introductif présentant l'organisation..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Texte détaillé des paragraphes ({editingLang.toUpperCase()})
                      </label>
                      <textarea
                        rows={8}
                        value={
                          editingLang === 'fr'
                            ? currentPage.body_html_fr || ''
                            : currentPage.body_html_en || ''
                        }
                        onChange={(e) => {
                          if (editingLang === 'fr') {
                            setCurrentPage({ ...currentPage, body_html_fr: e.target.value });
                          } else {
                            setCurrentPage({ ...currentPage, body_html_en: e.target.value });
                          }
                        }}
                        placeholder="Saisissez ici les paragraphes détaillés (séparés par un double saut de ligne)..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden leading-relaxed font-sans"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Chaque paragraphe séparé par une ligne vide est formaté proprement sur le site public.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photos illustratives de Présentation */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                  <div className="border-b border-gray-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#FF8C00]" />
                        <span>Photos Officielles (Siège et Terrain)</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Photographies du siège social à Djacoṭé-Comè et des actions communautaires.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPageImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-[#92278F] hover:bg-[#92278F] hover:text-white text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un emplacement photo</span>
                    </button>
                  </div>

                  {(currentPage.images || []).length === 0 ? (
                    <div className="p-8 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                      <p>Aucune photographie supplémentaire n&apos;est actuellement attachée.</p>
                      <button
                        type="button"
                        onClick={handleAddPageImage}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold hover:bg-gray-100"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#FF8C00]" />
                        <span>Ajouter une image</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentPage.images.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4 hover:border-purple-200 transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#92278F] uppercase tracking-wider">
                              Emplacement {idx + 1} : {img.label_fr || 'Photo illustrative'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePageImage(img.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                              title="Supprimer cet emplacement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            {img.url ? (
                              <div className="relative w-full sm:w-40 h-28 rounded-lg overflow-hidden border border-gray-300 shadow-2xs shrink-0 group">
                                <img
                                  src={img.url}
                                  alt={img.alt_fr || 'Photo'}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPageImagePicker(img.id)}
                                    className="px-2.5 py-1 rounded bg-white text-gray-900 font-bold text-xs"
                                  >
                                    Remplacer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full sm:w-40 h-28 rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 shrink-0">
                                <ImageIcon className="w-6 h-6 mb-1" />
                                <span className="text-[10px]">Photo vide</span>
                              </div>
                            )}

                            <div className="flex-1 space-y-3 w-full">
                              <button
                                type="button"
                                onClick={() => handleOpenPageImagePicker(img.id)}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#92278F] text-xs font-semibold text-gray-800 transition-colors shadow-2xs"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-[#FF8C00]" />
                                <span>Sélectionner dans la Médiathèque</span>
                              </button>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Légende ({editingLang.toUpperCase()})
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editingLang === 'fr'
                                      ? img.caption_fr || ''
                                      : img.caption_en || ''
                                  }
                                  onChange={(e) => {
                                    const updated = (currentPage.images || []).map((item) =>
                                      item.id === img.id
                                        ? {
                                            ...item,
                                            [editingLang === 'fr' ? 'caption_fr' : 'caption_en']:
                                              e.target.value,
                                          }
                                        : item
                                    );
                                    setCurrentPage({ ...currentPage, images: updated });
                                  }}
                                  placeholder="Légende sous la photo..."
                                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 bg-white focus:border-[#92278F] focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Principes de Présentation */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                  <div className="border-b border-gray-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#92278F]" />
                        <span>Principes Fondateurs de Présentation</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Piliers affichés dans la vue détaillée de la Présentation.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddBlock('pillar')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-[#92278F] hover:bg-[#92278F] hover:text-white text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un principe</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(currentPage.blocks || []).map((block, index) => (
                      <div
                        key={block.id || index}
                        className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 hover:border-purple-200 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-gray-700">
                            Principe #{index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              title="Monter"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(index, 'down')}
                              disabled={index === (currentPage.blocks || []).length - 1}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              title="Descendre"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(block.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors ml-2"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-4">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Titre ({editingLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              value={editingLang === 'fr' ? block.title_fr || '' : block.title_en || ''}
                              onChange={(e) => {
                                const updated = (currentPage.blocks || []).map((b) =>
                                  b.id === block.id
                                    ? {
                                        ...b,
                                        [editingLang === 'fr' ? 'title_fr' : 'title_en']: e.target.value,
                                      }
                                    : b
                                );
                                setCurrentPage({ ...currentPage, blocks: updated });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                            />
                          </div>
                          <div className="md:col-span-8">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Description ({editingLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              value={editingLang === 'fr' ? block.content_fr || '' : block.content_en || ''}
                              onChange={(e) => {
                                const updated = (currentPage.blocks || []).map((b) =>
                                  b.id === block.id
                                    ? {
                                        ...b,
                                        [editingLang === 'fr' ? 'content_fr' : 'content_en']: e.target.value,
                                      }
                                    : b
                                );
                                setCurrentPage({ ...currentPage, blocks: updated });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* SPÉCIFIQUE 2 : CHRONOLOGIE (HISTOIRE & TRAJECTOIRE)             */}
            {/* ============================================================== */}
            {activeSlug === 'histoire' && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                <div className="border-b border-gray-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#92278F]" />
                      <span>Jalons de la Chronologie Historique</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Gérez les étapes de la trajectoire institutionnelle (dates, titres, descriptions et ordre chronologique).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewMilestoneFormOpen(!newMilestoneFormOpen)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#92278F] text-white hover:bg-[#741772] text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF8C00]" />
                    <span>Ajouter une étape</span>
                  </button>
                </div>

                {/* Formulaire d'ajout rapide */}
                {newMilestoneFormOpen && (
                  <div className="p-5 rounded-xl border-2 border-dashed border-[#92278F]/40 bg-purple-50/50 space-y-4 animate-in fade-in">
                    <h4 className="text-xs font-bold text-[#92278F] uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nouvelle étape dans la chronologie</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Date / Année *
                        </label>
                        <input
                          type="text"
                          value={newMilestone.year || ''}
                          onChange={(e) => setNewMilestone({ ...newMilestone, year: e.target.value })}
                          placeholder="Ex: Septembre 2014, 2020..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-9">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Titre de l&apos;étape (FR) *
                        </label>
                        <input
                          type="text"
                          value={newMilestone.title_fr || ''}
                          onChange={(e) => setNewMilestone({ ...newMilestone, title_fr: e.target.value })}
                          placeholder="Ex: Création et premières initiatives citoyennes..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-12">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Titre en Anglais (EN)
                        </label>
                        <input
                          type="text"
                          value={newMilestone.title_en || ''}
                          onChange={(e) => setNewMilestone({ ...newMilestone, title_en: e.target.value })}
                          placeholder="Ex: Founding and Initial Grassroots Mobilization..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-12">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Description détaillée (FR)
                        </label>
                        <textarea
                          rows={2}
                          value={newMilestone.description_fr || ''}
                          onChange={(e) => setNewMilestone({ ...newMilestone, description_fr: e.target.value })}
                          placeholder="Détail des actions menées ou de la portée juridique..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-12">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Description en Anglais (EN)
                        </label>
                        <textarea
                          rows={2}
                          value={newMilestone.description_en || ''}
                          onChange={(e) => setNewMilestone({ ...newMilestone, description_en: e.target.value })}
                          placeholder="English description..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewMilestoneFormOpen(false)}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleAddMilestone}
                        className="px-4 py-1.5 rounded-lg bg-[#92278F] text-white text-xs font-bold hover:bg-[#741772]"
                      >
                        Confirmer l&apos;ajout
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des jalons chronologiques existants */}
                {milestones.length === 0 ? (
                  <div className="p-10 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">Aucune étape chronologique n&apos;est actuellement enregistrée.</p>
                    <p className="text-gray-500 mt-1">Cliquez sur « Ajouter une étape » pour créer le premier jalon historique.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone, idx) => (
                      <div
                        key={milestone.id || idx}
                        className="p-5 rounded-xl border border-gray-200 bg-white space-y-3 hover:border-purple-200 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-[#92278F]">
                              Étape {idx + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#FF8C00]">
                              {milestone.year}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveMilestone(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
                              title="Déplacer vers le haut"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMilestone(idx, 'down')}
                              disabled={idx === milestones.length - 1}
                              className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100"
                              title="Déplacer vers le bas"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(milestone.id)}
                              className="p-1.5 rounded text-gray-400 hover:text-red-600 transition-colors ml-2 hover:bg-red-50"
                              title="Supprimer cette étape"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Date / Année affichée
                            </label>
                            <input
                              type="text"
                              value={milestone.year || ''}
                              onChange={(e) => handleUpdateMilestone(milestone.id, 'year', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 font-semibold"
                            />
                          </div>

                          <div className="md:col-span-9">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Titre de l&apos;étape ({editingLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              value={editingLang === 'fr' ? milestone.title_fr || '' : milestone.title_en || ''}
                              onChange={(e) =>
                                handleUpdateMilestone(
                                  milestone.id,
                                  editingLang === 'fr' ? 'title_fr' : 'title_en',
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 font-semibold"
                            />
                          </div>

                          <div className="md:col-span-12">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                              Description du jalon ({editingLang.toUpperCase()})
                            </label>
                            <textarea
                              rows={2}
                              value={
                                editingLang === 'fr'
                                  ? milestone.description_fr || ''
                                  : milestone.description_en || ''
                              }
                              onChange={(e) =>
                                handleUpdateMilestone(
                                  milestone.id,
                                  editingLang === 'fr' ? 'description_fr' : 'description_en',
                                  e.target.value
                                )
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SPÉCIFIQUE 3 : SOCLE ÉTHIQUE (MISSION, VISION, VALEURS)        */}
            {/* ============================================================== */}
            {activeSlug === 'mission-vision-valeurs' && (
              <>
                {/* Textes statutaires : Mission & Vision */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                      <Compass className="w-5 h-5 text-[#92278F]" />
                      <span>Mission Statutaire & Vision Prospective</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Définissez la mission opérationnelle fondamentale et la vision sociétale d&apos;APS-BÉNIN.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Notre Mission ({editingLang.toUpperCase()})
                      </label>
                      <textarea
                        rows={4}
                        value={
                          editingLang === 'fr'
                            ? currentPage.intro_fr || ''
                            : currentPage.intro_en || ''
                        }
                        onChange={(e) => {
                          if (editingLang === 'fr') {
                            setCurrentPage({ ...currentPage, intro_fr: e.target.value });
                          } else {
                            setCurrentPage({ ...currentPage, intro_en: e.target.value });
                          }
                        }}
                        placeholder="Défendre les droits humains, promouvoir la justice et l’égalité de genre..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden leading-relaxed"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Affichée dans la carte violette « Notre Mission » sur la page publique.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Notre Vision ({editingLang.toUpperCase()})
                      </label>
                      <textarea
                        rows={4}
                        value={
                          editingLang === 'fr'
                            ? currentPage.subtitle_fr || ''
                            : currentPage.subtitle_en || ''
                        }
                        onChange={(e) => {
                          if (editingLang === 'fr') {
                            setCurrentPage({ ...currentPage, subtitle_fr: e.target.value });
                          } else {
                            setCurrentPage({ ...currentPage, subtitle_en: e.target.value });
                          }
                        }}
                        placeholder="Un Bénin et une Afrique où chaque femme, chaque jeune fille et chaque citoyen vit à l’abri des violences..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden leading-relaxed"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        Affichée dans la carte orange « Notre Vision » sur la page publique.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Les Valeurs fondamentales du Socle Éthique */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
                  <div className="border-b border-gray-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#FF8C00]" />
                        <span>Valeurs Fondamentales & Piliers Éthiques</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Principes intangibles structurants affichés sur la grille du Socle Éthique.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddBlock('pillar')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-50 text-[#92278F] hover:bg-[#92278F] hover:text-white text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une valeur</span>
                    </button>
                  </div>

                  {(currentPage.blocks || []).length === 0 ? (
                    <div className="p-8 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                      <p>Aucune valeur personnalisée n&apos;est enregistrée.</p>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('pillar')}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold hover:bg-gray-100"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#FF8C00]" />
                        <span>Ajouter une valeur</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentPage.blocks.map((block, index) => (
                        <div
                          key={block.id || index}
                          className="p-5 rounded-xl border border-gray-200 bg-white space-y-3 hover:border-purple-200 transition-all shadow-2xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-3">
                              <span className="text-xs font-bold text-[#92278F] uppercase tracking-wider">
                                Valeur #{index + 1}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveBlock(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                  title="Monter"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveBlock(index, 'down')}
                                  disabled={index === (currentPage.blocks || []).length - 1}
                                  className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                  title="Descendre"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBlock(block.id)}
                                  className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors ml-2"
                                  title="Supprimer cette valeur"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                <div className="sm:col-span-8">
                                  <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                    Intitulé ({editingLang.toUpperCase()})
                                  </label>
                                  <input
                                    type="text"
                                    value={editingLang === 'fr' ? block.title_fr || '' : block.title_en || ''}
                                    onChange={(e) => {
                                      const updated = (currentPage.blocks || []).map((b) =>
                                        b.id === block.id
                                          ? {
                                              ...b,
                                              [editingLang === 'fr' ? 'title_fr' : 'title_en']: e.target.value,
                                            }
                                          : b
                                      );
                                      setCurrentPage({ ...currentPage, blocks: updated });
                                    }}
                                    placeholder="Ex: Justice & Équité"
                                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 font-semibold focus:border-[#92278F] focus:outline-hidden"
                                  />
                                </div>

                                <div className="sm:col-span-4">
                                  <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                    Icône
                                  </label>
                                  <select
                                    value={block.icon_name || 'Scale'}
                                    onChange={(e) => {
                                      const updated = (currentPage.blocks || []).map((b) =>
                                        b.id === block.id ? { ...b, icon_name: e.target.value } : b
                                      );
                                      setCurrentPage({ ...currentPage, blocks: updated });
                                    }}
                                    className="w-full px-2 py-1.5 text-xs rounded-md border border-gray-300 bg-white"
                                  >
                                    {AVAILABLE_ICONS.map((ic) => (
                                      <option key={ic} value={ic}>
                                        {ic}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                                  Description / Sens éthique ({editingLang.toUpperCase()})
                                </label>
                                <textarea
                                  rows={2}
                                  value={editingLang === 'fr' ? block.content_fr || '' : block.content_en || ''}
                                  onChange={(e) => {
                                    const updated = (currentPage.blocks || []).map((b) =>
                                      b.id === block.id
                                        ? {
                                            ...b,
                                            [editingLang === 'fr' ? 'content_fr' : 'content_en']: e.target.value,
                                          }
                                        : b
                                    );
                                    setCurrentPage({ ...currentPage, blocks: updated });
                                  }}
                                  placeholder="Défense inconditionnelle de l’accès équitable aux droits fondamentaux..."
                                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 leading-relaxed focus:border-[#92278F] focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Barre de navigation rapide vers les autres modules */}
            <div className="bg-purple-50/60 rounded-2xl p-6 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-gray-900 font-heading">
                  Navigation rapide dans les modules institutionnels
                </h4>
                <p className="text-xs text-gray-600">
                  Accédez directement aux autres rubriques administrables de l&apos;organisation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/admin/domaines"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#92278F] text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                >
                  Domaines d&apos;intervention →
                </Link>
                <Link
                  href="/admin/equipe"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#92278F] text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                >
                  Gérer l&apos;Équipe →
                </Link>
                <Link
                  href="/admin/gouvernance"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#92278F] text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                >
                  Gérer la Gouvernance →
                </Link>
                <Link
                  href="/admin/documents"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#92278F] text-xs font-semibold text-gray-700 transition-colors shadow-2xs"
                >
                  Documents & Rapports →
                </Link>
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg flex items-center justify-between gap-4 z-20">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-4 h-4 text-[#FF8C00]" />
                <span>
                  Modifications enregistrées en direct dans Supabase avec mise à jour immédiate du site public.
                </span>
              </div>

              <div className="flex items-center gap-3">
                {activeTabDef && (
                  <Link
                    href={activeTabDef.publicUrl}
                    target="_blank"
                    className="px-3.5 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Voir en ligne
                  </Link>
                )}

                <button
                  type="button"
                  onClick={activeSlug === 'histoire' ? handleSaveAllMilestones : handleSavePage}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Enregistrement en cours...' : `Enregistrer « ${activeTabDef?.label || 'la page'} »`}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={mediaModalOpen}
        onClose={() => {
          setMediaModalOpen(false);
          setMediaTarget(null);
        }}
        onSelect={handleMediaSelect}
        title="Choisir une image depuis la Médiathèque"
      />
    </AdminAuthGuard>
  );
}
