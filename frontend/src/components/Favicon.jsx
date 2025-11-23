import React, { useEffect, useState } from 'react';
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Favicon = () => {
  const [favicon, setFavicon] = useState('');

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
     
        const response = await axios.get(`${backendUrl}/api/business-details`);
        
        if (response.data.success && response.data.data?.logos?.favicon?.url) {
          const faviconUrl = response.data.data.logos.favicon.url;
          setFavicon(faviconUrl);
          updateDocumentFavicon(faviconUrl);
        
        
        }
      } catch (error) {
        console.error('❌ Error fetching favicon for customer website:', error);
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
        link.type = 'image/x-icon';
        link.href = faviconUrl;
        
        // Additional favicon for Apple devices
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = faviconUrl;
        
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