'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage, getLocalizedText } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { ProjectItem } from '@/types';
import { Search, MapPin, Calendar, ArrowRight, Filter, Zap, FolderKanban, Users } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function ProjetsPage() {
  const { language, t } = useLanguage();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'project' | 'activity'>('all');

  useEffect(() => {
    supabaseStore.getProjects().then(setProjects);
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'activity' ? p.publication_type === 'activity' : p.publication_type !== 'activity');
    const title = (language === 'en' ? p.title_en : p.title_fr).toLowerCase();
    const excerpt = (language === 'en' ? p.excerpt_en : p.excerpt_fr).toLowerCase();
    const communes = p.communes.join(' ').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = !query || title.includes(query) || excerpt.includes(query) || communes.includes(query);
    return matchesStatus && matchesType && matchesQuery;
  });

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#FF8C00] text-white shadow-2xs">
            {t('projects.status_in_progress')}
          </span>
        );
      case 'completed':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-green-700 text-white shadow-2xs">
            {t('projects.status_completed')}
          </span>
        );
      case 'upcoming':
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#92278F] text-white shadow-2xs">
            {t('projects.status_upcoming')}
          </span>
        );
    }
  };

  const projectCount = projects.filter((p) => p.publication_type !== 'activity').length;
  const activityCount = projects.filter((p) => p.publication_type === 'activity').length;

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Field Initiatives & Actions' : 'Initiatives & Actions de Terrain'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Projects & Key Activities' : 'Nos Projets & Activités Phares'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'Discover our multi-year institutional projects and on-the-ground flagship activities empowering communities across Benin.'
                : 'Découvrez nos projets institutionnels pluriannuels et nos activités phares de terrain pour l’autonomisation, la santé reproductive et les droits humains.'}
            </p>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="py-6 bg-purple-50/25 backdrop-blur-xs border-b border-purple-100/60 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Type Switcher Tabs */}
              <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-white shadow-2xs w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === 'all'
                      ? 'bg-[#92278F] text-white shadow-xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {language === 'en' ? 'All Content' : 'Tous les contenus'} ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('project')}
                  className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    typeFilter === 'project'
                      ? 'bg-[#92278F] text-white shadow-xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FolderKanban className="w-4 h-4 text-purple-200" />
                  <span>{language === 'en' ? 'Projects' : 'Projets'} ({projectCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('activity')}
                  className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    typeFilter === 'activity'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-200" />
                  <span>{language === 'en' ? 'Flagship Activities' : 'Activités phares'} ({activityCount})</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'en' ? 'Search by title, commune...' : 'Rechercher par titre, commune...'}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-800 shadow-2xs"
                />
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-100/60">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                {language === 'en' ? 'Status:' : 'Statut :'}
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('common.filter_all')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'in_progress'
                    ? 'bg-[#FF8C00] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('projects.status_in_progress')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('projects.status_completed')}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === 'upcoming'
                    ? 'bg-[#92278F] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t('projects.status_upcoming')}
              </button>

              {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSearchQuery('');
                  }}
                  className="ml-auto text-xs text-[#92278F] font-bold hover:underline"
                >
                  {language === 'en' ? 'Clear all filters' : 'Effacer les filtres'}
                </button>
              )}
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
                    ? 'No initiatives matching your current filter criteria.'
                    : 'Aucun contenu ne correspond à vos critères de recherche actuels.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-bold"
                >
                  {language === 'en' ? 'Reset filters' : 'Réinitialiser les filtres'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((proj) => {
                  const isActivity = proj.publication_type === 'activity';

                  return (
                    <article
                      key={proj.id}
                      className={`bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-xl flex flex-col group ${
                        isActivity ? 'border-amber-200 hover:border-amber-400' : 'border-gray-200 hover:border-[#92278F]'
                      }`}
                    >
                      <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                        <OptimizedImage
                          src={proj.main_image}
                          alt={getLocalizedText(proj.title_fr, proj.title_en, language)}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
                          {isActivity ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500 text-white shadow-2xs">
                              <Zap className="w-3 h-3" />
                              <span>{language === 'en' ? 'Activity' : 'Activité'}</span>
                              {proj.activity_category && <span>• {proj.activity_category}</span>}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded bg-[#92278F] text-white shadow-2xs">
                              <FolderKanban className="w-3 h-3" />
                              <span>{language === 'en' ? 'Project' : 'Projet'}</span>
                            </span>
                          )}
                          {getStatusBadge(proj.status)}
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Parent Project link if activity */}
                          {isActivity && (proj.related_project_title || proj.related_project_id) && (
                            <div className="mb-2.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-[#92278F] text-[11px] font-bold border border-purple-100 line-clamp-1">
                                <span>↳ {language === 'en' ? 'Linked Project:' : 'Rattachée à :'}</span>
                                <span className="font-semibold">{proj.related_project_title || 'Projet cadre'}</span>
                              </span>
                            </div>
                          )}

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
                            {getLocalizedText(proj.title_fr, proj.title_en, language)}
                          </h2>

                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                            {getLocalizedText(proj.excerpt_fr, proj.excerpt_en, language)}
                          </p>

                          {/* Extra info for activity */}
                          {isActivity && proj.participants_count && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 mb-3 font-semibold">
                              <Users className="w-3.5 h-3.5 text-amber-600" />
                              <span>{proj.participants_count}</span>
                            </div>
                          )}
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
