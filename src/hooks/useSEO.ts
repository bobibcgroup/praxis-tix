import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOData {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = 'Praxis — Get Dressed Right';
const DEFAULT_DESCRIPTION = 'Praxis helps you choose what to wear, instantly. Smart outfits for real moments — powered by intelligent styling.';
const DEFAULT_OG_IMAGE = '/og-image.jpg';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : '';

// Route-specific metadata overrides
const ROUTE_METADATA: Record<string, SEOData> = {
  '/': {
    title: 'Praxis — Smart Styling, Instantly',
    description: 'Instant outfits for any moment. Or let Praxis Agent handle everything for you.',
  },
  '/landing': {
    title: 'Praxis — Smart Styling, Instantly',
    description: 'Instant outfits for any moment. Or let Praxis Agent handle everything for you.',
  },
  '/history': {
    title: 'Your Looks — Praxis',
    description: DEFAULT_DESCRIPTION,
  },
  '/profile': {
    title: 'My Style — Praxis',
    description: DEFAULT_DESCRIPTION,
  },
  '/favorites': {
    title: 'Favorites — Praxis',
    description: DEFAULT_DESCRIPTION,
  },
  '/settings': {
    title: 'Settings — Praxis',
    description: DEFAULT_DESCRIPTION,
  },
  '/dashboard': {
    title: 'Dashboard — Praxis',
    description: DEFAULT_DESCRIPTION,
  },
  '/agent': {
    title: 'Praxis Agent — Hands-free Styling',
    description: 'Tell Praxis Agent what you need. Get styled outfits automatically with an intelligent assistant.',
  },
  '/agent/capture': {
    title: 'Refine Fit & Color — Praxis Agent',
    description: 'Optional: Share a photo or video to refine your fit and color preferences.',
  },
  '/agent/results': {
    title: 'Your Looks — Praxis Agent',
    description: 'Here are your looks. Refine with natural language to get exactly what you want.',
  },
};

/**
 * Hook to manage SEO metadata dynamically based on current route
 */
export const useSEO = (customMetadata?: SEOData) => {
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    // Get route-specific metadata or use defaults
    const routeMetadata = ROUTE_METADATA[pathname] || {};
    const metadata = { ...routeMetadata, ...customMetadata };

    // Build title
    const title = metadata.title || DEFAULT_TITLE;
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Description
    const description = metadata.description || DEFAULT_DESCRIPTION;
    updateMetaTag('description', description);

    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', metadata.ogImage || `${SITE_URL}${DEFAULT_OG_IMAGE}`, true);
    updateMetaTag('og:type', metadata.ogType || 'website', true);
    updateMetaTag('og:url', `${SITE_URL}${pathname}`, true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', metadata.ogImage || `${SITE_URL}${DEFAULT_OG_IMAGE}`);

    // Canonical URL
    const canonical = metadata.canonical || `${SITE_URL}${pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // Robots
    if (metadata.noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }
  }, [pathname, customMetadata]);
};
