'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabaseStore } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { SiteSettings } from '@/types';
import { SiteLogo } from '@/components/SiteLogo';
import {
  SOCIAL_PLATFORMS,
  SocialPlatformId,
  getPlatformState,
  setPlatformState,
} from '@/lib/social';
import { SocialPlatformIcon } from '@/components/admin/SocialPlatformIcon';
import {
  Save,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Share2,
  Upload,
  Camera,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ImageIcon,
} from 'lucide-react';

export default function AdminParametresPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingSocialOnly, setSavingSocialOnly] = useState(false);
  const [socialSavedSuccess, setSocialSavedSuccess] = useState(false);

  // Social update handler
  const handleUpdateSocial = (
    platformId: SocialPlatformId,
    updates: { url?: string; enabled?: boolean }
  ) => {
    if (!settings) return;
    const updatedLinks = setPlatformState(settings.social_links, platformId, updates);
    setSettings({
      ...settings,
      social_links: updatedLinks,
    });
  };

  const handleSaveSocialOnly = async () => {
    if (!settings || savingSocialOnly) return;
    setSavingSocialOnly(true);
    try {
      await supabaseStore.updateSettings({
        social_links: settings.social_links,
      });
      setSocialSavedSuccess(true);
      setTimeout(() => setSocialSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || 'Impossible d\'enregistrer les réseaux sociaux'}`);
    } finally {
      setSavingSocialOnly(false);
    }
  };

  // Logo upload & preview state
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMessage, setLogoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabaseStore.getSettings().then(setSettings);
  }, []);

  // Cleanup local preview object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoMessage({
        type: 'error',
        text: t('settings.logo_invalid_format'),
      });
      return;
    }

    // Validate file size (max 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setLogoMessage({
        type: 'error',
        text: t('settings.logo_too_large'),
      });
      return;
    }

    if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setSelectedLogoFile(file);
    setLogoPreviewUrl(preview);
    setLogoMessage(null);
  };

  const handleCancelLogoSelection = () => {
    if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setSelectedLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveLogoOnly = async () => {
    if (!selectedLogoFile || !settings || uploadingLogo) return;

    setUploadingLogo(true);
    setLogoMessage(null);

    try {
      // Upload file directly to 'logos' bucket in Supabase storage
      const result = await supabaseStore.uploadFile(selectedLogoFile, 'logos', 'branding');
      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || t('settings.logo_upload_error'));
      }

      const newLogoUrl = result.publicUrl;

      // Update central settings with new logo_url
      const updatedSettings: SiteSettings = {
        ...settings,
        logo_url: newLogoUrl,
      };

      await supabaseStore.updateSettings(updatedSettings);
      setSettings(updatedSettings);

      // Reset selection state
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      setSelectedLogoFile(null);
      setLogoPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setLogoMessage({
        type: 'success',
        text: t('settings.logo_updated'),
      });

      setTimeout(() => {
        setLogoMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setLogoMessage({
        type: 'error',
        text: `${t('settings.logo_upload_error')} : ${err.message || 'Erreur inconnue'}`,
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || savingGeneral) return;

    setSavingGeneral(true);
    try {
      await supabaseStore.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer les paramètres dans Supabase"}`);
    } finally {
      setSavingGeneral(false);
    }
  };

  if (!settings) {
    return (
      <AdminAuthGuard requireSuperAdmin>
        <div className="p-8 text-xs text-gray-500">Chargement des paramètres...</div>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard requireSuperAdmin>
      <AdminHeader
        title="Paramètres Généraux du Site"
        subtitle="Configuration globale de l’identité institutionnelle, du logo officiel, des coordonnées et du référencement"
      />

      <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Paramètres institutionnels mis à jour avec succès !</span>
          </div>
        )}

        {/* SECTION DÉDIÉE : LOGO OFFICIEL DU SITE (FORMAT LIBRE & RATIO PRÉSERVÉ) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#92278F]" />
              <span>{t('settings.logo_title')}</span>
            </h2>
            <span className="text-[10px] font-bold text-[#FF8C00] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 w-fit">
              Tous Formats (Horizontal, Carré ou Circulaire) • Ratio Préservé
            </span>
          </div>

          {/* Structure harmonisée en 3 blocs : [ Aperçu proportionnel ] [ Description & informations ] [ Actions ] */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-5 sm:gap-6">
            {/* 1. GAUCHE : Aperçu avec ratio d'origine préservé (aucun rognage circulaire forcé) */}
            <div className="relative group shrink-0">
              <div className="relative rounded-2xl border-2 border-[#92278F]/25 bg-white p-2 shadow-xs hover:border-[#92278F] transition-colors flex items-center justify-center overflow-hidden">
                <SiteLogo
                  variant="preview"
                  overrideUrl={logoPreviewUrl || settings.logo_url}
                  alt="Aperçu Logo officiel APS-BÉNIN"
                />

                {/* Overlay de modification au survol */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute inset-0 bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-2xs cursor-pointer rounded-2xl"
                  title={t('settings.logo_change')}
                >
                  <Upload className="w-5 h-5 text-[#FF8C00] mb-0.5" />
                  <span className="text-[10px] font-bold">Remplacer</span>
                </button>
              </div>

              {/* Indicateur de validation discret */}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-2xs flex items-center justify-center"
                title="Logo officiel actif"
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            </div>

            {/* 2. CENTRE : Description & détails techniques */}
            <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-xs font-bold text-gray-900">
                  {selectedLogoFile ? 'Aperçu du nouveau fichier' : 'Emblème institutionnel officiel'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>Source Unique</span>
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                Logo officiel unique utilisé sur tout le site : en-tête public, pied de page, portail de connexion et administration. Les logos horizontaux, carrés ou verticaux conservent automatiquement leurs proportions d'origine sans déformation.
              </p>
              <p className="text-[11px] text-gray-400">
                Formats acceptés : PNG, JPG, WEBP, SVG • Max 5 Mo • Stockage bucket <span className="text-[#92278F] font-medium">logos</span>
              </p>
            </div>

            {/* 3. DROITE : Bouton d'action principal */}
            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full sm:w-auto">
              {/* Input fichier natif invisible */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 transition-all shadow-xs hover:border-[#92278F] hover:text-[#92278F]"
              >
                <Upload className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>{t('settings.logo_choose')}</span>
              </button>

              {selectedLogoFile && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSaveLogoOnly}
                    disabled={uploadingLogo}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-[#FF8C00]" />
                    <span>{uploadingLogo ? t('settings.logo_uploading') : t('settings.logo_save')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelLogoSelection}
                    disabled={uploadingLogo}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    title={t('settings.logo_cancel')}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="sm:inline">{t('settings.logo_cancel')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fichier sélectionné en attente d'enregistrement */}
          {selectedLogoFile && (
            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon className="w-3.5 h-3.5 text-[#92278F] shrink-0" />
                <span className="font-bold truncate">{selectedLogoFile.name}</span>
                <span className="text-[11px] text-purple-700">
                  ({(selectedLogoFile.size / 1024).toFixed(1)} Ko)
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#92278F] text-white px-2 py-0.5 rounded-full shrink-0">
                Prêt
              </span>
            </div>
          )}

          {/* Message de notification d'upload */}
          {logoMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                logoMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {logoMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{logoMessage.text}</span>
            </div>
          )}
        </div>

        {/* FORMULAIRE DES PARAMÈTRES GÉNÉRAUX */}
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          {/* Identity & Legal */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#92278F]" />
              <span>Identité & Références Légales</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nom officiel complet
                </label>
                <input
                  type="text"
                  required
                  value={settings.org_name}
                  onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sigle / Nom court
                </label>
                <input
                  type="text"
                  required
                  value={settings.org_name_short}
                  onChange={(e) => setSettings({ ...settings, org_name_short: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none font-bold text-[#92278F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Slogan (Français)
                </label>
                <input
                  type="text"
                  value={settings.slogan_fr}
                  onChange={(e) => setSettings({ ...settings, slogan_fr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none italic"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Slogan (Anglais)
                </label>
                <input
                  type="text"
                  value={settings.slogan_en}
                  onChange={(e) => setSettings({ ...settings, slogan_en: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none italic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Réf. Récépissé d’enregistrement
                </label>
                <input
                  type="text"
                  value={settings.registration_reference}
                  onChange={(e) => setSettings({ ...settings, registration_reference: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Journal Officiel
                </label>
                <input
                  type="text"
                  value={settings.jo_reference}
                  onChange={(e) => setSettings({ ...settings, jo_reference: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Identifiant Fiscal Unique (IFU)
                </label>
                <input
                  type="text"
                  value={settings.ifu_number}
                  onChange={(e) => setSettings({ ...settings, ifu_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none font-mono font-bold text-[#92278F]"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
              Coordonnées Institutionnelles
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Adresse complète du Siège
                </label>
                <input
                  type="text"
                  value={settings.address_location}
                  onChange={(e) => setSettings({ ...settings, address_location: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Boîte Postale (BP)
                </label>
                <input
                  type="text"
                  value={settings.postal_box}
                  onChange={(e) => setSettings({ ...settings, postal_box: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Téléphones (séparés par virgule)
                </label>
                <input
                  type="text"
                  value={settings.phones.join(', ')}
                  onChange={(e) => setSettings({ ...settings, phones: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email officiel
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#FF8C00]" />
                  <span>Réseaux Sociaux Officiels</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Contrôlez l'activation et l'adresse officielle de chaque plateforme. Seules les plateformes activées munies d'une URL valide sont affichées sur le site public.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {socialSavedSuccess && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Enregistré !</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveSocialOnly}
                  disabled={savingSocialOnly}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-50 text-[#92278F] hover:bg-purple-100 border border-purple-200 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-[#FF8C00]" />
                  <span>{savingSocialOnly ? 'Enregistrement...' : 'Enregistrer les réseaux sociaux'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {SOCIAL_PLATFORMS.map((platform) => {
                const state = getPlatformState(settings.social_links, platform.id);
                return (
                  <div
                    key={platform.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      state.enabled
                        ? 'bg-purple-50/20 border-[#92278F]/25 shadow-2xs'
                        : 'bg-gray-50/70 border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                      {/* 1. GAUCHE : Logo officiel & Nom de la plateforme */}
                      <div className="flex items-center gap-3 sm:w-56 shrink-0">
                        {/* Zone d'icône compacte et uniforme (32x32px, icône 22px) */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white border shadow-2xs transition-all ${
                            state.enabled ? 'border-gray-200' : 'border-gray-200/60'
                          }`}
                        >
                          <SocialPlatformIcon
                            platform={platform.id}
                            size={22}
                            disabled={!state.enabled}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-gray-900 truncate">
                            {platform.name}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {platform.badge}
                          </span>
                        </div>
                      </div>

                      {/* 2. CENTRE : État Activé / Désactivé avec switch */}
                      <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:w-44 shrink-0">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            state.enabled
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          {state.enabled ? 'Activé' : 'Désactivé'}
                        </span>

                        {/* Interrupteur switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={state.enabled}
                          aria-label={`Activer ou désactiver ${platform.name}`}
                          onClick={() => handleUpdateSocial(platform.id, { enabled: !state.enabled })}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#92278F] ${
                            state.enabled ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              state.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* 3. DROITE : Champ URL et indicateur public */}
                      <div className="flex-1 w-full min-w-0">
                        <div className="relative">
                          <input
                            type="url"
                            value={state.url}
                            placeholder={platform.placeholder}
                            onChange={(e) => handleUpdateSocial(platform.id, { url: e.target.value })}
                            className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-mono transition-colors ${
                              state.enabled && !state.url
                                ? 'border-amber-400 bg-amber-50/40 focus:border-amber-500'
                                : 'border-gray-300 bg-white focus:border-[#92278F]'
                            }`}
                          />
                        </div>

                        {/* Note discrète d'état */}
                        <div className="mt-1 text-[10px]">
                          {state.enabled && state.url && (
                            <p className="text-green-700 font-medium flex items-center gap-1">
                              <span>✓ Affiché sur le site public</span>
                            </p>
                          )}
                          {state.enabled && !state.url && (
                            <p className="text-amber-700 font-medium flex items-center gap-1">
                              <span>⚠️ URL vide (ne sera pas affiché)</span>
                            </p>
                          )}
                          {!state.enabled && (
                            <p className="text-gray-400 font-normal">
                              Désactivé (masqué sur le site public)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEO Metadata */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#92278F]" />
              <span>Référencement & Balises Globales SEO</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Titre Général du Site (Français)
                </label>
                <input
                  type="text"
                  value={settings.seo.meta_title_fr}
                  onChange={(e) => setSettings({
                    ...settings,
                    seo: { ...settings.seo, meta_title_fr: e.target.value },
                  })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Meta Description (Français)
                </label>
                <input
                  type="text"
                  value={settings.seo.meta_description_fr}
                  onChange={(e) => setSettings({
                    ...settings,
                    seo: { ...settings.seo, meta_description_fr: e.target.value },
                  })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={savingGeneral}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#FF8C00]" />
              <span>{savingGeneral ? 'Enregistrement...' : 'Enregistrer tous les paramètres'}</span>
            </button>
          </div>
        </form>
      </main>
    </AdminAuthGuard>
  );
}
