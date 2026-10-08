'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const CallToAction: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#92278F] via-[#741772] to-gray-950 text-white py-16 sm:py-20">
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#FF8C00]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-orange-300 border border-white/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Agissons ensemble • Comè & Bénin</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight max-w-3xl mx-auto">
          {t('cta.title')}
        </h2>

        <p className="text-base sm:text-lg text-purple-100 max-w-2xl mx-auto font-normal">
          {t('cta.subtitle')}
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF8C00] hover:bg-[#e07b00] text-white font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <Mail className="w-4 h-4" />
            <span>{t('cta.btn_contact')}</span>
          </Link>

          <Link
            href="/projets"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium transition-all border border-white/30"
          >
            <span>{t('cta.btn_projects')}</span>
            <ArrowRight className="w-4 h-4 text-[#FF8C00]" />
          </Link>
        </div>
      </div>
    </section>
  );
};
