// src/components/FacebookPixel.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const FacebookPixel = () => {
  const location = useLocation();
  
  useEffect(() => {
    import('react-facebook-pixel')
      .then((x) => x.default)
      .then((ReactPixel) => {
        ReactPixel.init('913853534399435'); // Your pixel ID
        ReactPixel.pageView(); // Track initial pageview
        
        // Advanced Matching (optional but recommended)
        ReactPixel.init('913853534399435', {}, {
          autoConfig: true,
          debug: false,
        });
      });
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null; 
};

export default FacebookPixel;