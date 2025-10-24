import { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import RelatedProduct from '../components/RelatedProduct';
import { FaStar, FaStarHalf, FaRegStar, FaThumbsUp, FaThumbsDown, FaTimes, FaUserShield } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Product = () => {
  const { productId } = useParams();
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

  // Fetch product data and reviews
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    if (!productId) {
      setError('Product ID not found');
      setLoading(false);
      return;
    }

    if (!products || products.length === 0) {
      setLoading(false);
      return;
    }

    const product = products.find((item) => item._id === productId);

    if (product) {
      setProductData(product);
      setImage(product.image?.[0] || '');
      setError(null);
      fetchProductReviews(productId);
    } else {
      setError('Product not found');
    }
    setLoading(false);
  }, [productId, products]);

  const stock = productData ? productData.quantity : 0;

  // Monitor stock and adjust quantity if needed
  useEffect(() => {
    if (quantity > stock) {
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
        
        // Transform backend comments to frontend review format with replies
        const productReviews = comments.map(comment => ({
          id: comment._id,
          rating: comment.rating,
          comment: comment.content,
          images: comment.reviewImages?.map(img => img.url) || [],
          date: new Date(comment.date).toLocaleDateString(),
          author: comment.email,
          likes: comment.likes || 0,
          dislikes: comment.dislikes || 0,
          likedBy: comment.likedBy?.map(user => user._id || user) || [],
          dislikedBy: comment.dislikedBy?.map(user => user._id || user) || [],
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

  // Add direct increment/decrement handlers
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

  // Handle multiple image uploads - store files for backend upload
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

  // Remove review image
  const removeReviewImage = (index) => {
    if (reviewImages[index]?.url) {
      URL.revokeObjectURL(reviewImages[index].url);
    }
    setReviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle review submission to backend
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
      formData.append('productId', productId);
      formData.append('userId', user._id);
      formData.append('content', comment);
      formData.append('rating', rating);

      reviewImages.forEach((imageData, index) => {
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
          author: newComment.author,
          likes: newComment.likes || 0,
          dislikes: newComment.dislikes || 0,
          likedBy: newComment.likedBy?.map(user => user._id || user) || [],
          dislikedBy: newComment.dislikedBy?.map(user => user._id || user) || [],
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
        reviewImages.forEach(image => URL.revokeObjectURL(image.url));
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

  // Check if current user has liked/disliked a review
  const getUserInteractionStatus = (review) => {
    if (!user || !user._id) return { hasLiked: false, hasDisliked: false };
    
    const hasLiked = review.likedBy?.includes(user._id) || false;
    const hasDisliked = review.dislikedBy?.includes(user._id) || false;
    
    return { hasLiked, hasDisliked };
  };

  // YouTube-like like functionality
  const handleLikeReview = async (reviewId) => {
    if (!user || !user._id) {
      toast.error('Please login to like reviews');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const review = reviews.find(r => r.id === reviewId);
      const { hasLiked, hasDisliked } = getUserInteractionStatus(review);

      let endpoint = '';
      let method = 'PATCH';

      if (hasLiked) {
        endpoint = 'remove-like';
      } else if (hasDisliked) {
        endpoint = 'like';
      } else {
        endpoint = 'like';
      }

      const response = await fetch(`${backendUrl}/api/comments/${reviewId}/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (response.ok) {
        setReviews(prevReviews => 
          prevReviews.map(review => {
            if (review.id === reviewId) {
              const updatedReview = { ...review };
              
              if (hasLiked) {
                updatedReview.likes = Math.max(0, (review.likes || 0) - 1);
                updatedReview.likedBy = (review.likedBy || []).filter(id => id !== user._id);
              } else if (hasDisliked) {
                updatedReview.likes = (review.likes || 0) + 1;
                updatedReview.dislikes = Math.max(0, (review.dislikes || 0) - 1);
                updatedReview.likedBy = [...(review.likedBy || []), user._id];
                updatedReview.dislikedBy = (review.dislikedBy || []).filter(id => id !== user._id);
              } else {
                updatedReview.likes = (review.likes || 0) + 1;
                updatedReview.likedBy = [...(review.likedBy || []), user._id];
              }
              
              return updatedReview;
            }
            return review;
          })
        );
      } else {
        toast.error('Failed to update like');
      }
    } catch (error) {
      toast.error('Error updating like');
    }
  };

  // YouTube-like dislike functionality
  const handleDislikeReview = async (reviewId) => {
    if (!user || !user._id) {
      toast.error('Please login to dislike reviews');
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const review = reviews.find(r => r.id === reviewId);
      const { hasLiked, hasDisliked } = getUserInteractionStatus(review);

      let endpoint = '';
      let method = 'PATCH';

      if (hasDisliked) {
        endpoint = 'remove-dislike';
      } else if (hasLiked) {
        endpoint = 'dislike';
      } else {
        endpoint = 'dislike';
      }

      const response = await fetch(`${backendUrl}/api/comments/${reviewId}/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user._id })
      });

      if (response.ok) {
        setReviews(prevReviews => 
          prevReviews.map(review => {
            if (review.id === reviewId) {
              const updatedReview = { ...review };
              
              if (hasDisliked) {
                updatedReview.dislikes = Math.max(0, (review.dislikes || 0) - 1);
                updatedReview.dislikedBy = (review.dislikedBy || []).filter(id => id !== user._id);
              } else if (hasLiked) {
                updatedReview.likes = Math.max(0, (review.likes || 0) - 1);
                updatedReview.dislikes = (review.dislikes || 0) + 1;
                updatedReview.dislikedBy = [...(review.dislikedBy || []), user._id];
                updatedReview.likedBy = (review.likedBy || []).filter(id => id !== user._id);
              } else {
                updatedReview.dislikes = (review.dislikes || 0) + 1;
                updatedReview.dislikedBy = [...(review.dislikedBy || []), user._id];
              }
              
              return updatedReview;
            }
            return review;
          })
        );
      } else {
        toast.error('Failed to update dislike');
      }
    } catch (error) {
      toast.error('Error updating dislike');
    }
  };

  // Handle image click to show in modal
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Close the modal
  const closeModal = () => {
    setSelectedImage(null);
  };

  // Toggle to show all reviews or only 10 reviews
  const toggleShowAllReviews = () => {
    setShowAllReviews((prev) => !prev);
  };

  // Filter reviews by rating
  const filterReviewsByRating = (rating) => {
    if (filterRating === rating) {
      setFilterRating(null);
    } else {
      setFilterRating(rating);
    }
  };

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  // Get rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));

  // Get the reviews to display (filtered by rating or all)
  const filteredReviews = filterRating
    ? reviews.filter((review) => review.rating === filterRating)
    : reviews;

  // Get the reviews to display (10 initially or all)
  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 10);

  // Render rating stars
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

  const handleAddToCart = () => {
    if (stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    
    const finalQuantity = Math.min(quantity, stock);
    
    if (finalQuantity !== quantity) {
      setQuantity(finalQuantity);
      toast.info(`Quantity adjusted to available stock: ${finalQuantity}`);
    }
    
    addToCart(productData._id, finalQuantity);
    setQuantity(1);
    toast.success('Product added to cart!');
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

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="btn bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading || !productData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
            <p className="text-sm text-gray-500">Product ID: {productId}</p>
          </div>
        </div>
      </div>
    );
  }

  const discountPrice = productData.discount 
    ? productData.price * (1 - productData.discount / 100) 
    : null;

  return (
    <div className="container mx-auto px-4 border-t-2 pt-10">
      <div className="flex flex-col gap-12 sm:flex-row sm:gap-12">
        <div className="flex flex-1 flex-col-reverse gap-3 sm:flex-row">
          {/* Thumbnail Images */}
          <div className="flex w-full justify-between overflow-x-auto sm:w-[18%] sm:flex-col sm:justify-normal sm:overflow-y-auto">
            {productData.image?.map((item, index) => (
              <img
                key={index}
                src={item}
                alt={`Product Thumbnail ${index + 1}`}
                className="w-[24%] shrink-0 cursor-pointer sm:mb-3 sm:w-full object-cover h-20 sm:h-24"
                onClick={() => setImage(item)} 
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                }}
              />
            ))}
          </div>

          {/* Main Image */}
          <div className="relative w-full sm:w-4/5">
            {/* Discount Badge */}
            {productData.discount && (
              <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
                {productData.discount}% OFF
              </div>
            )}
            <img
              src={image || productData.image?.[0]}
              alt={productData.name}
              className="h-auto w-full object-cover max-h-96"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/500?text=Product+Image';
              }}
            />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="mt-2 text-2xl font-medium">{productData.name}</h1>
          <div className="mt-2 flex items-center gap-1">
            {renderRating(averageRating)} 
            <p className="pl-2">{averageRating.toFixed(1)}</p>
            <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <p className="text-3xl font-medium">
              {currency} {discountPrice ? discountPrice.toFixed(2) : productData.price.toFixed(2)}
            </p>
            {discountPrice && (
              <p className="text-sm text-gray-500 line-through">
                {currency} {productData.price.toFixed(2)}
              </p>
            )}
          </div>
          <p className="mt-5 text-gray-500 md:w-4/5">{productData.description}</p>
          
          <div className="my-8 flex items-center gap-4">
            <p className="font-medium">Quantity</p>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1 || stock === 0}
                className={`w-8 h-8 rounded border border-gray-300 flex items-center justify-center ${
                  quantity <= 1 || stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
              >
                -
              </button>
              <input
                className="w-16 rounded border-2 border-gray-300 px-2 py-1 text-center text-sm"
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
                className={`w-8 h-8 rounded border border-gray-300 flex items-center justify-center ${
                  quantity >= stock || stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                }`}
              >
                +
              </button>
             
            </div>
          </div>
          
          {renderStockStatus()}
          
          <button
            onClick={handleAddToCart}
            className={`btn mt-4 ${
              stock === 0 
                ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                : 'hover:bg-black hover:text-white transition-colors'
            }`}
            disabled={stock === 0}
          >
            {stock === 0 
              ? 'OUT OF STOCK' 
              : quantity > stock 
                ? `ADD ${stock} TO CART` 
                : `ADD TO CART`
            }
          </button>
          
          <hr className="mt-8 sm:w-4/5" />
          <div className="mt-5 flex flex-col gap-1 text-sm text-gray-500">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-20">
        <h2 className="text-2xl font-medium">Customer Reviews</h2>
        <div className="mt-4 flex flex-col items-center gap-6 rounded-lg border p-6 sm:flex-row">
          {/* Left Side – Average Rating */}
          <div className="flex flex-1 flex-col items-center">
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">out of 5</span>
            </div>
            <div className="mt-2 flex gap-1">{renderRating(averageRating)}</div>
            <p className="mt-2 text-sm text-gray-500">Based on {reviews.length} reviews</p>
          </div>

          {/* Right Side – Star Rating Distribution & Filters */}
          <div className="flex-1">
            <div className="mt-2 space-y-2">
              {ratingBreakdown.map(({ star, count }) => (
                <div
                  key={star}
                  className={`flex cursor-pointer items-center gap-2 p-1 rounded ${
                    filterRating === star ? 'bg-yellow-50' : ''
                  }`}
                  onClick={() => filterReviewsByRating(star)}
                >
                  <div className="flex gap-1">{renderRating(star)}</div>
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-yellow-400"
                      style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">({count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Description and Reviews */}
      <div className="mt-20">
        <div className="flex">
          <button
            className={`border px-5 py-3 text-sm ${activeTab === 'description' ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`border px-5 py-3 text-sm ${activeTab === 'reviews' ? 'bg-gray-100 font-medium' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Description Tab Content */}
        {activeTab === 'description' && (
          <div className="flex flex-col gap-4 border p-6 text-sm text-gray-500">
            <p>{productData.description}</p>
          </div>
        )}

        {/* Reviews Tab Content */}
        {activeTab === 'reviews' && (
          <div className="border p-6">
            {/* Review Form */}
            <div className="mb-8">
              <h3 className="text-lg font-medium">Leave a Review</h3>
              {!user || !user._id ? (
                <div>
                  <p className="mt-4 text-sm text-gray-500">Please login to leave a review.</p>
                </div>
              ) : (
                <>
                  <div className="mt-4">
                    <p className="mb-2">Your Rating:</p>
                    <div className="flex gap-1">
                      {renderClickableStars(rating, setRating)}
                    </div>
                  </div>
                  <textarea
                    className="mt-4 w-full rounded border-2 border-gray-300 p-2 text-sm"
                    rows="4"
                    placeholder="Write your review..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="text-sm"
                    />
                  
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reviewImages.map((imageData, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageData.url}
                          alt={`Review Image ${index + 1}`}
                          className="size-20 rounded object-cover"
                        />
                        <button
                          onClick={() => removeReviewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full size-5 text-xs flex items-center justify-center"
                        >
                          <FaTimes size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className={`btn mt-4 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleSubmitReview}
                    disabled={uploading}
                  >
                    {uploading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </>
              )}
            </div>

            {/* Display Existing Reviews */}
            <div className="mt-8">
              <h3 className="text-lg font-medium">Customer Reviews</h3>
              {loadingReviews ? (
                <p className="mt-4 text-sm text-gray-500">Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No reviews yet. Be the first to review!</p>
              ) : (
                <>
                  {displayedReviews.map((review) => {
                    const { hasLiked, hasDisliked } = getUserInteractionStatus(review);
                    
                    return (
                      <div key={review.id} className="mt-4 border-b pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderRating(review.rating)}
                            <span className="font-medium text-sm">{maskEmail(review.author)}</span>
                          </div>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                        <p className="mt-2 text-sm">{review.comment}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.images.map((imageUrl, index) => (
                            <img
                              key={index}
                              src={imageUrl}
                              alt={`Review Image ${index + 1}`}
                              className="size-20 cursor-pointer object-cover"
                              onClick={() => handleImageClick(imageUrl)}
                            />
                          ))}
                        </div>

                        {/* Admin Reply Section */}
                        {review.hasReply && review.reply && (
                          <div className="mt-4 ml-4 border-l-2 border-black pl-4">
                            <div className="mb-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                              <div className="flex items-center gap-2 mb-1">
                                <FaUserShield className="text-black" size={14} />
                                <span className="font-medium text-sm text-black">{maskEmail(review.reply.author)}</span>
                                <span className="text-xs text-gray-500">{review.reply.date}</span>
                              </div>
                              <p className="text-sm text-gray-700">{review.reply.content}</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>Was this helpful?</span>
                          <button 
                            onClick={() => handleLikeReview(review.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              hasLiked 
                                ? 'text-green-600 font-semibold' 
                                : 'hover:text-green-600'
                            }`}
                          >
                            <FaThumbsUp size={14} /> {review.likes}
                          </button>
                          <button 
                            onClick={() => handleDislikeReview(review.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              hasDisliked 
                                ? 'text-red-600 font-semibold' 
                                : 'hover:text-red-600'
                            }`}
                          >
                            <FaThumbsDown size={14} /> {review.dislikes}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredReviews.length > 10 && (
                    <button
                      className="btn mt-4"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative">
            <img
              src={selectedImage}
              alt="Enlarged Review"
              className="max-h-[90vh] max-w-[90vw] rounded"
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