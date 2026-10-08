'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { SocialLinksConfig } from '@/types';
import { getActiveSocialPlatforms } from '@/lib/social';
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  Lock,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [socialLinks, setSocialLinks] = useState<SocialLinksConfig | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabaseStore.getSettings().then((s) => {
      if (isMounted && s) {
        if (s.logo_url) setLogoUrl(s.logo_url);
        if (s.social_links) setSocialLinks(s.social_links);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeSocials = useMemo(() => {
    return getActiveSocialPlatforms(socialLinks);
  }, [socialLinks]);

  const renderSocialIcon = (id: string, badge: string) => {
    switch (id) {
      case 'facebook':
        return <Facebook className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'instagram':
        return <Instagram className="w-4 h-4" />;
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      default:
        return <span className="text-[11px] font-bold tracking-tight">{badge}</span>;
    }
  };

  return (
    <footer className="bg-gray-950 text-gray-300 pt-16 pb-12 border-t-4 border-[#92278F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-gray-800">
          {/* Column 1: Organization identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="w-11 h-11 rounded-full border-2 border-[#FF8C00] bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center shrink-0 relative">
                  <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center">
                    <Image
                      src={logoUrl}
                      alt="APS-BÉNIN Logo Officiel"
                      fill
                      sizes="44px"
                      className="object-contain p-0.5"
                      referrerPolicy="no-referrer"
                      unoptimized={Boolean(logoUrl.startsWith('data:'))}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#92278F] flex items-center justify-center text-white font-extrabold text-lg border-2 border-[#FF8C00] shrink-0">
                  APS
                </div>
              )}
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight font-heading">
                  APS-BÉNIN
                </span>
                <p className="text-[10px] text-gray-400 font-medium tracking-wider">
                  AGISSONS POUR SAUVER
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-300 italic font-medium border-l-2 border-[#FF8C00] pl-3 py-1">
              « {language === 'en' ? 'For a more just and egalitarian world' : 'Pour un monde plus juste et égalitaire'} »
            </p>

            <p className="text-xs text-gray-400 leading-relaxed">
              {language === 'en'
                ? 'Non-Governmental Organization committed to human rights, gender equality, sexual and reproductive health, and grassroots community empowerment across Benin.'
                : "Organisation Non Gouvernementale engagée dans la défense des droits humains, la promotion de l'égalité de genre, la santé reproductive et l'autonomisation des communautés vulnérables au Bénin."}
            </p>

            {/* Social links */}
            {activeSocials.length > 0 && (
              <div className="pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  {t('footer.follow_us')}
                </h5>
                <div className="flex flex-wrap items-center gap-2">
                  {activeSocials.map((platform) => (
                    <a
                      key={platform.id}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#92278F] text-gray-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                      aria-label={platform.name}
                      title={platform.name}
                    >
                      {renderSocialIcon(platform.id, platform.badge)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF8C00]" />
              {t('footer.links_title')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href="/organisation/presentation" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.presentation')}
                </Link>
              </li>
              <li>
                <Link href="/organisation/histoire" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.history')}
                </Link>
              </li>
              <li>
                <Link href="/organisation/domaines" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.domains')}
                </Link>
              </li>
              <li>
                <Link href="/projets" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.projects')}
                </Link>
              </li>
              <li>
                <Link href="/actualites" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.news')}
                </Link>
              </li>
              <li>
                <Link href="/opportunites" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.opportunities')}
                </Link>
              </li>
              <li>
                <Link href="/mediatheque/photos" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.mediatheque')}
                </Link>
              </li>
              <li>
                <Link href="/partenaires" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.partners')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FF8C00] transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Headquarters & Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF8C00]" />
              {t('footer.headquarters')}
            </h4>
            <div className="space-y-3 text-xs text-gray-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF8C00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Djacoṭé-Comè</p>
                  <p className="text-gray-400">Département du Mono</p>
                  <p className="text-gray-400">République du Bénin</p>
                  <p className="text-gray-400 mt-1">BP : 69 Comè – Rép. du Bénin</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-[#FF8C00] shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+22952948323" className="block hover:text-white transition-colors">
                    +229 52 94 83 23
                  </a>
                  <a href="tel:+22996448362" className="block hover:text-white transition-colors">
                    +229 96 44 83 62
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Mail className="w-4 h-4 text-[#FF8C00] shrink-0 mt-0.5" />
                <a
                  href="mailto:agissonspoursauver@gmail.com"
                  className="hover:text-white transition-colors break-all"
                >
                  agissonspoursauver@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Institutional & Legal References */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#92278F]" />
              {t('footer.legal_title')}
            </h4>
            <div className="space-y-2.5 text-xs text-gray-400">
              <div className="p-2.5 rounded bg-gray-900 border border-gray-800">
                <p className="text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF8C00]" />
                  Enregistrement Officiel
                </p>
                <p className="text-[11px] leading-tight text-gray-400">
                  N°9/040PDM/SG/STCCD- du 20 septembre 2017
                </p>
                <p className="text-[11px] leading-tight text-gray-400 mt-1">
                  Journal Officiel N°21 du 1er Novembre 2017
                </p>
              </div>

              <div className="p-2.5 rounded bg-gray-900 border border-gray-800">
                <p className="text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#FF8C00]" />
                  Identifiant Fiscal Unique (IFU)
                </p>
                <p className="text-sm font-mono font-bold text-white tracking-wider">
                  6 2022 1407 5648
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/organisation/documents"
                  className="inline-flex items-center gap-1.5 text-xs text-[#FF8C00] hover:underline font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('nav.documents')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © {currentYear} AGISSONS POUR SAUVER (APS-BÉNIN). {t('footer.rights')}
          </p>

          <div className="flex items-center gap-4">
            <Link href="/mentions-legales" className="hover:text-gray-300 transition-colors">
              {t('footer.terms')}
            </Link>
            <span>•</span>
            <Link href="/politique-confidentialite" className="hover:text-gray-300 transition-colors">
              {t('footer.privacy')}
            </Link>
            <span>•</span>
            <Link
              href="/admin"
              className="flex items-center gap-1 text-[#92278F] hover:text-[#b432b0] font-semibold"
            >
              <Lock className="w-3 h-3 text-[#FF8C00]" />
              <span>{t('nav.admin')}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
