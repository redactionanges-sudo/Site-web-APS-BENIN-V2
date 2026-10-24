'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { OpportunityItem } from '@/types';
import { ArrowRight, Clock, MapPin, Briefcase } from 'lucide-react';

export const OpenOpportunities: React.FC = () => {
  const { language, t } = useLanguage();
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);

  useEffect(() => {
    supabaseStore.getOpportunities().then((items) => {
      // Prioritize open opportunities
      const open = items.filter((o) => o.status === 'open').slice(0, 3);
      setOpportunities(open.length > 0 ? open : items.slice(0, 3));
    });
  }, []);

  const getTypeLabel = (type: OpportunityItem['type']) => {
    switch (type) {
      case 'recruitment':
        return t('opp.type_recruitment');
      case 'internship':
        return t('opp.type_internship');
      case 'volunteering':
        return t('opp.type_volunteering');
      case 'call_for_tenders':
        return t('opp.type_tenders');
      case 'consultation':
        return t('opp.type_consultation');
      default:
        return 'Opportunité';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section className="py-20 bg-white/70 backdrop-blur-xs border-b border-purple-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#92278F]">
              {t('opp.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 font-heading">
              {t('opp.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {t('opp.subtitle')}
            </p>
          </div>

          <Link
            href="/opportunites"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#92278F] hover:text-[#741772] transition-colors self-start md:self-end"
          >
            <span>{t('opp.view_all')}</span>
            <ArrowRight className="w-4 h-4 text-[#FF8C00]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-6 rounded-2xl border border-gray-200/90 hover:border-[#92278F] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-50 text-[#92278F] border border-purple-100 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {getTypeLabel(opp.type)}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      opp.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {opp.status === 'open' ? t('opp.status_open') : t('opp.status_closed')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#92278F] transition-colors font-heading mb-3 line-clamp-2 leading-snug">
                  {language === 'en' ? opp.title_en : opp.title_fr}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                  {language === 'en' ? opp.description_en : opp.description_fr}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
                    <span className="line-clamp-1">{language === 'en' ? opp.location_en : opp.location_fr}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#92278F]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(opp.deadline)}</span>
                  </span>
                </div>

                <Link
                  href={`/opportunites/${opp.slug}`}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-50 hover:bg-[#92278F] text-gray-700 hover:text-white text-xs font-bold transition-colors"
                >
                  <span>{language === 'en' ? 'View details & apply' : 'Voir les détails & postuler'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
