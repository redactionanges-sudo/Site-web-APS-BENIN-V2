'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { GovernanceMember } from '@/types';
import { ShieldCheck, CheckCircle2, Users } from 'lucide-react';

export default function GouvernancePage() {
  const { language } = useLanguage();
  const [governance, setGovernance] = useState<GovernanceMember[]>([]);

  useEffect(() => {
    supabaseStore.getGovernance().then(setGovernance);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Democratic Steering' : 'Pilotage Démocratique'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Governance & Leadership' : 'Gouvernance & Conseil d’Administration'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'Statutory oversight mechanisms guaranteeing transparent accountability and strategic alignment.'
                : 'Les instances statutaires garantissant la conformité, la rigueur démocratique et la pérennité stratégique.'}
            </p>
          </div>
        </section>

        {/* Governance Organs Presentation */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
            {/* 3 statutory organs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-purple-50/50 border border-purple-100">
                <span className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider">
                  Organe 1
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-heading mt-1 mb-2">
                  {language === 'en' ? 'General Assembly' : 'Assemblée Générale (AG)'}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {language === 'en'
                    ? 'Supreme decision-making organ bringing together all active members annually to approve moral, financial reports and orient strategic goals.'
                    : 'Instance souveraine réunissant annuellement l’ensemble des membres adhérents pour approuver les rapports moral et financier et définir les orientations stratégiques.'}
                </p>
              </div>

              <div className="p-6 rounded-xl bg-purple-50/50 border border-purple-100">
                <span className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider">
                  Organe 2
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-heading mt-1 mb-2">
                  {language === 'en' ? 'Board of Directors' : 'Conseil d’Administration (CA)'}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {language === 'en'
                    ? 'Elected by the General Assembly to oversee organizational strategy, fiduciary integrity, and executive alignment.'
                    : 'Élu par l’AG, il impulse les politiques générales, veille à l’application des résolutions et supervise la direction exécutive.'}
                </p>
              </div>

              <div className="p-6 rounded-xl bg-purple-50/50 border border-purple-100">
                <span className="text-xs font-bold text-[#FF8C00] uppercase tracking-wider">
                  Organe 3
                </span>
                <h3 className="text-lg font-bold text-gray-900 font-heading mt-1 mb-2">
                  {language === 'en' ? 'Supervisory Committee' : 'Comité de Surveillance (CS)'}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {language === 'en'
                    ? 'Independent statutory body conducting periodic internal audits and safeguarding statutory and financial ethics.'
                    : 'Organe autonome de contrôle interne et de vérification des comptes, garant de l’orthodoxie financière et des statuts.'}
                </p>
              </div>
            </div>

            {/* Governance Members Cards */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 font-heading mb-8">
                {language === 'en' ? 'Members of the Board & Committee' : 'Membres du Conseil et des Organes de Contrôle'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {governance.map((m) => (
                  <div
                    key={m.id}
                    className="p-6 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-purple-100 text-[#92278F]">
                          {language === 'en' ? m.title_en : m.title_fr}
                        </span>
                        <span className="text-xs font-mono text-gray-400 uppercase">
                          {m.organ.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">
                        {m.name}
                      </h3>

                      <p className="text-sm font-semibold text-[#FF8C00] mb-3">
                        {language === 'en' ? m.role_en : m.role_fr}
                      </p>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {language === 'en' ? m.bio_en : m.bio_fr}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
