'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { InstitutionalDoc, DocumentCategory } from '@/types';
import {
  DOCUMENT_CATEGORIES,
  getCategoryMeta,
  detectDocFormat,
} from '@/lib/document-categories';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Download,
  ExternalLink,
  X,
  Upload,
  Link as LinkIcon,
  Check,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<InstitutionalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<InstitutionalDoc | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<InstitutionalDoc | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'draft'>('all');

  // Form state
  const [sourceType, setSourceType] = useState<'upload' | 'external'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const [form, setForm] = useState<Partial<InstitutionalDoc>>({
    title_fr: '',
    title_en: '',
    slug: '',
    category: 'institutional_document',
    description_fr: '',
    description_en: '',
    file_url: '',
    file_size: '',
    publication_year: new Date().getFullYear(),
    is_public: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await supabaseStore.getDocuments();
      setDocs(list);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingDoc(null);
    setSourceType('upload');
    setUploadError('');
    setSelectedFileName('');
    setForm({
      title_fr: '',
      title_en: '',
      slug: '',
      category: 'institutional_document',
      description_fr: '',
      description_en: '',
      file_url: '',
      file_size: '',
      publication_year: new Date().getFullYear(),
      is_public: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (d: InstitutionalDoc) => {
    setEditingDoc(d);
    setUploadError('');
    setSelectedFileName('');

    // Detect if current file_url is external or uploaded
    const isExt = d.file_url.startsWith('http') && !d.file_url.includes('supabase.co/storage/v1/object/public/documents');
    setSourceType(isExt ? 'external' : 'upload');

    setForm({ ...d });
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('Le fichier est trop volumineux. La taille maximale autorisée est de 25 Mo.');
      return;
    }

    // Validate extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setUploadError(`Type de fichier non autorisé (${fileExt}). Formats acceptés : PDF, Word, Excel, PowerPoint.`);
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // Calculate friendly file size
      const sizeStr = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
        : `${Math.round(file.size / 1024)} Ko`;

      const result = await supabaseStore.uploadFile(file, 'documents', 'documents');

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || 'Erreur lors du téléversement du document');
      }

      setSelectedFileName(file.name);
      setForm((prev) => ({
        ...prev,
        file_url: result.publicUrl,
        file_size: sizeStr,
        title_fr: prev.title_fr || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      }));
    } catch (err: any) {
      console.error('Document upload error:', err);
      setUploadError(err.message || 'Impossible de téléverser le document.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_fr?.trim()) {
      alert('Veuillez renseigner le titre du document.');
      return;
    }

    const fileUrl = (form.file_url || '').trim();
    if (!fileUrl || fileUrl === '#') {
      alert(
        sourceType === 'upload'
          ? 'Veuillez téléverser un fichier avant d’enregistrer.'
          : 'Veuillez renseigner une URL valide vers le document externe.'
      );
      return;
    }

    if (sourceType === 'external' && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      alert('L’URL externe doit commencer par http:// ou https://');
      return;
    }

    const slug =
      form.slug?.trim() ||
      form.title_fr
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        Date.now().toString().slice(-4);

    const payload: InstitutionalDoc = {
      id: editingDoc?.id || 'doc-' + Date.now(),
      slug,
      title_fr: form.title_fr.trim(),
      title_en: (form.title_en || form.title_fr).trim(),
      category: (form.category as DocumentCategory) || 'institutional_document',
      description_fr: form.description_fr || '',
      description_en: form.description_en || form.description_fr || '',
      file_url: fileUrl,
      file_size: form.file_size || (sourceType === 'external' ? 'Lien externe' : '1.0 Mo'),
      publication_year: Number(form.publication_year) || new Date().getFullYear(),
      is_public: Boolean(form.is_public),
    };

    try {
      await supabaseStore.saveDocument(payload);
      await loadData();
      setModalOpen(false);
    } catch (err: any) {
      alert(`Erreur d'enregistrement : ${err.message || "Impossible d'enregistrer le document dans Supabase"}`);
    }
  };

  const handleTogglePublic = async (doc: InstitutionalDoc) => {
    try {
      const updated = { ...doc, is_public: !doc.is_public };
      await supabaseStore.saveDocument(updated);
      await loadData();
    } catch (err: any) {
      alert(`Erreur de modification du statut : ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await supabaseStore.deleteDocument(docToDelete.id);
      await loadData();
      setDeleteConfirmOpen(false);
      setDocToDelete(null);
    } catch (err: any) {
      alert(`Erreur de suppression : ${err.message || "Impossible de supprimer le document dans Supabase"}`);
    }
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        doc.title_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.title_en && doc.title_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.description_fr && doc.description_fr.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

      // Status
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'public' && doc.is_public) ||
        (statusFilter === 'draft' && !doc.is_public);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [docs, searchQuery, categoryFilter, statusFilter]);

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Documents & Publications"
        subtitle="Rapports d’activités, statuts, chartes, études, TDR et publications officielles d’APS-BÉNIN"
        actionButton={
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Nouveau Document</span>
          </button>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
        {/* Toolbar: Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par titre ou mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-[#92278F] outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-2 text-xs rounded-lg border border-gray-200 bg-white outline-none"
              >
                <option value="all">Toutes les catégories</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label_fr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Tous ({docs.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('public')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  statusFilter === 'public' ? 'bg-white text-green-700 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Publics ({docs.filter((d) => d.is_public).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                  statusFilter === 'draft' ? 'bg-white text-amber-700 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Non publiés ({docs.filter((d) => !d.is_public).length})
              </button>
            </div>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            {filteredDocs.length} document{filteredDocs.length > 1 ? 's' : ''} affiché{filteredDocs.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Documents Cards Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-[#92278F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500">Chargement des documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-800 mb-1">Aucun document trouvé</h3>
            <p className="text-xs text-gray-500 mb-4">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Aucun résultat pour les critères de filtre sélectionnés.'
                : 'Commencez par ajouter votre premier document institutionnel.'}
            </p>
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => {
              const catMeta = getCategoryMeta(doc.category);
              const fmt = detectDocFormat(doc.file_url);

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                    doc.is_public
                      ? 'border-gray-200 hover:border-[#92278F]'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div>
                    {/* Header: Category, Year, Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#92278F] border border-purple-100 truncate max-w-[200px]">
                        {catMeta.label_fr}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-gray-400">
                          {doc.publication_year}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTogglePublic(doc)}
                          title={doc.is_public ? 'Document public (cliquer pour masquer)' : 'Document masqué (cliquer pour publier)'}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            doc.is_public
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {doc.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{doc.is_public ? 'Public' : 'Masqué'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-gray-900 font-heading mb-2 leading-snug line-clamp-2">
                      {doc.title_fr}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                      {doc.description_fr || <span className="italic text-gray-400">Aucune description</span>}
                    </p>
                  </div>

                  {/* Footer: Format badge, size & Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${fmt.color}`}>
                        {fmt.format}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono truncate">
                        {doc.file_size || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {doc.file_url && doc.file_url !== '#' && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-purple-50 text-[#92278F] transition-colors"
                          title="Consulter le fichier"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="p-1.5 rounded hover:bg-purple-50 text-[#92278F] transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDocToDelete(doc);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Création / Édition */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <h3 className="font-bold text-base text-gray-900 font-heading">
                    {editingDoc ? 'Modifier le document' : 'Ajouter un document'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Gestion centralisée : fichier Supabase Storage ou lien externe
                  </p>
                </div>
                <button onClick={() => setModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* 1. Titre FR & EN */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Titre officiel du document *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title_fr || ''}
                    onChange={(e) => setForm({ ...form, title_fr: e.target.value })}
                    placeholder="Ex: Rapport Annuel d'Activités et d'Impact 2025"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Titre en anglais (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.title_en || ''}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    placeholder="Ex: Annual Activities and Impact Report 2025"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] outline-none"
                  />
                </div>

                {/* 2. Catégorie & Année */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Catégorie documentaire *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none bg-white font-medium"
                    >
                      {DOCUMENT_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label_fr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Année de publication / du document
                    </label>
                    <input
                      type="number"
                      value={form.publication_year || new Date().getFullYear()}
                      onChange={(e) => setForm({ ...form, publication_year: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* 3. Statut de visibilité */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-gray-800">
                      Visibilité publique
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      {form.is_public
                        ? 'Le document est accessible sur la page publique des documents.'
                        : 'Le document est restreint à l’administration (non visible au public).'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_public: !form.is_public })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      form.is_public ? 'bg-[#92278F]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        form.is_public ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Source du document (Fichier hébergé vs Lien externe) */}
                <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">
                      Source du document *
                    </span>
                    <div className="flex items-center bg-white p-0.5 rounded-lg border border-purple-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setSourceType('upload')}
                        className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                          sourceType === 'upload'
                            ? 'bg-[#92278F] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Fichier hébergé (Supabase)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSourceType('external')}
                        className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                          sourceType === 'external'
                            ? 'bg-[#92278F] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Lien externe</span>
                      </button>
                    </div>
                  </div>

                  {sourceType === 'upload' ? (
                    <div className="space-y-2">
                      {/* Upload Box */}
                      <div className="border-2 border-dashed border-purple-200 hover:border-[#92278F] rounded-xl p-4 text-center bg-white transition-colors">
                        {uploading ? (
                          <div className="py-4 space-y-2">
                            <div className="w-6 h-6 border-2 border-[#92278F] border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs font-medium text-gray-600">
                              Téléversement vers Supabase Storage (bucket documents)...
                            </p>
                          </div>
                        ) : form.file_url && form.file_url !== '#' ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2.5 bg-purple-50/60 rounded-lg border border-purple-100 text-left">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileCheck className="w-6 h-6 text-[#92278F] shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {selectedFileName || 'Fichier associé'}
                                  </p>
                                  <p className="text-[10px] text-gray-500 font-mono truncate">
                                    {form.file_size} • {form.file_url}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={form.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded bg-white hover:bg-purple-100 border border-purple-200 text-[#92278F] text-[11px] font-bold flex items-center gap-1 shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Voir</span>
                              </a>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                              <label className="cursor-pointer text-[11px] font-bold text-[#92278F] hover:underline flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                <span>Remplacer le fichier</span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                              <span className="text-gray-300">|</span>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, file_url: '', file_size: '' })}
                                className="text-[11px] font-bold text-red-600 hover:underline"
                              >
                                Retirer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3">
                            <Upload className="w-8 h-8 text-[#92278F] mx-auto mb-2 opacity-80" />
                            <p className="text-xs font-bold text-gray-800 mb-0.5">
                              Cliquez pour sélectionner un document
                            </p>
                            <p className="text-[11px] text-gray-500 mb-3">
                              Formats acceptés : PDF, Word (doc/docx), Excel (xls/xlsx), PowerPoint (ppt/pptx) • Max 25 Mo
                            </p>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                              <Upload className="w-3.5 h-3.5 text-[#FF8C00]" />
                              <span>Choisir un fichier</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {uploadError && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Lien externe du document (Google Drive, OneDrive, lien direct) *
                        </label>
                        <input
                          type="url"
                          required={sourceType === 'external'}
                          value={form.file_url || ''}
                          onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                          placeholder="https://drive.google.com/file/d/... ou https://..."
                          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Format / Libellé taille
                          </label>
                          <input
                            type="text"
                            value={form.file_size || ''}
                            onChange={(e) => setForm({ ...form, file_size: e.target.value })}
                            placeholder="Ex: Lien Google Drive ou 14.5 Mo"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 outline-none"
                          />
                        </div>
                        <div className="flex items-end">
                          <p className="text-[11px] text-gray-500 pb-2">
                            Idéal pour les rapports volumineux ou partages institutionnels.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Description FR */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description ou résumé du document
                  </label>
                  <textarea
                    rows={3}
                    value={form.description_fr || ''}
                    onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                    placeholder="Synthèse du contenu, objectifs ou public cible..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] outline-none"
                  />
                </div>

                {/* 6. Description EN (optionnelle) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description en anglais (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={form.description_en || ''}
                    onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                    placeholder="Summary in English..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:border-[#92278F] outline-none"
                  />
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Les modifications sont enregistrées immédiatement dans Supabase.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-5 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                    >
                      Enregistrer le document
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmation de suppression */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Supprimer ce document ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le document « ${docToDelete?.title_fr} » du répertoire d’APS-BÉNIN ? Cette action retirera son association du site.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </main>
    </AdminAuthGuard>
  );
}
