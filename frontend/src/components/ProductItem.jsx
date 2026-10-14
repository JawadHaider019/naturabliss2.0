import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { FaStar, FaStarHalf, FaRegStar, FaPlus } from 'react-icons/fa';

const ProductItem = ({ id, slug, image, name, price, discount, rating, status = 'published', className = '', onClick }) => {
  const { currency, addToCart } = useContext(ShopContext);
  const navigate = useNavigate();

  // Don't render if product is not published
  if (status !== 'published') {
    return null;
  }

  const numPrice = Number(price) || 0;
  const numDiscount = Number(discount);
  const hasDiscount = !isNaN(numDiscount) && numDiscount > 0 && numDiscount < numPrice;
  const actualPrice = hasDiscount ? numDiscount : numPrice;
  const discountPercentage = hasDiscount ? Math.round(((numPrice - numDiscount) / numPrice) * 100) : 0;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }

    // Facebook Pixel: Track product view
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [id],
        content_name: name,
        content_type: 'product',
        value: actualPrice,
        currency: 'PKR',
        content_category: 'Product',
        has_discount: hasDiscount,
        discount_percentage: discountPercentage > 0 ? discountPercentage : undefined
      });

      console.log('📊 Facebook Pixel: Product view tracked', {
        product: name,
        price: actualPrice,
        id: id
      });
    }

    // Navigate to product page
    navigate(`/product/${slug || id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(id, 1);
  };

  const renderRating = (ratingValue = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStar size={12} />
          </span>
        );
      } else if (i - 0.5 <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStarHalf size={12} />
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaRegStar size={12} />
          </span>
        );
      }
    }
    return stars;
  };

  return (
    <div onClick={handleClick} className={`group cursor-pointer text-gray-700 flex flex-col h-full w-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 pb-2 ${className}`}>
      {/* Fixed aspect ratio container for consistent image size */}
      <div className="relative overflow-hidden w-full aspect-square bg-white flex items-center justify-center">
        {hasDiscount && discountPercentage > 0 && (
          <div className="absolute right-2 top-2 z-10 bg-[#587a3b] px-2 py-1 text-xs font-semibold text-white shadow-sm">
            {discountPercentage}% OFF
          </div>
        )}
        <img
          className="w-full h-full object-contain transition-transform duration-300 ease-in-out group-hover:scale-105"
          src={image}
          alt={name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/fallback-image.jpg";
          }}
        />
      </div>

      <div className="flex flex-col flex-grow pt-3 pb-1 px-2">
        {/* Title - large font */}
        <h3 className="text-base sm:text-xl  text-black line-clamp-1 group-hover:text-[#587a3b] transition-colors leading-tight" title={name}>
          {name}
        </h3>

        {/* Rating directly below title */}
        <div className="mt-1 min-h-[18px] flex items-center">
          {rating > 0 && (
            <div className="flex items-center gap-1">
              {renderRating(rating)}
              <span className="text-xs font-medium text-gray-500 ml-1">({rating.toFixed(1)})</span>
            </div>
          )}
        </div>

        {/* Price on left side (large) & + Add to Cart icon button on right side */}
        <div className="flex items-center justify-between mt-2 pt-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg md:text-xl font-semibold text-black">
              {currency} {actualPrice}
            </span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-gray-400 line-through hidden sm:inline font-normal">
                {currency} {numPrice}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            title="Add to cart"
            className="bg-[#587a3b] hover:bg-[#46622f] text-white w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer shadow-sm active:scale-95"
            aria-label={`Add ${name} to cart`}
          >
            <FaPlus className="text-xs sm:text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;