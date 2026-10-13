'use client';

import React, { useEffect, useState } from 'react';
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
import { HomeMediathequeSection } from '@/components/HomeMediathequeSection';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore, resolveMediaUrl, unpackInstitutionalPage } from '@/lib/supabase';
import { initialInstitutionalPages } from '@/lib/initial-data';
import { InstitutionalPage } from '@/types';
import { ShieldCheck, HeartHandshake, Eye, Award, ArrowRight } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function HomePage() {
  const { language, t } = useLanguage();
  const fallbackPres = initialInstitutionalPages.find((p) => p.slug === 'presentation');
  const [presPage, setPresPage] = useState<InstitutionalPage | null>(() =>
    fallbackPres ? unpackInstitutionalPage(fallbackPres) : null
  );

  useEffect(() => {
    supabaseStore.getInstitutionalPageBySlug('presentation', true).then((res) => {
      if (res) setPresPage(res);
    });

    const handlePageChanged = (e: any) => {
      if (e?.detail?.slug === 'presentation') {
        setPresPage(e.detail);
      }
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aps_page_last_updated' || e.key === 'aps_benin_institutional_pages') {
        supabaseStore.getInstitutionalPageBySlug('presentation', true).then((res) => {
          if (res) setPresPage(res);
        });
      }
    };
    window.addEventListener('aps_page_changed', handlePageChanged);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('aps_page_changed', handlePageChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const presImage = resolveMediaUrl(
    presPage?.images?.find((img) => img.slot_key === 'community_action')?.url ||
    presPage?.images?.[1]?.url ||
    presPage?.images?.[0]?.url ||
    presPage?.hero_image ||
    'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80'
  );

  const presAlt =
    (language === 'en'
      ? presPage?.images?.find((img) => img.slot_key === 'community_action')?.alt_en
      : presPage?.images?.find((img) => img.slot_key === 'community_action')?.alt_fr) ||
    'APS-BÉNIN Activités de terrain à Comè';

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
                <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white ring-1 ring-gray-200 h-[440px]">
                  <OptimizedImage
                    src={presImage}
                    alt={presAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 z-10">
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

        {/* 8. Mediatheque & Video Section */}
        <HomeMediathequeSection />

        {/* 9. Partenaires */}
        <PartnersCarousel />

        {/* 10. Call to action */}
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
