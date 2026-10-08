'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { ProjectItem } from '@/types';
import { Search, MapPin, Calendar, ArrowRight, Filter } from 'lucide-react';

export default function ProjetsPage() {
  const { language, t } = useLanguage();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    supabaseStore.getProjects().then(setProjects);
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const title = (language === 'en' ? p.title_en : p.title_fr).toLowerCase();
    const excerpt = (language === 'en' ? p.excerpt_en : p.excerpt_fr).toLowerCase();
    const communes = p.communes.join(' ').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || title.includes(query) || excerpt.includes(query) || communes.includes(query);
    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#FF8C00] text-white">
            {t('projects.status_in_progress')}
          </span>
        );
      case 'completed':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-green-700 text-white">
            {t('projects.status_completed')}
          </span>
        );
      case 'upcoming':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#92278F] text-white">
            {t('projects.status_upcoming')}
          </span>
        );
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
              {language === 'en' ? 'Field Initiatives' : 'Initiatives de Terrain'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Our Projects & Interventions' : 'Nos Projets & Réalisations'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'Discover our completed and ongoing projects transforming lives across the Mono department and Benin.'
                : 'Découvrez nos projets en cours, achevés et à venir pour l’autonomisation, la santé reproductive et les droits humains.'}
            </p>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="py-8 bg-purple-50/25 backdrop-blur-xs border-b border-purple-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[#92278F] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('common.filter_all')} ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'in_progress'
                    ? 'bg-[#FF8C00] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('projects.status_in_progress')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-green-700 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('projects.status_completed')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'upcoming'
                    ? 'bg-[#92278F] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('projects.status_upcoming')}
              </button>
            </div>

            {/* Search Input */}
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

        {/* Projects Grid */}
        <section className="py-16 bg-white/75 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-base text-gray-600 font-medium">
                  {language === 'en'
                    ? 'No projects matching your current filter criteria.'
                    : 'Aucun projet ne correspond à vos critères de recherche actuels.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-bold"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((proj) => (
                  <article
                    key={proj.id}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-lg flex flex-col group"
                  >
                    <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                      <img
                        src={proj.main_image || 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80'}
                        alt={language === 'en' ? proj.title_en : proj.title_fr}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        {getStatusBadge(proj.status)}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
                            <span>{proj.communes.join(', ')}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#92278F]" />
                            <span>{proj.period}</span>
                          </span>
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#92278F] transition-colors font-heading line-clamp-2 leading-snug mb-3">
                          {language === 'en' ? proj.title_en : proj.title_fr}
                        </h2>

                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                          {language === 'en' ? proj.excerpt_en : proj.excerpt_fr}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          {proj.duration}
                        </span>

                        <Link
                          href={`/projets/${proj.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#92278F] group-hover:text-[#FF8C00] transition-colors"
                        >
                          <span>{t('projects.details_btn')}</span>
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
