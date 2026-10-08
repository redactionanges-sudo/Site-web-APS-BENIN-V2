'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroBanner } from '@/components/HeroBanner';
import { KeyStats } from '@/components/KeyStats';
import { DomainCards } from '@/components/DomainCards';
import { FeaturedProjects } from '@/components/FeaturedProjects';
import { LatestNews } from '@/components/LatestNews';
import { OpenOpportunities } from '@/components/OpenOpportunities';
import { PartnersCarousel } from '@/components/PartnersCarousel';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { ShieldCheck, HeartHandshake, Eye, Award, ArrowRight, Play, Image as ImageIcon } from 'lucide-react';

export default function HomePage() {
  const { language, t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroBanner />

        {/* 2. Institutional Presentation Section */}
        <section className="py-20 bg-white/75 backdrop-blur-xs border-b border-purple-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-xs font-bold uppercase tracking-wider text-[#92278F] border border-purple-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF8C00]" />
                  <span>{t('home.presentation_badge')}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 font-heading leading-tight">
                  {t('home.presentation_title')}
                </h2>

                <p className="text-base text-gray-700 leading-relaxed">
                  {language === 'en'
                    ? "AGISSONS POUR SAUVER (APS-BENIN) is a non-governmental organization established in September 2014 and officially registered in September 2017 (Prefectural Order N°9/040PDM/SG/STCCD- and Official Gazette N°21 of November 1, 2017)."
                    : "L'organisation AGISSONS POUR SAUVER (APS-BÉNIN) est une Organisation Non Gouvernementale créée en septembre 2014 et enregistrée officiellement en septembre 2017 (Arrêté préfectoral N°9/040PDM/SG/STCCD- et parution au Journal Officiel N°21 du 1er Novembre 2017)."}
                </p>

                <p className="text-base text-gray-700 leading-relaxed">
                  {language === 'en'
                    ? "Headquartered in Djacoṭé-Comè in the Mono department, APS-BENIN works with passion, rigor, and proximity to defend fundamental human rights, promote genuine gender equality, combat gender-based violence, improve sexual and reproductive health, and facilitate the socioeconomic empowerment of women, girls, and vulnerable community members."
                    : "Basée à Djacoṭé-Comè dans le département du Mono, APS-BÉNIN agit avec rigueur, humanisme et proximité pour défendre les droits fondamentaux, instaurer une véritable égalité de genre, éradiquer les violences basées sur le genre, préserver la santé sexuelle et reproductive et propulser l'autonomie socio-économique des femmes, des jeunes filles et des groupes vulnérables."}
                </p>

                {/* 3 Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <HeartHandshake className="w-5 h-5 text-[#92278F] mb-2" />
                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                      {language === 'en' ? 'Human Dignity' : 'Dignité Humaine'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {language === 'en'
                        ? 'Protection of inalienable rights for every individual.'
                        : 'Protection des droits inaliénables de chaque individu.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <Eye className="w-5 h-5 text-[#FF8C00] mb-2" />
                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                      {language === 'en' ? 'Gender Equality' : 'Égalité de Genre'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {language === 'en'
                        ? 'Fair opportunities and full leadership for women and girls.'
                        : 'Égalité des chances et leadership pour les femmes et filles.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <Award className="w-5 h-5 text-[#92278F] mb-2" />
                    <h3 className="font-bold text-sm text-gray-900 mb-1">
                      {language === 'en' ? 'Community Impact' : 'Action de Terrain'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {language === 'en'
                        ? 'Concrete transformations across the 6 communes of Mono.'
                        : 'Transformations concrètes dans les 6 communes du Mono.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/organisation/presentation"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white font-semibold text-sm transition-all shadow-xs"
                  >
                    <span>{t('home.presentation_readmore')}</span>
                    <ArrowRight className="w-4 h-4 text-[#FF8C00]" />
                  </Link>
                </div>
              </div>

              {/* Visual column with authentic photography */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white ring-1 ring-gray-200">
                  <img
                    src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80"
                    alt="APS-BÉNIN Activités de terrain à Comè"
                    className="w-full h-[440px] object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                    <div className="text-white">
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                        {language === 'en' ? 'Djacoṭé-Comè • Mono' : 'Djacoṭé-Comè • Mono'}
                      </p>
                      <h4 className="font-bold text-base mt-1 font-heading">
                        {language === 'en'
                          ? 'Empowering women artisans and grassroots leaders'
                          : 'Autonomisation des femmes artisanes et leaders locales'}
                      </h4>
                      <p className="text-xs text-gray-300 mt-1">
                        {language === 'en'
                          ? '10+ years of active engagement on the ground in Benin.'
                          : 'Plus de 10 ans d’engagement actif sur le terrain béninois.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Key Statistics */}
        <KeyStats />

        {/* 4. Domaines d'intervention */}
        <DomainCards />

        {/* 5. Featured Projects */}
        <FeaturedProjects />

        {/* 6. Latest News */}
        <LatestNews />

        {/* 7. Current Opportunities */}
        <OpenOpportunities />

        {/* 8. Mediatheque Preview */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF8C00]">
                  {t('media.badge')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 font-heading">
                  {t('media.title')}
                </h2>
                <p className="text-sm sm:text-base text-gray-300 mt-2">
                  {t('media.subtitle')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/mediatheque/photos"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#FF8C00]" />
                  <span>{t('media.view_photos')}</span>
                </Link>
                <Link
                  href="/mediatheque/videos"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] hover:bg-[#741772] text-white text-xs font-semibold transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-[#FF8C00]" />
                  <span>{t('media.view_videos')}</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Photo 1 */}
              <Link
                href="/mediatheque/photos"
                className="group relative rounded-2xl overflow-hidden bg-gray-800 h-64 border border-gray-700/80 block"
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
                  alt="Éducation sexuelle en milieu scolaire"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    {language === 'en' ? 'Album: Health & Education' : 'Album : Santé & Éducation'}
                  </span>
                  <h4 className="font-bold text-sm text-white line-clamp-2">
                    {language === 'en'
                      ? 'Adolescent reproductive health awareness in Comè secondary schools'
                      : 'Sensibilisation SDSR des adolescents dans les collèges de Comè'}
                  </h4>
                </div>
              </Link>

              {/* Photo 2 */}
              <Link
                href="/mediatheque/photos"
                className="group relative rounded-2xl overflow-hidden bg-gray-800 h-64 border border-gray-700/80 block"
              >
                <motion.img
                  src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80"
                  alt="Formation des femmes artisanes"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                    {language === 'en' ? 'Album: Economic Autonomy' : 'Album : Autonomie Économique'}
                  </span>
                  <h4 className="font-bold text-sm text-white line-clamp-2">
                    {language === 'en'
                      ? 'Vocational equipment handover to women cooperatives in Mono'
                      : 'Dotation des équipements de transformation aux coopératives du Mono'}
                  </h4>
                </div>
              </Link>

              {/* Video preview */}
              <div className="group relative rounded-2xl overflow-hidden bg-gray-800 h-64 border border-gray-700/80">
                <motion.img
                  src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80"
                  alt="Vidéo reportage terrain"
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Link
                    href="/mediatheque/videos"
                    className="w-14 h-14 rounded-full bg-[#92278F] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-2 border-[#FF8C00]"
                    aria-label="Regarder la vidéo"
                  >
                    <Play className="w-6 h-6 fill-current ml-1 text-white" />
                  </Link>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 p-5">
                  <span className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-wider mb-1 block">
                    {language === 'en' ? 'Featured Video' : 'Vidéo à la une'}
                  </span>
                  <h4 className="font-bold text-sm text-white line-clamp-1">
                    {language === 'en'
                      ? 'Field Report: Real impact of APS-BENIN actions in Mono'
                      : 'Reportage terrain : L’impact réel des actions d’APS-BÉNIN dans le Mono'}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Partenaires */}
        <PartnersCarousel />

        {/* 10. Call to action */}
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
