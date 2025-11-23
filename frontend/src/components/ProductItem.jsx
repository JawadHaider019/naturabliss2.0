import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { FaStar, FaStarHalf, FaRegStar } from 'react-icons/fa';

const ProductItem = ({ id, image, name, price, discount, rating, status = 'published' }) => {
  const { currency } = useContext(ShopContext);
  const navigate = useNavigate();

  // Don't render if product is not published
  if (status !== 'published') {
    return null;
  }

  const handleClick = () => {
    navigate(`/product/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderRating = (ratingValue = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStar size={14} />
          </span>
        );
      } else if (i - 0.5 <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStarHalf size={14} />
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaRegStar size={14} />
          </span>
        );
      }
    }
    return stars;
  };

  const actualPrice = discount ? discount : price; 

  return (
    <div onClick={handleClick} className="cursor-pointer text-gray-700">
      <div className="relative overflow-hidden">
        {discount && (
          <div className="absolute right-2 top-2 rounded-full bg-black px-2 py-1 text-xs font-medium text-white">
            {Math.round(((price - discount) / price) * 100)}% OFF
          </div>
        )}
        <img
          className="transition ease-in-out hover:scale-110"
          src={image}
          alt={name}
        />
      </div>
      <p className="pb-1 pt-3 text-sm">{name}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          {currency} {actualPrice.toFixed(2)}
        </p>
        {discount && (
          <p className="text-sm text-gray-500 line-through">
            {currency} {price.toFixed(2)}
          </p>
        )}
      </div>
      {rating > 0 && (
        <div className="mt-1 flex items-center gap-1">
          {renderRating(rating)}
          <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
        </div>
      )}
    </div>
  );
};

export default ProductItem;