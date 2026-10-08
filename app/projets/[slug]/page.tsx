'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { ProjectItem } from '@/types';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Target,
  FileText,
  Download,
  Building,
  CheckCircle,
  AlertCircle,
  Play,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { language, t } = useLanguage();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseStore.getProjectBySlug(slug).then((res) => {
      setProject(res);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#92278F] border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF8C00] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Projet introuvable</h1>
          <p className="text-gray-600 mb-6">Le projet recherché n’existe pas ou a été déplacé.</p>
          <Link
            href="/projets"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste des projets</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Header Banner */}
        <section className="bg-gray-900 text-white py-14 sm:py-20 relative overflow-hidden">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url('${project.main_image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#92278F]/60 to-black/90" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8">
            <Link
              href="/projets"
              className="inline-flex items-center gap-2 text-xs font-semibold text-orange-300 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('projects.view_all')}</span>
            </Link>

            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded text-white ${
                    project.status === 'in_progress'
                      ? 'bg-[#FF8C00]'
                      : project.status === 'completed'
                      ? 'bg-green-700'
                      : 'bg-[#92278F]'
                  }`}
                >
                  {project.status === 'in_progress'
                    ? t('projects.status_in_progress')
                    : project.status === 'completed'
                    ? t('projects.status_completed')
                    : t('projects.status_upcoming')}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded bg-white/10 text-white border border-white/20">
                  {project.intervention_zone}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
                {language === 'en' ? project.title_en : project.title_fr}
              </h1>

              <p className="text-base text-purple-100 max-w-3xl leading-relaxed">
                {language === 'en' ? project.excerpt_en : project.excerpt_fr}
              </p>
            </div>
          </div>
        </section>

        {/* Project Meta Bar */}
        <section className="bg-gray-50 border-b border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#FF8C00] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">Communes ciblées</span>
                  <span className="font-bold text-gray-900">{project.communes.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#92278F] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">Période d’exécution</span>
                  <span className="font-bold text-gray-900">{project.period}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#FF8C00] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">Durée totale</span>
                  <span className="font-bold text-gray-900">{project.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#92278F] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">Statut du projet</span>
                  <span className="font-bold text-gray-900 capitalize">{project.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Details */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Content Column */}
              <div className="lg:col-span-8 space-y-10">
                {/* Contexte & Problématique */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                    {language === 'en' ? 'Context & Problem Statement' : 'Contexte & Problématique'}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {language === 'en' ? project.context_en : project.context_fr}
                  </p>
                  <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-100 text-xs sm:text-sm text-gray-800">
                    <strong className="text-[#d97500] block mb-1">
                      {language === 'en' ? 'Core Challenge Addressed:' : 'Défi Majeur Adressé :'}
                    </strong>
                    {language === 'en' ? project.problem_en : project.problem_fr}
                  </div>
                </div>

                {/* Objectifs */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#92278F]" />
                    <span>{language === 'en' ? 'Project Objectives' : 'Objectifs du Projet'}</span>
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {language === 'en' ? project.objectives_en : project.objectives_fr}
                  </p>
                </div>

                {/* Activités */}
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                    {language === 'en' ? 'Activities Implemented' : 'Activités & Actions Déployées'}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {language === 'en' ? project.activities_en : project.activities_fr}
                  </p>
                </div>

                {/* Résultats attendus & obtenus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                    <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#92278F]" />
                      <span>{language === 'en' ? 'Expected Results' : 'Résultats Attendus'}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {language === 'en' ? project.expected_results_en : project.expected_results_fr}
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-purple-50/60 border border-purple-100">
                    <h3 className="font-bold text-base text-[#92278F] mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#FF8C00]" />
                      <span>{language === 'en' ? 'Results Achieved' : 'Résultats Obtenus'}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {language === 'en' ? project.achieved_results_en : project.achieved_results_fr}
                    </p>
                  </div>
                </div>

                {/* Bénéficiaires */}
                <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                  <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF8C00]" />
                    <span>{language === 'en' ? 'Beneficiaries' : 'Bénéficiaires Directs & Indirects'}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {language === 'en' ? project.beneficiaries_en : project.beneficiaries_fr}
                  </p>
                </div>

                {/* Photo Gallery if any */}
                {project.photos && project.photos.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 font-heading">
                      {language === 'en' ? 'Field Gallery' : 'Galerie Photos du Projet'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {project.photos.map((url, i) => (
                        <motion.div
                          key={i}
                          whileHover="hover"
                          className="rounded-xl overflow-hidden h-48 bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:shadow-lg transition-shadow duration-300"
                        >
                          <motion.img
                            src={url}
                            alt={`${project.title_fr} - Photo ${i + 1}`}
                            className="w-full h-full object-cover"
                            variants={{
                              hover: { scale: 1.08 },
                            }}
                            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            loading="lazy"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Partners, Financial Partner & Documents */}
              <div className="lg:col-span-4 space-y-6">
                {/* Partners Card */}
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#92278F]" />
                    <span>Partenaires & Bailleurs</span>
                  </h3>

                  <div>
                    <span className="text-xs text-gray-500 font-medium block mb-1">
                      Partenaires opérationnels :
                    </span>
                    <ul className="space-y-1">
                      {project.partners.map((p, idx) => (
                        <li key={idx} className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {project.financial_partner && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500 font-medium block mb-1">
                        Partenaire Financier / Bailleur :
                      </span>
                      <p className="text-xs font-bold text-[#92278F]">
                        {project.financial_partner}
                      </p>
                    </div>
                  )}
                </div>

                {/* Documents Card */}
                {project.documents && project.documents.length > 0 && (
                  <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-4">
                    <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider border-b border-purple-200 pb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#92278F]" />
                      <span>Documents Associés</span>
                    </h3>

                    <div className="space-y-2">
                      {project.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          download
                          onClick={(e) => {
                            if (doc.url === '#') {
                              e.preventDefault();
                              alert(`Téléchargement de : ${doc.title}`);
                            }
                          }}
                          className="flex items-center justify-between p-3 rounded-lg bg-white border border-purple-100 hover:border-[#92278F] transition-all text-xs group"
                        >
                          <span className="font-medium text-gray-800 group-hover:text-[#92278F] line-clamp-1">
                            {doc.title}
                          </span>
                          <Download className="w-4 h-4 text-[#FF8C00] shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
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
