'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { PartnerItem } from '@/types';
import { ExternalLink, Handshake, ShieldCheck, Building2 } from 'lucide-react';

export default function PartenairesPage() {
  const { language, t } = useLanguage();
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');

  useEffect(() => {
    supabaseStore.getPartners().then((res) => {
      setPartners(res.filter((p) => p.is_active));
    });
  }, []);

  const filtered = selectedCat === 'all'
    ? partners
    : partners.filter((p) => p.category === selectedCat);

  const getCategoryLabel = (cat: PartnerItem['category']) => {
    switch (cat) {
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
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Synergy & Trust' : 'Synergie & Confiance'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Our Institutional & Technical Partners' : 'Nos Partenaires & Alliances'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'State institutions, municipal authorities, international donors and civil society networks advancing our mission.'
                : 'Institutions étatiques, municipalités décentralisées, partenaires techniques, bailleurs et coalitions engagés à nos côtés.'}
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-6 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedCat === 'all'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('common.filter_all')} ({partners.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCat('institutional')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedCat === 'institutional'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('partners.type_institutional')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCat('technical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedCat === 'technical'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('partners.type_technical')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCat('network_coalition')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedCat === 'network_coalition'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('partners.type_network')}
            </button>
          </div>
        </section>

        {/* Partners Directory Grid */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-md bg-white flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      {item.logo ? (
                        <div className="w-20 h-16 rounded-xl bg-white border border-gray-200/90 p-2 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-purple-200 transition-colors">
                          <img
                            src={item.logo}
                            alt={`Logo ${item.name}`}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-[#92278F] shadow-2xs">
                          <Building2 className="w-7 h-7 stroke-[1.75]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#92278F] uppercase tracking-wider block">
                          {getCategoryLabel(item.category)}
                        </span>
                        <h2 className="font-bold text-base text-gray-900 font-heading leading-snug">
                          {item.name}
                        </h2>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                      {language === 'en' ? item.description_en : item.description_fr}
                    </p>

                    <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 text-xs">
                      <strong className="text-[#92278F] block mb-0.5">Domaine de coopération :</strong>
                      <span className="text-gray-700">
                        {language === 'en' ? item.collaboration_scope_en : item.collaboration_scope_fr}
                      </span>
                    </div>
                  </div>

                  {item.website_url && (
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <a
                        href={item.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8C00] hover:underline"
                      >
                        <span>Visiter le site officiel</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
