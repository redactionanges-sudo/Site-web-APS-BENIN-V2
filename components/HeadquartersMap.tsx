'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useSiteSettings, sanitizePhoneForTel } from '@/hooks/useSiteSettings';
import { CallHeadquartersCTA } from '@/components/CallHeadquartersCTA';

interface HeadquartersMapProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export const HeadquartersMap: React.FC<HeadquartersMapProps> = ({
  className = '',
  variant = 'full',
}) => {
  const { language } = useLanguage();
  const { addressLocation, postalBox, validPhones } = useSiteSettings();
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Coordonnées officielles du siège à Djacoṭé-Comè (Mono, Bénin)
  const latitude = 6.4074;
  const longitude = 1.8819;
  const coordsFormatted = '6°24\'26.6"N 1°52\'54.8"E';
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&hl=${language === 'en' ? 'en' : 'fr'}&z=15&output=embed`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${latitude}, ${longitude}`).then(() => {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    });
  };

  return (
    <section
      aria-label="Localisation du Siège Social d'APS-Bénin"
      className={`rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-xs ${className}`}
    >
      <div className="p-5 sm:p-6 bg-gradient-to-r from-gray-950 via-purple-950 to-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF8C00] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF8C00]">
              {language === 'en' ? 'Geographic Location' : 'Localisation Géographique'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-heading text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-[#FF8C00]" />
            <span>
              {language === 'en'
                ? 'Headquarters & Operational Office'
                : 'Siège National & Coordination Opérationnelle'}
            </span>
          </h3>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            {language === 'en'
              ? 'Visit our permanent offices in Comè or plan your route to meet our project team.'
              : 'Retrouvez nos bureaux permanents à Comè et planifiez votre venue pour échanger avec notre équipe.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF8C00] hover:bg-[#e07b00] text-gray-950 font-bold text-xs transition-all shadow-sm"
          >
            <Navigation className="w-4 h-4 text-gray-950" />
            <span>{language === 'en' ? 'Directions' : 'Itinéraire'}</span>
            <ExternalLink className="w-3 h-3 text-gray-950/70" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        <div className="lg:col-span-7 xl:col-span-8 relative min-h-[340px] sm:min-h-[420px] bg-gray-100">
          <iframe
            title="Carte d'accès au Siège Social d'APS-Bénin à Comè"
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '340px' }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full absolute inset-0"
          />

          <div className="absolute bottom-3 left-3 bg-gray-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-bold border border-white/10 shadow-lg hidden sm:flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#FF8C00]" />
            <span>Djacoṭé-Comè • Mono • Bénin</span>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 space-y-5 bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                {language === 'en' ? 'Physical Address' : 'Adresse Physique'}
              </span>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF8C00] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-snug">
                    {addressLocation || 'Djacoṭé-Comè, Département du Mono, République du Bénin'}
                  </p>
                  {postalBox && (
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{postalBox}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#92278F] block">
                  {language === 'en' ? 'GPS Coordinates' : 'Coordonnées GPS'}
                </span>
                <span className="font-mono text-xs font-bold text-gray-800">
                  {coordsFormatted}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-purple-200 text-[#92278F] text-[11px] font-bold hover:bg-purple-100 transition-colors"
                title="Copier les coordonnées GPS"
              >
                {copiedCoords ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{language === 'en' ? 'Copied' : 'Copié'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{language === 'en' ? 'Copy' : 'Copier'}</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                {language === 'en' ? 'Desk Hours' : 'Permanences & Horaires d’Ouverture'}
              </span>
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <Clock className="w-4 h-4 text-[#92278F] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {language === 'en'
                      ? 'Monday to Friday:'
                      : 'Du lundi au vendredi :'}
                  </p>
                  <p className="text-gray-600">
                    <strong>08h00 – 12h30</strong> & <strong>15h00 – 18h30</strong>
                  </p>
                  <p className="text-[11px] text-gray-500 italic mt-1">
                    {language === 'en'
                      ? 'Urgent GBV and human rights assistance available 7/7 by telephone.'
                      : 'Urgences VBG & assistance d’écoute joignables 7j/7 par téléphone.'}
                  </p>
                </div>
              </div>
            </div>

            {validPhones.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  {language === 'en' ? 'Phone Lines' : 'Lignes Directes'}
                </span>
                <div className="space-y-1.5">
                  {validPhones.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${sanitizePhoneForTel(phone)}`}
                      className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-[#92278F] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#FF8C00]" />
                      <span>{phone}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
            >
              <span>{language === 'en' ? 'Open in Maps' : 'Ouvrir sur Maps'}</span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </a>

            <CallHeadquartersCTA variant="secondary" />
          </div>
        </div>
      </div>
    </section>
  );
};
