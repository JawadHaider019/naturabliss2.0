import React, { useEffect, useState } from 'react';
import { getBusinessDetails } from "../services/businessService";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Favicon = () => {
  const [favicon, setFavicon] = useState('');

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const data = await getBusinessDetails(backendUrl);
        if (data?.logos?.favicon?.url) {
          const faviconUrl = data.logos.favicon.url;
          setFavicon(faviconUrl);
          updateDocumentFavicon(faviconUrl);
        }
      } catch (error) {
        // Silent error
      }
    };

    if (backendUrl) {
      fetchFavicon();
    }
  }, []);

  const updateDocumentFavicon = (faviconUrl) => {
    if (faviconUrl) {
      try {
        // Remove existing favicons
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach(link => link.remove());
        
        // Create new favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        // Small sizes: the uploaded logo is ~512px / 67KB, far more than a tab icon needs
        link.href = getOptimizedImageUrl(faviconUrl, { width: 64, quality: 'auto', format: 'png' });

        // Additional favicon for Apple devices
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = getOptimizedImageUrl(faviconUrl, { width: 180, quality: 'auto', format: 'png' });
        
        document.head.appendChild(link);
        document.head.appendChild(appleTouchIcon);
        
  
      } catch (error) {
        console.error('❌ Error updating favicon in DOM:', error);
      }
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default Favicon;