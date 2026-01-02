import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Hero = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const sliderRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Create axios instance
  const api = axios.create({
    baseURL: backendUrl,
    timeout: 5000,
  });

  // Pre-loaded default banner from assets - ALWAYS AVAILABLE
  const defaultBanner = {
    _id: 'default-banner',
    desktopImageUrl: assets.banner1,
    mobileImageUrl: assets.banner1,
    altText: 'Default banner image'
  };

  // Simple fetch function
  const fetchBanners = async () => {
    if (hasFetchedRef.current) return;
    
    try {
      hasFetchedRef.current = true;
      
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
        }
      }
    } catch (err) {
      console.log('Failed to fetch banners, using default');
    } finally {
      setIsLoading(false);
    }
  };

  // Start with default banner immediately - NO DELAY
  useEffect(() => {
    // ALWAYS show default banner first
    setBanners([defaultBanner]);
    setIsLoading(false);
    
    // Then fetch from backend
    setTimeout(() => {
      fetchBanners();
    }, 100);
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
    appendDots: dots => <CustomDots dots={dots} />,
    customPaging: i => (
      <button 
        className="w-2 h-2 rounded-full bg-white/50 transition-all duration-300 hover:bg-white/80 hover:scale-110 focus:outline-none"
        aria-label={`Go to slide ${i + 1}`}
      />
    ),
    dotsClass: "slick-dots !flex !flex-col !static !w-auto !m-0",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: false,
          dots: true,
          appendDots: dots => <MobileCustomDots dots={dots} />,
          customPaging: i => (
            <button 
              className="w-2 h-2 rounded-full bg-white/50 transition-all duration-300 hover:bg-white/80 hover:scale-110 focus:outline-none"
              aria-label={`Go to slide ${i + 1}`}
            />
          ),
          dotsClass: "slick-dots !flex !flex-row !static !w-auto !m-0 justify-center"
        }
      }
    ]
  };

  // Banner Item Component - FIXED: No initial opacity 0
  const BannerItem = ({ banner, index }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageUrl = getImageUrl(banner);
    
    // Pre-load the image
    useEffect(() => {
      if (!imageUrl) {
        setImageLoaded(true);
        return;
      }
      
      // Check if image is already cached (default banner from assets)
      const img = new Image();
      
      // For default banner, assume it's already loaded since it's in assets
      if (banner._id === 'default-banner') {
        setImageLoaded(true);
        return;
      }
      
      img.src = imageUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => {
        console.warn(`Failed to load banner image: ${imageUrl}`);
        setImageLoaded(true); // Still show fallback
      };
    }, [imageUrl, banner._id]);

    const isClickable = banner.linkUrl && banner.linkUrl !== '';
    const bannerHeight = screenSize === 'mobile' ? 'h-[70vh] md:h-[80vh]' : 'h-[90vh]';

    return (
      <div 
        className={`relative w-full overflow-hidden ${bannerHeight}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${banners.length}`}
        onClick={() => isClickable && handleBannerClick(banner)}
        style={{ 
          cursor: isClickable ? 'pointer' : 'default',
        }}
      >
        {/* MAIN FIX: Always show image immediately with full opacity */}
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt={banner.altText || "Banner image"}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            // REMOVED: style={{ opacity: imageLoaded ? 1 : 0 }}
            // Now shows immediately at full opacity
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = assets.banner1; // Fallback to default
            }}
          />
        </div>

        {/* Light overlay for better contrast (optional) */}
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Loading spinner only for non-default banners */}
        {!imageLoaded && banner._id !== 'default-banner' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-5">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
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
      className="relative w-full overflow-hidden bg-gray-900" 
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
          height: 100%;
        }
        .slick-slide > div {
          height: 100%;
        }
        /* Ensure no black flashes */
        .slick-slide {
          background: transparent !important;
        }
        /* Make sure the track has no black background */
        .slick-track {
          background: transparent !important;
        }
        /* Prevent any black backgrounds in slick components */
        .slick-list {
          background: transparent !important;
        }
      `}</style>
      
      {/* Container with fallback background */}
      <div className="relative w-full h-full">
        <Slider ref={sliderRef} {...settings}>
          {displayBanners.map((banner, index) => (
            <BannerItem 
              key={`${banner._id}-${index}`} 
              banner={banner} 
              index={index}
            />
          ))}
        </Slider>
        
        {/* Fallback in case slider fails to render */}
        {displayBanners.length === 0 && (
          <div className="w-full h-[90vh] relative">
            <img
              src={assets.banner1}
              alt="Fallback banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;