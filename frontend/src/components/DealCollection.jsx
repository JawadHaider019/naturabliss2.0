import { useContext, useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import Title from './Title';
import DealItem from "./DealItem.jsx";
import axios from 'axios';
import Slider from "react-slick";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import Slick Carousel CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Memoized arrow components
const NextArrow = memo(({ onClick }) => (
  <button
    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-black/80 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors border border-white/20"
    onClick={onClick}
  >
    <FaChevronRight size={14} />
  </button>
));

const PrevArrow = memo(({ onClick }) => (
  <button
    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-black/80 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors border border-white/20"
    onClick={onClick}
  >
    <FaChevronLeft size={14} />
  </button>
));


const DealCollection = () => {
  const { backendUrl, currency, deals: contextDeals } = useContext(ShopContext);
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false); // Start as false for instant render
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);
  const mountedRef = useRef(true);

  // Use context deals immediately if available
  const initialDeals = useMemo(() => {
    return Array.isArray(contextDeals) ? contextDeals : [];
  }, [contextDeals]);

  // Memoized helper function
  const getDealTypeName = useCallback((dealType) => {
    return dealType || 'Deal';
  }, []);

  // Ultra-fast fetch with race conditions
  const fetchDeals = useCallback(async (signal) => {
    try {
      const response = await axios.get(`${backendUrl}/api/deal/list`, {
        timeout: 3000,
        signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      return response.data.success ? (response.data.deals || []) : [];
    } catch (error) {
      if (!axios.isCancel(error)) {
        throw error;
      }
    }
  }, [backendUrl]);

  // Process deals instantly with minimal logic
  const processedDeals = useMemo(() => {
    const source = deals.length > 0 ? deals : initialDeals;
    
    if (!source.length) return [];

    const now = Date.now();
    return source
      .filter(deal => {
        if (deal.status !== 'published') return false;
        
        const start = deal.dealStartDate ? new Date(deal.dealStartDate).getTime() : 0;
        const end = deal.dealEndDate ? new Date(deal.dealEndDate).getTime() : Infinity;
        
        return start <= now && end >= now;
      })
      .slice(0, 8); // Fixed limit for consistency
  }, [deals, initialDeals]);

  // Load deals in background without blocking render
  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    // Only fetch if we don't have initial deals
    if (initialDeals.length === 0) {
      setLoading(true);
      
      const loadDeals = async () => {
        try {
          const dealsData = await fetchDeals(controller.signal);
          if (mountedRef.current && dealsData.length > 0) {
            setDeals(dealsData);
          }
        } catch (err) {
          if (mountedRef.current && !axios.isCancel(err)) {
            // Silent error - don't show to user for better UX
          }
        } finally {
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      };

      // Small delay to allow initial render
      setTimeout(loadDeals, 100);
    } else {
      // We have initial deals, render immediately
      setDeals(initialDeals);
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [fetchDeals, initialDeals]);

  // Optimized click handler
  const handleDealClick = useCallback((dealId) => {
    navigate(`/deal/${dealId}`);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }, [navigate]);

  // Memoized view configuration
  const viewConfig = useMemo(() => {
    const count = processedDeals.length;
    const showSlider = count >= 3;
    
    const gridColumns = 
      count === 1 ? "grid-cols-1 max-w-xs mx-auto" :
      count === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
      "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-6xl mx-auto";

    const sliderSettings = {
      dots: count > 1,
      infinite: count > 3,
      speed: 400,
      slidesToShow: Math.min(3, count),
      slidesToScroll: 1,
      autoplay: count > 3,
      autoplaySpeed: 5000,
      pauseOnHover: true,
      arrows: false,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: Math.min(2, count),
          }
        },
        {
          breakpoint: 640,
          settings: {
            slidesToShow: 1,
          }
        }
      ],
      appendDots: dots => (
        <div className="mt-4">
          <ul className="flex justify-center space-x-1"> {dots} </ul>
        </div>
      ),
      customPaging: () => (
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
      )
    };

    return { showSlider, gridColumns, sliderSettings, count };
  }, [processedDeals.length]);

  // Memoized deals rendering
  const renderedDeals = useMemo(() => 
    processedDeals.map((deal) => (
      <DealItem
        key={deal._id}
        id={deal._id}
        image={deal.dealImages?.[0] }
        name={deal.dealName}
        price={deal.dealTotal || 0}
        discount={deal.dealFinalPrice || 0}
        rating={0}
        dealType={getDealTypeName(deal.dealType)}
        productsCount={deal.dealProducts?.length || 0}
        endDate={deal.dealEndDate}
        onDealClick={handleDealClick}
        currency={currency}
      />
    )), [processedDeals, getDealTypeName, handleDealClick, currency]
  );

  // Show content immediately with available data
  const hasContent = processedDeals.length > 0 || initialDeals.length > 0;

  // DON'T RENDER ANYTHING IF NO DEALS
  if (!hasContent && !loading) {
    return null;
  }

  if (!hasContent && loading) {
    return (
      <div className="my-12">
        <div className="py-2 text-center">
          <div className="text-3xl">
            <Title text1={'HOT'} text2={'DEALS'} />
          </div>
          {/* Added small line of text below heading */}
          <p className="text-[16px] text-gray-600 my-3 font-light">
    Trending Skincare Deals — Discover Organic Products Handcrafted with Care and Loved by All.
          </p>
        </div>
        
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  if (error && !hasContent) {
    return (
      <div className="my-12">
        <div className="py-4 text-center text-3xl">
          <Title text1={'HOT'} text2={'DEALS'} />
        </div>
        {/* Added small line of text below heading */}
        <p className="text-lg text-gray-600 font-light">
  Trending Skincare Deals — Discover Organic Products Handcrafted with Care and Loved by All.
        </p>
        <div className="text-center text-gray-500 py-4 text-sm">
          Check your connection
        </div>
      </div>
    );
  }

  return (
    <div className="my-12">
      <div className="py-4 text-center">
        <div className="text-3xl">
          <Title text1={'HOT'} text2={'DEALS'} />
        </div>
        {/* Added small line of text below heading */}
        <p className="text-[16px] text-gray-600  font-light">
  Trending Skincare Deals — Discover Organic Products Handcrafted with Care and Loved by All.
        </p>
      </div>

      {processedDeals.length === 0 ? (
        <div className="text-center text-gray-400 py-6 text-sm">
          No deals available
        </div>
      ) : viewConfig.showSlider ? (
        <div className="relative px-2 sm:px-4">
          <Slider ref={sliderRef} {...viewConfig.sliderSettings}>
            {processedDeals.map((deal) => (
              <div key={deal._id} className="px-1 sm:px-2">
                {renderedDeals.find(item => item.key === deal._id)}
              </div>
            ))}
          </Slider>
          
          {viewConfig.count > 3 && (
            <>
              <PrevArrow onClick={() => sliderRef.current?.slickPrev()} />
              <NextArrow onClick={() => sliderRef.current?.slickNext()} />
            </>
          )}
        </div>
      ) : (
        <div className={`grid ${viewConfig.gridColumns} gap-3 px-4`}>
          {renderedDeals}
        </div>
      )}
      
      {/* Invisible loading indicator */}
      {loading && (
        <div className="hidden">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
        </div>
      )}
    </div>
  );
};

export default memo(DealCollection);