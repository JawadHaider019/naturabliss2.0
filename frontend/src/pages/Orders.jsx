import { useContext, useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from '../components/Title';
import axios from "axios";
import { assets } from "../assets/assets";
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faBox,
  faShippingFast,
  faMotorcycle,
  faCheckCircle,
  faMapMarkerAlt,
  faCreditCard,
  faUser,
  faShoppingBag,
  faHistory,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';

// Helper functions
const imageCache = new Map();

const resolveImageUrl = (imageSource, backendUrl) => {
  if (!imageSource) return assets.placeholder_image;
  if (imageSource.startsWith('http')) return imageSource;
  if (imageSource.startsWith('/')) return `${backendUrl}${imageSource}`;
  return `${backendUrl}/uploads/${imageSource}`;
};

const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    if (!imageCache.has(url)) {
      const img = new Image();
      img.src = url;
      imageCache.set(url, img);
    }
  });
};

const getProductImageById = async (productId, backendUrl) => {
  if (!productId) return assets.placeholder_image;
  
  try {
    const cachedProducts = localStorage.getItem('productCache');
    if (cachedProducts) {
      const products = JSON.parse(cachedProducts);
      const cachedProduct = products.find(p => p._id === productId);
      if (cachedProduct?.image?.[0]) {
        return resolveImageUrl(cachedProduct.image[0], backendUrl);
      }
    }
    
    const response = await axios.get(`${backendUrl}/api/products/${productId}`);
    if (response.data.success && response.data.data?.image?.[0]) {
      return resolveImageUrl(response.data.data.image[0], backendUrl);
    }
  } catch (error) {
    // Silently handle error
  }
  
  return assets.placeholder_image;
};

