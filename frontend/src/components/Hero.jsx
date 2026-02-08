import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Hero = () => {
  const [banners, setBanners] = useState([]);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Pre-loaded default banner from assets - ALWAYS AVAILABLE
  const defaultBanner = {
    _id: 'default-banner',
    desktopImageUrl: assets.banner1,
    mobileImageUrl: assets.banner1,
    altText: 'Default banner image'
  };

  // Simple fetch function with better error handling
  const fetchBanners = async () => {
    if (hasFetchedRef.current) return;
    
    try {
      hasFetchedRef.current = true;
      setError(null);
      
      // Create axios instance with timeout
      const api = axios.create({
        baseURL: backendUrl,
        timeout: 3000,
      });
      
      const response = await api.get('/api/banners/active');
      
      if (response.data.success) {
        const data = response.data.data;
        
        if (Array.isArray(data) && data.length > 0) {
          const validBanners = data.filter(banner => 
            banner.desktopImageUrl && banner.mobileImageUrl
          );
          
          if (validBanners.length > 0) {
            // Sort by order
            const sortedBanners = validBanners.sort((a, b) => a.order - b.order);
            setBanners(sortedBanners);
          }
          // If no valid banners, keep default banner
        }
        // If no data, keep default banner
      }
      // If not successful, keep default banner
    } catch (err) {
      console.log('Failed to fetch banners:', err.message);
      setError(err.message);
      // Keep default banner on error
    }
  };

  // Start with default banner immediately
  useEffect(() => {
    // ALWAYS show default banner first
    setBanners([defaultBanner]);
    
    // Then fetch from backend with delay
    const timer = setTimeout(() => {
      fetchBanners();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Check screen size
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 1024) {
        setScreenSize('mobile');
      } else {
        setScreenSize('desktop');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle banner click
  const handleBannerClick = (banner) => {
    if (banner.linkUrl && banner.linkUrl !== '') {
      if (banner.openInNewTab) {
        window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(banner.linkUrl);
      }
    }
  };

  // Get image URL based on screen size
  const getImageUrl = (banner) => {
    if (!banner) return assets.banner1;
    
    if (screenSize === 'mobile' && banner.mobileImageUrl) {
      return banner.mobileImageUrl;
    }
    
    if (banner.desktopImageUrl) {
      return banner.desktopImageUrl;
    }
    
    return assets.banner1;
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
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 8000,
    pauseOnHover: false,
    arrows: false,
    fade: true,
    appendDots: dots => screenSize === 'mobile' ? <MobileCustomDots dots={dots} /> : <CustomDots dots={dots} />,
    customPaging: i => (
      <button 
        className="w-2 h-2 rounded-full bg-white/50 transition-all duration-300 hover:bg-white/80 hover:scale-110 focus:outline-none"
        aria-label={`Go to slide ${i + 1}`}
      />
    ),
    dotsClass: screenSize === 'mobile' 
      ? "slick-dots !flex !flex-row !static !w-auto !m-0 justify-center"
      : "slick-dots !flex !flex-col !static !w-auto !m-0",
  };

  // Banner Item Component - SIMPLIFIED
  const BannerItem = ({ banner, index }) => {
    const imageUrl = getImageUrl(banner);
    const isClickable = banner.linkUrl && banner.linkUrl !== '';

    return (
      <div 
        className="relative w-full"
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${banners.length}`}
        onClick={() => isClickable && handleBannerClick(banner)}
        style={{ 
          cursor: isClickable ? 'pointer' : 'default',
        }}
      >
        {/* Image container */}
        <div className="relative w-full" style={{
          height: screenSize === 'mobile' ? 'auto' : '90vh'
        }}>
          <img
            src={imageUrl}
            alt={banner.altText || "Banner image"}
            className={`w-full ${screenSize === 'mobile' ? 'h-auto' : 'h-full object-cover'}`}
            loading={index === 0 ? "eager" : "lazy"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = assets.banner1; // Fallback to default
            }}
          />
        </div>

        {/* Light overlay for better contrast (optional) - only on desktop */}
        {screenSize === 'desktop' && (
          <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
        )}

        {/* Accessibility indicator */}
        {isClickable && (
          <div className="sr-only">
            Clickable banner - {banner.openInNewTab ? 'Opens in new tab' : 'Navigate to link'}
          </div>
        )}
      </div>
    );
  };

  // ALWAYS show at least the default banner
  const displayBanners = banners.length > 0 ? banners : [defaultBanner];

  return (
    <div 
      className="relative w-full bg-gray-900" 
      aria-label="Featured banners"
      role="region"
      aria-roledescription="carousel"
    >
      <style>{`
        .slick-dots li.slick-active button {
          background: white !important;
          transform: scale(1.2);
        }
        .slick-slider, .slick-list, .slick-track {
          height: auto !important;
        }
        .slick-slide > div {
          height: auto !important;
        }
        .slick-slide {
          background: transparent !important;
        }
        .slick-track {
          background: transparent !important;
          display: flex !important;
        }
        .slick-list {
          background: transparent !important;
          overflow: hidden !important;
        }
        
        /* Desktop specific styles */
        @media (min-width: 1024px) {
          .slick-slider, .slick-list, .slick-track {
            height: 90vh !important;
          }
          .slick-slide > div {
            height: 90vh !important;
          }
        }
        
        /* Hide dots if only one banner */
        .slick-dots[style*="display: none !important"] {
          display: none !important;
        }
      `}</style>
      
      {/* Container */}
      <div className="relative w-full">
        {displayBanners.length === 1 ? (
          // Single banner - no slider needed
          <BannerItem banner={displayBanners[0]} index={0} />
        ) : (
          // Multiple banners - use slider
          <Slider ref={sliderRef} {...settings}>
            {displayBanners.map((banner, index) => (
              <BannerItem 
                key={`${banner._id}-${index}`} 
                banner={banner} 
                index={index}
              />
            ))}
          </Slider>
        )}
        
        {/* Error message (debug only) */}
        {error && process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 right-4 bg-red-500/80 text-white text-xs p-2 rounded z-30">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;