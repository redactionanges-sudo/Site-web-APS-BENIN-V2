'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { SiteLogo } from '@/components/SiteLogo';
import { CallHeadquartersCTA } from '@/components/CallHeadquartersCTA';
import {
  Menu,
  X,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Lock,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const {
    orgName,
    orgNameShort,
    addressLocality,
    addressLocation,
    email,
    primaryPhoneTelHref,
    validPhones,
  } = useSiteSettings();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
  const [oppDropdownOpen, setOppDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      {/* Top Bar: Contact info & utilities */}
      <div className="bg-[#92278F] text-white text-xs py-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-purple-100">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
              <span>{addressLocality || addressLocation}</span>
            </span>

            {primaryPhoneTelHref && validPhones.length > 0 && (
              <a
                href={primaryPhoneTelHref}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
                title="Numéro direct du siège"
              >
                <Phone className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>{validPhones.join(' / ')}</span>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="hidden md:flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#FF8C00]" />
                <span>{email}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Direct Call Headquarters CTA */}
            <CallHeadquartersCTA variant="header" className="hidden lg:inline-flex" />

            {/* Bilingual Language Switcher */}
            <div className="flex items-center bg-black/20 rounded px-2 py-0.5 border border-white/20">
              <Globe className="w-3 h-3 text-[#FF8C00] mr-1.5" />
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`font-semibold px-1.5 py-0.5 rounded transition-colors ${
                  language === 'fr'
                    ? 'bg-white text-[#92278F] shadow-xs'
                    : 'text-white hover:text-orange-200'
                }`}
              >
                FR
              </button>
              <span className="text-white/40 mx-0.5">|</span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`font-semibold px-1.5 py-0.5 rounded transition-colors ${
                  language === 'en'
                    ? 'bg-white text-[#92278F] shadow-xs'
                    : 'text-white hover:text-orange-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Back-office link */}
            <Link
              href="/admin"
              className="flex items-center gap-1 text-white/90 hover:text-white hover:underline transition-colors"
            >
              <Lock className="w-3 h-3 text-[#FF8C00]" />
              <span className="hidden sm:inline">
                {user ? `Admin (${user.role === 'super_admin' ? 'Super' : 'Éditeur'})` : t('nav.admin')}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand identity with institutional official logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <SiteLogo variant="header" priority />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-xl text-[#92278F] tracking-tight font-heading">
                {orgNameShort}
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#92278F] border border-purple-200">
                ONG
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 tracking-wide line-clamp-1">
              {orgName}
            </p>
          </div>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold text-gray-700">
          <Link
            href="/"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/') && pathname === '/'
                ? 'text-[#92278F] bg-purple-50 font-bold'
                : 'hover:text-[#92278F] hover:bg-gray-50'
            }`}
          >
            {t('nav.home')}
          </Link>

          {/* L'Organisation Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOrgDropdownOpen(true)}
            onMouseLeave={() => setOrgDropdownOpen(false)}
          >
            <button
              type="button"
              className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                isActive('/organisation')
                  ? 'text-[#92278F] bg-purple-50 font-bold'
                  : 'hover:text-[#92278F] hover:bg-gray-50'
              }`}
            >
              <span>{t('nav.organization')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#92278F]" />
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-64 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                  <Link
                    href="/organisation/presentation"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.presentation')}
                  </Link>
                  <Link
                    href="/organisation/histoire"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.history')}
                  </Link>
                  <Link
                    href="/organisation/mission-vision-valeurs"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.mission_vision_values')}
                  </Link>
                  <Link
                    href="/organisation/domaines"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.domains')}
                  </Link>
                  <div className="my-1 border-t border-gray-100" />
                  <Link
                    href="/organisation/equipe"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.team')}
                  </Link>
                  <Link
                    href="/organisation/gouvernance"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.governance')}
                  </Link>
                  <Link
                    href="/organisation/documents"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.documents')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/projets"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/projets')
                ? 'text-[#92278F] bg-purple-50 font-bold'
                : 'hover:text-[#92278F] hover:bg-gray-50'
            }`}
          >
            {t('nav.projects')}
          </Link>

          <Link
            href="/actualites"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/actualites')
                ? 'text-[#92278F] bg-purple-50 font-bold'
                : 'hover:text-[#92278F] hover:bg-gray-50'
            }`}
          >
            {t('nav.news')}
          </Link>

          {/* Opportunités Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setOppDropdownOpen(true)}
            onMouseLeave={() => setOppDropdownOpen(false)}
          >
            <Link
              href="/opportunites"
              className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                isActive('/opportunites')
                  ? 'text-[#92278F] bg-purple-50 font-bold'
                  : 'hover:text-[#92278F] hover:bg-gray-50'
              }`}
            >
              <span>{t('nav.opportunities')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Link>

            {oppDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-56 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                  <Link
                    href="/opportunites?type=recruitment"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.recruitments')}
                  </Link>
                  <Link
                    href="/opportunites?type=internship"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.internships')}
                  </Link>
                  <Link
                    href="/opportunites?type=volunteering"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.volunteering')}
                  </Link>
                  <Link
                    href="/opportunites?type=call_for_tenders"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.tenders')}
                  </Link>
                  <Link
                    href="/opportunites?type=consultation"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.consultations')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Médiathèque Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setMediaDropdownOpen(true)}
            onMouseLeave={() => setMediaDropdownOpen(false)}
          >
            <button
              type="button"
              className={`flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                isActive('/mediatheque')
                  ? 'text-[#92278F] bg-purple-50 font-bold'
                  : 'hover:text-[#92278F] hover:bg-gray-50'
              }`}
            >
              <span>{t('nav.mediatheque')}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {mediaDropdownOpen && (
              <div className="absolute left-0 top-full pt-1 w-48 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                  <Link
                    href="/mediatheque/photos"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.photos')}
                  </Link>
                  <Link
                    href="/mediatheque/videos"
                    className="block px-4 py-2 hover:bg-purple-50 hover:text-[#92278F] text-gray-700 text-sm"
                  >
                    {t('nav.videos')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/partenaires"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/partenaires')
                ? 'text-[#92278F] bg-purple-50 font-bold'
                : 'hover:text-[#92278F] hover:bg-gray-50'
            }`}
          >
            {t('nav.partners')}
          </Link>

          <Link
            href="/contact"
            className="ml-2 px-4 py-2 rounded-md bg-[#92278F] hover:bg-[#741772] text-white font-medium transition-all shadow-xs"
          >
            {t('nav.contact')}
          </Link>
        </nav>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/contact"
            className="px-3 py-1.5 rounded-md bg-[#92278F] text-white text-xs font-semibold"
          >
            {t('nav.contact')}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-700 hover:text-[#92278F] hover:bg-gray-100"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 px-4 pt-3 pb-6 max-h-[85vh] overflow-y-auto">
          <nav className="flex flex-col space-y-1 text-base font-medium text-gray-800">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-purple-50 hover:text-[#92278F]"
            >
              {t('nav.home')}
            </Link>

            <div className="pt-2 pb-1 border-t border-gray-100">
              <span className="px-3 text-xs font-bold uppercase tracking-wider text-[#92278F]">
                {t('nav.organization')}
              </span>
              <div className="mt-1 pl-3 space-y-1">
                <Link
                  href="/organisation/presentation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.presentation')}
                </Link>
                <Link
                  href="/organisation/histoire"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.history')}
                </Link>
                <Link
                  href="/organisation/mission-vision-valeurs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.mission_vision_values')}
                </Link>
                <Link
                  href="/organisation/domaines"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.domains')}
                </Link>
                <Link
                  href="/organisation/equipe"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.team')}
                </Link>
                <Link
                  href="/organisation/gouvernance"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.governance')}
                </Link>
                <Link
                  href="/organisation/documents"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.documents')}
                </Link>
              </div>
            </div>

            <Link
              href="/projets"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-purple-50 hover:text-[#92278F]"
            >
              {t('nav.projects')}
            </Link>

            <Link
              href="/actualites"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-purple-50 hover:text-[#92278F]"
            >
              {t('nav.news')}
            </Link>

            <div className="pt-2 pb-1 border-t border-gray-100">
              <span className="px-3 text-xs font-bold uppercase tracking-wider text-[#92278F]">
                {t('nav.opportunities')}
              </span>
              <div className="mt-1 pl-3 space-y-1">
                <Link
                  href="/opportunites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('opp.view_all')}
                </Link>
                <Link
                  href="/opportunites?type=recruitment"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.recruitments')}
                </Link>
                <Link
                  href="/opportunites?type=internship"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.internships')}
                </Link>
                <Link
                  href="/opportunites?type=volunteering"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.volunteering')}
                </Link>
                <Link
                  href="/opportunites?type=call_for_tenders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.tenders')}
                </Link>
              </div>
            </div>

            <div className="pt-2 pb-1 border-t border-gray-100">
              <span className="px-3 text-xs font-bold uppercase tracking-wider text-[#92278F]">
                {t('nav.mediatheque')}
              </span>
              <div className="mt-1 pl-3 space-y-1">
                <Link
                  href="/mediatheque/photos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.photos')}
                </Link>
                <Link
                  href="/mediatheque/videos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#92278F]"
                >
                  {t('nav.videos')}
                </Link>
              </div>
            </div>

            <Link
              href="/partenaires"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-purple-50 hover:text-[#92278F]"
            >
              {t('nav.partners')}
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded hover:bg-purple-50 hover:text-[#92278F]"
            >
              {t('nav.contact')}
            </Link>

            {primaryPhoneTelHref && (
              <div className="pt-2 px-1">
                <CallHeadquartersCTA variant="primary" className="w-full justify-center" />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded bg-purple-50 text-[#92278F] font-semibold"
              >
                <Lock className="w-4 h-4 text-[#FF8C00]" />
                <span>{t('nav.admin')}</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
