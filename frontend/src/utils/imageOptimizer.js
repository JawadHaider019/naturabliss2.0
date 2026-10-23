/**
 * Utility to optimize image URLs, especially Cloudinary URLs, by injecting
 * automatic format (WebP/AVIF), quality compression, and responsive dimensions.
 */
export const getOptimizedImageUrl = (url, { width, height, quality = 'auto', format = 'auto', crop = 'limit' } = {}) => {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary optimization
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // Avoid double transformation if already present
    if (/\/upload\/[a-z]_[a-z0-9_,]+?\//.test(url)) {
      return url;
    }

    const transformations = [`f_${format}`, `q_${quality}`];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (width || height) transformations.push(`c_${crop}`);

    return url.replace('/upload/', `/upload/${transformations.join(',')}/`);
  }

  // Unsplash image optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const parsedUrl = new URL(url);
      if (width) parsedUrl.searchParams.set('w', String(width));
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('q', '80');
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  return url;
};
