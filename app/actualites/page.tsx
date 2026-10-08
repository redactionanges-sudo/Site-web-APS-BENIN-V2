'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { Search, Calendar, User, ArrowRight, Tag } from 'lucide-react';

export default function ActualitesPage() {
  const { language, t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    supabaseStore.getNews().then((items) => {
      setNews(items.filter((n) => n.status === 'published'));
    });
  }, []);

  const categories = Array.from(
    new Set(news.map((n) => (language === 'en' ? n.category_en : n.category_fr)))
  );

  const filteredNews = news.filter((n) => {
    const currentCat = language === 'en' ? n.category_en : n.category_fr;
    const matchesCat = categoryFilter === 'all' || currentCat === categoryFilter;
    const title = (language === 'en' ? n.title_en : n.title_fr).toLowerCase();
    const summary = (language === 'en' ? n.summary_en : n.summary_fr).toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || title.includes(q) || summary.includes(q);
    return matchesCat && matchesSearch;
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Information & Field Voice' : 'Information & Voix du Terrain'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'News & Press Releases' : 'Actualités & Communiqués'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'Follow our latest field missions, advocacy milestones, workshops and institutional events.'
                : 'Suivez nos actions quotidiennes, nos prises de position, nos plaidoyers et nos événements sur le terrain.'}
            </p>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="py-8 bg-purple-50/25 backdrop-blur-xs border-b border-purple-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-[#92278F] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('common.filter_all')} ({news.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#92278F] text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-800"
              />
            </div>
          </div>
        </section>

        {/* News Grid */}
        <section className="py-16 bg-white/75 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {filteredNews.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-base text-gray-600 font-medium">
                  {language === 'en'
                    ? 'No news articles matching your search criteria.'
                    : 'Aucun article ne correspond à votre recherche.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNews.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-lg flex flex-col group"
                  >
                    <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                      <img
                        src={item.main_image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'}
                        alt={language === 'en' ? item.title_en : item.title_fr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-[#92278F] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-xs">
                        {language === 'en' ? item.category_en : item.category_fr}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#FF8C00]" />
                            <span>{formatDate(item.published_at)}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 line-clamp-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{item.author}</span>
                          </span>
                        </div>

                        <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#92278F] transition-colors font-heading line-clamp-2 leading-snug mb-2">
                          {language === 'en' ? item.title_en : item.title_fr}
                        </h2>

                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                          {language === 'en' ? item.summary_en : item.summary_fr}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                        <Link
                          href={`/actualites/${item.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#92278F] group-hover:text-[#FF8C00] transition-colors"
                        >
                          <span>{t('news.read_more')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
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
