import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from './Title';
import ProductItem from "./ProductItem";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);

  // Use useMemo to filter and process products
  const processedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    try {
      // Filter out draft products and only show published products
      const publishedProducts = products.filter(product => {
        const isPublished = product.status === 'published' || !product.status;
        return isPublished;
      });

      // Remove duplicate products by ID and get latest 8 from published products
      const uniqueProducts = publishedProducts.filter((product, index, self) =>
        index === self.findIndex(p => p._id === product._id)
      );
      
      const latestUniqueProducts = uniqueProducts.slice(0, 100);

      return latestUniqueProducts;

    } catch (err) {
      return [];
    }
  }, [products]);

  useEffect(() => {
    setLatestProducts(processedProducts);
  }, [processedProducts]);

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
    const count = latestProducts.length;
    if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto";
    return "grid-cols-2 sm:grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto";
  };

  // Enhanced Slick Slider settings with max 4 products
  const sliderSettings = {
    dots: true,
    infinite: latestProducts.length > 1,
    speed: 500,
    slidesToShow: Math.min(4, latestProducts.length),
    slidesToScroll: 1,
    autoplay: latestProducts.length > Math.min(4, latestProducts.length),
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
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(4, latestProducts.length),
          slidesToScroll: 1,
          infinite: latestProducts.length > 4,
          autoplay: latestProducts.length > 4,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(3, latestProducts.length),
          slidesToScroll: 1,
          infinite: latestProducts.length > 3,
          autoplay: latestProducts.length > 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(2, latestProducts.length),
          slidesToScroll: 1,
          infinite: latestProducts.length > 2,
          autoplay: latestProducts.length > 2,
          dots: true
        }
      },
      {
        breakpoint: 480, // Changed from 640 to 480 for better mobile targeting
        settings: {
          slidesToShow: Math.min(2, latestProducts.length), // Changed from 1 to 2
          slidesToScroll: 1,
          infinite: latestProducts.length > 2, // Updated condition for 2 slides
          autoplay: latestProducts.length > 2, // Updated condition for 2 slides
          dots: latestProducts.length > 2, // Updated condition for 2 slides
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
      return latestProducts.length > 2; // Changed from > 1 to > 2
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return latestProducts.length > 2;
    }
    return latestProducts.length > 4;
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
  }, [latestProducts.length]);

  if (loading) {
    return (
      <div className="my-16 md:my-24">
        <div className="py-2 text-center text-2xl md:text-3xl">
          <Title text1={'LATEST'} text2={'COLLECTIONS'} />
        </div>
        <div className="text-center text-gray-500 py-8">
          Loading latest collections...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-16 md:my-24">
        <div className="py-4 text-center text-2xl md:text-3xl">
          <Title text1={'LATEST'} text2={'COLLECTIONS'} />
         <p className="text-[14px] md:text-[16px] text-gray-600 font-light px-2">
   Experience the Beauty of Nature with Natura Bliss's Newest Organic Skincare Collection
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
        <Title text1={'LATEST'} text2={'COLLECTIONS'} />
        <p className="text-[14px] md:text-[16px] text-gray-600 font-light px-4 max-w-2xl mx-auto">
   Experience the Beauty of Nature with Natura Bliss's Newest Organic Skincare Collection
  </p>
      </div>

      {latestProducts.length === 0 ? (
        <div className="text-center text-gray-500 py-8 px-4">
          No products available at the moment.
        </div>
      ) : showSlider ? (
        <div className="relative px-2 sm:px-4">
          <Slider ref={sliderRef} {...sliderSettings}>
            {latestProducts.map((item) => (
              <div key={item._id} className="px-1 sm:px-2">
                <div className="mx-1 h-full">
                  <div className="h-full flex">
                    <ProductItem
                      id={item._id}
                      image={item.image && item.image.length > 0 ? item.image[0] : "/images/fallback-image.jpg"}
                      name={item.name}
                      price={item.price}
                      discount={item.discountprice}
                      rating={item.rating || 0}
                      status={item.status}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </Slider>
          
          {latestProducts.length > Math.min(4, latestProducts.length) && (
            <>
              <PrevArrow onClick={() => sliderRef.current?.slickPrev()} />
              <NextArrow onClick={() => sliderRef.current?.slickNext()} />
            </>
          )}
        </div>
      ) : (
        <div className={`grid ${getGridColumns()} gap-4 sm:gap-6 gap-y-8 px-4 sm:px-6`}>
          {latestProducts.map((item) => (
            <div key={item._id} className="flex justify-center">
              <ProductItem
                id={item._id}
                image={item.image && item.image.length > 0 ? item.image[0] : "/images/fallback-image.jpg"}
                name={item.name}
                price={item.price}
                discount={item.discountprice}
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

export default LatestCollection;