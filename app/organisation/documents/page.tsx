'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { InstitutionalDoc } from '@/types';
import {
  DOCUMENT_CATEGORIES,
  getCategoryMeta,
  detectDocFormat,
} from '@/lib/document-categories';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  Eye,
  FileCheck,
  FolderOpen,
} from 'lucide-react';

export default function DocumentsPage() {
  const { language, t } = useLanguage();
  const [docs, setDocs] = useState<InstitutionalDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    supabaseStore.getDocuments().then((items) => {
      setDocs(items.filter((d) => d.is_public));
      setLoading(false);
    });
  }, []);

  // Extract unique available years sorted descending
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(docs.map((d) => d.publication_year).filter(Boolean)));
    return years.sort((a, b) => b - a);
  }, [docs]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        doc.title_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.title_en && doc.title_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.description_fr && doc.description_fr.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.description_en && doc.description_en.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category
      const matchesCategory =
        selectedCategory === 'all' || doc.category === selectedCategory;

      // Year
      const matchesYear =
        selectedYear === 'all' || String(doc.publication_year) === selectedYear;

      return matchesSearch && matchesCategory && matchesYear;
    });
  }, [docs, searchQuery, selectedCategory, selectedYear]);

  // Categories present in the loaded public documents
  const presentCategories = useMemo(() => {
    const usedCatIds = new Set(docs.map((d) => d.category));
    return DOCUMENT_CATEGORIES.filter((c) => usedCatIds.has(c.id));
  }, [docs]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Transparency & Accountability' : 'Transparence & Redevabilité'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Official Documents & Publications' : 'Documents Officiels & Bibliothèque'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'Statutes, annual impact reports, ethical safeguarding policies, studies, and external financial audits available for public consultation.'
                : 'Consultez et téléchargez nos statuts officiels, rapports annuels d’activités, chartes éthiques, études terrain et audits financiers certifiés.'}
            </p>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="py-6 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-4">
            {/* Top row: Search input + Year filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search by title, topic or keyword...' : 'Rechercher un document par titre, mot-clé...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:border-[#92278F] outline-none shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-3">
                {availableYears.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-500">
                      {language === 'en' ? 'Year:' : 'Année :'}
                    </span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                    >
                      <option value="all">{language === 'en' ? 'All years' : 'Toutes les années'}</option>
                      {availableYears.map((yr) => (
                        <option key={yr} value={String(yr)}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <span className="text-xs font-bold text-gray-500">
                  {filteredDocs.length} {language === 'en' ? 'document(s)' : 'document(s) disponible(s)'}
                </span>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span>{language === 'en' ? 'Categories:' : 'Catégories :'}</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#92278F] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('common.filter_all')} ({docs.length})
              </button>

              {presentCategories.map((cat) => {
                const count = docs.filter((d) => d.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#92278F] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {language === 'en' ? cat.label_en : cat.label_fr} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Documents list */}
        <section className="py-16 bg-white min-h-[450px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-3 border-[#92278F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-500">
                  {language === 'en' ? 'Loading documents...' : 'Chargement des documents...'}
                </p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-gray-50 border border-gray-200 max-w-xl mx-auto">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 font-heading mb-1">
                  {language === 'en' ? 'No document found' : 'Aucun document trouvé'}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {searchQuery || selectedCategory !== 'all' || selectedYear !== 'all'
                    ? language === 'en'
                      ? 'No document corresponds to your search criteria. Try resetting the filters.'
                      : 'Aucun document ne correspond à vos critères de recherche. Essayez de réinitialiser les filtres.'
                    : language === 'en'
                      ? 'Official publications will appear here shortly.'
                      : 'Les documents institutionnels seront publiés très prochainement.'}
                </p>
                {(searchQuery || selectedCategory !== 'all' || selectedYear !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedYear('all');
                    }}
                    className="px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors"
                  >
                    {language === 'en' ? 'Reset filters' : 'Réinitialiser les filtres'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc) => {
                  const catMeta = getCategoryMeta(doc.category);
                  const fmt = detectDocFormat(doc.file_url);
                  const isRealUrl = doc.file_url && doc.file_url !== '#';

                  return (
                    <div
                      key={doc.id}
                      className="p-6 rounded-2xl border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-md bg-white flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header: Category Badge + Year */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-purple-50 text-[#92278F] border border-purple-100 truncate max-w-[200px]">
                            {language === 'en' ? catMeta.label_en : catMeta.label_fr}
                          </span>
                          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 shrink-0 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{doc.publication_year}</span>
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-base font-bold text-gray-900 group-hover:text-[#92278F] transition-colors font-heading mb-2 leading-snug">
                          {language === 'en' ? doc.title_en || doc.title_fr : doc.title_fr}
                        </h2>

                        {/* Description */}
                        <p className="text-xs text-gray-600 leading-relaxed mb-4 line-clamp-3">
                          {language === 'en'
                            ? doc.description_en || doc.description_fr || (
                                <span className="italic text-gray-400">Official institutional document</span>
                              )
                            : doc.description_fr || (
                                <span className="italic text-gray-400">Document officiel institutionnel</span>
                              )}
                        </p>
                      </div>

                      {/* Footer: Format & Action buttons */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${fmt.color}`}>
                            {fmt.format}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono truncate">
                            {doc.file_size || '—'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isRealUrl ? (
                            <>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-purple-200 text-[#92278F] hover:bg-purple-50 text-xs font-bold transition-colors"
                                title={language === 'en' ? 'Open in new tab' : 'Consulter dans un nouvel onglet'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{language === 'en' ? 'View' : 'Consulter'}</span>
                              </a>

                              {!fmt.isExternalLink && (
                                <a
                                  href={doc.file_url}
                                  download
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-bold transition-colors shadow-2xs"
                                  title={language === 'en' ? 'Direct download' : 'Télécharger le fichier'}
                                >
                                  <Download className="w-3.5 h-3.5 text-[#FF8C00]" />
                                  <span>{t('common.download')}</span>
                                </a>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-400 italic">
                              {language === 'en' ? 'Available upon request' : 'Disponible sur demande'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
