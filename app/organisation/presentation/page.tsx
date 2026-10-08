'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import {
  ShieldCheck,
  FileCheck2,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function PresentationPage() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gray-900 text-white py-16 sm:py-20 relative overflow-hidden">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1600&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/50 to-black/90" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <div className="max-w-3xl space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#FF8C00] px-3 py-1 rounded bg-white/10 border border-white/20">
                {language === 'en' ? 'The Organization' : "L'Organisation"}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading">
                {language === 'en' ? 'Overview & Identity' : 'Présentation Institutionnelle'}
              </h1>
              <p className="text-lg text-purple-100 font-serif italic border-l-4 border-[#FF8C00] pl-4">
                « {language === 'en' ? 'For a more just and egalitarian world' : 'Pour un monde plus juste et égalitaire'} »
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-white/75 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left/Main Column */}
              <div className="lg:col-span-8 space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-heading mb-4">
                    {language === 'en' ? 'Who is APS-BENIN?' : 'Qui est AGISSONS POUR SAUVER (APS-BÉNIN) ?'}
                  </h2>
                  <div className="prose prose-purple max-w-none text-gray-700 space-y-4 leading-relaxed text-base">
                    <p>
                      <strong>AGISSONS POUR SAUVER (APS-BÉNIN)</strong>{' '}
                      {language === 'en'
                        ? 'is a non-governmental organization created in September 2014 by a collective of citizens committed to the defense of human rights, human dignity, and social justice.'
                        : "est une organisation non gouvernementale créée en septembre 2014 par un collectif de citoyennes et citoyens engagés pour la défense des droits humains, de la dignité et de la justice sociale."}
                    </p>
                    <p>
                      {language === 'en'
                        ? 'Officially registered in September 2017 with the Ministry of Interior and Public Security (Prefectural Order N°9/040PDM/SG/STCCD- and published in the Official Gazette of the Republic of Benin N°21 of November 1, 2017), the NGO has established a solid operational footprint in the Mono department.'
                        : "Enregistrée officiellement en septembre 2017 auprès du Ministère de l'Intérieur et de la Sécurité Publique (Récépissé N°9/040PDM/SG/STCCD- et parution au Journal Officiel de la République du Bénin N°21 du 1er Novembre 2017), l'ONG a bâti un ancrage territorial solide dans le département du Mono."}
                    </p>
                    <p>
                      {language === 'en'
                        ? 'APS-BENIN works every day to eliminate all forms of discrimination against women and girls, fight gender-based violence, ensure comprehensive access to sexual and reproductive health information, and support socioeconomic independence through vocational training and solidarity cooperatives.'
                        : "APS-BÉNIN œuvre au quotidien pour éliminer toutes les formes de discrimination à l'égard des femmes et des filles, éradiquer les violences basées sur le genre, garantir l'accès universel à l'information sur la santé sexuelle et reproductive et favoriser l'autonomie financière des ménages vulnérables par la formation professionnelle et l'appui aux coopératives solidaires."}
                    </p>
                  </div>
                </div>

                {/* Key Pillars */}
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 font-heading mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#92278F]" />
                    <span>{language === 'en' ? 'Our Fundamental Principles' : 'Nos Principes Fondateurs'}</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-[#FF8C00] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">
                          {language === 'en' ? 'Independence & Ethics' : 'Indépendance & Éthique'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {language === 'en'
                            ? 'A non-partisan, secular civil society entity governed by strict integrity.'
                            : 'Une association apolitique, laïque et régie par des règles strictes de probité.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-[#FF8C00] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">
                          {language === 'en' ? 'Proximity & Inclusiveness' : 'Proximité & Inclusion'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {language === 'en'
                            ? 'Actions co-designed with grassroots community members and vulnerable groups.'
                            : 'Des actions co-construites avec les communautés de base et les personnes vulnérables.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-[#FF8C00] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">
                          {language === 'en' ? 'Transparency & Results' : 'Transparence & Résultats'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {language === 'en'
                            ? 'Accountability to beneficiaries, institutional partners and donors.'
                            : 'Redevabilité rigoureuse envers les bénéficiaires, les partenaires et les bailleurs.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
                      <CheckCircle2 className="w-5 h-5 text-[#FF8C00] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">
                          {language === 'en' ? 'Gender Equality' : 'Égalité de Genre'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {language === 'en'
                            ? 'Advancing equal rights, leadership and economic opportunities.'
                            : 'Lutte constante pour l’égalité des droits, le leadership et l’autonomie des femmes.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subsections links */}
                <div className="pt-4 flex flex-wrap gap-4">
                  <Link
                    href="/organisation/histoire"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-purple-50 text-[#92278F] font-bold text-sm hover:bg-[#92278F] hover:text-white transition-colors"
                  >
                    <span>{language === 'en' ? 'Discover our history' : 'Découvrir notre histoire'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/organisation/mission-vision-valeurs"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-orange-50 text-[#d97500] font-bold text-sm hover:bg-[#FF8C00] hover:text-white transition-colors"
                  >
                    <span>{language === 'en' ? 'Mission, Vision & Values' : 'Mission, Vision & Valeurs'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Institutional Identity Card */}
              <div className="lg:col-span-4">
                <div className="sticky top-28 space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 font-heading border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-[#92278F]" />
                      <span>{language === 'en' ? 'Institutional Identity Card' : "Fiche d'Identité Officielle"}</span>
                    </h3>

                    <dl className="space-y-3.5 text-xs">
                      <div>
                        <dt className="text-gray-500 font-medium">Nom officiel</dt>
                        <dd className="font-bold text-gray-900 mt-0.5">AGISSONS POUR SAUVER – APS-BÉNIN</dd>
                      </div>

                      <div>
                        <dt className="text-gray-500 font-medium">Date de création</dt>
                        <dd className="font-semibold text-gray-900 mt-0.5">Septembre 2014</dd>
                      </div>

                      <div>
                        <dt className="text-gray-500 font-medium">Enregistrement officiel</dt>
                        <dd className="font-semibold text-gray-900 mt-0.5">20 septembre 2017</dd>
                      </div>

                      <div>
                        <dt className="text-gray-500 font-medium">Récépissé Préfectoral</dt>
                        <dd className="font-mono text-gray-900 mt-0.5 bg-white p-1.5 rounded border border-gray-200">
                          N°9/040PDM/SG/STCCD-
                        </dd>
                      </div>

                      <div>
                        <dt className="text-gray-500 font-medium">Journal Officiel</dt>
                        <dd className="font-mono text-gray-900 mt-0.5 bg-white p-1.5 rounded border border-gray-200">
                          JO N°21 du 1er Novembre 2017
                        </dd>
                      </div>

                      <div>
                        <dt className="text-gray-500 font-medium">Identifiant Fiscal Unique (IFU)</dt>
                        <dd className="font-mono font-bold text-[#92278F] mt-0.5 bg-purple-50 p-1.5 rounded border border-purple-200 text-sm">
                          6 2022 1407 5648
                        </dd>
                      </div>

                      <div>
                        <dt className="text-gray-500 font-medium">Siège Social</dt>
                        <dd className="font-semibold text-gray-900 mt-0.5 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#FF8C00] shrink-0 mt-0.5" />
                          <span>Djacoṭé-Comè, Mono, République du Bénin</span>
                        </dd>
                      </div>

                      <div>
                        <dt className="text-gray-500 font-medium">Boîte Postale</dt>
                        <dd className="font-semibold text-gray-900 mt-0.5">BP 69 Comè – Bénin</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Photo of headquarters or community */}
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80"
                      alt="APS-BÉNIN Siège Comè"
                      className="w-full h-44 object-cover"
                    />
                    <div className="p-4 bg-white text-xs text-gray-600">
                      <p className="font-semibold text-gray-900">Siège de Djacoṭé-Comè</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Accueil du public et cellules d’écoute citoyennes.
                      </p>
                    </div>
                  </div>
                </div>
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
