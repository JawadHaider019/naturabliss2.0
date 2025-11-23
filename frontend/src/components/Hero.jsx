import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { IoIosArrowForward } from "react-icons/io";
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const Hero = () => {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const sliderRef = useRef(null);
  const hasFetchedRef = useRef(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Pre-defined default banner - shown immediately
  const defaultBanner = {
    _id: 'default-banner',
    imageUrl: assets.banner1,
    headingLine1: 'NATURA BLISS',
    headingLine2: 'Pure Organic Beauty',
    subtext: 'Discover the essence of natural skincare',
    buttonText: 'Explore Collection',
    redirectUrl: '/collection'
  };

  // Simple fetch function
  const fetchBanners = async () => {
    if (hasFetchedRef.current) return;
    
    try {
      hasFetchedRef.current = true;
      
      const response = await fetch(`${backendUrl}/api/banners/active`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const validBanners = data.data.filter(banner => 
            banner.imageUrl && banner.headingLine1
          );
          
          if (validBanners.length > 0) {
            setBanners(validBanners);
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
    
    // Fetch from backend after a short delay
    const timer = setTimeout(() => {
      fetchBanners();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleButtonClick = (e) => {
    e.stopPropagation();
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

  // Banner Item Component
  const BannerItem = ({ banner, index }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    
    useEffect(() => {
      const img = new Image();
      img.src = banner.imageUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(true);
    }, [banner.imageUrl]);

    return (
      <section 
        className="relative w-full h-[90vh] overflow-hidden bg-black"
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} of ${banners.length}`}
      >
        {/* Background Image */}
        <div className="absolute inset-0 bg-black">
          <img
            src={banner.imageUrl}
            alt={banner.headingLine1 || "Natura Bliss Banner"}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading={index === 0 ? "eager" : "lazy"}
            style={{ 
              opacity: imageLoaded ? 1 : 0.7,
            }}
          />
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 z-2"></div>

        {/* Content */}
        <div className="absolute inset-0 z-10">
          {/* Main Headline */}
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

          <div className="absolute bottom-5 md:bottom-10 right-4 md:right-10 text-white mx-2 mt-2">
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

        {/* Loading indicator for backend images */}
        {!imageLoaded && banner._id !== 'default-banner' && (
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </section>
    );
  };

  // ALWAYS SHOW CONTENT - Never show "not found" or empty states to users
  const displayBanners = banners.length > 0 ? banners : [{
    _id: 'default-banner',
    imageUrl: '', // Empty for gradient fallback
    headingLine1: 'NATURA BLISS',
    headingLine2: 'Pure Organic',
    subtext: 'Discover the essence of natural skincare',
    buttonText: 'Explore Collection',
    redirectUrl: '/collection'
  }];

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
      `}</style>
      
      <Slider ref={sliderRef} {...settings}>
        {banners.map((banner, index) => (
          <BannerItem key={`${banner._id}-${index}`} banner={banner} index={index} />
        ))}
      </Slider>
    </div>
  );
};

export default Hero;
