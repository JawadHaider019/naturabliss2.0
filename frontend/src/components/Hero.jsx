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

  // Pre-defined default banner - shown immediately
  const defaultBanner = {
    _id: 'default-banner',
    desktopImageUrl: assets.banner1,
    mobileImageUrl: assets.banner1,
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

  // Start with default banner, then fetch from backend
  useEffect(() => {
    // Show default banner immediately
    setBanners([defaultBanner]);
    setIsLoading(false);
    
    // Fetch from backend after a short delay
    const timer = setTimeout(() => {
      fetchBanners();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Check screen size - show mobile banner on tablets too
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // Mobile: < 768px, Tablet: 768px - 1024px, Desktop: > 1024px
      if (width < 1024) {
        setScreenSize('mobile'); // Show mobile banner on both mobile and tablet
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
      // Show mobile image on both mobile phones and tablets
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

  // Slider settings - responsive breakpoints
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
        breakpoint: 1024, // Tablet and below
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

  // Banner Item Component
  const BannerItem = ({ banner, index }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageUrl = getImageUrl(banner);
    
    useEffect(() => {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
    }, [imageUrl]);

    // Determine if banner is clickable
    const isClickable = banner.linkUrl && banner.linkUrl !== '';

    // Adjust height based on screen size
    const bannerHeight = screenSize === 'mobile' ? 'h-[70vh] md:h-[80vh]' : 'h-[90vh]';

    return (
      <div 
        className={`relative w-full overflow-hidden bg-black ${bannerHeight}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${banners.length}`}
        onClick={() => isClickable && handleBannerClick(banner)}
        style={{ 
          cursor: isClickable ? 'pointer' : 'default',
        }}
      >
        {/* Background Image */}
        <div className="absolute inset-0 bg-black">
          <img
            src={imageUrl}
            alt="Banner"
            className="w-full h-full object-cover transition-opacity duration-300"
            loading={index === 0 ? "eager" : "lazy"}
            style={{ 
              opacity: imageLoaded ? 1 : 0.7,
            }}
          />
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Loading indicator for backend images */}
        {!imageLoaded && banner._id !== 'default-banner' && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {/* Accessibility indicator for clickable banners */}
        {isClickable && (
          <div className="sr-only">
            Clickable banner - {banner.openInNewTab ? 'Opens in new tab' : 'Navigate to link'}
          </div>
        )}
      </div>
    );
  };

  // ALWAYS SHOW CONTENT - Never show "not found" or empty states to users
  const displayBanners = banners.length > 0 ? banners : [defaultBanner];

  // Minimal loading state that doesn't block content
  if (isLoading && banners.length === 0) {
    return (
      <section className="relative w-full h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-white/70">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden" 
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
        /* Add subtle hover effect for clickable banners */
        .clickable-banner:hover img {
          transform: scale(1.01);
          transition: transform 0.3s ease;
        }
      `}</style>
      
      <Slider ref={sliderRef} {...settings}>
        {displayBanners.map((banner, index) => (
          <BannerItem 
            key={`${banner._id}-${index}`} 
            banner={banner} 
            index={index}
            className={banner.linkUrl ? 'clickable-banner' : ''}
          />
        ))}
      </Slider>
    </div>
  );
};

export default Hero;