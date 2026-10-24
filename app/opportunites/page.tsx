'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { OpportunityItem } from '@/types';
import {
  Briefcase,
  Clock,
  MapPin,
  ArrowRight,
  Filter,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';

function OpportunitiesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const { language, t } = useLanguage();
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabaseStore.getOpportunities().then(setItems);
  }, []);

  const openCount = items.filter((i) => i.status === 'open').length;
  const closedCount = items.filter((i) => i.status !== 'open').length;

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      activeTab === 'open' ? item.status === 'open' : item.status !== 'open';
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const title = (language === 'en' ? item.title_en : item.title_fr).toLowerCase();
    const desc = (language === 'en' ? item.description_en : item.description_fr).toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || title.includes(q) || desc.includes(q);
    return matchesStatus && matchesType && matchesSearch;
  });

  const getTypeLabel = (type: OpportunityItem['type']) => {
    switch (type) {
      case 'recruitment':
        return t('opp.type_recruitment');
      case 'internship':
        return t('opp.type_internship');
      case 'volunteering':
        return t('opp.type_volunteering');
      case 'call_for_tenders':
        return t('opp.type_tenders');
      case 'consultation':
        return t('opp.type_consultation');
      default:
        return 'Opportunité';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <main className="flex-1">
      {/* Header */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20 mb-3">
            {language === 'en' ? 'Careers & Procurement' : 'Carrières & Marchés'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
            {language === 'en' ? 'Opportunities & Calls' : 'Opportunités & Appels'}
          </h1>
          <p className="text-base sm:text-lg text-purple-100 max-w-2xl mt-3">
            {language === 'en'
              ? 'Join our team, volunteer, or participate in public procurement and consultancy tenders with APS-BENIN.'
              : 'Rejoignez nos équipes, engagez-vous comme volontaire ou participez à nos appels d’offres et consultations de prestations.'}
          </p>
        </div>
      </section>

      {/* Tabs: Open vs Closed */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('open')}
            className={`py-4 px-2 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'open'
                ? 'border-[#92278F] text-[#92278F]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>{language === 'en' ? 'Open Opportunities' : 'Opportunités ouvertes'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              {openCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('closed')}
            className={`py-4 px-2 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'closed'
                ? 'border-[#92278F] text-[#92278F]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <XCircle className="w-4 h-4 text-gray-400" />
            <span>{language === 'en' ? 'Closed Opportunities' : 'Opportunités clôturées'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {closedCount}
            </span>
          </button>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="py-6 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedType === 'all'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('common.filter_all')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('recruitment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedType === 'recruitment'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('nav.recruitments')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('call_for_tenders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedType === 'call_for_tenders'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('nav.tenders')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('consultation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedType === 'consultation'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('nav.consultations')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('internship')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedType === 'internship'
                  ? 'bg-[#92278F] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t('nav.internships')}
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#92278F] bg-white text-gray-800"
            />
          </div>
        </div>
      </section>

      {/* Opportunities List */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-base text-gray-600 font-medium">
                {language === 'en'
                  ? 'No opportunities match your current selection.'
                  : 'Aucune opportunité ne correspond à vos filtres actuels.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-2xl border border-gray-200 hover:border-[#92278F] transition-all hover:shadow-md bg-white flex flex-col justify-between group overflow-hidden"
                >
                  <div>
                    {opp.main_image ? (
                      <div className="h-44 w-full overflow-hidden bg-gray-100 relative">
                        <img
                          src={opp.main_image}
                          alt={language === 'en' ? opp.title_en : opp.title_fr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/95 backdrop-blur-xs text-[#92278F] border border-purple-100 shadow-2xs flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {getTypeLabel(opp.type)}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs ${
                              opp.status === 'open'
                                ? 'bg-green-700 text-white'
                                : 'bg-gray-800 text-white'
                            }`}
                          >
                            {opp.status === 'open' ? t('opp.status_open') : t('opp.status_closed')}
                          </span>
                        </div>
                        {opp.gallery && opp.gallery.length > 0 && (
                          <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                            <span>+{opp.gallery.length} photos</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 pb-0">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-50 text-[#92278F] border border-purple-100 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {getTypeLabel(opp.type)}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              opp.status === 'open'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {opp.status === 'open' ? t('opp.status_open') : t('opp.status_closed')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-6 pt-4">
                      <h2 className="text-base font-bold text-gray-900 group-hover:text-[#92278F] transition-colors font-heading mb-3 line-clamp-2 leading-snug">
                        {language === 'en' ? opp.title_en : opp.title_fr}
                      </h2>

                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                        {language === 'en' ? opp.description_en : opp.description_fr}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-0">
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
                          <span className="line-clamp-1">
                            {language === 'en' ? opp.location_en : opp.location_fr}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-[#92278F]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(opp.deadline)}</span>
                        </span>
                      </div>

                      <Link
                        href={`/opportunites/${opp.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-50 hover:bg-[#92278F] text-gray-700 hover:text-white text-xs font-bold transition-colors"
                      >
                        <span>{language === 'en' ? 'View details' : 'Voir les détails'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <CallToAction />
    </main>
  );
}

export default function OpportunitesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500">Chargement des opportunités...</div>}>
        <OpportunitiesContent />
      </Suspense>
      <Footer />
    </div>
  );
}
