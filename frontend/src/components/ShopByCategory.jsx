import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Title from "./Title";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop";

const ShopByCategory = () => {
  const [backendCategories, setBackendCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Fetch only actual categories from backend database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendURL}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          const catList = data.data || data.categories || data || [];
          if (Array.isArray(catList)) {
            setBackendCategories(catList);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    };

    if (backendURL) {
      fetchCategories();
    }
  }, [backendURL]);

  // Map each DB category to its name and category image
  const displayCategories = useMemo(() => {
    if (!backendCategories || backendCategories.length === 0) {
      return [];
    }

    return backendCategories.map((cat) => {
      const catName = (cat.name || cat.title || "").trim();
      const catId = cat._id || cat.id;

      // Use uploaded category image; fallback to DEFAULT_PLACEHOLDER if not uploaded
      const finalImage = cat.image?.trim() || DEFAULT_PLACEHOLDER;

      return {
        id: catId || catName,
        name: catName,
        displayName: catName.toUpperCase(),
        image: finalImage,
      };
    }).filter(cat => cat.name.length > 0);
  }, [backendCategories]);

  const handleCategoryClick = (categoryName) => {
    navigate(`/collection?category=${encodeURIComponent(categoryName)}`);
  };

  // Prevent layout shift while loading categories
  if (loading && displayCategories.length === 0) {
    return (
      <section className="my-10 md:my-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[260px]">
        <div className="py-2 text-center text-2xl md:text-3xl mb-6 sm:mb-10">
          <Title text1={"SHOP BY"} text2={"CATEGORY"} />
        </div>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center w-[140px] sm:w-[170px] md:w-[190px] lg:w-[200px]">
              <div className="w-full aspect-[4/5] bg-gray-200 animate-pulse rounded-sm" />
              <div className="mt-3.5 h-3 w-16 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <section className="my-10 md:my-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header - Standard Title style */}
      <div className="py-2 text-center text-2xl md:text-3xl mb-6 sm:mb-10">
        <Title text1={"SHOP BY"} text2={"CATEGORY"} />
      </div>

      {/* Categories Cards - Always Centered Flex Layout */}
      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">
        {displayCategories.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => handleCategoryClick(item.name)}
            className="group flex flex-col items-center cursor-pointer select-none w-[140px] sm:w-[170px] md:w-[190px] lg:w-[200px]"
          >
            {/* Edge-to-edge product category photo on warm beige background */}
            <div className="w-full aspect-[4/5] bg-[#F4F2EC] overflow-hidden relative rounded-sm shadow-sm transition-all duration-300 group-hover:shadow-md">
              <img
                src={getOptimizedImageUrl(item.image, { width: 280, quality: 'auto' })}
                alt={item.name}
                width="180"
                height="225"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                onError={(e) => {
                  e.target.src = DEFAULT_PLACEHOLDER;
                }}
              />
            </div>

            {/* Uppercase Category Label */}
            <p className="mt-3.5 text-[11px] sm:text-xs md:text-[13px] font-medium tracking-widest text-neutral-800 uppercase text-center group-hover:text-[#587a3b] transition-colors">
              {item.displayName}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ShopByCategory;
