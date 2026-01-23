import { useSEO } from '@/hooks/useSEO';
import type { SEOData } from '@/hooks/useSEO';

interface SEOProps {
  metadata?: SEOData;
}

/**
 * SEO component that updates document metadata based on current route
 * Should be placed inside BrowserRouter to access route information
 */
export const SEO = ({ metadata }: SEOProps) => {
  useSEO(metadata);
  return null;
};
