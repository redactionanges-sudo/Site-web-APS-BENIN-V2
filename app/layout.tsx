import type { Metadata } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { ScrollToTop } from '@/components/ScrollToTop';
import { AfricanPatternCanvas } from '@/components/AfricanPatternCanvas';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-opensans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'APS-BÉNIN | Agissons Pour Sauver - Site Institutionnel Officiel',
  description: "Site web institutionnel officiel de l'organisation AGISSONS POUR SAUVER (APS-BÉNIN), engagée pour les droits humains, l'égalité du genre, la santé reproductive et l'autonomisation des communautés vulnérables à Comè et au Bénin.",
  openGraph: {
    title: 'APS-BÉNIN | Agissons Pour Sauver - Site Institutionnel Officiel',
    description: "Site web institutionnel officiel de l'organisation AGISSONS POUR SAUVER (APS-BÉNIN), engagée pour les droits humains, l'égalité du genre, la santé reproductive et l'autonomisation des communautés vulnérables à Comè et au Bénin.",
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APS-BÉNIN | Agissons Pour Sauver - Site Institutionnel Officiel',
    description: "Site web institutionnel officiel de l'organisation AGISSONS POUR SAUVER (APS-BÉNIN).",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${openSans.variable}`}>
      <body className="min-h-screen bg-[#FAF8FB] text-gray-900 font-sans antialiased selection:bg-[#92278F] selection:text-white relative" suppressHydrationWarning>
        <AfricanPatternCanvas />
        <AuthProvider>
          <LanguageProvider>
            <div className="relative z-10 flex flex-col min-h-screen">
              {children}
              <ScrollToTop />
            </div>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
