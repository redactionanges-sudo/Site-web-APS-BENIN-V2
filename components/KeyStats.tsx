'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { supabaseStore } from '@/lib/supabase';
import { KeyStatistic } from '@/types';
import { Calendar, CheckCircle2, Users, MapPin, Handshake } from 'lucide-react';

interface CounterProps {
  valueString: string;
  duration?: number;
}

const AnimatedNumber: React.FC<CounterProps> = ({ valueString, duration = 1800 }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Parse numeric part and suffix/prefix (e.g. "12 500+", "35+", "2014")
  const numericMatch = valueString.replace(/\s/g, '').match(/^(\D*)(\d+)(\D*)$/);
  const prefix = numericMatch ? numericMatch[1] : '';
  const rawTarget = numericMatch ? parseInt(numericMatch[2], 10) : 0;
  const suffix = numericMatch ? numericMatch[3] : '';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.25 }
    );

    const currentElem = elementRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated || !rawTarget) {
      if (hasAnimated && !rawTarget) setDisplayValue(valueString);
      return;
    }

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * rawTarget);

      // Format thousands with space if > 999
      const formatted = current >= 1000 ? current.toLocaleString('fr-FR') : current.toString();
      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Ensure final exact value
        const finalFormatted =
          rawTarget >= 1000 ? rawTarget.toLocaleString('fr-FR') : rawTarget.toString();
        setDisplayValue(`${prefix}${finalFormatted}${suffix}`);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasAnimated, rawTarget, prefix, suffix, duration, valueString]);

  return <span ref={elementRef}>{displayValue || valueString}</span>;
};

export const KeyStats: React.FC = () => {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<KeyStatistic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    supabaseStore.getStatistics().then((data) => {
      if (isMounted) {
        // Only display published statistics sorted by order_index
        const published = (data || [])
          .filter((s) => s.is_published !== false)
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        setStats(published);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const getIcon = (key: string) => {
    switch (key) {
      case 'creation_year':
        return <Calendar className="w-6 h-6 text-[#FF8C00]" />;
      case 'projects_count':
        return <CheckCircle2 className="w-6 h-6 text-[#FF8C00]" />;
      case 'beneficiaries':
        return <Users className="w-6 h-6 text-[#FF8C00]" />;
      case 'communes_covered':
        return <MapPin className="w-6 h-6 text-[#FF8C00]" />;
      case 'partners_count':
        return <Handshake className="w-6 h-6 text-[#FF8C00]" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-[#FF8C00]" />;
    }
  };

  if (!loading && stats.length === 0) {
    return null;
  }

  // Determine grid columns dynamically based on stats count (1 to 6)
  const gridColsClass =
    stats.length <= 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
      : stats.length === 3
      ? 'grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto'
      : stats.length === 4
      ? 'grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';

  return (
    <section className="bg-white/70 backdrop-blur-xs py-14 border-b border-gray-100 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#92278F] bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
            {t('stats.title')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 font-heading">
            {t('stats.subtitle')}
          </h2>
          <div className="w-12 h-1 bg-[#FF8C00] mx-auto mt-3 rounded-full" />
        </div>

        <div className={`grid ${gridColsClass} gap-4 sm:gap-6`}>
          {stats.map((st) => {
            const desc = language === 'en' ? (st.description_en || st.description_fr) : st.description_fr;
            return (
              <div
                key={st.id}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-purple-50/40 to-white border border-purple-100/70 hover:border-[#92278F]/40 transition-all duration-300 hover:shadow-md group hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xs border border-purple-100 mb-4 group-hover:scale-110 group-hover:bg-purple-50 transition-all">
                  {getIcon(st.key)}
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#92278F] font-heading tracking-tight">
                  <AnimatedNumber valueString={st.value} />
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-800 mt-2 leading-snug">
                  {language === 'en' ? (st.label_en || st.label_fr) : st.label_fr}
                </span>
                {desc && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
