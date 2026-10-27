'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage, getLocalizedText } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { PhotoAlbum, MediaItem, ProjectItem } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { RichTextContent, LocalizedRichContent } from '@/components/RichTextContent';
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
  Film,
  Zap,
  FolderKanban,
  Image as ImageIcon,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { language, t } = useLanguage();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [parentProject, setParentProject] = useState<ProjectItem | null>(null);
  const [childActivities, setChildActivities] = useState<ProjectItem[]>([]);
  const [projectMedia, setProjectMedia] = useState<{
    albums: PhotoAlbum[];
    photos: MediaItem[];
    videos: MediaItem[];
    allMedia: MediaItem[];
  }>({ albums: [], photos: [], videos: [], allMedia: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseStore.getProjectBySlug(slug).then(async (res) => {
      setProject(res);
      setLoading(false);
      if (res) {
        trackEvent('view_project', {
          target_id: res.id,
          target_title: res.title_fr,
          path: `/projets/${slug}`,
        });

        // Load media (direct + linked albums)
        try {
          const media = await supabaseStore.getProjectMedia(res.id);
          setProjectMedia(media);
        } catch (e) {
          console.warn('Failed to load project media:', e);
        }

        // If activity and has parent project, load parent project
        if (res.publication_type === 'activity' && res.related_project_id) {
          try {
            const allProj = await supabaseStore.getProjects();
            const parent = allProj.find((p) => p.id === res.related_project_id);
            if (parent) setParentProject(parent);
          } catch (e) {
            console.warn('Failed to load parent project:', e);
          }
        }

        // If institutional project, load child activities
        if (res.publication_type !== 'activity') {
          try {
            const acts = await supabaseStore.getActivitiesByProject(res.id);
            setChildActivities(acts);
          } catch (e) {
            console.warn('Failed to load child activities:', e);
          }
        }
      }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Content not found' : 'Contenu introuvable'}
          </h1>
          <p className="text-gray-600 mb-6">
            {language === 'en'
              ? 'The requested project or activity does not exist or has been moved.'
              : 'Le projet ou l’activité recherché n’existe pas ou a été déplacé.'}
          </p>
          <Link
            href="/projets"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Back to projects & activities' : 'Retour aux projets & activités'}</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isActivity = project.publication_type === 'activity';

  // Merge direct photos and photos from associated albums/media without duplicates
  const allPhotoUrls: string[] = Array.from(
    new Set([
      ...(project.photos || []),
      ...projectMedia.photos.map((p) => p.url).filter(Boolean),
    ])
  ).filter((url) => typeof url === 'string' && url.trim().length > 0);

  // Merge direct videos and videos from associated media without duplicates
  const allVideoUrls: string[] = Array.from(
    new Set([
      ...(project.videos || []),
      ...projectMedia.videos.map((v) => v.url).filter(Boolean),
    ])
  ).filter((url) => typeof url === 'string' && url.trim().length > 0);

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
                {isActivity ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded bg-amber-500 text-white shadow-2xs">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Flagship Activity' : 'Activité phare de terrain'}</span>
                    {project.activity_category && <span>• {project.activity_category}</span>}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded bg-[#92278F] text-white shadow-2xs">
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Institutional Project' : 'Projet institutionnel'}</span>
                  </span>
                )}

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

              {/* Parent Project Linked Banner for Activities */}
              {isActivity && (parentProject || project.related_project_title) && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-900/80 border border-purple-400/40 text-xs text-purple-200">
                  <span className="text-purple-300">
                    {language === 'en' ? 'Conducted under the project:' : 'Menée dans le cadre du projet :'}
                  </span>
                  {parentProject ? (
                    <Link
                      href={`/projets/${parentProject.slug}`}
                      className="font-bold text-white hover:text-amber-300 underline inline-flex items-center gap-1"
                    >
                      <span>{getLocalizedText(parentProject.title_fr, parentProject.title_en, language)}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="font-bold text-white">{project.related_project_title}</span>
                  )}
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
                {getLocalizedText(project.title_fr, project.title_en, language)}
              </h1>

              <p className="text-base text-purple-100 max-w-3xl leading-relaxed">
                {getLocalizedText(project.excerpt_fr, project.excerpt_en, language)}
              </p>
            </div>
          </div>
        </section>

        {/* Project / Activity Meta Bar */}
        <section className="bg-gray-50 border-b border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#FF8C00] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">
                    {language === 'en' ? 'Target Communes' : 'Communes ciblées'}
                  </span>
                  <span className="font-bold text-gray-900">{project.communes.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#92278F] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">
                    {language === 'en' ? 'Execution Period' : 'Période d’exécution'}
                  </span>
                  <span className="font-bold text-gray-900">{project.period}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#FF8C00] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">
                    {language === 'en' ? 'Total Duration' : 'Durée totale'}
                  </span>
                  <span className="font-bold text-gray-900">{project.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#92278F] shrink-0" />
                <div>
                  <span className="text-gray-400 block font-medium">
                    {isActivity
                      ? language === 'en'
                        ? 'Participants / Direct'
                        : 'Participants / Directs'
                      : language === 'en'
                      ? 'Project Status'
                      : 'Statut du projet'}
                  </span>
                  <span className="font-bold text-gray-900 capitalize">
                    {isActivity && project.participants_count
                      ? project.participants_count
                      : project.status === 'in_progress'
                      ? t('projects.status_in_progress')
                      : project.status === 'completed'
                      ? t('projects.status_completed')
                      : t('projects.status_upcoming')}
                  </span>
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
                {/* Contexte & Problématique (Project specific) */}
                {!isActivity && (Boolean(project.context_fr || project.context_en || project.problem_fr || project.problem_en)) && (
                  <div className="space-y-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                      {language === 'en' ? 'Context & Problem Statement' : 'Contexte & Problématique'}
                    </h2>
                    {(project.context_fr || project.context_en) && (
                      <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                        <LocalizedRichContent fr={project.context_fr} en={project.context_en} />
                      </div>
                    )}
                    {(project.problem_fr || project.problem_en) && (
                      <div className="p-5 rounded-xl bg-orange-50/70 border border-orange-100 text-xs sm:text-sm text-gray-800">
                        <strong className="text-[#d97500] block mb-1 font-bold">
                          {language === 'en' ? 'Core Challenge Addressed:' : 'Défi Majeur Adressé :'}
                        </strong>
                        <LocalizedRichContent fr={project.problem_fr} en={project.problem_en} />
                      </div>
                    )}
                  </div>
                )}

                {/* Objectifs */}
                {Boolean(project.objectives_fr || project.objectives_en) && (
                  <div className="space-y-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#92278F]" />
                      <span>
                        {isActivity
                          ? language === 'en'
                            ? 'Specific Activity Objectives'
                            : "Objectifs spécifiques de l'activité"
                          : language === 'en'
                          ? 'Project Objectives'
                          : 'Objectifs du Projet'}
                      </span>
                    </h2>
                    <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      <LocalizedRichContent fr={project.objectives_fr} en={project.objectives_en} />
                    </div>
                  </div>
                )}

                {/* Activités / Déroulement des actions */}
                {Boolean(project.activities_fr || project.activities_en) && (
                  <div className="space-y-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                      {isActivity
                        ? language === 'en'
                          ? 'Implementation & Actions Taken'
                          : 'Déroulement & Actions Réalisées'
                        : language === 'en'
                        ? 'Activities Implemented'
                        : 'Activités & Actions Déployées'}
                    </h2>
                    <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      <LocalizedRichContent fr={project.activities_fr} en={project.activities_en} />
                    </div>
                  </div>
                )}

                {/* Résultats attendus & obtenus */}
                {(Boolean(project.expected_results_fr || project.expected_results_en) ||
                  Boolean(project.achieved_results_fr || project.achieved_results_en)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Boolean(project.expected_results_fr || project.expected_results_en) && (
                      <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                        <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2 font-heading">
                          <CheckCircle className="w-4 h-4 text-[#92278F]" />
                          <span>{language === 'en' ? 'Expected Results' : 'Résultats Attendus'}</span>
                        </h3>
                        <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          <LocalizedRichContent fr={project.expected_results_fr} en={project.expected_results_en} />
                        </div>
                      </div>
                    )}

                    {Boolean(project.achieved_results_fr || project.achieved_results_en) && (
                      <div className={`p-6 rounded-xl bg-purple-50/60 border border-purple-100 ${!project.expected_results_fr && !project.expected_results_en ? 'md:col-span-2' : ''}`}>
                        <h3 className="font-bold text-base text-[#92278F] mb-2 flex items-center gap-2 font-heading">
                          <CheckCircle className="w-4 h-4 text-[#FF8C00]" />
                          <span>
                            {isActivity
                              ? language === 'en'
                                ? 'Concrete Results & Immediate Impact'
                                : 'Résultats Concrets & Retombées Immédiates'
                              : language === 'en'
                              ? 'Results Achieved'
                              : 'Résultats Obtenus'}
                          </span>
                        </h3>
                        <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                          <LocalizedRichContent fr={project.achieved_results_fr} en={project.achieved_results_en} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bénéficiaires */}
                {Boolean(project.beneficiaries_fr || project.beneficiaries_en) && (
                  <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                    <h3 className="font-bold text-base text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#FF8C00]" />
                      <span>{language === 'en' ? 'Direct & Indirect Beneficiaries' : 'Bénéficiaires Directs & Indirects'}</span>
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      <LocalizedRichContent fr={project.beneficiaries_fr} en={project.beneficiaries_en} />
                    </div>
                  </div>
                )}

                {/* Observations & Perspectives (activity-focused) */}
                {Boolean(project.observations_fr || project.observations_en) && (
                  <div className="p-6 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <h3 className="font-bold text-base text-amber-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>{language === 'en' ? 'Observations & Perspectives' : 'Observations, Recommandations & Perspectives'}</span>
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <LocalizedRichContent fr={project.observations_fr} en={project.observations_en} />
                    </div>
                  </div>
                )}

                {/* Section: Child Activities Linked to this Project (for Projects only) */}
                {!isActivity && childActivities.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        <span>
                          {language === 'en'
                            ? `Key Activities under this Project (${childActivities.length})`
                            : `Activités Phares Menées dans ce Projet (${childActivities.length})`}
                        </span>
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {childActivities.map((act) => (
                        <Link
                          key={act.id}
                          href={`/projets/${act.slug}`}
                          className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/80 transition-all hover:shadow-md flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold mb-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-200/70">
                                <Zap className="w-3 h-3 text-amber-700" />
                                <span>{act.activity_category || 'Activité'}</span>
                              </span>
                              <span>{act.period}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#92278F] transition-colors line-clamp-2 mb-1">
                              {getLocalizedText(act.title_fr, act.title_en, language)}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {getLocalizedText(act.excerpt_fr, act.excerpt_en, language)}
                            </p>
                          </div>
                          <div className="pt-3 mt-3 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-[#92278F]">
                            <span>{act.communes.join(', ')}</span>
                            <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              <span>{language === 'en' ? 'View details' : 'Voir l’activité'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Associated Médiathèque Albums */}
                {projectMedia.albums.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#92278F]" />
                        <span>
                          {language === 'en'
                            ? `Associated Photo Albums (${projectMedia.albums.length})`
                            : `Albums Photos Associés dans la Médiathèque (${projectMedia.albums.length})`}
                        </span>
                      </h3>
                      <Link
                        href="/mediatheque"
                        className="text-xs font-bold text-[#92278F] hover:text-[#FF8C00] transition-colors"
                      >
                        {language === 'en' ? 'Explore all in Médiathèque →' : 'Voir toute la médiathèque →'}
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {projectMedia.albums.map((alb) => (
                        <div
                          key={alb.id}
                          className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs hover:shadow-md transition-shadow group flex flex-col"
                        >
                          <div className="relative h-40 bg-gray-100 overflow-hidden">
                            <img
                              src={alb.cover_image || project.main_image}
                              alt={alb.title_fr}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {alb.media_count} {language === 'en' ? 'media' : 'médias'}
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">
                                {getLocalizedText(alb.title_fr, alb.title_en, language)}
                              </h4>
                              {alb.description_fr && (
                                <p className="text-xs text-gray-500 line-clamp-2">
                                  {getLocalizedText(alb.description_fr, alb.description_en, language)}
                                </p>
                              )}
                            </div>
                            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                              <span>{alb.created_at ? new Date(alb.created_at).getFullYear() : ''}</span>
                              <Link
                                href="/mediatheque"
                                className="font-bold text-[#92278F] hover:underline"
                              >
                                {language === 'en' ? 'Open album' : 'Consulter'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Gallery (Direct + Combined from Associated Albums) */}
                {allPhotoUrls.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#92278F]" />
                      <span>
                        {language === 'en'
                          ? `Field Gallery (${allPhotoUrls.length} photos)`
                          : `Galerie Photos du Terrain (${allPhotoUrls.length} photos)`}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {allPhotoUrls.map((url, i) => (
                        <motion.div
                          key={i}
                          whileHover="hover"
                          className="rounded-xl overflow-hidden h-44 bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:shadow-lg transition-shadow duration-300"
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

                {/* Video Gallery / Associated Videos if any */}
                {allVideoUrls.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
                      <Film className="w-5 h-5 text-[#FF8C00]" />
                      <span>
                        {language === 'en'
                          ? `Videos & Documentaries (${allVideoUrls.length})`
                          : `Vidéos & Reportages Associés (${allVideoUrls.length})`}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {allVideoUrls.map((vUrl, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                          <VideoPlayer
                            url={vUrl}
                            title={`${project.title_fr} - Vidéo ${idx + 1}`}
                            poster={allPhotoUrls[idx] || project.main_image}
                          />
                        </div>
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
                    <span>{language === 'en' ? 'Partners & Donors' : 'Partenaires & Bailleurs'}</span>
                  </h3>

                  {project.partners && project.partners.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500 font-medium block mb-1">
                        {language === 'en' ? 'Operational partners:' : 'Partenaires opérationnels :'}
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
                  )}

                  {project.financial_partner && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500 font-medium block mb-1">
                        {language === 'en' ? 'Financial Partner / Donor:' : 'Partenaire Financier / Bailleur :'}
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
                      <span>{language === 'en' ? 'Associated Documents' : 'Documents Associés'}</span>
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
