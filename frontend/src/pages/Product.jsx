import { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import RelatedProduct from '../components/RelatedProduct';
import {
  FaStar,
  FaStarHalf,
  FaRegStar,
  FaWhatsapp,
  FaThumbsUp,
  FaThumbsDown,
  FaTimes,
  FaUserShield,
  FaCheckCircle,
  FaLeaf
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const Product = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, currency, addToCart, user, token, backendUrl } = useContext(ShopContext);

  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [filterRating, setFilterRating] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Categories & Variants State
  const [backendCategories, setBackendCategories] = useState([]);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Use ref to track if addToCart was called to prevent multiple calls
  const addToCartCalledRef = useRef(false);
  const whatsappButtonRef = useRef(null);

  // Email masking function
  const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return 'Unknown User';

    if (email.includes('***@') || !email.includes('@')) return email;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return email;

    const [localPart, domain] = email.split('@');

    if (localPart.length === 1) {
      return `${localPart}***@${domain}`;
    }

    const firstChar = localPart[0];
    const maskedLocalPart = firstChar + '***';

    return `${maskedLocalPart}@${domain}`;
  };

  // Fetch categories from backend for variants support
  useEffect(() => {
    const fetchCategories = async () => {
      if (!backendUrl) return;
      try {
        const response = await axios.get(`${backendUrl}/api/categories`);
        let categories = response.data;
        if (categories && categories.data && Array.isArray(categories.data)) {
          categories = categories.data;
        } else if (categories && categories.categories && Array.isArray(categories.categories)) {
          categories = categories.categories;
        }

        if (Array.isArray(categories)) {
          const transformed = categories.map((cat) => ({
            id: cat._id || cat.id,
            name: cat.name || 'Category',
            subcategories: (cat.subcategories || []).map((sub) => ({
              id: sub._id || sub.id,
              name: sub.name || 'Subcategory'
            }))
          }));
          setBackendCategories(transformed);
        }
      } catch (err) {
        console.error('Error fetching categories for variants:', err);
      }
    };

    fetchCategories();
  }, [backendUrl]);

  // Fetch product data and reviews
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);

      if (!slug) {
        setError('Product not found');
        setLoading(false);
        return;
      }

      // 1. Try finding in context first
      const product = products.find((item) => item.slug === slug || item._id === slug);

      if (product) {
        setProductData(product);
        if (product.variants && product.variants.length > 0) {
          setSelectedVariant(product.variants[0]);
        } else {
          setSelectedVariant(null);
        }
        setImage(product.image?.[0] || '');
        setError(null);
        fetchProductReviews(product._id);
        setLoading(false);
      } else {
        // 2. If not found in context, fetch from API
        try {
          const response = await axios.post(`${backendUrl}/api/product/single`, { productId: slug });
          if (response.data.success) {
            const fetchedProduct = response.data.product;
            setProductData(fetchedProduct);
            if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
              setSelectedVariant(fetchedProduct.variants[0]);
            } else {
              setSelectedVariant(null);
            }
            setImage(fetchedProduct.image?.[0] || '');
            fetchProductReviews(fetchedProduct._id);
            setError(null);
          } else {
            setError('Product not found');
          }
        } catch (err) {
          console.error("Fetch Product Error:", err);
          setError('Failed to load product');
        } finally {
          setLoading(false);
        }
      }
    };

    if (products && products.length > 0) {
      fetchProductData();
    } else if (products !== undefined) {
      fetchProductData();
    }
  }, [slug, products, backendUrl]);

  // Determine available subcategories/variants for the current product
  useEffect(() => {
    if (productData?.category && backendCategories.length > 0) {
      const categoryId = productData.category;
      const category = backendCategories.find(
        (cat) => cat.id === categoryId || cat.name === categoryId
      );

      if (category && category.subcategories && category.subcategories.length > 0) {
        setAvailableSubcategories(category.subcategories);

        if (productData.subcategory) {
          const subcat = category.subcategories.find(
            (sub) => sub.id === productData.subcategory || sub.name === productData.subcategory
          );
          if (subcat) {
            setSelectedSubcategory(subcat.id);
          } else {
            setSelectedSubcategory(productData.subcategory);
          }
        }
      } else {
        setAvailableSubcategories([]);
        setSelectedSubcategory('');
      }
    }
  }, [productData, backendCategories]);

  // Variant products map: subcategory -> product
  const variantProducts = useMemo(() => {
    if (!productData?.category || !products.length || !availableSubcategories.length) return {};

    const variants = {};
    availableSubcategories.forEach((subcat) => {
      const variant = products.find(
        (p) =>
          (p.category === productData.category || p.category === productData.category?._id) &&
          (p.subcategory === subcat.id || p.subcategory === subcat.name)
      );
      if (variant) {
        variants[subcat.id] = variant;
      }
    });
    return variants;
  }, [productData, products, availableSubcategories]);

  // Handle switching variant
  const handleSubcategoryChange = useCallback((subcategoryId) => {
    if (!subcategoryId || subcategoryId === selectedSubcategory) return;
    setSelectedSubcategory(subcategoryId);

    const targetProduct = variantProducts[subcategoryId] || products.find(
      (p) =>
        (p.category === productData?.category || p.category === productData?.category?._id) &&
        (p.subcategory === subcategoryId)
    );

    if (targetProduct) {
      if (targetProduct.slug) {
        navigate(`/product/${targetProduct.slug}`);
      } else if (targetProduct._id) {
        navigate(`/product/${targetProduct._id}`);
      }
    }
  }, [selectedSubcategory, variantProducts, products, productData, navigate]);

  // Safe parsing helper functions for Ingredients, Benefits, and How To Use
  const ingredientsList = useMemo(() => {
    if (!productData) return [];
    const ing = productData.ingredients;
    if (Array.isArray(ing)) return ing.filter(Boolean);
    if (typeof ing === 'string' && ing.trim()) {
      try {
        const parsed = JSON.parse(ing);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
        // Not JSON string
      }
      return ing.split(/[,\n]/).map((i) => i.trim()).filter(Boolean);
    }
    return [];
  }, [productData]);

  const benefitsList = useMemo(() => {
    if (!productData) return [];
    const ben = productData.benefits;
    if (Array.isArray(ben)) return ben.filter(Boolean);
    if (typeof ben === 'string' && ben.trim()) {
      try {
        const parsed = JSON.parse(ben);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
        // Not JSON string
      }
      return ben.split(/[,\n]/).map((b) => b.trim()).filter(Boolean);
    }
    return [];
  }, [productData]);

  const howToUseText = useMemo(() => {
    if (!productData) return '';
    return typeof productData.howToUse === 'string' ? productData.howToUse.trim() : '';
  }, [productData]);

  const stock = useMemo(() => {
    if (selectedVariant && selectedVariant.quantity !== undefined && selectedVariant.quantity !== null && selectedVariant.quantity !== '') {
      return Number(selectedVariant.quantity);
    }
    return productData ? Number(productData.quantity || 0) : 0;
  }, [selectedVariant, productData]);

  // Monitor stock and adjust quantity if needed
  useEffect(() => {
    if (quantity > stock && stock > 0) {
      setQuantity(Math.max(1, stock));
    }
  }, [stock, quantity]);

  // Fetch reviews from backend for specific product
  const fetchProductReviews = async (productId) => {
    if (!productId || !backendUrl) {
      return;
    }

    setLoadingReviews(true);
    try {
      const response = await fetch(`${backendUrl}/api/comments?productId=${productId}`);

      if (response.ok) {
        const comments = await response.json();

        const productReviews = comments.map(comment => ({
          id: comment._id,
          rating: comment.rating,
          comment: comment.content,
          images: comment.reviewImages?.map(img => img.url) || [],
          date: new Date(comment.date).toLocaleDateString(),
          author: comment.email,
          likes: comment.likes || 0,
          dislikes: comment.dislikes || 0,
          likedBy: comment.likedBy?.map(u => u._id || u) || [],
          dislikedBy: comment.dislikedBy?.map(u => u._id || u) || [],
          hasReply: comment.hasReply || false,
          reply: comment.reply ? {
            id: comment.reply._id || 'reply-' + comment._id,
            content: comment.reply.content,
            author: comment.reply.author || 'Admin',
            isAdmin: true,
            date: new Date(comment.reply.date).toLocaleDateString()
          } : null
        }));

        setReviews(productReviews);
      } else {
        toast.error('Failed to load reviews');
      }
    } catch (error) {
      toast.error('Error loading reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderStockStatus = () => {
    if (stock === 0) {
      return (
        <p className="text-red-500 font-medium">Out of Stock</p>
      );
    } else if (stock < 5) {
      return (
        <div>
          <p className="text-red-500 font-medium">Only {stock} item{stock !== 1 ? 's' : ''} left!</p>
          <p className="text-red-400 text-sm mt-1">Hurry, low stock</p>
        </div>
      );
    } else if (stock < 10) {
      return (
        <div>
          <p className="text-orange-500">{stock} items left</p>
          <p className="text-orange-400 text-sm mt-1">Limited stock available</p>
        </div>
      );
    } else if (stock < 20) {
      return (
        <div>
          <p className="text-yellow-600">Limited items left</p>
        </div>
      );
    } else {
      return (
        <div>
          <p className="text-green-500 font-medium">In Stock</p>
          <p className="text-green-600 text-sm mt-1">Available for immediate shipping</p>
        </div>
      );
    }
  };

  const handleQuantityChange = (e) => {
    let value = Number(e.target.value);

    if (isNaN(value) || value < 1) {
      value = 1;
    }

    value = Math.min(value, stock);
    setQuantity(value);
  };

  const incrementQuantity = () => {
    if (quantity < stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const imageData = files.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setReviewImages((prevImages) => [...prevImages, ...imageData]);
    }
  };

  const removeReviewImage = (index) => {
    if (reviewImages[index]?.url) {
      URL.revokeObjectURL(reviewImages[index].url);
    }
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!user || !user._id) {
      toast.error('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.trim() === '') {
      toast.error('Please write a review comment');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('targetType', 'product');
      formData.append('productId', productData._id);
      formData.append('userId', user._id);
      formData.append('content', comment);
      formData.append('rating', rating);

      reviewImages.forEach((imageData) => {
        formData.append('reviewImages', imageData.file);
      });

      const currentToken = token || localStorage.getItem('token');

      const response = await fetch(`${backendUrl}/api/comments`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (response.ok) {
        const newComment = await response.json();

        const newReview = {
          id: newComment._id,
          rating: newComment.rating,
          comment: newComment.content,
          images: newComment.reviewImages?.map(img => img.url) || [],
          date: new Date(newComment.date).toLocaleDateString(),
          author: newComment.email,
          likes: newComment.likes || 0,
          dislikes: newComment.dislikes || 0,
          likedBy: newComment.likedBy?.map(u => u._id || u) || [],
          dislikedBy: newComment.dislikedBy?.map(u => u._id || u) || [],
          hasReply: newComment.hasReply || false,
          reply: newComment.reply ? {
            id: newComment.reply._id || 'reply-' + newComment._id,
            content: newComment.reply.content,
            author: newComment.reply.author || 'Admin',
            isAdmin: true,
            date: new Date(newComment.reply.date).toLocaleDateString()
          } : null
        };

        setReviews((prevReviews) => [newReview, ...prevReviews]);
        setRating(0);
        setComment('');
        reviewImages.forEach(img => URL.revokeObjectURL(img.url));
        setReviewImages([]);

        toast.success('Review submitted successfully!');
      } else {
        toast.error('Failed to submit review');
      }
    } catch (error) {
      toast.error('Error submitting review');
    } finally {
      setUploading(false);
    }
  };

  const getUserInteractionStatus = (review) => {
    if (!user || !user._id) return { hasLiked: false, hasDisliked: false };

    const hasLiked = review.likedBy?.includes(user._id) || false;
    const hasDisliked = review.dislikedBy?.includes(user._id) || false;

    return { hasLiked, hasDisliked };
  };

  const handleLikeReview = async (reviewId) => {
    if (!user || !user._id) {
      toast.error('Please login to like reviews');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const review = reviews.find(r => r.id === reviewId);
      const { hasLiked } = getUserInteractionStatus(review);

      const endpoint = hasLiked ? 'remove-like' : 'like';

      const response = await fetch(`${backendUrl}/api/comments/${reviewId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (response.ok) {
        setReviews(prevReviews =>
          prevReviews.map(r => {
            if (r.id === reviewId) {
              const updatedReview = { ...r };
              const currentlyLiked = updatedReview.likedBy?.includes(user._id);
              const currentlyDisliked = updatedReview.dislikedBy?.includes(user._id);

              if (currentlyLiked) {
                updatedReview.likes = Math.max(0, (r.likes || 0) - 1);
                updatedReview.likedBy = (r.likedBy || []).filter(id => id !== user._id);
              } else {
                updatedReview.likes = (r.likes || 0) + 1;
                updatedReview.likedBy = [...(r.likedBy || []), user._id];
                if (currentlyDisliked) {
                  updatedReview.dislikes = Math.max(0, (r.dislikes || 0) - 1);
                  updatedReview.dislikedBy = (r.dislikedBy || []).filter(id => id !== user._id);
                }
              }
              return updatedReview;
            }
            return r;
          })
        );
      } else {
        toast.error('Failed to update like');
      }
    } catch (error) {
      toast.error('Error updating like');
    }
  };

  const handleDislikeReview = async (reviewId) => {
    if (!user || !user._id) {
      toast.error('Please login to dislike reviews');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const review = reviews.find(r => r.id === reviewId);
      const { hasDisliked } = getUserInteractionStatus(review);

      const endpoint = hasDisliked ? 'remove-dislike' : 'dislike';

      const response = await fetch(`${backendUrl}/api/comments/${reviewId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (response.ok) {
        setReviews(prevReviews =>
          prevReviews.map(r => {
            if (r.id === reviewId) {
              const updatedReview = { ...r };
              const currentlyDisliked = updatedReview.dislikedBy?.includes(user._id);
              const currentlyLiked = updatedReview.likedBy?.includes(user._id);

              if (currentlyDisliked) {
                updatedReview.dislikes = Math.max(0, (r.dislikes || 0) - 1);
                updatedReview.dislikedBy = (r.dislikedBy || []).filter(id => id !== user._id);
              } else {
                updatedReview.dislikes = (r.dislikes || 0) + 1;
                updatedReview.dislikedBy = [...(r.dislikedBy || []), user._id];
                if (currentlyLiked) {
                  updatedReview.likes = Math.max(0, (r.likes || 0) - 1);
                  updatedReview.likedBy = (r.likedBy || []).filter(id => id !== user._id);
                }
              }
              return updatedReview;
            }
            return r;
          })
        );
      } else {
        toast.error('Failed to update dislike');
      }
    } catch (error) {
      toast.error('Error updating dislike');
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const toggleShowAllReviews = () => {
    setShowAllReviews((prev) => !prev);
  };

  const filterReviewsByRating = (ratingVal) => {
    if (filterRating === ratingVal) {
      setFilterRating(null);
    } else {
      setFilterRating(ratingVal);
    }
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));

  const filteredReviews = filterRating
    ? reviews.filter((review) => review.rating === filterRating)
    : reviews;

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 10);

  const renderRating = (ratingValue = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStar />
          </span>
        );
      } else if (i - 0.5 <= ratingValue) {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaStarHalf />
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-yellow-400">
            <FaRegStar />
          </span>
        );
      }
    }
    return stars;
  };

  const hasDiscount = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.discountprice !== undefined &&
        selectedVariant.discountprice !== null &&
        selectedVariant.discountprice > 0 &&
        selectedVariant.discountprice < selectedVariant.price;
    }
    return productData?.discountprice !== undefined &&
      productData?.discountprice !== null &&
      productData?.discountprice > 0 &&
      productData?.discountprice < productData?.price;
  }, [selectedVariant, productData]);

  const actualPrice = useMemo(() => {
    if (selectedVariant) {
      return hasDiscount ? Number(selectedVariant.discountprice) : Number(selectedVariant.price);
    }
    if (productData) {
      return hasDiscount ? Number(productData.discountprice) : Number(productData.price);
    }
    return 0;
  }, [selectedVariant, productData, hasDiscount]);

  const originalPrice = useMemo(() => {
    if (selectedVariant && hasDiscount) {
      return Number(selectedVariant.price);
    }
    if (productData && hasDiscount) {
      return Number(productData.price);
    }
    return null;
  }, [selectedVariant, productData, hasDiscount]);

  const discountPercentage = useMemo(() => {
    if (selectedVariant && hasDiscount && selectedVariant.price > 0) {
      return Math.round(((selectedVariant.price - selectedVariant.discountprice) / selectedVariant.price) * 100);
    }
    if (productData && hasDiscount && productData.price > 0) {
      return Math.round(((productData.price - productData.discountprice) / productData.price) * 100);
    }
    return null;
  }, [selectedVariant, productData, hasDiscount]);

  const handleOrderOnWhatsApp = useCallback(() => {
    if (!productData) return;

    const variantInfo = selectedVariant ? ` (${selectedVariant.name})` : '';
    const message = `Assalam O Alaikum! I would like to order:\n\n` +
      `*Product:* ${productData.name}${variantInfo}\n` +
      `*Quantity:* ${quantity}\n` +
      `*Price:* ${currency} ${(actualPrice * quantity).toFixed(2)}\n\n` +
      `Please let me know the next steps.`;

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = "923241572294";

    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  }, [productData, selectedVariant, quantity, currency, actualPrice]);

  const handleAddToCart = async () => {
    if (isAddingToCart || addToCartCalledRef.current) {
      return;
    }

    if (stock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    const finalQuantity = Math.min(quantity, stock);

    if (finalQuantity !== quantity) {
      setQuantity(finalQuantity);
      toast.info(`Quantity adjusted to available stock: ${finalQuantity}`);
    }

    setIsAddingToCart(true);
    addToCartCalledRef.current = true;

    try {
      const cartKey = (selectedVariant && productData.variants && productData.variants.length > 0)
        ? `${productData._id}__${selectedVariant.name}`
        : productData._id;

      addToCart(cartKey, finalQuantity);
      setQuantity(1);
    } catch (error) {
      toast.error('Failed to add product to cart');
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
        addToCartCalledRef.current = false;
      }, 1000);
    }
  };

  const renderClickableStars = (currentRating, setRatingFunc) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className="cursor-pointer text-yellow-400 text-xl"
          onClick={() => setRatingFunc(i)}
        >
          {i <= currentRating ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    return stars;
  };

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="btn bg-[#587a3b] text-white px-4 py-2 rounded hover:bg-[#486530]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !productData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 border-t-2 pt-10">
      {/* Dynamic Structured Data (SEO) */}
      {productData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": productData.name,
              "image": productData.image,
              "description": productData.description,
              "brand": {
                "@type": "Brand",
                "name": "Natura Bliss"
              },
              "sku": productData._id,
              "offers": {
                "@type": "AggregateOffer",
                "url": `${window.location.origin}/product/${productData.slug || productData._id}`,
                "priceCurrency": "PKR",
                "lowPrice": (productData.discountprice && productData.discountprice < productData.price)
                  ? productData.discountprice.toString()
                  : productData.price.toString(),
                "highPrice": productData.price.toString()
              }
            })
          }}
        />
      )}
      <div className="flex flex-col gap-12 sm:flex-row sm:gap-12">
        <div className="flex flex-1 flex-col-reverse gap-3 sm:flex-row">
          {/* Thumbnail Images */}
          <div className="flex w-full justify-between overflow-x-auto sm:w-[18%] sm:flex-col sm:justify-normal sm:overflow-y-auto">
            {productData.image?.map((item, index) => (
              <img
                key={index}
                src={item}
                alt={`Product Thumbnail ${index + 1}`}
                className={`w-[24%] shrink-0 cursor-pointer sm:mb-3 sm:w-full object-cover h-20 sm:h-24 rounded border transition-all ${
                  (image === item || (!image && index === 0)) ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                }`}
                onClick={() => setImage(item)}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                }}
              />
            ))}
          </div>

          {/* Main Image */}
          <div className="relative w-full sm:w-4/5">
            {discountPercentage && (
              <div className="absolute right-2 top-2 rounded-full bg-[#587a3b] px-2.5 py-1 text-xs font-medium text-white shadow">
                {discountPercentage}% OFF
              </div>
            )}
            <img
              src={image || productData.image?.[0]}
              alt={productData.name}
              className="h-auto w-full object-cover max-h-[480px] rounded-lg shadow-sm"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500?text=Product+Image';
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="mt-2 text-2xl sm:text-3xl font-medium text-gray-900">{productData.name}</h1>
          <div className="mt-2 flex items-center gap-1">
            {renderRating(averageRating)}
            <p className="pl-2 text-sm font-semibold">{averageRating.toFixed(1)}</p>
            <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
          </div>

          {/* PRICE DISPLAY */}
          <div className="mt-5 flex items-center gap-4">
            <p className="text-3xl font-medium text-gray-900">
              {currency} {actualPrice.toFixed(2)}
            </p>
            {originalPrice && originalPrice !== actualPrice && (
              <p className="text-base text-gray-400 line-through">
                {currency} {originalPrice.toFixed(2)}
              </p>
            )}
          </div>

          <p className="mt-4 text-gray-600 leading-relaxed md:w-4/5">{productData.description}</p>

          {/* VARIANTS SECTION (Matching user screenshot) */}
          {productData.variants && productData.variants.length > 0 ? (
            <div className="mt-6 sm:w-4/5">
              <p className="text-xs sm:text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                MORE VARIANTS
              </p>
              <div className="space-y-2.5">
                {productData.variants.map((v, idx) => {
                  const isSelected = selectedVariant ? selectedVariant.name === v.name : idx === 0;

                  const hasDisc = v.discountprice !== undefined &&
                    v.discountprice !== null &&
                    v.discountprice > 0 &&
                    v.discountprice < v.price;

                  const vPrice = hasDisc ? v.discountprice : v.price;
                  const vOrigPrice = hasDisc ? v.price : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.image) {
                          setImage(v.image);
                        }
                      }}
                      className={`flex items-center justify-between px-4 py-3 sm:py-3.5 rounded-xl border transition-all duration-150 cursor-pointer w-full select-none ${
                        isSelected
                          ? 'border-[#587a3b] bg-[#587a3b] text-white shadow-md'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      {/* Left: Radio Indicator, Thumbnail & Variant Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-white bg-[#587a3b]' : 'border-gray-400 bg-white'
                        }`}>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        {v.image && (
                          <img
                            src={v.image}
                            alt={v.name}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0 border ${
                              isSelected ? 'border-gray-600' : 'border-gray-200'
                            }`}
                          />
                        )}
                        <span className={`text-sm sm:text-base truncate ${isSelected ? 'font-bold text-white' : 'font-semibold text-gray-900'}`}>
                          {v.name}
                        </span>
                      </div>

                      {/* Right: Price & Strikethrough Original Price */}
                      {vPrice !== undefined && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className={`text-sm sm:text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {currency} {Number(vPrice).toFixed(2)}
                          </span>
                          {vOrigPrice && (
                            <span className={`text-xs sm:text-sm line-through ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                              {currency} {Number(vOrigPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : availableSubcategories && availableSubcategories.length > 1 ? (
            <div className="mt-6 sm:w-4/5">
              <p className="text-xs sm:text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                MORE VARIANTS
              </p>
              <div className="space-y-2.5">
                {availableSubcategories.map((subcat) => {
                  const variantProduct = variantProducts[subcat.id] || (productData.subcategory === subcat.id ? productData : null);
                  const isSelected = selectedSubcategory === subcat.id || productData.subcategory === subcat.id;

                  const hasDisc = variantProduct?.discountprice !== undefined &&
                    variantProduct?.discountprice !== null &&
                    variantProduct?.discountprice > 0 &&
                    variantProduct?.discountprice < variantProduct?.price;

                  const vPrice = hasDisc ? variantProduct?.discountprice : variantProduct?.price;
                  const vOrigPrice = hasDisc ? variantProduct?.price : null;

                  return (
                    <div
                      key={subcat.id}
                      onClick={() => handleSubcategoryChange(subcat.id)}
                      className={`flex items-center justify-between px-4 py-3.5 sm:py-4 rounded-xl border transition-all duration-150 cursor-pointer w-full select-none ${
                        isSelected
                          ? 'border-[#587a3b] bg-[#587a3b] text-white shadow-md'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      {/* Left: Radio Indicator & Variant Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-white bg-[#587a3b]' : 'border-gray-400 bg-white'
                        }`}>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className={`text-sm sm:text-base truncate ${isSelected ? 'font-bold text-white' : 'font-semibold text-gray-900'}`}>
                          {subcat.name}
                        </span>
                      </div>

                      {/* Right: Price & Strikethrough Original Price */}
                      {vPrice !== undefined && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className={`text-sm sm:text-base font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {currency} {Number(vPrice).toFixed(2)}
                          </span>
                          {vOrigPrice && (
                            <span className={`text-xs sm:text-sm line-through ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                              {currency} {Number(vOrigPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* QUANTITY SELECTOR */}
          <div className="my-6 flex items-center gap-4">
            <p className="font-medium text-sm text-gray-700">Quantity</p>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1 || stock === 0}
                className={`w-8 h-8 rounded-none border border-gray-300 flex items-center justify-center ${
                  quantity <= 1 || stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
              >
                -
              </button>
              <input
                className="w-16 rounded-none border-2 border-gray-300 px-2 py-1 text-center text-sm font-medium"
                type="number"
                value={quantity}
                min={1}
                max={stock}
                onChange={handleQuantityChange}
                onBlur={(e) => {
                  let value = Number(e.target.value);
                  if (isNaN(value) || value < 1) value = 1;
                  if (value > stock) value = stock;
                  setQuantity(value);
                }}
                disabled={stock === 0}
              />
              <button
                onClick={incrementQuantity}
                disabled={quantity >= stock || stock === 0}
                className={`w-8 h-8 rounded-none border border-gray-300 flex items-center justify-center ${
                  quantity >= stock || stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
              >
                +
              </button>
            </div>
          </div>

          {renderStockStatus()}

          {/* ACTION BUTTONS */}
          <div className="mt-6 flex flex-col gap-3 w-full max-w-sm sm:max-w-md">
            {/* ADD TO CART - Brand Olive */}
            <button
              onClick={handleAddToCart}
              className={`w-full py-3.5 px-6 rounded-none font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center text-white bg-[#587a3b] hover:bg-[#486530] active:bg-[#3b5327] shadow-sm uppercase ${
                stock === 0 || isAddingToCart
                  ? 'opacity-50 cursor-not-allowed bg-gray-400'
                  : ''
              }`}
              disabled={stock === 0 || isAddingToCart}
            >
              {isAddingToCart
                ? 'ADDING TO CART...'
                : stock === 0
                  ? 'OUT OF STOCK'
                  : quantity > stock
                    ? `ADD ${stock} TO CART`
                    : `ADD TO CART`
              }
            </button>

            {/* PLACE ORDER - Black Background */}
            <button
              onClick={async () => {
                if (stock === 0) return;
                const cartKey = (selectedVariant && productData.variants && productData.variants.length > 0)
                  ? `${productData._id}__${selectedVariant.name}`
                  : productData._id;

                await addToCart(cartKey, quantity);
                if (window.fbq) {
                  const unitPrice = Number(actualPrice || productData.discountprice || productData.price || 0);
                  window.fbq('track', 'InitiateCheckout', {
                    content_ids: [productData._id],
                    content_name: selectedVariant ? `${productData.name} (${selectedVariant.name})` : productData.name,
                    content_type: 'product',
                    value: unitPrice * quantity,
                    currency: 'PKR',
                    num_items: quantity
                  });
                }
                navigate('/place-order');
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={stock === 0}
              className={`w-full py-3.5 px-6 rounded-none font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center text-white bg-black hover:bg-neutral-800 active:bg-neutral-900 shadow-sm uppercase ${
                stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
              }`}
            >
              PLACE ORDER
            </button>

            {/* ORDER ON WHATSAPP - WhatsApp Green */}
            <button
              ref={whatsappButtonRef}
              onClick={handleOrderOnWhatsApp}
              disabled={stock === 0}
              className={`w-full py-3.5 px-6 rounded-none font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 text-white bg-[#25D366] hover:bg-[#1EBE5D] active:bg-[#1DA851] shadow-sm ${
                stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaWhatsapp className="w-5 h-5" />
              <span>Order on WhatsApp</span>
            </button>
          </div>

          <hr className="mt-8 sm:w-4/5 border-gray-200" />

          {/* PRODUCT HIGHLIGHTS & BENEFITS */}
          <ul className="mt-5 flex flex-col gap-1.5 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            {benefitsList.length > 0 ? (
              benefitsList.map((benefit, idx) => (
                <li key={idx}>{benefit}</li>
              ))
            ) : (
              <>
                <li>Made with pure, natural, and organic ingredients.</li>
                <li>Free from harsh chemicals, parabens, and artificial fragrances.</li>
                <li>Handcrafted in Pakistan with care and love for your well-being.</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Customer Reviews Rating Summary */}
      <div className="mt-16">
        <h2 className="text-2xl font-medium text-gray-900">Customer Feedback</h2>
        <div className="mt-4 flex flex-col items-center gap-6 rounded-lg border border-gray-200 p-4 sm:p-6 lg:flex-row bg-white">
          {/* Left Side – Average Rating */}
          <div className="flex flex-1 flex-col items-center w-full lg:w-auto">
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">out of 5</span>
            </div>
            <div className="mt-2 flex gap-1 text-sm sm:text-base">{renderRating(averageRating)}</div>
            <p className="mt-2 text-sm text-gray-500">Based on {reviews.length} reviews</p>
          </div>

          {/* Right Side – Star Rating Distribution & Filters */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="mt-2 space-y-2">
              {ratingBreakdown.map(({ star, count }) => (
                <div
                  key={star}
                  className={`flex cursor-pointer items-center gap-2 p-1.5 rounded transition-colors ${
                    filterRating === star ? 'bg-yellow-50 font-medium' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => filterReviewsByRating(star)}
                >
                  <div className="flex gap-1 text-xs sm:text-sm">{renderRating(star)}</div>
                  <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-yellow-400"
                      style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 min-w-[30px]">({count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABS: Description, Ingredients, How to Use, and Reviews */}
      <div className="mt-12">
        <div className="flex overflow-x-auto border-b border-gray-200 gap-1">
          <button
            className={`border px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-md ${
              activeTab === 'description' ? 'bg-olive-50/70 border-[#587a3b] text-[#587a3b] font-bold border-b-2' : 'bg-white border-transparent text-gray-500 hover:text-[#587a3b]'
            }`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`border px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-md flex items-center gap-1.5 ${
              activeTab === 'ingredients' ? 'bg-olive-50/70 border-[#587a3b] text-[#587a3b] font-bold border-b-2' : 'bg-white border-transparent text-gray-500 hover:text-[#587a3b]'
            }`}
            onClick={() => setActiveTab('ingredients')}
          >
            <FaLeaf className="text-[#587a3b] text-xs" />
            Ingredients {ingredientsList.length > 0 && `(${ingredientsList.length})`}
          </button>
          <button
            className={`border px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-md ${
              activeTab === 'howtouse' ? 'bg-olive-50/70 border-[#587a3b] text-[#587a3b] font-bold border-b-2' : 'bg-white border-transparent text-gray-500 hover:text-[#587a3b]'
            }`}
            onClick={() => setActiveTab('howtouse')}
          >
            How to Use
          </button>
          <button
            className={`border px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors rounded-t-md ${
              activeTab === 'reviews' ? 'bg-olive-50/70 border-[#587a3b] text-[#587a3b] font-bold border-b-2' : 'bg-white border-transparent text-gray-500 hover:text-[#587a3b]'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Description Tab Content */}
        {activeTab === 'description' && (
          <div className="flex flex-col gap-4 border border-t-0 border-gray-200 p-5 sm:p-8 text-sm text-gray-600 leading-relaxed bg-white">
            <p className="whitespace-pre-line">{productData.description}</p>
            {benefitsList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2">Key Benefits:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {benefitsList.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Ingredients Tab Content (SZ-Naturals feature) */}
        {activeTab === 'ingredients' && (
          <div className="border border-t-0 border-gray-200 p-5 sm:p-8 bg-white">
            {ingredientsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {ingredientsList.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{ingredient}</p>
                      <p className="text-xs text-gray-500 mt-0.5">100% natural ingredient</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <FaLeaf className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-base font-medium text-gray-800">Pure & Natural Ingredients</h3>
                <p className="text-gray-500 text-sm mt-1">Detailed ingredients list will be updated soon.</p>
              </div>
            )}
          </div>
        )}

        {/* How to Use Tab Content */}
        {activeTab === 'howtouse' && (
          <div className="border border-t-0 border-gray-200 p-5 sm:p-8 bg-white">
            {howToUseText ? (
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {howToUseText}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Directions for use will be added soon.</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab Content */}
        {activeTab === 'reviews' && (
          <div className="border border-t-0 border-gray-200 p-5 sm:p-8 bg-white">
            {/* Review Form */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900">Leave a Review</h3>
              {!user || !user._id ? (
                <div>
                  <p className="mt-4 text-sm text-gray-500">Please login to leave a review.</p>
                </div>
              ) : (
                <>
                  <div className="mt-4">
                    <p className="mb-2 text-sm text-gray-700 font-medium">Your Rating:</p>
                    <div className="flex gap-1 text-lg sm:text-xl">
                      {renderClickableStars(rating, setRating)}
                    </div>
                  </div>
                  <textarea
                    className="mt-4 w-full rounded border-2 border-gray-300 p-3 text-sm focus:border-black focus:outline-none"
                    rows="4"
                    placeholder="Write your honest review..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="text-sm w-full sm:w-auto"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reviewImages.map((imageData, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageData.url}
                          alt={`Review Image ${index + 1}`}
                          className="size-16 sm:size-20 rounded object-cover border"
                        />
                        <button
                          onClick={() => removeReviewImage(index)}
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full size-4 sm:size-5 text-xs flex items-center justify-center"
                        >
                          <FaTimes size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className={`btn mt-4 w-full sm:w-auto ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleSubmitReview}
                    disabled={uploading}
                  >
                    {uploading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </>
              )}
            </div>

            {/* Display Existing Reviews */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
              {loadingReviews ? (
                <p className="mt-4 text-sm text-gray-500">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No reviews yet. Be the first to review!</p>
              ) : (
                <>
                  {displayedReviews.map((review) => {
                    const { hasLiked, hasDisliked } = getUserInteractionStatus(review);

                    return (
                      <div key={review.id} className="mt-4 border-b border-gray-200 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 text-sm">{renderRating(review.rating)}</div>
                            <span className="font-medium text-sm text-gray-900">{maskEmail(review.author)}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">{review.date}</p>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.images.map((imageUrl, index) => (
                            <img
                              key={index}
                              src={imageUrl}
                              alt={`Review Image ${index + 1}`}
                              className="size-16 sm:size-20 cursor-pointer object-cover rounded border"
                              onClick={() => handleImageClick(imageUrl)}
                            />
                          ))}
                        </div>

                        {/* Admin Reply Section */}
                        {review.hasReply && review.reply && (
                          <div className="mt-4 ml-0 sm:ml-4 border-l-0 sm:border-l-2 border-black sm:pl-4">
                            <div className="mb-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                              <div className="flex items-center gap-2 mb-1">
                                <FaUserShield className="text-[#587a3b]" size={14} />
                                <span className="font-medium text-sm text-black">{maskEmail(review.reply.author)}</span>
                                <span className="text-xs text-gray-500">{review.reply.date}</span>
                              </div>
                              <p className="text-sm text-gray-700">{review.reply.content}</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span className="hidden sm:inline">Was this helpful?</span>
                          <span className="sm:hidden">Helpful?</span>
                          <button
                            onClick={() => handleLikeReview(review.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              hasLiked
                                ? 'text-green-600 font-semibold'
                                : 'hover:text-green-600'
                            }`}
                          >
                            <FaThumbsUp size={12} className="sm:size-[14px]" />
                            <span className="text-xs sm:text-sm">{review.likes}</span>
                          </button>
                          <button
                            onClick={() => handleDislikeReview(review.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              hasDisliked
                                ? 'text-red-600 font-semibold'
                                : 'hover:text-red-600'
                            }`}
                          >
                            <FaThumbsDown size={12} className="sm:size-[14px]" />
                            <span className="text-xs sm:text-sm">{review.dislikes}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredReviews.length > 10 && (
                    <button
                      className="btn mt-4 w-full sm:w-auto"
                      onClick={toggleShowAllReviews}
                    >
                      {showAllReviews ? 'Show Less' : `Show All (${filteredReviews.length})`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Enlarged Image */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative mx-4 max-w-4xl w-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Enlarged Review"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded"
            />
            <button
              className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-black hover:bg-gray-200 transition-colors flex items-center justify-center"
              onClick={closeModal}
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>
      )}

      {productData.category && <RelatedProduct category={productData.category} />}
    </div>
  );
};

export default Product;