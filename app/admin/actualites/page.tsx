'use client';

import React, { useEffect, useState } from 'react';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { supabaseStore } from '@/lib/supabase';
import { NewsItem, NewsStatus } from '@/types';
import { ImagePickerField, MultiImageGalleryField } from '@/components/admin/MediaSelectorModal';
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
} from 'lucide-react';

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);

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
    main_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
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
      main_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_fr || !form.slug) {
      alert('Veuillez renseigner le titre en français et le slug de l’article.');
      return;
    }

    const payload: NewsItem = {
      id: editingNews?.id || 'news-' + Date.now(),
      slug: form.slug!,
      title_fr: form.title_fr || '',
      title_en: form.title_en || form.title_fr || '',
      summary_fr: form.summary_fr || '',
      summary_en: form.summary_en || form.summary_fr || '',
      content_fr: form.content_fr || '',
      content_en: form.content_en || form.content_fr || '',
      author: form.author || 'Cellule Communication APS-BÉNIN',
      category_fr: form.category_fr || 'Actualité',
      category_en: form.category_en || 'News',
      main_image: form.main_image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
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

  const filtered = news.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title_fr.toLowerCase().includes(q) || item.slug.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminAuthGuard>
      <AdminHeader
        title="Gestion des Actualités (CMS)"
        subtitle="Rédigez, publiez et archivez les articles et communiqués d’APS-BÉNIN"
        actionButton={
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>Rédiger un Article</span>
          </button>
        }
      />

      <main className="p-6 space-y-6 max-w-7xl">
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

        {/* News Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Date de parution</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
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
                ))}
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

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                       Lien Vidéo YouTube (optionnel)
                    </label>
                    <input
                      type="text"
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
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

                {/* Content FR & EN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Contenu complet (Français)
                    </label>
                    <textarea
                      rows={8}
                      value={form.content_fr}
                      onChange={(e) => setForm({ ...form, content_fr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Full Content (English)
                    </label>
                    <textarea
                      rows={8}
                      value={form.content_en}
                      onChange={(e) => setForm({ ...form, content_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#92278F] outline-none"
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
                    className="px-5 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold shadow-xs"
                  >
                    {editingNews ? 'Enregistrer les modifications' : 'Publier l’article'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          title="Supprimer cet article ?"
          message={`Êtes-vous sûr de vouloir supprimer définitivement l’article « ${newsToDelete?.title_fr} » ?`}
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
