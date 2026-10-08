'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/lib/i18n';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function MentionsLegalesPage() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#92278F] hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-gray-900 font-heading">
              Mentions Légales
            </h1>
            <p className="text-xs text-gray-400">Dernière mise à jour : Octobre 2026</p>

            <div className="prose prose-purple text-gray-700 space-y-6 text-sm leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">1. Éditeur du Site</h2>
                <p>
                  Le présent site internet institutionnel est la propriété exclusive de l'Organisation Non Gouvernementale :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Dénomination officielle :</strong> AGISSONS POUR SAUVER – APS-BÉNIN</li>
                  <li><strong>Sigle :</strong> APS-BÉNIN</li>
                  <li><strong>Date de création :</strong> Septembre 2014</li>
                  <li><strong>Enregistrement officiel :</strong> Récépissé N°9/040PDM/SG/STCCD- du 20 septembre 2017 (Préfecture du Mono)</li>
                  <li><strong>Journal Officiel :</strong> JO N°21 du 1er Novembre 2017</li>
                  <li><strong>Identifiant Fiscal Unique (IFU) :</strong> 6 2022 1407 5648</li>
                  <li><strong>Siège social :</strong> Djacoṭé-Comè, Département du Mono, République du Bénin</li>
                  <li><strong>Boîte Postale :</strong> BP 69 Comè – République du Bénin</li>
                  <li><strong>Téléphones :</strong> +229 52 94 83 23 / +229 96 44 83 62</li>
                  <li><strong>Email :</strong> agissonspoursauver@gmail.com</li>
                  <li><strong>Directeur de publication :</strong> La Présidente / Directrice Exécutive d'APS-BÉNIN</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">2. Hébergement & Infrastructure</h2>
                <p>
                  Le site web est déployé sur une infrastructure cloud internationale sécurisée compatible Google Cloud Platform / Supabase, répondant aux normes industrielles de sécurité, de disponibilité et de redondance des données.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">3. Propriété Intellectuelle & Droits d'Auteur</h2>
                <p>
                  L’ensemble des contenus (textes, photographies d'activités, vidéos, chartes, rapports institutionnels, logos et éléments graphiques) figurant sur ce portail sont la propriété d'APS-BÉNIN ou font l'objet d'une autorisation d'utilisation.
                </p>
                <p>
                  Toute reproduction, représentation, diffusion ou rediffusion totale ou partielle sans autorisation écrite préalable d'APS-BÉNIN est strictement interdite conformément aux dispositions du Code de la Propriété Intellectuelle béninois et international.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">4. Liens Hypertextes</h2>
                <p>
                  Le site peut contenir des liens vers des sites tiers (partenaires institutionnels, ministères, organisations internationales). APS-BÉNIN n'exerce aucun contrôle sur le contenu de ces sites externes et décline toute responsabilité quant à leurs contenus ou pratiques.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
