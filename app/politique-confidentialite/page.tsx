'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

export default function PolitiqueConfidentialitePage() {
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
              Politique de Confidentialité & Protection des Données
            </h1>
            <p className="text-xs text-gray-400">Dernière mise à jour : Octobre 2026</p>

            <div className="prose prose-purple text-gray-700 space-y-6 text-sm leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">1. Engagement Institutionnel</h2>
                <p>
                  L'organisation <strong>AGISSONS POUR SAUVER (APS-BÉNIN)</strong> accorde une importance primordiale à la protection de la vie privée et des données à caractère personnel de ses membres, bénéficiaires, partenaires et visiteurs, en conformité avec le Code du Numérique en République du Bénin (Loi N° 2017-20) et les standards internationaux applicables.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">2. Données Collectées</h2>
                <p>
                  Dans le cadre de l’utilisation de notre site institutionnel, les données collectées se limitent strictement aux informations transmises volontairement :
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Formulaire de contact : nom, prénom, adresse email, téléphone, objet et contenu de la demande ;</li>
                  <li>Dépôt de candidatures (recrutements, stages, consultations) : CV, lettres de motivation et justificatifs transmis par email.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">3. Finalité du Traitement</h2>
                <p>
                  Les données recueillies sont exploitées exclusivement par APS-BÉNIN pour traiter vos messages, instruire les candidatures, gérer les partenariats institutionnels et garantir l’assistance confidentielle aux survivantes de violences basées sur le genre.
                </p>
                <p>
                  <strong>Aucune donnée personnelle n’est cédée, vendue ou louée à des tiers à des fins commerciales.</strong>
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-gray-900">4. Vos Droits</h2>
                <p>
                  Conformément aux lois béninoises relatives à la protection des données personnelles, vous disposez d’un droit d’accès, de rectification, d’opposition et de suppression de vos données. Pour exercer ce droit, il vous suffit de contacter notre secrétariat par email à :
                </p>
                <p className="font-semibold text-[#92278F]">agissonspoursauver@gmail.com</p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
