'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage, getLocalizedText } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { NewsItem } from '@/types';
import { ArrowRight, Calendar, User, Eye, Heart } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';

export const LatestNews: React.FC = () => {
  const { language, t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    supabaseStore.getNews().then((items) => {
      setNews(items.filter((n) => n.status === 'published').slice(0, 3));
    });
  }, []);

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
    <section className="py-20 bg-purple-50/20 backdrop-blur-xs border-t border-b border-purple-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#92278F]">
              {t('news.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 font-heading">
              {t('news.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {t('news.subtitle')}
            </p>
          </div>

          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#92278F] hover:text-[#741772] transition-colors self-start md:self-end"
          >
            <span>{t('news.view_all')}</span>
            <ArrowRight className="w-4 h-4 text-[#FF8C00]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200/90 hover:border-[#92278F] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col group"
            >
              <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                <OptimizedImage
                  src={item.main_image}
                  alt={language === 'en' ? item.title_en : item.title_fr}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#92278F] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-xs z-10">
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

                  <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#92278F] transition-colors font-heading line-clamp-2 leading-snug mb-2">
                    {getLocalizedText(item.title_fr, item.title_en, language)}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {getLocalizedText(item.summary_fr, item.summary_en, language)}
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

                  <div className="flex items-center gap-2.5 text-[11px] text-gray-400 font-semibold">
                    <span className="flex items-center gap-1" title={`${item.views_count || 120} vues`}>
                      <Eye className="w-3 h-3 text-gray-400" />
                      <span>{item.views_count || 120}</span>
                    </span>
                    <span className="flex items-center gap-1 text-rose-500/80" title={`${item.likes_count || 18} mentions j'aime`}>
                      <Heart className="w-3 h-3 fill-rose-500/80 text-rose-500/80" />
                      <span>{item.likes_count || 18}</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
