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
  MoveUp,
  MoveDown,
  RefreshCw,
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
    description: 'En-tête, sous-titres, citations et visuels de la trajectoire institutionnelle.',
  },
  {
    slug: 'mission-vision-valeurs',
    label: 'Mission, Vision & Valeurs',
    badge: 'Socle Éthique',
    publicUrl: '/organisation/mission-vision-valeurs',
    description: 'Piliers éthiques, mission statutaire et vision sociétale pour le Bénin.',
  },
  {
    slug: 'domaines',
    label: "Domaines d'intervention",
    badge: "Piliers d'Action",
    publicUrl: '/organisation/domaines',
    description: 'En-tête éditorial, citation inspirante et visuels des axes stratégiques.',
  },
];

export default function AdminInstitutionalPages() {
  const [pages, setPages] = useState<InstitutionalPage[]>([]);
  const [activeSlug, setActiveSlug] = useState<InstitutionalPageSlug>('presentation');
  const [currentPage, setCurrentPage] = useState<InstitutionalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active language tab for bilingual editing in admin
  const [editingLang, setEditingLang] = useState<'fr' | 'en'>('fr');

  // Media selector modal state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{
    type: 'hero' | 'page_image' | 'block_image';
    imageId?: string;
    blockId?: string;
  } | null>(null);

  const loadAllPages = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await supabaseStore.getInstitutionalPages();
      setPages(data);
      const found = data.find((p) => p.slug === activeSlug);
      if (found) {
        setCurrentPage(JSON.parse(JSON.stringify(found)));
      }
    } catch (err: any) {
      console.error('Erreur chargement pages institutionnelles:', err);
      setErrorMessage('Impossible de charger les données des pages institutionnelles.');
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  // Load all pages on mount
  useEffect(() => {
    loadAllPages();
  }, [loadAllPages]);

  // When active slug changes
  const handleSelectTab = (slug: InstitutionalPageSlug) => {
    setActiveSlug(slug);
    setSaveSuccess(false);
    setErrorMessage(null);
    const found = pages.find((p) => p.slug === slug);
    if (found) {
      setCurrentPage(JSON.parse(JSON.stringify(found)));
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!currentPage) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const saved = await supabaseStore.saveInstitutionalPage(currentPage);
      // update state
      setPages((prev) => prev.map((p) => (p.slug === saved.slug ? saved : p)));
      setCurrentPage(JSON.parse(JSON.stringify(saved)));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      console.error('Erreur enregistrement:', err);
      setErrorMessage(err?.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Hero Media picker
  const handleOpenHeroPicker = () => {
    setMediaTarget({ type: 'hero' });
    setMediaModalOpen(true);
  };

  // Page Image picker
  const handleOpenPageImagePicker = (imageId: string) => {
    setMediaTarget({ type: 'page_image', imageId });
    setMediaModalOpen(true);
  };

  // Add a new image slot to page
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

  // Remove image from page
  const handleRemovePageImage = (id: string) => {
    if (!currentPage) return;
    setCurrentPage({
      ...currentPage,
      images: (currentPage.images || []).filter((img) => img.id !== id),
    });
  };

  // Add a new block (e.g. pillar or paragraph)
  const handleAddBlock = (type: InstitutionalPageBlock['type']) => {
    if (!currentPage) return;
    const newBlock: InstitutionalPageBlock = {
      id: `blk-${Date.now()}`,
      type,
      title_fr: type === 'pillar' ? 'Nouveau principe' : 'Nouveau paragraphe',
      title_en: type === 'pillar' ? 'New principle' : 'New paragraph',
      content_fr: '',
      content_en: '',
      icon_name: 'ShieldCheck',
      order_index: (currentPage.blocks || []).length + 1,
    };
    setCurrentPage({
      ...currentPage,
      blocks: [...(currentPage.blocks || []), newBlock],
    });
  };

  // Remove block
  const handleRemoveBlock = (blockId: string) => {
    if (!currentPage) return;
    setCurrentPage({
      ...currentPage,
      blocks: (currentPage.blocks || []).filter((b) => b.id !== blockId),
    });
  };

  // Reorder block
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!currentPage || !currentPage.blocks) return;
    const newBlocks = [...currentPage.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    // update order_index
    newBlocks.forEach((b, i) => {
      b.order_index = i + 1;
    });
    setCurrentPage({ ...currentPage, blocks: newBlocks });
  };

  // Handle selected media callback
  const handleMediaSelect = (media: SelectedMedia) => {
    if (!currentPage || !mediaTarget) return;

    if (mediaTarget.type === 'hero') {
      setCurrentPage({
        ...currentPage,
        hero_image: media.url,
        hero_image_alt_fr: media.alt_fr || currentPage.hero_image_alt_fr || media.title_fr,
      });
    } else if (mediaTarget.type === 'page_image' && mediaTarget.imageId) {
      const updatedImages = (currentPage.images || []).map((img) => {
        if (img.id === mediaTarget.imageId) {
          return {
            ...img,
            url: media.url,
            alt_fr: media.alt_fr || img.alt_fr || media.title_fr || '',
          };
        }
        return img;
      });
      setCurrentPage({ ...currentPage, images: updatedImages });
    }

    setMediaModalOpen(false);
    setMediaTarget(null);
  };

  const activeTabDef = PAGE_TABS.find((t) => t.slug === activeSlug);

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Pages Institutionnelles"
        subtitle="Gestion éditoriale complète des textes, titres, citations et photographies de la rubrique « L'Organisation »"
        actionButton={
          <div className="flex items-center gap-2">
            {activeTabDef && (
              <Link
                href={activeTabDef.publicUrl}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <span>Aperçu en ligne</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !currentPage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        }
      />

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Banner notification */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span className="font-semibold">
                Modifications enregistrées avec succès ! Les pages publiques affichent désormais les nouveaux contenus.
              </span>
            </div>
            <Link
              href={activeTabDef?.publicUrl || '/organisation/presentation'}
              target="_blank"
              className="font-bold underline text-green-900 hover:text-green-700"
            >
              Voir la page publique →
            </Link>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Page selector Tabs */}
        <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-2xs flex flex-wrap gap-2">
          {PAGE_TABS.map((tab) => {
            const isSelected = activeSlug === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                onClick={() => handleSelectTab(tab.slug)}
                className={`flex-1 min-w-[200px] text-left p-3 rounded-xl transition-all border ${
                  isSelected
                    ? 'bg-purple-50/80 border-[#92278F] text-[#92278F] shadow-xs'
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
                    {tab.slug}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
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
            {/* Status toggle */}
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
              onClick={handleSave}
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
            <p className="text-xs font-semibold">Chargement des données éditoriales...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. SECTION EN-TÊTE / HERO DE LA PAGE */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#92278F]" />
                    <span>En-tête & Titres Principaux</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Modifiez le grand titre, l&apos;étiquette supérieure, le sous-titre et la citation d&apos;accroche.
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
                    placeholder={editingLang === 'fr' ? "L'Organisation" : 'The Organization'}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Ex: L&apos;Organisation, Notre Trajectoire, Identité Institutionnelle.
                  </p>
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
                  <p className="text-[11px] text-gray-400 mt-1">
                    Affichée avec bordure orange dans le bandeau noir supérieur.
                  </p>
                </div>

                {/* Sous-titre descriptif */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sous-titre descriptif ({editingLang.toUpperCase()})
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
                    placeholder="Brève phrase d'introduction sous le titre..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Image d'arrière-plan du Hero */}
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
                      Sélectionnez une photographie officielle de votre Médiathèque. Si aucune image n&apos;est choisie, un fond sombre avec le dégradé signature APS-BÉNIN sera utilisé automatiquement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SECTION CORPS DE TEXTE & PARAGRAPHES (POUR PRÉSENTATION) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#92278F]" />
                  <span>Textes Institutionnels & Paragraphes</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Paragraphes détaillés, mission statutaire et présentation officielle.
                </p>
              </div>

              <div className="space-y-4">
                {/* Chapô / Introduction */}
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

                {/* Corps de texte principal */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Texte détaillé ({editingLang.toUpperCase()})
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
                    placeholder="Saisissez ici les paragraphes détaillés de la présentation (séparés par un saut de ligne)..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] focus:outline-hidden leading-relaxed font-sans"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Chaque paragraphe séparé par une ligne vide est formaté proprement sur le site public.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. SECTION VISUELS & PHOTOS ASSOCIÉES (MÉDIATHÈQUE) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
              <div className="border-b border-gray-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#FF8C00]" />
                    <span>Photographies & Médias Illustratifs</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Remplacez, ajoutez ou retirez des images de cette page. Toutes les photos proviennent directement de votre Médiathèque.
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
                  <p>Aucune photographie supplémentaire n&apos;est actuellement attachée à cette page.</p>
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
                              Légende affichée ({editingLang.toUpperCase()})
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

                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-0.5">
                              Texte alternatif / Accessibilité ({editingLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              value={
                                editingLang === 'fr'
                                  ? img.alt_fr || ''
                                  : img.alt_en || ''
                              }
                              onChange={(e) => {
                                const updated = (currentPage.images || []).map((item) =>
                                  item.id === img.id
                                    ? {
                                        ...item,
                                        [editingLang === 'fr' ? 'alt_fr' : 'alt_en']:
                                          e.target.value,
                                      }
                                    : item
                                );
                                setCurrentPage({ ...currentPage, images: updated });
                              }}
                              placeholder="Description pour l'accessibilité..."
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

            {/* 4. BLOCS STRUCTURANTS / PILIERS / PRINCIPES FONDATUERS */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-2xs space-y-6">
              <div className="border-b border-gray-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#92278F]" />
                    <span>Principes Fondateurs & Blocs de Contenu</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ajoutez, modifiez ou réorganisez les piliers fondamentaux et blocs illustratifs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBlock('pillar')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-[#92278F] hover:bg-[#92278F] hover:text-white text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un pilier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock('paragraph')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un bloc texte</span>
                  </button>
                </div>
              </div>

              {(currentPage.blocks || []).length === 0 ? (
                <div className="p-8 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                  <p>Aucun bloc modulaire n&apos;est défini pour cette section.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentPage.blocks.map((block, index) => (
                    <div
                      key={block.id || index}
                      className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-white space-y-3 hover:border-purple-200 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-[#92278F]">
                            {block.type === 'pillar' ? 'Pilier / Principe' : 'Bloc Texte'}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            #{index + 1}
                          </span>
                        </div>

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
                            title="Supprimer ce bloc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Titre du bloc ({editingLang.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={
                              editingLang === 'fr'
                                ? block.title_fr || ''
                                : block.title_en || ''
                            }
                            onChange={(e) => {
                              const updated = (currentPage.blocks || []).map((b) =>
                                b.id === block.id
                                  ? {
                                      ...b,
                                      [editingLang === 'fr' ? 'title_fr' : 'title_en']:
                                        e.target.value,
                                    }
                                  : b
                              );
                              setCurrentPage({ ...currentPage, blocks: updated });
                            }}
                            placeholder="Ex: Indépendance & Éthique"
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-8">
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Description / Contenu ({editingLang.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={
                              editingLang === 'fr'
                                ? block.content_fr || ''
                                : block.content_en || ''
                            }
                            onChange={(e) => {
                              const updated = (currentPage.blocks || []).map((b) =>
                                b.id === block.id
                                  ? {
                                      ...b,
                                      [editingLang === 'fr' ? 'content_fr' : 'content_en']:
                                        e.target.value,
                                    }
                                  : b
                              );
                              setCurrentPage({ ...currentPage, blocks: updated });
                            }}
                            placeholder="Explication du principe ou paragraphe..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 focus:border-[#92278F] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. LIENS ET SOUS-PAGES DE LA RUBRIQUE */}
            <div className="bg-purple-50/60 rounded-2xl p-6 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-gray-900 font-heading">
                  Navigation rapide dans la rubrique « L&apos;Organisation »
                </h4>
                <p className="text-xs text-gray-600">
                  Gérez également les autres modules déjà intégrés : Équipe opérationnelle, Conseil d&apos;administration, et Documents officiels.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                  Gérer les Documents →
                </Link>
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg flex items-center justify-between gap-4 z-20">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-4 h-4 text-[#FF8C00]" />
                <span>
                  Toutes les modifications prennent effet immédiatement après enregistrement.
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
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Enregistrement en cours...' : 'Enregistrer la page'}</span>
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
