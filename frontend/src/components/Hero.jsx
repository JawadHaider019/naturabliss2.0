import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

// Pre-loaded default banner from local assets - ALWAYS AVAILABLE INSTANTLY
const defaultBanner = {
  _id: 'default-banner',
  desktopImageUrl: assets.desktopBanner,
  mobileImageUrl: assets.mobileBanner,
  altText: 'Natura Bliss Natural & Organic Skincare'
};

// Helper to preload an image into browser cache
const preloadImage = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    img.src = url;
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
};

const Hero = () => {
  const [banners, setBanners] = useState([defaultBanner]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [screenSize, setScreenSize] = useState(() => 
    (typeof window !== 'undefined' && window.innerWidth < 1024) ? 'mobile' : 'desktop'
  );
  const sliderRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch banners from backend and PRELOAD before swapping
  const fetchBanners = async () => {
    if (hasFetchedRef.current) return;
    
    try {
      hasFetchedRef.current = true;
      
      const api = axios.create({
        baseURL: backendUrl,
        timeout: 4000,
      });
      
      const response = await api.get('/api/banners/active');
      
      if (response.data?.success) {
        const data = response.data.data;
        
        if (Array.isArray(data) && data.length > 0) {
          const validBanners = data.filter(banner => 
            banner.desktopImageUrl && banner.mobileImageUrl
          );
          
          if (validBanners.length > 0) {
            const sortedBanners = validBanners.sort((a, b) => a.order - b.order);
            
            // PRELOAD all banner images into browser cache first!
            // This prevents ANY blank / white / black gap during state switch
            const preloadPromises = sortedBanners.map(b => [
              preloadImage(b.desktopImageUrl),
              preloadImage(b.mobileImageUrl)
            ]).flat();
            
            await Promise.all(preloadPromises);
            
            // Now that images are 100% in browser memory, update state
            setBanners(sortedBanners);
            setIsDbLoaded(true);
            return;
          }
        }
      }
    } catch (err) {
      console.log('Using local fallback banner:', err.message);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Screen resize listener
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize(width < 1024 ? 'mobile' : 'desktop');
    };
    
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle banner click
  const handleBannerClick = (banner) => {
    if (banner?.linkUrl) {
      if (banner.openInNewTab) {
        window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(banner.linkUrl);
      }
    }
  };

  // Get image URL based on screen size with Cloudinary optimization
  const getImageUrl = (banner) => {
    const fallbackImage = screenSize === 'mobile' ? assets.mobileBanner : assets.desktopBanner;
    if (!banner) return fallbackImage;
    
    if (screenSize === 'mobile' && banner.mobileImageUrl) {
      return getOptimizedImageUrl(banner.mobileImageUrl, { width: 750, quality: 'auto' });
    }
    
    if (screenSize !== 'mobile' && banner.desktopImageUrl) {
      return getOptimizedImageUrl(banner.desktopImageUrl, { width: 1400, quality: 'auto' });
    }
    
    const fallback = banner.desktopImageUrl || banner.mobileImageUrl || fallbackImage;
    return getOptimizedImageUrl(fallback, { width: screenSize === 'mobile' ? 750 : 1400, quality: 'auto' });
  };

  // Custom dots components
  const CustomDots = ({ dots }) => (
    <div className="absolute left-4 md:left-16 bottom-10 md:bottom-20 z-20 flex flex-col gap-1">
      <ul className="flex flex-col gap-1 m-0 p-0 md:flex-col md:gap-1">
        {dots}
      </ul>
    </div>
  );

  const MobileCustomDots = ({ dots }) => (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
      <ul className="flex flex-row gap-2 m-0 p-0">
        {dots}
      </ul>
    </div>
  );

  // Slider settings
  const settings = {
    dots: true,
    infinite: banners.length > 1,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 8000,
    pauseOnHover: false,
    arrows: false,
    fade: true,
    accessibility: false,
    appendDots: dots => screenSize === 'mobile' ? <MobileCustomDots dots={dots} /> : <CustomDots dots={dots} />,
    customPaging: i => (
      <button 
        className="p-2 inline-flex items-center justify-center focus:outline-none"
        aria-label={`Go to slide ${i + 1}`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white/60 transition-all duration-300 hover:bg-[#587a3b] hover:scale-110 shadow-sm block" />
      </button>
    ),
    dotsClass: screenSize === 'mobile' 
      ? "slick-dots !flex !flex-row !static !w-auto !m-0 justify-center"
      : "slick-dots !flex !flex-col !static !w-auto !m-0",
  };

  // Banner Item Component
  const BannerItem = ({ banner, index }) => {
    const imageUrl = getImageUrl(banner);
    const fallbackImage = screenSize === 'mobile' ? assets.mobileBanner : assets.desktopBanner;
    const isClickable = banner?.linkUrl && banner.linkUrl !== '';

    return (
      <div 
        className="relative w-full select-none"
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${banners.length}`}
        onClick={() => isClickable && handleBannerClick(banner)}
        style={{ 
          cursor: isClickable ? 'pointer' : 'default',
        }}
      >
        <div 
          className="relative w-full overflow-hidden" 
          style={{
            height: screenSize === 'mobile' ? 'auto' : '90vh',
            aspectRatio: screenSize === 'mobile' ? '3 / 4' : 'auto'
          }}
        >
          <img
            src={imageUrl || fallbackImage}
            alt={banner?.altText || "Natura Bliss Banner"}
            width={screenSize === 'mobile' ? 750 : 1400}
            height={screenSize === 'mobile' ? 1000 : 700}
            className={`w-full ${screenSize === 'mobile' ? 'h-auto aspect-[3/4] object-cover block' : 'h-full object-cover'}`}
            loading="eager"
            fetchpriority="high"
            decoding="sync"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>

        {isClickable && (
          <div className="sr-only">
            Clickable banner - {banner.openInNewTab ? 'Opens in new tab' : 'Navigate to link'}
          </div>
        )}
      </div>
    );
  };

  const displayBanners = banners.length > 0 ? banners : [defaultBanner];

  return (
    <div 
      className="hero-slider-container relative w-full overflow-hidden" 
      aria-label="Featured banners"
      role="region"
      aria-roledescription="carousel"
      style={{
        backgroundColor: '#FAF8F5'
      }}
    >
      <style>{`
        .hero-slider-container {
          background-color: #FAF8F5 !important;
        }
        .hero-slider-container .slick-dots li.slick-active button {
          background: #587a3b !important;
          transform: scale(1.3);
          box-shadow: 0 0 8px rgba(88, 122, 59, 0.7);
        }
        .hero-slider-container .slick-slider, 
        .hero-slider-container .slick-list, 
        .hero-slider-container .slick-track {
          height: auto !important;
          background: transparent !important;
        }
        .hero-slider-container .slick-slide > div {
          height: auto !important;
          background: transparent !important;
        }
        .hero-slider-container .slick-slide {
          background: transparent !important;
          display: block !important;
        }
        .hero-slider-container .slick-track {
          background: transparent !important;
          display: flex !important;
        }
        .hero-slider-container .slick-list {
          background: transparent !important;
          overflow: hidden !important;
        }
        
        /* Desktop specific styles */
        @media (min-width: 1024px) {
          .hero-slider-container .slick-slider, 
          .hero-slider-container .slick-list, 
          .hero-slider-container .slick-track {
            height: 90vh !important;
          }
          .hero-slider-container .slick-slide > div {
            height: 90vh !important;
          }
        }
        
        /* Hide dots if only one banner */
        .hero-slider-container .slick-dots[style*="display: none !important"] {
          display: none !important;
        }
      `}</style>
      
      {/* Fallback Image Layer: Always immediately rendered underneath until DB banners are ready */}
      {!isDbLoaded && (
        <div className="w-full">
          <BannerItem banner={defaultBanner} index={0} />
        </div>
      )}

      {/* Main Banner Slider Layer */}
      {isDbLoaded && (
        <div className="relative w-full transition-opacity duration-500 ease-in opacity-100">
          {displayBanners.length === 1 ? (
            <BannerItem banner={displayBanners[0]} index={0} />
          ) : (
            <Slider ref={sliderRef} {...settings}>
              {displayBanners.map((banner, index) => (
                <BannerItem 
                  key={`${banner._id || 'banner'}-${index}`} 
                  banner={banner} 
                  index={index}
                />
              ))}
            </Slider>
          )}
        </div>
      )}
    </div>
  );
};

export default Hero;