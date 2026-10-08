'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CallToAction } from '@/components/CallToAction';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { NewsItem } from '@/types';
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  AlertCircle,
  Play,
  FileText,
  Download,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function NewsDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { language, t } = useLanguage();
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseStore.getNewsBySlug(slug).then((res) => {
      setArticle(res);
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

  if (!article) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-12 h-12 text-[#FF8C00] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article introuvable</h1>
          <p className="text-gray-600 mb-6">L’actualité recherchée n’existe pas ou a été archivée.</p>
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#92278F] text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux actualités</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Article Header */}
        <section className="bg-gray-50 border-b border-gray-200 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-8">
            <Link
              href="/actualites"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#92278F] hover:underline mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('news.view_all')}</span>
            </Link>

            <div className="space-y-4">
              <span className="inline-block bg-[#92278F] text-white text-xs font-semibold px-3 py-1 rounded">
                {language === 'en' ? article.category_en : article.category_fr}
              </span>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 font-heading leading-tight">
                {language === 'en' ? article.title_en : article.title_fr}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-[#FF8C00]" />
                  <span>{formatDate(article.published_at)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <User className="w-4 h-4 text-[#92278F]" />
                  <span>{article.author}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Article Body */}
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
            {/* Featured Image */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-h-[460px] bg-gray-100">
              <img
                src={article.main_image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80'}
                alt={article.title_fr}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Excerpt */}
            <div className="p-6 rounded-xl bg-purple-50/60 border-l-4 border-[#92278F] text-sm sm:text-base text-gray-800 font-medium leading-relaxed italic">
              {language === 'en' ? article.summary_en : article.summary_fr}
            </div>

            {/* Rich content */}
            <div className="prose prose-purple max-w-none text-gray-700 leading-relaxed text-base whitespace-pre-line">
              {language === 'en' ? article.content_en : article.content_fr}
            </div>

            {/* Video embed if present */}
            {article.video_url && (
              <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#92278F]" />
                  <span>Vidéo associée</span>
                </h3>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Vidéo APS-BÉNIN"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Gallery if present */}
            {article.gallery && article.gallery.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  {language === 'en' ? 'Photo Gallery' : 'Galerie d’Images'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {article.gallery.map((img, i) => (
                    <motion.div
                      key={i}
                      whileHover="hover"
                      className="h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer shadow-xs hover:shadow-lg transition-shadow duration-300"
                    >
                      <motion.img
                        src={img}
                        alt={`${article.title_fr} ${i + 1}`}
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

            {/* Share and back buttons */}
            <div className="pt-8 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/actualites"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'en' ? 'Back to news' : 'Retour aux actualités'}</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({
                      title: article.title_fr,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Lien copié dans le presse-papier !');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#92278F] text-white text-xs font-bold hover:bg-[#741772] transition-colors"
              >
                <Share2 className="w-4 h-4 text-[#FF8C00]" />
                <span>Partager cet article</span>
              </button>
            </div>
          </div>
        </section>

        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}
