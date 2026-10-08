'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { DomainOfIntervention } from '@/types';
import {
  ShieldCheck,
  TrendingUp,
  HeartPulse,
  AlertCircle,
  Scale,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-[#92278F]" />,
  TrendingUp: <TrendingUp className="w-6 h-6 text-[#92278F]" />,
  HeartPulse: <HeartPulse className="w-6 h-6 text-[#92278F]" />,
  AlertCircle: <AlertCircle className="w-6 h-6 text-[#92278F]" />,
  Scale: <Scale className="w-6 h-6 text-[#92278F]" />,
  Users: <Users className="w-6 h-6 text-[#92278F]" />,
  Award: <Award className="w-6 h-6 text-[#92278F]" />,
};

export const DomainCards: React.FC = () => {
  const { language, t } = useLanguage();
  const [domains, setDomains] = useState<DomainOfIntervention[]>([]);

  useEffect(() => {
    supabaseStore.getDomains().then((res) => {
      setDomains(res.filter((d) => d.is_active));
    });
  }, []);

  return (
    <section className="py-20 bg-purple-50/20 backdrop-blur-xs border-b border-purple-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#92278F]">
              {t('domains.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 font-heading">
              {t('domains.title')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {t('domains.subtitle')}
            </p>
          </div>

          <Link
            href="/organisation/domaines"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#92278F] hover:text-[#741772] transition-colors self-start md:self-end"
          >
            <span>{t('domains.view_all')}</span>
            <ArrowRight className="w-4 h-4 text-[#FF8C00]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {domains.map((dom, idx) => (
            <motion.div
              key={dom.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#92278F]/60 transition-all hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 group-hover:bg-[#92278F] group-hover:text-white transition-all group-hover:scale-105">
                  {iconMap[dom.icon_name] || <ShieldCheck className="w-6 h-6 text-[#92278F]" />}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 font-heading leading-snug group-hover:text-[#92278F] transition-colors">
                  {language === 'en' ? dom.title_en : dom.title_fr}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                  {language === 'en' ? dom.short_desc_en : dom.short_desc_fr}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href={`/organisation/domaines#${dom.slug}`}
                  className="text-xs font-semibold text-[#92278F] group-hover:text-[#FF8C00] flex items-center gap-1 transition-colors"
                >
                  <span>{language === 'en' ? 'Learn more' : 'En savoir plus'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

