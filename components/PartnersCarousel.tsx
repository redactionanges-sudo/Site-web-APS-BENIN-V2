'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { PartnerItem } from '@/types';
import { ArrowRight, ExternalLink, Building2 } from 'lucide-react';

export const PartnersCarousel: React.FC = () => {
  const { language, t } = useLanguage();
  const [partners, setPartners] = useState<PartnerItem[]>([]);

  useEffect(() => {
    supabaseStore.getPartners().then((list) => {
      setPartners(list.filter((p) => p.is_active));
    });
  }, []);

  const getCategoryLabel = (category: PartnerItem['category']) => {
    switch (category) {
      case 'technical':
        return t('partners.type_technical');
      case 'financial':
        return t('partners.type_financial');
      case 'institutional':
        return t('partners.type_institutional');
      case 'network_coalition':
        return t('partners.type_network');
      default:
        return 'Partenaire';
    }
  };

  return (
    <section className="py-20 bg-purple-50/20 backdrop-blur-xs border-t border-b border-purple-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#92278F]">
            {t('partners.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 font-heading">
            {t('partners.title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {t('partners.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white rounded-xl p-5 border border-gray-200/80 hover:border-[#92278F] transition-all hover:shadow-md flex flex-col items-center text-center justify-between group"
            >
              <div className="w-full h-16 rounded-lg bg-white border border-gray-100 p-2 mb-3 flex items-center justify-center group-hover:border-purple-200 transition-colors">
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105 duration-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-[#92278F] flex items-center justify-center">
                    <Building2 className="w-5 h-5 stroke-[1.75]" />
                  </div>
                )}
              </div>

              <div className="w-full">
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-[#92278F] transition-colors">
                  {partner.name}
                </h3>
                <span className="inline-block text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100">
                  {getCategoryLabel(partner.category)}
                </span>
              </div>

              {partner.website_url && (
                <a
                  href={partner.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-[11px] font-semibold text-[#FF8C00] hover:underline flex items-center gap-1"
                >
                  <span>Visiter</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/partenaires"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#92278F] hover:text-[#741772] transition-colors"
          >
            <span>{t('partners.view_all')}</span>
            <ArrowRight className="w-4 h-4 text-[#FF8C00]" />
          </Link>
        </div>
      </div>
    </section>
  );
};
