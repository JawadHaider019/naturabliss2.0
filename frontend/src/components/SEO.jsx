import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = "Natura Bliss | 100% Pure Skincare & Cold-Pressed Oils in Pakistan";
const DEFAULT_DESC = "Shop 100% pure cold-pressed oils, herbal haircare & organic skincare in Pakistan. Chemical-free, cruelty-free. Cash on delivery available nationwide.";
const DEFAULT_IMAGE = "https://naturabliss.pk/logo.png";
const BASE_URL = "https://naturabliss.pk";

/**
 * SEO component for dynamically managing meta tags, title, OG/Twitter cards, and Schema.org JSON-LD
 */
const SEO = ({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  schema,
  noindex = false
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Document Title
    const finalTitle = title ? `${title} | Natura Bliss Pakistan` : DEFAULT_TITLE;
    document.title = title && title.includes('Natura Bliss') ? title : finalTitle;

    // Helper to create or update meta tags
    const setMeta = (name, content, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Primary Meta Description & Robots
    const finalDesc = description || DEFAULT_DESC;
    setMeta('description', finalDesc);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    // 3. Canonical Link
    const finalCanonical = canonical || `${BASE_URL}${location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonical);

    // 4. Open Graph Tags
    const finalImage = ogImage || DEFAULT_IMAGE;
    setMeta('og:title', document.title, true);
    setMeta('og:description', finalDesc, true);
    setMeta('og:image', finalImage, true);
    setMeta('og:url', finalCanonical, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', 'Natura Bliss Pakistan', true);
    setMeta('og:locale', 'en_PK', true);

    // 5. Twitter Card Tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', document.title);
    setMeta('twitter:description', finalDesc);
    setMeta('twitter:image', finalImage);

    // 6. Dynamic JSON-LD Schema
    const scriptId = 'page-dynamic-schema';
    let scriptTag = document.getElementById(scriptId);

    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    // Cleanup on unmount (restore default title)
    return () => {
      const dynamicScript = document.getElementById(scriptId);
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [title, description, canonical, ogType, ogImage, schema, noindex, location.pathname]);

  return null;
};

export default SEO;
