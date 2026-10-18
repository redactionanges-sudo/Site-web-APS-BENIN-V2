'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { MediaItem, BannerAnnouncement } from '@/types';
import { initialSiteSettings } from '@/lib/initial-data';
import { CallHeadquartersCTA } from '@/components/CallHeadquartersCTA';
import {
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Sparkles,
  Phone,
  Bell,
  ExternalLink,
} from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { language, t } = useLanguage();

  // 1. Initial State: Immédiatement initialisé avec les photos du hero (dont ART5181 en priorité 1) pour un LCP instantané dès le premier octet HTML
  const [slides, setSlides] = useState<MediaItem[]>(() => supabaseStore.getCachedHeroPhotos());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. Dynamic Banner Announcements State
  const initialAnnouncements = useMemo(() => {
    return (initialSiteSettings?.seo?.hero_announcements || [])
      .filter((a) => a.is_published)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, []);

  const [announcements, setAnnouncements] = useState<BannerAnnouncement[]>(initialAnnouncements);

  // Load latest hero photos and announcements from Supabase without blocking the initial paint
  useEffect(() => {
    setHasMounted(true);
    let mounted = true;

    const loadFreshHeroPhotos = () => {
      supabaseStore.getHeroPhotos().then((photos) => {
        if (mounted) {
          setSlides(photos);
          setCurrentIndex((prev) => (prev >= photos.length ? 0 : prev));
        }
      });
    };

    const loadFreshAnnouncements = () => {
      supabaseStore.getBannerAnnouncements().then((items) => {
        if (mounted && items && items.length > 0) {
          setAnnouncements(items);
        }
      });
    };

    // Initial load
    loadFreshHeroPhotos();
    loadFreshAnnouncements();

    // Event listeners for real-time synchronization with admin mutations
    const handleMediaSync = () => {
      loadFreshHeroPhotos();
    };

    const handleSettingsSync = () => {
      loadFreshAnnouncements();
    };

    window.addEventListener('aps_media_changed', handleMediaSync);
    window.addEventListener('aps_site_settings_changed', handleSettingsSync);
    window.addEventListener('storage', handleMediaSync);

    return () => {
      mounted = false;
      window.removeEventListener('aps_media_changed', handleMediaSync);
      window.removeEventListener('aps_site_settings_changed', handleSettingsSync);
      window.removeEventListener('storage', handleMediaSync);
    };
  }, []);

  // Slide navigation
  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Autoplay carousel (6.5s) with single stable interval and hover pause
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused, nextSlide]);

  const currentSlide = slides.length > 0 ? (slides[currentIndex] || slides[0]) : null;

  // Preload next slide in background once current is rendered
  const nextIndex = slides.length > 0 ? (currentIndex + 1) % slides.length : 0;
  const nextSlideData = slides.length > 1 ? slides[nextIndex] : null;

  // Preload next slide in browser background safely without nested link tags
  useEffect(() => {
    if (typeof window !== 'undefined' && nextSlideData?.url) {
      const img = new window.Image();
      img.src = nextSlideData.url;
    }
  }, [nextSlideData?.url]);

  // Filter active announcements deterministically
  const activeAnnouncements = useMemo(() => {
    return announcements.filter((item) => item.is_published !== false);
  }, [announcements]);

  return (
    <section
      suppressHydrationWarning
      className="relative overflow-hidden bg-gray-950 text-white min-h-[640px] lg:min-h-[720px] flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Bannière d'accueil APS-BÉNIN"
    >
      {/* Dynamic Background Image Slideshow with optimized lightweight gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-gray-950" suppressHydrationWarning>
        {currentSlide?.url ? (
          <div
            key={currentSlide.id}
            className="absolute inset-0 w-full h-full transition-opacity duration-500 ease-out"
            suppressHydrationWarning
          >
            <Image
              src={currentSlide.url}
              alt={
                language === 'en'
                  ? currentSlide.alt_en || currentSlide.title_en || 'APS-BENIN actions'
                  : currentSlide.alt_fr || currentSlide.title_fr || 'APS-BÉNIN actions sur le terrain'
              }
              fill
              priority={currentIndex === 0}
              sizes="100vw"
              className="object-cover object-center filter brightness-[0.92] contrast-[1.03]"
              referrerPolicy="no-referrer"
              unoptimized={Boolean(currentSlide.url.startsWith('data:'))}
            />
          </div>
        ) : (
          /* Neutral branded gradient backdrop matching APS-BÉNIN corporate visual identity */
          <div className="absolute inset-0 bg-gradient-to-br from-[#2f0d2e] via-[#1a081a] to-gray-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#92278F]/25 via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#FF8C00]/15 via-transparent to-transparent pointer-events-none" />
          </div>
        )}


        {/* Lighter, controlled gradient overlay:
            Photos remain clearly visible and vibrant while ensuring maximum text readability */}
        <div className="absolute inset-0 z-1 bg-gradient-to-r from-gray-950/80 via-gray-950/50 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-1 bg-gradient-to-t from-gray-950/90 via-transparent to-black/35 pointer-events-none" />
        <div className="absolute inset-0 z-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#92278F]/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl space-y-6">
          {/* Badge with pulse indicator */}
          <div
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-semibold text-orange-300 shadow-sm"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8C00] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF8C00]" />
            </span>
            <span>{t('hero.badge')} • Comè, Mono (Bénin)</span>
          </div>

          {/* Main Headline with subtle text-shadow for crisp legibility */}
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-heading drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              AGISSONS POUR SAUVER
              <span className="block text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#FF8C00] mt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                APS-BÉNIN
              </span>
            </h1>
          </div>

          {/* Slogan */}
          <p
            className="text-lg sm:text-2xl font-serif italic text-purple-100 border-l-4 border-[#FF8C00] pl-4 py-1.5 bg-black/35 backdrop-blur-xs rounded-r-lg max-w-2xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
          >
            « {language === 'en' ? 'For a more just and egalitarian world' : 'Pour un monde plus juste et égalitaire'} »
          </p>

          {/* Descriptive Excerpt */}
          <p
            className="text-base sm:text-lg text-gray-100 leading-relaxed max-w-2xl font-normal drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
          >
            {language === 'en'
              ? 'Founded in 2014, APS-BENIN takes tangible action across the Mono department to defend human rights, advance gender equality, safeguard sexual and reproductive health, and empower women and vulnerable youth.'
              : "Organisation citoyenne créée en 2014, APS-BÉNIN agit concrètement sur le terrain dans le département du Mono pour la défense des droits humains, l'égalité de genre, la santé sexuelle et reproductive et l'autonomie des femmes et des jeunes vulnérables."}
          </p>

          {/* Action CTA Buttons */}
          <div
            className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4"
          >
            {/* Primary CTA: Découvrir */}
            <Link
              href="/organisation/presentation"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#92278F] hover:bg-[#741772] text-white font-semibold transition-all shadow-lg hover:shadow-purple-900/50 hover:-translate-y-0.5 border border-purple-400/30 group active:scale-95"
            >
              <ShieldCheck className="w-5 h-5 text-[#FF8C00] group-hover:scale-110 transition-transform" />
              <span>{t('hero.cta_discover')}</span>
            </Link>

            {/* Secondary CTA: Nos projets */}
            <Link
              href="/projets"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF8C00] hover:bg-[#e07b00] text-white font-semibold transition-all shadow-lg hover:shadow-orange-950/50 hover:-translate-y-0.5 group active:scale-95"
            >
              <span>{t('hero.cta_projects')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Tertiary CTA: Contact */}
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-medium transition-all border border-white/25 hover:border-white/40 hover:-translate-y-0.5 active:scale-95"
            >
              <HeartHandshake className="w-4 h-4 text-[#FF8C00]" />
              <span>{t('hero.cta_contact')}</span>
            </Link>

            {/* Direct Line Headquarters CTA */}
            <CallHeadquartersCTA variant="hero" />
          </div>
        </div>

        {/* Carousel Navigation Controls & Photo Caption Info */}
        {slides.length > 0 && (
          <div className="mt-8 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/15">
            {/* Slide Indicators & Arrows */}
            {slides.length > 1 ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Image précédente"
                    className="p-1 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 px-2" suppressHydrationWarning>
                    {slides.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        aria-label={`Aller à la photo ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentIndex
                            ? 'w-6 bg-[#FF8C00]'
                            : 'w-2 bg-white/40 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Image suivante"
                    className="p-1 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs text-gray-200 hidden sm:inline-flex items-center gap-1.5" suppressHydrationWarning>
                  <Sparkles className="w-3.5 h-3.5 text-[#FF8C00]" />
                  {`${currentIndex + 1} / ${slides.length}`}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Current photo caption tag */}
            {currentSlide && (
              <div className="flex items-center gap-2 text-xs text-gray-200 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 max-w-md truncate">
                {currentSlide.location && (
                  <span className="flex items-center gap-1 text-orange-300 shrink-0 font-medium">
                    <MapPin className="w-3 h-3" />
                    {currentSlide.location}
                  </span>
                )}
                <span className="text-gray-400">•</span>
                <span className="truncate text-white font-medium">
                  {language === 'en' ? currentSlide.title_en : currentSlide.title_fr}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Administrable Information Marquee Banner */}
      <div className="relative z-10 bg-[#92278F] border-t border-purple-400/30 overflow-hidden py-2.5 text-xs text-white shadow-md">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          {/* Render Active Announcements Twice for Seamless Continuous Loop */}
          {[...activeAnnouncements, ...activeAnnouncements].map((ann, i) => {
            const text = language === 'en' ? (ann.text_en || ann.text_fr) : ann.text_fr;
            const btnText = language === 'en' ? (ann.button_text_en || ann.button_text_fr || 'Learn more') : (ann.button_text_fr || 'En savoir plus');
            const isExternal = ann.link_url?.startsWith('http');

            return (
              <React.Fragment key={`${ann.id}-${i}`}>
                <span className="inline-flex items-center gap-2.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#FF8C00] flex-shrink-0" />
                  <span>{text}</span>

                  {/* Optional Action Button */}
                  {ann.link_url && (
                    <Link
                      href={ann.link_url}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20 transition-colors ml-1"
                    >
                      <span>{btnText}</span>
                      {isExternal ? (
                        <ExternalLink className="w-2.5 h-2.5 text-orange-300" />
                      ) : (
                        <ArrowRight className="w-2.5 h-2.5 text-orange-300" />
                      )}
                    </Link>
                  )}
                </span>
                <span className="text-purple-300 select-none">✦</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
