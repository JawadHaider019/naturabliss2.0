import { useState, useEffect, useMemo, useCallback, memo, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalf, FaRegStar, FaClock, FaFire } from "react-icons/fa";
import { ShopContext } from "../context/ShopContext";

// Pre-calculated deal type configurations
const DEAL_TYPE_CONFIG = {
  "flash-sale": { label: "FLASH SALE", color: "bg-red-600 text-white", icon: FaFire },
  seasonal: { label: "SEASONAL", color: "bg-green-600 text-white" },
  clearance: { label: "CLEARANCE", color: "bg-orange-600 text-white" },
  bundle: { label: "BUNDLE", color: "bg-purple-600 text-white" },
  featured: { label: "FEATURED", color: "bg-blue-600 text-white" },
  buyonegetone: { label: "BOGO", color: "bg-pink-600 text-white" },
  daily_deal: { label: "DAILY DEAL", color: "bg-indigo-600 text-white" },
  weekly_special: { label: "WEEKLY SPECIAL", color: "bg-teal-600 text-white" },
};

// ---------------- Flip Countdown Components ----------------
const FlipUnit = ({ value }) => (
  <div className="relative w-8 h-10 sm:w-10 sm:h-12 perspective-200">
    <AnimatePresence mode="popLayout">
      <motion.div
        key={value}
        initial={{ rotateX: 90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        exit={{ rotateX: -90, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-black text-white  flex items-center justify-center text-lg sm:text-xl font-bold shadow-md"
      >
        {value}
      </motion.div>
    </AnimatePresence>
  </div>
);

const FlipCountdown = ({ days, hours, minutes, seconds, showDays, showSeconds }) => {
  const format = (num) => num.toString().padStart(2, "0").split("");

  const d = format(days || 0);
  const h = format(hours || 0);
  const m = format(minutes || 0);
  const s = format(seconds || 0);

  return (
    <div className="flex items-center justify-center gap-1 text-black  px-3 py-2">
      {/* Days - only show if showDays is true */}
      {showDays && (
        <>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <FlipUnit value={d[0]} />
              <FlipUnit value={d[1]} />
            </div>
            <span className="text-black">days</span>
          </div>
          <span className="font-bold text-lg pb-6">:</span>
        </>
      )}

      {/* Hours */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <FlipUnit value={h[0]} />
          <FlipUnit value={h[1]} />
        </div>
        <span className="text-black">hours</span>
      </div>
      <span className="font-bold text-lg pb-6">:</span>

      {/* Minutes */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <FlipUnit value={m[0]} />
          <FlipUnit value={m[1]} />
        </div>
        <span className="text-black">mins</span>
      </div>

      {/* Seconds - only show when showSeconds is true */}
      {showSeconds && (
        <>
          <span className="font-bold text-lg pb-6">:</span>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <FlipUnit value={s[0]} />
              <FlipUnit value={s[1]} />
            </div>
            <span className="text-black">sec</span>
          </div>
        </>
      )}
    </div>
  );
};

// ---------------- Rating Stars (Updated to match ProductItem) ----------------
const RatingStars = memo(({ rating = 0 }) => {
  const stars = useMemo(() => {
    const starsArray = [];
    const numericRating = Number(rating) || 0;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= numericRating) {
        starsArray.push(
          <span key={i} className="text-yellow-400">
            <FaStar size={14} />
          </span>
        );
      } else if (i - 0.5 <= numericRating) {
        starsArray.push(
          <span key={i} className="text-yellow-400">
            <FaStarHalf size={14} />
          </span>
        );
      } else {
        starsArray.push(
          <span key={i} className="text-yellow-400">
            <FaRegStar size={14} />
          </span>
        );
      }
    }
    return starsArray;
  }, [rating]);

  return <div className="flex items-center gap-1">{stars}</div>;
});

// ---------------- Countdown Timer ----------------
const CountdownTimer = memo(({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [expired, setExpired] = useState(false);
  const [showDays, setShowDays] = useState(false);
  const [showSeconds, setShowSeconds] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const diff = new Date(endDate) - Date.now();
      
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft({});
        return;
      }

      // Calculate all time units
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      // Show days if more than 1 day remaining, hide seconds
      const shouldShowDays = days > 0;
      const shouldShowSeconds = days === 0; // Hide seconds when showing days

      setShowDays(shouldShowDays);
      setShowSeconds(shouldShowSeconds);

      setExpired(false);
      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="mt-3 p-3 flex flex-col items-center">
      <AnimatePresence mode="wait">
        {expired ? (
          <motion.div
            key="expired"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-gray-600 font-bold text-center uppercase bg-gray-100 border border-gray-300 rounded-md px-4 py-2"
          >
            ⚠️ Deal Expired
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 text-red-600 font-bold text-lg uppercase">
              <FaClock size={20} />
              <span>Ends In:</span>
            </div>
            <FlipCountdown
              days={timeLeft.days}
              hours={timeLeft.hours}
              minutes={timeLeft.minutes}
              seconds={timeLeft.seconds}
              showDays={showDays}
              showSeconds={showSeconds}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ---------------- Deal Item ----------------
const DealItem = memo(
  ({
    id,
    image,
    name,
    price = 0,
    discount = 0,
    rating = 0,
    dealType,
    productsCount = 0,
    endDate,
    onDealClick,
    currency,
  }) => {
    const { getDealRatingInfo, deals } = useContext(ShopContext);
    
    // Get rating from ShopContext - this ensures we have the latest rating data
    const dealRatingInfo = useMemo(() => {
      return getDealRatingInfo(id);
    }, [getDealRatingInfo, id, deals]);

    // Use context rating if available, otherwise fallback to prop
    const finalRating = dealRatingInfo.rating || rating;
    const reviewCount = dealRatingInfo.reviewCount || 0;

    const {
      dealTypeSlug,
      dealTypeBadge,
      displayPrice,
      hasDiscount,
      discountPercentage,
      savingsAmount,
      isFlashSale,
    } = useMemo(() => {
      let typeSlug = "deal";
      let typeName = "Deal";

      if (dealType) {
        if (typeof dealType === "object") {
          typeSlug = dealType.slug || "deal";
          typeName = dealType.name || "Deal";
        } else {
          typeSlug = dealType;
          typeName = dealType;
        }
      }

      const badgeConfig =
        DEAL_TYPE_CONFIG[typeSlug] || { label: typeName.toUpperCase(), color: "bg-gray-600 text-white" };

      const finalPrice = discount > 0 && discount < price ? discount : price;
      const hasDisc = discount > 0 && discount < price;
      const discountPct = hasDisc ? Math.round(((price - discount) / price) * 100) : 0;
      const savings = hasDisc ? price - discount : 0;

      return {
        dealTypeSlug: typeSlug,
        dealTypeBadge: badgeConfig,
        displayPrice: finalPrice,
        hasDiscount: hasDisc,
        discountPercentage: discountPct,
        savingsAmount: savings,
        isFlashSale: typeSlug === "flash-sale",
      };
    }, [dealType, price, discount]);

    const handleClick = useCallback(() => onDealClick?.(id), [onDealClick, id]);

    const handleImageError = useCallback((e) => {
      e.target.src = "/images/fallback-image.jpg";
    }, []);

    // Enhanced rating normalization
    const normalizedRating = useMemo(() => {
      const numRating = Number(finalRating);
      
      // Check if rating is valid number between 0-5
      if (isNaN(numRating) || numRating < 0) return 0;
      if (numRating > 5) return 5;
      
      return numRating;
    }, [finalRating]);

    return (
      <div
        onClick={handleClick}
        className="relative cursor-pointer bg-white border border-gray-300 group hover:border-black transition-all duration-200"
      >
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start">
          <div className={`rounded-full px-2 py-1 text-xs ${dealTypeBadge.color}`}>
            {dealTypeBadge.label}
          </div>
          {hasDiscount && (
            <div className="rounded-full bg-black text-white px-2 py-1 text-xs">
              {discountPercentage}% OFF
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50">
          <img
            className="w-full h-49 object-cover transition-transform duration-300 group-hover:scale-105"
            src={image}
            alt={name}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
          />
          {productsCount > 0 && (
            <div className="absolute left-2 bottom-2 bg-black/80 text-white px-2 py-1 text-xs font-medium rounded">
              {productsCount} item{productsCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors leading-tight">
            {name}
          </h3>

          {/* UPDATED: Match ProductItem exactly - conditional display with same styling */}
          {normalizedRating > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <RatingStars rating={normalizedRating} />
              <span className="text-xs text-gray-500 ml-1">({normalizedRating.toFixed(1)})</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-red-600">
              {currency} {displayPrice.toFixed(2)}
            </p>
            {hasDiscount && (
              <p className="text-sm text-gray-500 line-through font-medium">
                {currency} {price.toFixed(2)}
              </p>
            )}
          </div>

          {hasDiscount && (
            <div className="text-xs text-green-600 font-medium">
              You save {currency} {savingsAmount.toFixed(2)}
            </div>
          )}

          {isFlashSale && endDate && <CountdownTimer endDate={endDate} />}

          <div className="pt-2">
            <button className="w-full bg-black text-white py-2 text-sm font-semibold hover:bg-gray-800 transition-colors duration-200 uppercase tracking-wide">
              View Deal
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default DealItem;