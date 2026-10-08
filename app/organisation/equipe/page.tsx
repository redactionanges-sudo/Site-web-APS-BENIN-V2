'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { TeamMember } from '@/types';
import { UserCheck, Award, User } from 'lucide-react';

export default function EquipePage() {
  const { language } = useLanguage();
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    supabaseStore.getTeam().then((res) => {
      setTeam(res.filter((m) => m.is_active));
    });
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
              {language === 'en' ? 'Our Human Capital' : 'Notre Capital Humain'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'The Executive & Field Team' : 'Équipe Exécutive & Opérationnelle'}
            </h1>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
              {language === 'en'
                ? 'Dedicated professionals bringing expertise, proximity, and unwavering passion to community development.'
                : "Des professionnelles et professionnels dévoués alliant expertise technique, humanisme et proximité constante sur le terrain."}
            </p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200/90 hover:border-[#92278F] transition-all hover:shadow-lg flex flex-col group"
                >
                  {member.photo ? (
                    <div className="relative h-72 w-full overflow-hidden bg-gray-100">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="relative h-72 w-full overflow-hidden bg-gradient-to-br from-purple-50 via-gray-50 to-purple-100 flex flex-col items-center justify-center text-[#92278F] p-6 border-b border-gray-100">
                      <div className="w-20 h-20 rounded-full bg-white shadow-2xs border border-purple-200/80 flex items-center justify-center mb-3">
                        <User className="w-10 h-10 text-[#92278F] stroke-[1.5]" />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        APS-BÉNIN
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 font-heading mb-1">
                        {member.name}
                      </h3>
                      <p className="text-xs font-bold text-[#92278F] uppercase tracking-wide mb-3">
                        {language === 'en' ? member.role_en : member.role_fr}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-4">
                        {language === 'en' ? member.bio_en : member.bio_fr}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                        <Award className="w-3.5 h-3.5 text-[#FF8C00] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {language === 'en' ? member.expertise_en : member.expertise_fr}
                        </span>
                      </div>
                    </div>
                  </div>
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
