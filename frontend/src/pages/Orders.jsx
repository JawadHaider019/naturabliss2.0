import { useContext, useEffect, useState, useMemo, useCallback, memo } from "react";
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
  faHistory
} from '@fortawesome/free-solid-svg-icons';

// Helper functions (keep these at the top)
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

// 🆕 Function to get product image by ID
const getProductImageById = async (productId, backendUrl) => {
  if (!productId) return assets.placeholder_image;
  
  try {
    // Try to get product from localStorage cache first
    const cachedProducts = localStorage.getItem('productCache');
    if (cachedProducts) {
      const products = JSON.parse(cachedProducts);
      const cachedProduct = products.find(p => p._id === productId);
      if (cachedProduct?.image?.[0]) {
        return resolveImageUrl(cachedProduct.image[0], backendUrl);
      }
    }
    
    // If not in cache, try to fetch from backend
    const response = await axios.get(`${backendUrl}/api/products/${productId}`);
    if (response.data.success && response.data.data?.image?.[0]) {
      return resolveImageUrl(response.data.data.image[0], backendUrl);
    }
  } catch (error) {
    console.error("Error fetching product image:", error);
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
          // Use deal image if available
          url = resolveImageUrl(item.dealImage, backendUrl);
        } else if (item.image) {
          // Use direct image if available
          url = resolveImageUrl(item.image, backendUrl);
        } else if (item.id) {
          // Try to get image by product ID
          url = await getProductImageById(item.id, backendUrl);
        }
        
        setImageUrl(url);
        
        // Preload the image
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
        console.error("Error loading order item image:", error);
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
                {item.category || 'Product'}
              </p>
            </div>
            <p className="text-black font-bold text-lg md:text-xl shrink-0">
              {currency}{item.price.toFixed(2)}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <p className="text-gray-700 text-sm font-medium">
                Qty: <span className="text-black font-bold">{item.quantity}</span>
              </p>
              <p className="text-gray-700 text-sm font-medium">
                Total: <span className="text-black font-bold">
                  {currency}{(item.price * item.quantity).toFixed(2)}
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
      'Shipped': { icon: faShippingFast, color: 'text-black bg-purple-100 border-purple-300' },
      'Out for delivery': { icon: faMotorcycle, color: 'text-black bg-orange-100 border-orange-300' },
      'Delivered': { icon: faCheckCircle, color: 'text-black bg-green-100 border-green-300' },
      'Cancelled': { icon: faClock, color: 'text-black bg-red-100 border-red-300' }
    };

    const status = statusMap[order.status] || statusMap['Order Placed'];

    return { subtotal, total, formattedDate, ...status };
  }, [order]);

  // Preload images
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
      {/* Header */}
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
              {order.isRecent && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 text-white rounded animate-pulse">
                  <FontAwesomeIcon icon={faHistory} className="mr-1" />
                  New
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

      {/* Items */}
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

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-100 border-t-2 border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          {/* Info */}
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

          {/* Price */}
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

// 🆕 Function to manage guest orders in localStorage
const loadGuestOrdersFromStorage = () => {
  try {
    const guestOrders = localStorage.getItem('guestOrders');
    if (guestOrders) {
      return JSON.parse(guestOrders);
    }
  } catch (error) {
    console.error("Error loading guest orders from localStorage:", error);
  }
  return [];
};

// Main Orders component
const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(!token);

  // 🆕 Load all orders (both from localStorage for guests and backend for logged-in)
  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      if (mounted) setLoading(true);
      
      try {
        if (token) {
          // Logged-in user: Load their orders from backend
          const response = await axios.post(
            backendUrl + '/api/order/userorders',
            {},
            { 
              headers: { token },
              timeout: 10000
            }
          );

          if (mounted && response.data.success) {
            const sortedOrders = response.data.orders
              .filter(order => order.status !== "Cancelled")
              .sort((a, b) => parseInt(b.date) - parseInt(a.date));

            setOrders(sortedOrders);
            
            // Preload images
            const imagePromises = sortedOrders.flatMap(order => 
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
              const validUrls = imageUrls.filter(url => url !== assets.placeholder_image);
              preloadImages(validUrls);
            });
          }
        } else {
          // 🆕 Guest user: Load orders from localStorage
          const guestOrders = loadGuestOrdersFromStorage();
          
          // Also check for recent guest order
          const recentGuestOrder = localStorage.getItem('recentGuestOrder');
          let allGuestOrders = [...guestOrders];
          
          if (recentGuestOrder) {
            try {
              const recentOrder = JSON.parse(recentGuestOrder);
              // Ensure recent order has all required fields
              if (!recentOrder.items) recentOrder.items = [];
              if (!recentOrder.address) recentOrder.address = {};
              if (!recentOrder.customerDetails) recentOrder.customerDetails = {};
              
              // Add to list if not already there
              if (!allGuestOrders.some(order => order._id === recentOrder._id)) {
                allGuestOrders = [recentOrder, ...allGuestOrders];
              }
              
              // Clear recent order after 5 minutes
              setTimeout(() => {
                localStorage.removeItem('recentGuestOrder');
                console.log("🗑️ Cleared recent guest order from localStorage");
              }, 300000);
            } catch (error) {
              console.error("Error parsing recent guest order:", error);
              localStorage.removeItem('recentGuestOrder');
            }
          }
          
          // Ensure all guest orders have required fields
          const validatedOrders = allGuestOrders.map(order => ({
            ...order,
            items: order.items || [],
            address: order.address || { city: '', state: '' },
            customerDetails: order.customerDetails || { name: 'Guest Customer' },
            deliveryCharges: order.deliveryCharges || 0,
            paymentMethod: order.paymentMethod || 'COD',
            status: order.status || 'Order Placed',
            isGuest: true
          }));
          
          // Sort by date (newest first) and filter out cancelled
          const sortedOrders = validatedOrders
            .filter(order => order.status !== "Cancelled")
            .sort((a, b) => parseInt(b.date) - parseInt(a.date));

          if (mounted) {
            setOrders(sortedOrders);
            setIsGuestMode(true);
          }
          
          // Preload images
          const imagePromises = sortedOrders.flatMap(order => 
            (order.items || []).map(async (item) => {
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
            const validUrls = imageUrls.filter(url => url !== assets.placeholder_image);
            preloadImages(validUrls);
          });
          
          // 🆕 Try to sync with backend if we have guest info
          const guestOrderInfo = localStorage.getItem('guestOrderInfo');
          if (guestOrderInfo) {
            try {
              const { email, phone } = JSON.parse(guestOrderInfo);
              
              // Try to fetch guest orders from backend
              const response = await axios.post(
                backendUrl + '/api/order/guest-orders',
                { email, phone },
                { timeout: 10000 }
              );

              if (mounted && response.data.success && response.data.orders.length > 0) {
                const backendOrders = response.data.orders
                  .filter(order => order.status !== "Cancelled")
                  .map(order => ({
                    ...order,
                    isGuest: true
                  }))
                  .sort((a, b) => parseInt(b.date) - parseInt(a.date));

                // Merge localStorage and backend orders, remove duplicates
                const combinedOrders = [...backendOrders];
                sortedOrders.forEach(localOrder => {
                  if (!combinedOrders.some(backendOrder => backendOrder._id === localOrder._id)) {
                    combinedOrders.push(localOrder);
                  }
                });

                // Sort by date
                const finalOrders = combinedOrders.sort((a, b) => parseInt(b.date) - parseInt(a.date));
                
                if (mounted) {
                  setOrders(finalOrders);
                  // Save updated list to localStorage
                  localStorage.setItem('guestOrders', JSON.stringify(finalOrders));
                }
              }
            } catch (error) {
              console.log("No guest orders found or error fetching from backend:", error);
              // Keep using localStorage orders
            }
          }
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        if (mounted && !orders.length) {
          // Only show error if we have no orders at all
          if (token || !loadGuestOrdersFromStorage().length) {
            toast.error("Failed to load orders");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [backendUrl, token, orders.length]);

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
            {/* Orders list */}
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