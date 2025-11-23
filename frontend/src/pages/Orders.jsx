import { useContext, useEffect, useState, useMemo, useCallback, memo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from '../components/Title';
import axios from "axios";
import { assets } from "../assets/assets";
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimesCircle,
  faClock,
  faBox,
  faShippingFast,
  faMotorcycle,
  faCheckCircle,
  faPhone,
  faMapMarkerAlt,
  faCreditCard,
  faExclamationTriangle,
  faImage
} from '@fortawesome/free-solid-svg-icons';

// Global image cache
const imageCache = new Map();

// Ultra-fast image URL resolver
const resolveImageUrl = (image, backendUrl) => {
  if (!image) return assets.placeholder_image;
  
  const cacheKey = `${backendUrl}-${JSON.stringify(image)}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  let url = assets.placeholder_image;
  
  if (Array.isArray(image) && image.length > 0) {
    url = image[0];
  } else if (image && typeof image === 'object' && image.url) {
    url = image.url;
  } else if (typeof image === 'string') {
    if (image.startsWith('data:image')) {
      url = image;
    } else if (image.startsWith('/uploads/') && backendUrl) {
      url = `${backendUrl}${image}`;
    } else if (image in assets) {
      url = assets[image];
    } else {
      url = image;
    }
  }

  imageCache.set(cacheKey, url);
  return url;
};

// Preload images in batches
const preloadImages = (urls) => {
  if (!urls.length) return;
  
  // Use requestIdleCallback for non-critical image preloading
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      urls.forEach(url => {
        if (url && url !== assets.placeholder_image && !imageCache.get(`loaded-${url}`)) {
          const img = new Image();
          img.src = url;
          imageCache.set(`loaded-${url}`, true);
        }
      });
    });
  } else {
    // Fallback for older browsers
    setTimeout(() => {
      urls.forEach(url => {
        if (url && url !== assets.placeholder_image && !imageCache.get(`loaded-${url}`)) {
          const img = new Image();
          img.src = url;
          imageCache.set(`loaded-${url}`, true);
        }
      });
    }, 0);
  }
};

// Lightning-fast Image component
const OrderItemImage = memo(({ imageUrl, alt, className = "" }) => {
  const [loaded, setLoaded] = useState(imageCache.get(`loaded-${imageUrl}`) || false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (imageCache.get(`loaded-${imageUrl}`)) {
      setLoaded(true);
      return;
    }

    let mounted = true;
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(`loaded-${imageUrl}`, true);
      if (mounted) {
        setLoaded(true);
        setError(false);
      }
    };
    
    img.onerror = () => {
      if (mounted) {
        setError(true);
        setLoaded(true);
      }
    };
    
    img.src = imageUrl;

    return () => {
      mounted = false;
    };
  }, [imageUrl]);

  const displayUrl = error ? assets.placeholder_image : imageUrl;

  return (
    <div className={`flex items-center justify-center overflow-hidden bg-white border border-gray-200 ${className}`}>
      {!loaded ? (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 animate-pulse">
          <FontAwesomeIcon icon={faImage} className="text-gray-200 text-lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 bg-gray-100">
          <FontAwesomeIcon icon={faImage} className="text-gray-400 text-lg mb-1" />
          <span className="text-xs text-gray-500">No image</span>
        </div>
      ) : (
        <img
          className="w-full h-full object-contain p-1"
          src={displayUrl}
          alt={alt}
          loading="eager"
          decoding="async"
        />
      )}
    </div>
  );
});

// Ultra-fast Order Item
const OrderItem = memo(({ item, currency, backendUrl }) => {
  const itemData = useMemo(() => {
    const isDeal = item.isFromDeal === true;
    const imageSource = isDeal ? (item.dealImage || item.image) : item.image;
    const imageUrl = resolveImageUrl(imageSource, backendUrl);
    const price = item.price || 0;
    const discountPrice = item.discountprice > 0 ? item.discountprice : price;
    
    return {
      name: isDeal ? (item.dealName || item.name) : item.name,
      image: imageUrl,
      originalPrice: price,
      discountedPrice: discountPrice,
      isFromDeal: isDeal,
      description: isDeal ? item.dealDescription : item.description
    };
  }, [item, backendUrl]);

  const { totalPrice, unitPrice, originalTotalPrice, showOriginalPrice } = useMemo(() => ({
    totalPrice: (itemData.discountedPrice * item.quantity).toFixed(2),
    unitPrice: itemData.discountedPrice.toFixed(2),
    originalTotalPrice: (itemData.originalPrice * item.quantity).toFixed(2),
    showOriginalPrice: itemData.originalPrice > itemData.discountedPrice
  }), [itemData, item.quantity]);

  return (
    <div className="flex gap-4 p-4 hover:bg-gray-50 md:items-start">
      <div className="flex-shrink-0">
        <OrderItemImage 
          imageUrl={itemData.image}
          alt={itemData.name}
          className="w-24 h-24 md:w-28 md:h-28"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-2">
          <p className="font-semibold text-black text-base truncate">{itemData.name}</p>
          {itemData.isFromDeal && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-black text-white shrink-0">
              Deal
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {showOriginalPrice && (
            <div className="flex flex-col">
              <span className="text-gray-600 font-medium">Original</span>
              <span className="line-through text-gray-500 text-base">
                {currency}{originalTotalPrice}
              </span>
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-gray-600 font-medium">{itemData.isFromDeal ? 'Deal' : 'Price'}</span>
            <span className="font-semibold text-black text-base">
              {currency}{totalPrice}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-600 font-medium">Quantity</span>
            <span className="font-semibold text-black text-base">{item.quantity}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-600 font-medium">Unit Price</span>
            <span className="font-semibold text-gray-800 text-base">
              {currency}{unitPrice}
            </span>
          </div>
        </div>

        {itemData.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-1">
            {itemData.description}
          </p>
        )}
      </div>
    </div>
  );
});

// Blazing-fast Order Card
const OrderCard = memo(({ order, currency, backendUrl, isCancellable, onCancelOrder }) => {
  const { subtotal, total, formattedDate, statusIcon, statusColor } = useMemo(() => {
    const subtotal = order.items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const total = subtotal + (order.deliveryCharges || 0);
    const formattedDate = new Date(parseInt(order.date)).toLocaleDateString();
    
    const statusMap = {
      'Order Placed': { icon: faClock, color: 'text-black bg-yellow-100 border-yellow-300' },
      'Packing': { icon: faBox, color: 'text-black bg-blue-100 border-blue-300' },
      'Shipped': { icon: faShippingFast, color: 'text-black bg-purple-100 border-purple-300' },
      'Out for delivery': { icon: faMotorcycle, color: 'text-black bg-orange-100 border-orange-300' },
      'Delivered': { icon: faCheckCircle, color: 'text-black bg-green-100 border-green-300' }
    };

    const status = statusMap[order.status] || statusMap['Order Placed'];

    return { subtotal, total, formattedDate, ...status };
  }, [order]);

  // Preload images for this order
  useEffect(() => {
    const imageUrls = order.items.map(item => {
      const imageSource = item.isFromDeal ? (item.dealImage || item.image) : item.image;
      return resolveImageUrl(imageSource, backendUrl);
    }).filter(url => url !== assets.placeholder_image);
    
    preloadImages(imageUrls);
  }, [order.items, backendUrl]);

  return (
    <div className="mb-6 border-2 border-gray-200 bg-white shadow-lg   overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-200">
        <div className="flex justify-between items-center">
          <div className="min-w-0">
            <p className="font-semibold text-black text-lg">Order #{order._id?.substring(0, 8)}</p>
            <p className="text-sm text-gray-600 font-medium">{formattedDate}</p>
          </div>
          <div className={`inline-flex items-center px-3 py-2 border-2 font-semibold text-sm ${statusColor}`}>
            <FontAwesomeIcon icon={statusIcon} className="mr-2 text-base" />
            <span className="font-semibold">{order.status}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-200">
        {order.items.map((item, index) => (
          <OrderItem 
            key={`${order._id}-${item.id || index}`}
            item={item}
            currency={currency}
            backendUrl={backendUrl}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-100 border-t-2 border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          {/* Info */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-600 shrink-0 text-base" />
              <span className="text-gray-700 font-medium truncate">
                {order.address?.city}, {order.address?.state}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FontAwesomeIcon icon={faCreditCard} className="text-gray-600 shrink-0 text-base" />
              <span className="text-gray-700 font-medium capitalize">
                {order.paymentMethod} • {order.payment ? 'Paid' : 'COD'}
              </span>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="space-y-2 min-w-[140px]">
            <div className="bg-white border-2 border-gray-200 p-3 text-sm  ">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-semibold text-base">{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Total:</span>
                <span className="font-semibold text-lg text-black">{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            {isCancellable && (
              <button
                onClick={() => onCancelOrder(order._id)}
                className="w-full border-2 border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 flex items-center justify-center gap-2  "
              >
                <FontAwesomeIcon icon={faTimesCircle} className="text-base" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Main component with maximum optimization
const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [loading, setLoading] = useState(true);

  const cancellationReasons = useMemo(() => [
    "Changed my mind",
    "Found better price",
    "Delivery time",
    "Ordered by mistake",
    "Not required",
    "Other"
  ], []);

  // Single effect for data loading
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(
          backendUrl + '/api/order/userorders',
          {},
          { 
            headers: { token },
            timeout: 5000
          }
        );

        if (mounted && response.data.success) {
          const activeOrders = response.data.orders
            .filter(order => order.status !== "Cancelled")
            .sort((a, b) => parseInt(b.date) - parseInt(a.date));

          setOrders(activeOrders);

          // Preload all images immediately
          const allImageUrls = activeOrders.flatMap(order => 
            order.items.map(item => {
              const imageSource = item.isFromDeal ? (item.dealImage || item.image) : item.image;
              return resolveImageUrl(imageSource, backendUrl);
            })
          ).filter(url => url !== assets.placeholder_image);
          
          preloadImages(allImageUrls);
        }
      } catch (error) {
        if (mounted && error.code !== 'ECONNABORTED') {
          toast.error("Failed to load orders");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [backendUrl, token]);

  const cancelOrder = useCallback(async (orderId) => {
    const reason = selectedReason === 'Other' ? cancellationReason : selectedReason;

    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setCancellingOrder(orderId);
    try {
      const response = await axios.post(
        backendUrl + '/api/order/cancel',
        { orderId, cancellationReason: reason.trim() },
        { headers: { token }, timeout: 3000 }
      );

      if (response.data.success) {
        toast.success("Order cancelled successfully");
        setOrders(prev => prev.filter(order => order._id !== orderId));
      }
    } catch (error) {
      toast.error("Failed to cancel order");
    } finally {
      setCancellingOrder(null);
      setCancellationReason("");
      setSelectedReason("");
    }
  }, [backendUrl, token, selectedReason, cancellationReason]);

  const canCancelOrder = useCallback((order) => {
    if (order.status !== "Order Placed") return false;
    const orderTime = new Date(parseInt(order.date));
    return (Date.now() - orderTime) < (15 * 60 * 1000);
  }, []);

  if (loading) {
    return (
      <div className="border-t border-gray-200 pt-16">
        <div className="text-3xl mb-8">
          <Title text1={"MY"} text2={"ORDERS"} />
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-16">
      <div className="text-3xl mb-8">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-gray-400  ">
            <div className="flex items-center justify-between p-4 border-b-2 border-gray-400 bg-gray-100">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
                <h3 className="font-semibold text-black text-lg">Cancel Order</h3>
              </div>
              <button
                onClick={() => setCancellingOrder(null)}
                className="text-gray-600 hover:text-black text-xl font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <p className="text-base text-gray-700 mb-4 font-medium">Please tell us why you want to cancel this order:</p>

              <div className="space-y-3">
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full p-3 border-2 border-gray-400 text-base font-medium  "
                >
                  <option value="">Select a reason</option>
                  {cancellationReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>

                {selectedReason === 'Other' && (
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Please provide details..."
                    rows="3"
                    className="w-full p-3 border-2 border-gray-400 text-base font-medium   resize-none"
                    maxLength={200}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t-2 border-gray-400 bg-gray-100">
              <button
                onClick={() => setCancellingOrder(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-400 text-black text-base font-semibold hover:bg-gray-200  "
              >
                Keep Order
              </button>
              <button
                onClick={() => cancelOrder(cancellingOrder)}
                disabled={!selectedReason || (selectedReason === 'Other' && !cancellationReason.trim())}
                className={`flex-1 px-4 py-3 bg-red-600 text-white text-base font-semibold   ${
                  (!selectedReason || (selectedReason === 'Other' && !cancellationReason.trim()))
                    ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                }`}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {orders.length === 0 ? (
          <div className="text-center py-12 border-2 border-gray-400 bg-gray-100  ">
            <div className="mx-auto h-16 w-16 text-gray-500 mb-4">
              <img src={assets.parcel_icon} alt="No orders" className="opacity-60" />
            </div>
            <p className="text-gray-600 text-lg font-semibold">No active orders found</p>
            <p className="text-gray-500 text-base mt-2">Your orders will appear here once placed</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              currency={currency}
              backendUrl={backendUrl}
              isCancellable={canCancelOrder(order)}
              onCancelOrder={setCancellingOrder}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;