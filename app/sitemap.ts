import { MetadataRoute } from 'next';
import { initialProjects, initialNews, initialOpportunities } from '@/lib/initial-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || 'https://aps-benin.org';

  const staticRoutes = [
    '',
    '/organisation/presentation',
    '/organisation/histoire',
    '/organisation/mission-vision-valeurs',
    '/organisation/domaines',
    '/organisation/equipe',
    '/organisation/gouvernance',
    '/organisation/documents',
    '/projets',
    '/actualites',
    '/opportunites',
    '/mediatheque/photos',
    '/mediatheque/videos',
    '/partenaires',
    '/contact',
    '/mentions-legales',
    '/politique-confidentialite',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const projectRoutes = initialProjects.map((p) => ({
    url: `${baseUrl}/projets/${p.slug}`,
    lastModified: new Date(p.updated_at || p.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const newsRoutes = initialNews.map((n) => ({
    url: `${baseUrl}/actualites/${n.slug}`,
    lastModified: new Date(n.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const opportunityRoutes = initialOpportunities.map((o) => ({
    url: `${baseUrl}/opportunites/${o.slug}`,
    lastModified: new Date(o.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes, ...newsRoutes, ...opportunityRoutes];
}
