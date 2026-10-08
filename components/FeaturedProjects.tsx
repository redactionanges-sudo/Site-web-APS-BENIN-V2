'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { ProjectItem } from '@/types';
import { ArrowRight, MapPin, Calendar } from 'lucide-react';

export const FeaturedProjects: React.FC = () => {
  const { language, t } = useLanguage();
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    supabaseStore.getProjects().then((items) => {
      const featured = items.filter((p) => p.is_featured);
      setProjects(featured.length > 0 ? featured.slice(0, 3) : items.slice(0, 3));
    });
  }, []);

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
    <section className="py-20 bg-white/70 backdrop-blur-xs border-b border-purple-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#92278F]">
              {t('projects.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 font-heading">
              {t('projects.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {t('projects.subtitle')}
            </p>
          </div>

          <Link
            href="/projets"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#92278F] hover:text-[#741772] transition-colors self-start md:self-end"
          >
            <span>{t('projects.view_all')}</span>
            <ArrowRight className="w-4 h-4 text-[#FF8C00]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((proj, idx) => (
            <motion.article
              key={proj.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-xl flex flex-col group hover:-translate-y-1"
            >
              {/* Main Image with Status Badge and smooth zoom on hover */}
              <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                <img
                  src={proj.main_image || 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80'}
                  alt={language === 'en' ? proj.title_en : proj.title_fr}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  {getStatusBadge(proj.status)}
                </div>
              </div>

              {/* Content body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Meta items */}
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

                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#92278F] transition-colors font-heading line-clamp-2 leading-snug mb-3">
                    {language === 'en' ? proj.title_en : proj.title_fr}
                  </h3>

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
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
