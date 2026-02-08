import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const BestSeller = () => {
  const { products } = useContext(ShopContext);
  const [bestSeller, setBestSeller] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);

  // Use useMemo to filter and process bestseller products
  const processedBestSellers = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    try {
      // Filter out draft products and only show published products
      const publishedProducts = products.filter(product => {
        const isPublished = product.status === 'published' || !product.status;
        return isPublished;
      });

      // STRICT filtering - only products explicitly marked as bestsellers
      const bestProducts = publishedProducts.filter((item) => {
        // Check each possible bestseller field explicitly
        const isExplicitBestSeller = 
          (item.bestseller === true || item.bestseller === "true") ||
          (item.bestSeller === true || item.bestSeller === "true") ||
          (item.best_seller === true || item.best_seller === "true") ||
          (item.isBestseller === true || item.isBestseller === "true") ||
          (item.isBestSeller === true || item.isBestSeller === "true");

        return isExplicitBestSeller;
      });


      if (bestProducts.length === 0) {
        return [];
      }
      const finalBestSellers = bestProducts.slice(0, 20);

      return finalBestSellers;

    } catch (err) {
      return [];
    }
  }, [products]);

  useEffect(() => {
    setBestSeller(processedBestSellers);
  }, [processedBestSellers]);

  // Custom Next Arrow Component - Hide on mobile
  const NextArrow = ({ onClick }) => {
    return (
      <button
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-black/90 hover:bg-black text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border border-white/20 hidden sm:flex"
        onClick={onClick}
        aria-label="Next products"
      >
        <FaChevronRight size={14} className="md:w-4 md:h-4" />
      </button>
    );
  };

  // Custom Previous Arrow Component - Hide on mobile
  const PrevArrow = ({ onClick }) => {
    return (
      <button
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-black/90 hover:bg-black text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border border-white/20 hidden sm:flex"
        onClick={onClick}
        aria-label="Previous products"
      >
        <FaChevronLeft size={14} className="md:w-4 md:h-4" />
      </button>
    );
  };

  // Fixed grid columns with consistent sizing
  const getGridColumns = () => {
    const count = bestSeller.length;
    if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto";
    return "grid-cols-2 sm:grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto";
  };

  // Enhanced Slick Slider settings with max 4 products
  const sliderSettings = {
    dots: true,
    infinite: bestSeller.length > 1,
    speed: 500,
    slidesToShow: Math.min(4, bestSeller.length),
    slidesToScroll: 1,
    autoplay: bestSeller.length > Math.min(4, bestSeller.length),
    autoplaySpeed: 4000,
    pauseOnHover: true,
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    arrows: false,
    variableWidth: false,
    centerMode: false,
    adaptiveHeight: false,
    responsive: [
      {
        breakpoint: 1536,
        settings: {
          slidesToShow: Math.min(4, bestSeller.length),
          slidesToScroll: 1,
          infinite: bestSeller.length > 4,
          autoplay: bestSeller.length > 4,
        }
      },
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(4, bestSeller.length),
          slidesToScroll: 1,
          infinite: bestSeller.length > 4,
          autoplay: bestSeller.length > 4,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(3, bestSeller.length),
          slidesToScroll: 1,
          infinite: bestSeller.length > 3,
          autoplay: bestSeller.length > 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, bestSeller.length),
          slidesToScroll: 1,
          infinite: bestSeller.length > 2,
          autoplay: bestSeller.length > 2,
          dots: true
        }
      },
      {
        breakpoint: 480, // Changed from 640 to 480 for better mobile targeting
        settings: {
          slidesToShow: Math.min(2, bestSeller.length), // Changed from 1 to 2
          slidesToScroll: 1,
          infinite: bestSeller.length > 2, // Updated from > 1 to > 2
          autoplay: bestSeller.length > 2, // Updated from > 1 to > 2
          dots: bestSeller.length > 2, // Updated from > 1 to > 2
          arrows: false,
          swipe: true,
          touchMove: true,
          adaptiveHeight: false
        }
      }
    ],
    appendDots: dots => (
      <div className="mt-6 md:mt-8">
        <ul className="flex justify-center space-x-1 md:space-x-2"> {dots} </ul>
      </div>
    ),
    customPaging: i => (
      <button 
        className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gray-300 transition-all duration-300 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label={`Go to slide ${i + 1}`}
      />
    )
  };

  // Determine if we should show slider based on current screen size logic
  const shouldShowSlider = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return bestSeller.length > 2; // Changed from > 1 to > 2
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return bestSeller.length > 2;
    }
    return bestSeller.length > 4;
  };

  const [showSlider, setShowSlider] = useState(false);

  // Update slider visibility on mount and resize
  useEffect(() => {
    const updateSliderVisibility = () => {
      setShowSlider(shouldShowSlider());
    };

    updateSliderVisibility();
    window.addEventListener('resize', updateSliderVisibility);
    
    return () => {
      window.removeEventListener('resize', updateSliderVisibility);
    };
  }, [bestSeller.length]);

  if (loading) {
    return (
      <div className="my-16 md:my-24">
        <div className="py-2 text-center text-2xl md:text-3xl">
          <Title text1={"BEST"} text2={"SELLERS"} />
        </div>
        <div className="text-center text-gray-500 py-8">
          Loading best sellers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-16 md:my-24">
        <div className="py-4 text-center text-2xl md:text-3xl">
          <Title text1={"BEST"} text2={"SELLERS"} />
          <p className="text-[14px] md:text-[16px] text-gray-600 font-light px-4">
From Nature to Your Shelf — Discover the Organic Skincare Products Everyone's Talking About.
          </p>
        </div>
        <div className="text-center text-red-500 py-8">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="my-16 md:my-24">
      <div className="py-2 text-center text-2xl md:text-3xl">
        <Title text1={"BEST"} text2={"SELLERS"} />
        <p className="text-[14px] md:text-[16px] text-gray-600 font-light px-4 max-w-2xl mx-auto">
From Nature to Your Shelf — Discover the Organic Skincare Products Everyone's Talking About.
        </p>
      </div>

      {bestSeller.length === 0 ? (
        <div className="text-center text-gray-500 py-8 px-4">
          No best sellers available at the moment. Check back soon!
        </div>
      ) : showSlider ? (
        <div className="relative px-2 sm:px-4">
          <Slider ref={sliderRef} {...sliderSettings}>
            {bestSeller.map((item) => (
              <div key={item._id || item.id} className="px-1 sm:px-2">
                <div className="mx-1 h-full">
                  <div className="h-full flex">
                    <ProductItem
                      id={item._id || item.id}
                      image={item.image && item.image.length > 0 ? item.image[0] : "/images/fallback-image.jpg"}
                      name={item.name || "Unnamed Product"}
                      price={item.price || 0}
                      discount={item.discountprice || item.discountPrice || 0}
                      rating={item.rating || 0}
                      status={item.status}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </Slider>
          
          {bestSeller.length > Math.min(4, bestSeller.length) && (
            <>
              <PrevArrow onClick={() => sliderRef.current?.slickPrev()} />
              <NextArrow onClick={() => sliderRef.current?.slickNext()} />
            </>
          )}
        </div>
      ) : (
        <div className={`grid ${getGridColumns()} gap-4 sm:gap-6 gap-y-8 px-4 sm:px-6`}>
          {bestSeller.map((item) => (
            <div key={item._id || item.id} className="flex justify-center">
              <ProductItem
                id={item._id || item.id}
                image={item.image && item.image.length > 0 ? item.image[0] : "/images/fallback-image.jpg"}
                name={item.name || "Unnamed Product"}
                price={item.price || 0}
                discount={item.discountprice || item.discountPrice || 0}
                rating={item.rating || 0}
                status={item.status}
                className="w-full max-w-xs sm:max-w-sm"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Fixed style tag without jsx attribute */}
      <style>
        {`
          .slick-slide > div {
            height: 100%;
          }
          .slick-track {
            display: flex !important;
          }
          .slick-slide {
            height: inherit !important;
          }
          /* Ensure proper spacing for 2 items on mobile */
          @media (max-width: 480px) {
            .slick-slide {
              padding: 0 8px;
            }
            .slick-list {
              margin: 0 -8px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default BestSeller;