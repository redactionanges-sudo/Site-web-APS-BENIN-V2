'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { DomainOfIntervention } from '@/types';
import {
  ShieldCheck,
  TrendingUp,
  HeartPulse,
  AlertCircle,
  Scale,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-8 h-8 text-[#92278F]" />,
  TrendingUp: <TrendingUp className="w-8 h-8 text-[#92278F]" />,
  HeartPulse: <HeartPulse className="w-8 h-8 text-[#92278F]" />,
  AlertCircle: <AlertCircle className="w-8 h-8 text-[#92278F]" />,
  Scale: <Scale className="w-8 h-8 text-[#92278F]" />,
  Users: <Users className="w-8 h-8 text-[#92278F]" />,
  Award: <Award className="w-8 h-8 text-[#92278F]" />,
};

export default function DomainesPage() {
  const { language } = useLanguage();
  const [domains, setDomains] = useState<DomainOfIntervention[]>([]);

  useEffect(() => {
    supabaseStore.getDomains().then((res) => {
      setDomains(res.filter((d) => d.is_active));
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Pillars of Action' : "Piliers d'Action"}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Our Areas of Intervention' : "Nos Domaines d'Intervention"}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'Comprehensive, multidimensional programs designed to address systemic inequalities and uplift vulnerable communities.'
                : 'Des programmes structurants et multidimensionnels pour briser les inégalités et autonomiser durablement les communautés.'}
            </p>
          </div>
        </section>

        {/* Domains List */}
        <section className="py-20 bg-purple-50/20 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
            {domains.map((dom, index) => (
              <div
                key={dom.id}
                id={dom.slug}
                className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-200/90 shadow-xs hover:border-[#92278F] transition-all scroll-mt-28"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      {iconMap[dom.icon_name] || <ShieldCheck className="w-8 h-8 text-[#92278F]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider">
                          Axe {index + 1}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                        {language === 'en' ? dom.title_en : dom.title_fr}
                      </h2>
                      <p className="text-sm font-semibold text-gray-500 mt-1 italic">
                        {language === 'en' ? dom.short_desc_en : dom.short_desc_fr}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/projets`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 hover:bg-[#92278F] text-[#92278F] hover:text-white text-xs font-bold transition-colors shrink-0 self-start"
                  >
                    <span>{language === 'en' ? 'Related projects' : 'Projets associés'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-700 leading-relaxed">
                  <p>{language === 'en' ? dom.full_desc_en : dom.full_desc_fr}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
