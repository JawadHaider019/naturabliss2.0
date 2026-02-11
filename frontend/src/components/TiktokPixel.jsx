// src/components/TikTokPixel.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TikTokPixel = () => {
  const location = useLocation();

  // Initialize TikTok Pixel once
  useEffect(() => {
    if (window.ttq) return; // Already initialized

    const script = document.createElement("script");
    script.innerHTML = `
      !function(w,d,t){
        w.TiktokAnalyticsObject=t;
        var ttq=w[t]=w[t]||[];
        ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
        for(var i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.load=function(e,n){
          var r="https://analytics.tiktok.com/i18n/pixel/events.js";
          var s=document.createElement("script");
          s.type="text/javascript"; s.async=true;
          s.src=r+"?sdkid="+e+"&lib="+t;
          var f=document.getElementsByTagName("script")[0];
          f.parentNode.insertBefore(s,f);
        };
        ttq.load('D6507NJC77U8DQFBR5VG');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }, []);

  // Track page views on route change
  useEffect(() => {
    window.ttq?.page();
  }, [location.pathname]);

  return null;
};

export default TikTokPixel;
