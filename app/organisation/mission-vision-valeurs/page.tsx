'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import {
  Compass,
  Eye,
  Heart,
  Scale,
  ShieldAlert,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function MissionVisionValeursPage() {
  const { language } = useLanguage();

  const values = [
    {
      title_fr: 'Justice & Équité',
      title_en: 'Justice & Equity',
      desc_fr: 'Défense inconditionnelle de l’accès équitable aux droits fondamentaux pour chaque femme, jeune fille et personne vulnérable.',
      desc_en: 'Unconditional defense of equitable access to fundamental rights for every woman, girl, and vulnerable person.',
      icon: <Scale className="w-6 h-6 text-[#92278F]" />,
    },
    {
      title_fr: 'Solidarité Agissante',
      title_en: 'Active Solidarity',
      desc_fr: 'Entraide communautaire, filets de protection pour les personnes en situation d’extrême vulnérabilité et écoute empathique.',
      desc_en: 'Community mutual aid, safety nets for persons in extreme distress, and empathetic supportive listening.',
      icon: <Heart className="w-6 h-6 text-[#FF8C00]" />,
    },
    {
      title_fr: 'Intégrité & Transparence',
      title_en: 'Integrity & Transparency',
      desc_fr: 'Gestion rigoureuse, fidélité aux engagements statutaires, tolérance zéro contre la corruption et reddition scrupuleuse des comptes.',
      desc_en: 'Rigorous management, loyalty to statutory commitments, zero tolerance for corruption, and thorough accountability.',
      icon: <CheckCircle2 className="w-6 h-6 text-[#92278F]" />,
    },
    {
      title_fr: 'Inclusion & Non-discrimination',
      title_en: 'Inclusion & Non-Discrimination',
      desc_fr: 'Refus absolu de toute stigmatisation fondée sur le sexe, l’origine sociale, la situation matrimoniale, le handicap ou l’âge.',
      desc_en: 'Absolute rejection of any discrimination based on gender, background, marital status, disability or age.',
      icon: <Users className="w-6 h-6 text-[#FF8C00]" />,
    },
    {
      title_fr: 'Courage & Engagement',
      title_en: 'Courage & Commitment',
      desc_fr: 'Détermination à dénoncer les violences basées sur le genre et à bousculer les normes coutumières discriminatoires.',
      desc_en: 'Determination to speak out against gender violence and dismantle discriminatory traditional norms.',
      icon: <ShieldAlert className="w-6 h-6 text-[#92278F]" />,
    },
    {
      title_fr: 'Autonomie & Durabilité',
      title_en: 'Autonomy & Sustainability',
      desc_fr: 'Apporter aux bénéficiaires les compétences et moyens nécessaires pour qu’ils soient acteurs de leur propre émancipation pérenne.',
      desc_en: 'Empowering beneficiaries with skills and resources so they become leaders of their own sustainable emancipation.',
      icon: <Compass className="w-6 h-6 text-[#FF8C00]" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
              {language === 'en' ? 'Institutional Identity' : 'Identité Institutionnelle'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
              {language === 'en' ? 'Mission, Vision & Values' : 'Mission, Vision & Valeurs'}
            </h1>
            <p className="text-lg text-purple-100 font-serif italic border-l-4 border-[#FF8C00] pl-4 mt-3">
              « {language === 'en' ? 'For a more just and egalitarian world' : 'Pour un monde plus juste et égalitaire'} »
            </p>
          </div>
        </section>

        {/* Mission & Vision Grid */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-20">
              {/* Mission */}
              <div className="p-8 sm:p-10 rounded-2xl bg-purple-50/60 border-2 border-purple-100 relative overflow-hidden">
                <div className="w-14 h-14 rounded-xl bg-[#92278F] text-white flex items-center justify-center mb-6 shadow-sm">
                  <Compass className="w-7 h-7 text-[#FF8C00]" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 font-heading mb-4">
                  {language === 'en' ? 'Our Mission' : 'Notre Mission'}
                </h2>
                <p className="text-base text-gray-700 leading-relaxed">
                  {language === 'en'
                    ? 'To defend human rights, advance gender justice, eradicate gender-based violence, preserve sexual and reproductive health, and build economic independence for women, girls, and vulnerable community members in Benin through proximity-driven action, legal support, and grassroots capacity building.'
                    : "Défendre les droits humains, promouvoir la justice et l’égalité de genre, éradiquer les violences basées sur le genre, préserver la santé sexuelle et reproductive et bâtir l'autonomie économique des femmes, des filles et des communautés vulnérables au Bénin à travers des actions de proximité, une assistance juridique continue et le renforcement des capacités locales."}
                </p>
              </div>

              {/* Vision */}
              <div className="p-8 sm:p-10 rounded-2xl bg-orange-50/60 border-2 border-orange-100 relative overflow-hidden">
                <div className="w-14 h-14 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center mb-6 shadow-sm">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 font-heading mb-4">
                  {language === 'en' ? 'Our Vision' : 'Notre Vision'}
                </h2>
                <p className="text-base text-gray-700 leading-relaxed">
                  {language === 'en'
                    ? 'A Benin and an African continent where every woman, young girl, and citizen lives free from violence and discrimination, actively participates in decision-making, and enjoys full economic, physical, and social autonomy in a just and equitable society.'
                    : "Un Bénin et une Afrique où chaque femme, chaque jeune fille et chaque citoyen vit à l’abri des violences et de la discrimination, participe pleinement aux décisions qui engagent la cité, et jouit d'une totale autonomie économique, physique et sociale au sein d’une société juste, égalitaire et inclusive."}
                </p>
              </div>
            </div>

            {/* Values Section */}
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#92278F]">
                {language === 'en' ? 'Ethical Foundations' : 'Socle Éthique'}
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-1 font-heading">
                {language === 'en' ? 'Our Core Values' : 'Nos Valeurs Fondamentales'}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                {language === 'en'
                  ? 'The guiding principles that dictate every action, project, and relationship at APS-BENIN.'
                  : 'Les repères intangibles qui guident l’attitude de chaque collaborateur et partenaire d’APS-BÉNIN.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                    {v.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading mb-2">
                    {language === 'en' ? v.title_en : v.title_fr}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {language === 'en' ? v.desc_en : v.desc_fr}
                  </p>
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
