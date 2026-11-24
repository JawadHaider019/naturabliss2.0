// src/components/FacebookPixel.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { runAfterInteraction } from '../utils/thirdParty';

const FacebookPixel = () => {
  const location = useLocation();
  
  useEffect(() => {
    const initPixel = () => {
      import('react-facebook-pixel')
        .then((x) => x.default)
        .then((ReactPixel) => {
          ReactPixel.init('913853534399435', {}, {
            autoConfig: true,
            debug: false,
          });
          ReactPixel.pageView(); // Track initial pageview
        })
        .catch(() => {});
    };

    // Loaded after the first interaction so it does not compete with the page load
    runAfterInteraction(initPixel);
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