const OrderItemImage = memo(({ item, backendUrl }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(assets.placeholder_image);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);
      
      try {
        let url = assets.placeholder_image;
        
        if (item.isFromDeal && item.dealImage) {
          url = resolveImageUrl(item.dealImage, backendUrl);
        } else if (item.image) {
          url = resolveImageUrl(item.image, backendUrl);
        } else if (item.id) {
          url = await getProductImageById(item.id, backendUrl);
        }
        
        setImageUrl(url);
        
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setIsLoading(false);
          setImageError(false);
        };
        img.onerror = () => {
          setIsLoading(false);
          setImageError(true);
          setImageUrl(assets.placeholder_image);
        };
      } catch (error) {
        setIsLoading(false);
        setImageError(true);
        setImageUrl(assets.placeholder_image);
      }
    };
    
    loadImage();
  }, [item, backendUrl]);

  return (
    <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-md border-2 border-gray-200 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      )}
      <img
        src={imageError ? assets.placeholder_image : imageUrl}
        alt={item.name}
        className={`h-full w-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
      />
      {item.isFromDeal && (
        <div className="absolute top-1 left-1 bg-yellow-600 text-white text-xs px-2 py-1 rounded font-semibold">
          Deal
        </div>
      )}
    </div>
  );
});

const OrderItem = memo(({ item, currency, backendUrl }) => {
  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        <OrderItemImage item={item} backendUrl={backendUrl} />
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-3 mb-2">
            <div className="min-w-0">
              <p className="font-semibold text-black text-base md:text-lg truncate">
                {item.name}
              </p>
              <p className="text-gray-600 text-sm truncate">
                {item.category || 'Product'} {item.subcategory ? `| ${item.subcategory}` : ''}
              </p>
            </div>
            <p className="text-black font-bold text-lg md:text-xl shrink-0">
              {currency}{item.price?.toFixed(2) || '0.00'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <p className="text-gray-700 text-sm font-medium">
                Qty: <span className="text-black font-bold">{item.quantity || 1}</span>
              </p>
              <p className="text-gray-700 text-sm font-medium">
                Total: <span className="text-black font-bold">
                  {currency}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </span>
              </p>
            </div>
            
            {item.isFromDeal && item.originalTotalPrice && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm line-through">
                  {currency}{item.originalTotalPrice.toFixed(2)}
                </span>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                  Save {currency}{item.savings?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const OrderCard = memo(({ order, currency, backendUrl, isGuest = false }) => {
  const { subtotal, total, formattedDate, statusIcon, statusColor } = useMemo(() => {
    const subtotal = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const total = subtotal + (order.deliveryCharges || 0);
    const formattedDate = new Date(parseInt(order.date)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const statusMap = {
      'Order Placed': { icon: faClock, color: 'text-black bg-yellow-100 border-yellow-300' },
      'Processing': { icon: faBox, color: 'text-black bg-blue-100 border-blue-300' },
      'Packing': { icon: faBox, color: 'text-black bg-blue-100 border-blue-300' },
      'Shipped': { icon: faShippingFast, color: 'text-black bg-purple-100 border-purple-300' },
      'Out for delivery': { icon: faMotorcycle, color: 'text-black bg-orange-100 border-orange-300' },
      'Delivered': { icon: faCheckCircle, color: 'text-black bg-green-100 border-green-300' },
      'Cancelled': { icon: faClock, color: 'text-black bg-red-100 border-red-300' }
    };

    const status = statusMap[order.status] || statusMap['Order Placed'];

    return { subtotal, total, formattedDate, ...status };
  }, [order]);

  useEffect(() => {
    const imagePromises = order.items.map(async (item) => {
      if (item.isFromDeal && item.dealImage) {
        return resolveImageUrl(item.dealImage, backendUrl);
      } else if (item.image) {
        return resolveImageUrl(item.image, backendUrl);
      } else if (item.id) {
        return await getProductImageById(item.id, backendUrl);
      }
      return assets.placeholder_image;
    });

    Promise.all(imagePromises).then(imageUrls => {
      const validUrls = imageUrls.filter(url => url !== assets.placeholder_image);
      preloadImages(validUrls);
    });
  }, [order.items, backendUrl]);

  return (
    <div className="mb-6 border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-200">
        <div className="flex justify-between items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-black text-lg">Order #{order._id?.substring(order._id.length - 6).toUpperCase()}</p>
              {isGuest && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-700 text-white rounded">
                  <FontAwesomeIcon icon={faUser} className="mr-1" />
                  Guest
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-medium">{formattedDate}</p>
          </div>
          <div className={`inline-flex items-center px-3 py-2 border-2 font-semibold text-sm ${statusColor}`}>
            <FontAwesomeIcon icon={statusIcon} className="mr-2 text-base" />
            <span className="font-semibold">{order.status}</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {order.items && order.items.map((item, index) => (
          <OrderItem 
            key={`${order._id}-${item.id || index}`}
            item={item}
            currency={currency}
            backendUrl={backendUrl}
          />
        ))}
      </div>

      <div className="px-4 py-3 bg-gray-100 border-t-2 border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            {order.address && (
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-600 shrink-0 text-base" />
                <span className="text-gray-700 font-medium truncate">
                  {order.address.city}, {order.address.state}
                  {order.address.zipcode && ` (${order.address.zipcode})`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <FontAwesomeIcon icon={faCreditCard} className="text-gray-600 shrink-0 text-base" />
              <span className="text-gray-700 font-medium capitalize">
                {order.paymentMethod || 'COD'} • {order.payment ? 'Paid' : 'COD'}
              </span>
            </div>
            {order.customerDetails && (
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faUser} className="text-gray-600 shrink-0 text-base" />
                <span className="text-gray-700 font-medium truncate">
                  {order.customerDetails.name}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-[140px]">
            <div className="bg-white border-2 border-gray-200 p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-semibold text-base">{currency}{subtotal.toFixed(2)}</span>
              </div>
              {order.deliveryCharges > 0 && (
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 font-medium">Delivery:</span>
                  <span className="font-semibold">{currency}{order.deliveryCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-gray-300">
                <span className="text-gray-700 font-bold">Total:</span>
                <span className="font-semibold text-lg text-black">{currency}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Function to load guest info from localStorage
const loadGuestInfo = () => {
  try {
    const guestInfo = localStorage.getItem('guestOrderInfo');
    if (guestInfo) {
      return JSON.parse(guestInfo);
    }
  } catch (error) {
    console.error('Error loading guest info:', error);
  }
  return null;
};

// Function to load guest orders from localStorage
const loadGuestOrdersFromStorage = () => {
  try {
    const guestOrders = localStorage.getItem('guestOrders');
    if (guestOrders) {
      return JSON.parse(guestOrders);
    }
  } catch (error) {
    console.error('Error loading guest orders:', error);
  }
  return [];
};

// Main Orders component
const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [guestInfo, setGuestInfo] = useState(null);
  
  const isMounted = useRef(true);

  // Load guest info from localStorage on mount
  useEffect(() => {
    const info = loadGuestInfo();
    if (info) {
      setGuestInfo(info);
      setIsGuestMode(true);
    }
  }, []);

  // Fetch orders from backend
  const fetchOrders = useCallback(async (showIndicator = false) => {
    if (!isMounted.current) return;
    
    if (showIndicator) {
      setRefreshing(true);
    }
    
    try {
      let newOrders = [];

      if (token) {
        // Logged-in user: Load their orders from backend
        const response = await axios.post(
          backendUrl + '/api/order/userorders',
          {},
          { headers: { token } }
        );

        if (response.data.success) {
          newOrders = response.data.orders || [];
        }
      } else if (guestInfo) {
        // Guest user: Load orders from backend using email/phone
        const response = await axios.post(
          backendUrl + '/api/order/guest-orders',
          { 
            email: guestInfo.email,
            phone: guestInfo.phone 
          }
        );

        if (response.data.success) {
          newOrders = response.data.orders || [];
        }
      } else {
        // Fallback to localStorage
        newOrders = loadGuestOrdersFromStorage();
      }

      // Filter orders - keep cancelled orders from last 24 hours
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      newOrders = newOrders
        .filter(order => {
          if (order.status !== "Cancelled") {
            return true;
          }
          return parseInt(order.date) > oneDayAgo;
        })
        .sort((a, b) => parseInt(b.date) - parseInt(a.date));

      if (isMounted.current) {
        setOrders(newOrders);
        setLastUpdated(new Date());
        
        if (showIndicator) {
          if (newOrders.length > 0) {
            toast.success(`Found ${newOrders.length} orders!`);
          } else {
            toast.info('No orders found');
          }
        }
      }

      // Preload images
      if (newOrders.length > 0) {
        const imagePromises = newOrders.flatMap(order => 
          order.items.map(async (item) => {
            if (item.isFromDeal && item.dealImage) {
              return resolveImageUrl(item.dealImage, backendUrl);
            } else if (item.image) {
              return resolveImageUrl(item.image, backendUrl);
            } else if (item.id) {
              return await getProductImageById(item.id, backendUrl);
            }
            return assets.placeholder_image;
          })
        );

        Promise.all(imagePromises).then(imageUrls => {
          if (isMounted.current) {
            const validUrls = imageUrls.filter(url => url !== assets.placeholder_image);
            preloadImages(validUrls);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (showIndicator) {
        toast.error('Failed to fetch orders');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [backendUrl, token, guestInfo]);

  // Initial load
  useEffect(() => {
    isMounted.current = true;
    fetchOrders();
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchOrders]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!guestInfo && !token) return;

    const intervalId = setInterval(() => {
      fetchOrders(false);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchOrders, guestInfo, token]);

  // Refresh when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchOrders]);

  // Refresh on focus
  useEffect(() => {
    const handleFocus = () => {
      fetchOrders(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchOrders]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchOrders(true);
  };

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return lastUpdated.toLocaleTimeString();
  };

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
      <div className="text-3xl mb-8 flex justify-between items-center">
        <Title text1={"MY"} text2={"ORDERS"} />
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated {getLastUpdatedText()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              refreshing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FontAwesomeIcon 
              icon={faSyncAlt} 
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div>
        {orders.length === 0 ? (
          <div className="text-center py-12 border-2 border-gray-400 bg-gray-100 rounded-lg">
            <div className="mx-auto h-16 w-16 text-gray-500 mb-4">
              <FontAwesomeIcon icon={faShoppingBag} className="text-4xl opacity-60" />
            </div>
            <p className="text-gray-600 text-lg font-semibold">No orders found</p>
            <p className="text-gray-500 text-base mt-2">
              {token 
                ? "Your orders will appear here once placed" 
                : guestInfo 
                  ? "No orders found with this email/phone"
                  : "Place an order to see it here"}
            </p>
            {!token && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/place-order'}
                  className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800"
                >
                  Place Your First Order
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                currency={currency}
                backendUrl={backendUrl}
                isGuest={isGuestMode}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;