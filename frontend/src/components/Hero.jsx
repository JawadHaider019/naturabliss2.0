import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';

const Hero = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const sliderRef = useRef(null);
  const mountedRef = useRef(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Ultra-fast fetch with immediate cache-first approach
  const fetchBanners = useCallback(async () => {
    const cacheKey = 'hero-banners-v3';
    const cacheTimeKey = `${cacheKey}-time`;
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // 1. IMMEDIATE: Try cache first (synchronous)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheTimeKey);
      
      if (cached && cacheTime) {
        const isFresh = Date.now() - parseInt(cacheTime) < CACHE_DURATION;
        if (isFresh) {
          const parsedData = JSON.parse(cached);
          if (mountedRef.current && parsedData.length > 0) {
            setBanners(parsedData);
            setIsUsingFallback(false);
            return; // Exit early if we have fresh cache
          }
        }
      }
    } catch (error) {
      // Silent cache failure
    }

    // 2. Only show loading if no cache exists
    if (mountedRef.current && banners.length === 0) {
      setLoading(true);
    }

    // 3. ASYNC: Fetch fresh data in background
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const response = await fetch(`${backendUrl}/api/banners/active`, {
        signal: controller.signal,
        headers: { 
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const validBanners = data.data.filter(banner => 
            banner.imageUrl && banner.headingLine1
          );
          
          if (mountedRef.current && validBanners.length > 0) {
            setBanners(validBanners);
            setIsUsingFallback(false);
            
            // Cache the new data
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(validBanners));
              sessionStorage.setItem(cacheTimeKey, Date.now().toString());
            } catch (cacheError) {
              // Silent cache failure
            }
          }
        }
      }
    } catch (err) {
      // Silent failure - we'll use cached data or show default
      if (!mountedRef.current) return;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [backendUrl]);

  // Fetch data on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Immediate fetch without blocking render
    const timer = setTimeout(() => {
      fetchBanners();
    }, 0);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [fetchBanners]);

  // Handle button click
  const handleButtonClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Static dots components
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

  // Static slider settings
  const settings = {
    dots: true,
    infinite: banners.length > 1,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 8000,
    pauseOnHover: false,
    arrows: false,
    fade: true,
    lazyLoad: 'progressive',
    cssEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    adaptiveHeight: false,
    touchThreshold: 15,
    swipe: true,
    swipeToSlide: true,
    accessibility: true,
    focusOnSelect: false,
    waitForAnimate: true,
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
        breakpoint: 768,
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

  // Optimized Banner Item with progressive loading
  const BannerItem = ({ banner, index }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Preload next images silently
    useEffect(() => {
      if (index < banners.length - 1) {
        const img = new Image();
        img.src = banners[index + 1].imageUrl;
      }
    }, [index, banners]);

    return (
      <section 
        className="relative w-full h-[90vh] overflow-hidden bg-black"
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${banners.length}`}
      >
        {/* Background Image with priority loading */}
        <div className="absolute inset-0 bg-black">
          <img
            src={banner.imageUrl}
            alt={banner.headingLine1 || "Natura Bliss Banner"}
            className="w-full h-full object-cover transition-opacity duration-500"
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            width="1920"
            height="1080"
            onLoad={(e) => {
              setImageLoaded(true);
              e.target.style.opacity = '1';
            }}
            onError={(e) => {
              // Silent fail - keep background black
              e.target.style.display = 'none';
              setImageLoaded(true); // Still show content
            }}
            style={{ 
              opacity: imageLoaded ? 1 : 0,
            }}
          />
        </div>

        {/* Dark Overlay - shows immediately for better UX */}
        <div className="absolute inset-0 bg-black/50 z-2"></div>

        {/* Content that shows immediately */}
        <div className="absolute inset-0 z-10">
          {/* Main Headline - Centered horizontally on mobile only */}
          <h1 className="text-oswald absolute top-10 left-1/2 transform -translate-x-1/2 md:left-16 md:transform-none text-6xl xs:text-6xl sm:text-6xl md:text-6xl lg:text-8xl font-extrabold text-white uppercase leading-none tracking-tighter text-center md:text-left w-full md:w-auto px-4 md:px-0">
            {banner.headingLine1}
            {banner.headingLine2 && (
              <>
                <br />
                <span className="pl-0 md:pl-[50px] mb-2 text-oswald text-holo block md:inline">
                  {banner.headingLine2}
                </span>
              </>
            )}
          </h1>

          <div className="absolute bottom-20 md:bottom-10 right-4 md:right-10 text-white mx-2 mt-2">
            {banner.subtext && (
              <p className="font-mono text-sm uppercase max-w-60 md:max-w-80 border-y border-white/70 py-2 text-white/90">
                {banner.subtext}
              </p>
            )}

            {banner.buttonText && banner.redirectUrl && (
              <div className="text-right relative z-30">
                <Link
                  to={banner.redirectUrl}
                  onClick={handleButtonClick}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm md:text-base font-semibold text-white lowercase transition-all duration-300 hover:text-gray-100 hover:scale-105 relative z-30 pointer-events-auto"
                  aria-label={`${banner.buttonText} - ${banner.headingLine1}`}
                  tabIndex={0}
                >
                  {banner.buttonText}
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-white text-black rounded-full">
                    <IoIosArrowForward size={16} />
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Loading indicator for individual banner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}

        {isUsingFallback && index === 0 && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-yellow-500/90 text-black text-xs px-2 py-1 rounded-full font-medium">
              Cached
            </div>
          </div>
        )}
      </section>
    );
  };

  // ALWAYS SHOW CONTENT - Never show "not found" or empty states to users
  const displayBanners = banners.length > 0 ? banners : [{
    _id: 'default-banner',
    imageUrl: 'banner1', // Empty for gradient fallback
    headingLine1: 'NATURA BLISS',
    headingLine2: 'Pure Organic Beauty',
    subtext: 'Discover the essence of natural skincare',
    buttonText: 'Explore Collection',
    redirectUrl: '/collection'
  }];

  // Minimal loading state that doesn't block content
  if (loading && banners.length === 0) {
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
      {isUsingFallback && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-yellow-500 text-black text-sm px-3 py-1 rounded-full font-medium shadow-lg">
            Offline Mode
          </div>
        </div>
      )}

      {/* Inline critical styles */}
      <style>{`
        .slick-dots li.slick-active button {
          background: white !important;
          transform: scale(1.2);
        }
        @media (max-width: 768px) {
          .slick-dots {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            position: absolute !important;
            bottom: 1.5rem !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: auto !important;
          }
        }
        .slick-slider, .slick-list, .slick-track {
          height: 100%;
        }
        .slick-slide > div {
          height: 100%;
        }
        .slick-slide[aria-hidden="true"] {
          visibility: hidden;
        }
        .slick-slide:not([aria-hidden="true"]) {
          visibility: visible;
        }
      `}</style>
      
      <Slider ref={sliderRef} {...settings}>
        {displayBanners.map((banner, index) => (
          <BannerItem key={`${banner._id}-${index}`} banner={banner} index={index} />
        ))}
      </Slider>
    </div>
  );
};

export default Hero;
