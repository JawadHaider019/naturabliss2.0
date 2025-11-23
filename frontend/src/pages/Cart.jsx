import { useContext, useEffect, useState, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from '../components/Title';
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { useNavigate } from "react-router-dom"; 
import { FaInfoCircle, FaTrash, FaMinus, FaPlus, FaChevronDown, FaChevronUp, FaExclamationTriangle } from "react-icons/fa";
import { toast } from 'react-toastify';

const Cart = () => {
  const { 
    products, 
    deals, 
    currency, 
    cartItems, 
    cartDeals,
    updateQuantity,
    updateDealQuantity
  } = useContext(ShopContext);

  const [productData, setProductData] = useState(null);
  const [productCartData, setProductCartData] = useState([]);
  const [dealCartData, setDealCartData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedDeals, setExpandedDeals] = useState({});
  const [hasOutOfStockItems, setHasOutOfStockItems] = useState(false);
  const navigate = useNavigate();

  // Check if cart is empty
  const cartItemCount = (cartItems ? Object.keys(cartItems).length : 0) + 
                       (cartDeals ? Object.keys(cartDeals).length : 0);

  // Empty cart check - return early if cart is empty
  if (cartItemCount === 0) {
    return (
      <div className="border-t border-gray-300 pt-8 md:pt-14 px-4 md:px-0">
        <div className="mb-6 md:mb-8 text-3xl text-center">
          <Title text1={'YOUR'} text2={'CART'} />
        </div>
        <div className="text-center py-12 md:py-16 border border-gray-300 bg-gray-50">
          <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors font-medium"
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  // Stock checking - only check actual stock from backend
  const getProductStockInfo = useCallback((productId, quantity) => {
    const product = products.find(p => p._id === productId);
    if (!product) {
      return {
        inStock: false,
        available: 0,
        requested: quantity,
        isOutOfStock: true
      };
    }

    const availableStock = product.quantity || 0;
    const isOutOfStock = availableStock === 0;
    
    return {
      inStock: !isOutOfStock,
      available: availableStock,
      requested: quantity,
      isOutOfStock
    };
  }, [products]);

  const getDealStockInfo = useCallback((dealId, quantity) => {
    const deal = deals.find(d => d._id === dealId);
    if (!deal) {
      return {
        inStock: false,
        available: 0,
        requested: quantity,
        isOutOfStock: true
      };
    }

    // For deals, check if any product in the deal is out of stock
    const dealProducts = getDealProductsFromDeal(deal);
    const hasOutOfStockProduct = dealProducts.some(product => 
      product && (product.quantity === 0 || product.stock === 0)
    );

    const isOutOfStock = hasOutOfStockProduct;
    
    return {
      inStock: !isOutOfStock,
      available: 999, // Don't limit deal quantity in cart
      requested: quantity,
      isOutOfStock
    };
  }, [deals, products]);

  // Helper function to get deal products
  const getDealProductsFromDeal = (deal) => {
    if (deal.dealProducts && deal.dealProducts.length > 0) {
      return deal.dealProducts.map(product => {
        const productData = products.find(p => p._id === product._id) || product;
        return {
          ...productData,
          quantity: product.quantity || 1
        };
      });
    } else if (deal.products && deal.products.length > 0) {
      return deal.products.map(productId => {
        const product = products.find(p => p._id === productId);
        return {
          ...product,
          quantity: 1
        };
      });
    }
    return [];
  };

  // Update cart data whenever cartItems or cartDeals change
  useEffect(() => {
    // Process products
    const tempProductData = [];
    let outOfStockFound = false;

    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        const product = products.find(p => p._id === itemId);
        if (product) {
          const stockInfo = getProductStockInfo(itemId, cartItems[itemId]);
          
          if (stockInfo.isOutOfStock) {
            outOfStockFound = true;
          }

          tempProductData.push({
            id: itemId, 
            quantity: cartItems[itemId],
            type: 'product',
            data: product,
            stockInfo
          });
        }
      }
    }
    setProductCartData(tempProductData);

    // Process deals
    const tempDealData = [];
    for (const dealId in cartDeals) {
      if (cartDeals[dealId] > 0) {
        const deal = deals.find(d => d._id === dealId);
        if (deal) {
          const stockInfo = getDealStockInfo(dealId, cartDeals[dealId]);
          
          if (stockInfo.isOutOfStock) {
            outOfStockFound = true;
          }

          tempDealData.push({
            id: dealId, 
            quantity: cartDeals[dealId],
            type: 'deal',
            data: deal,
            stockInfo
          });
        }
      }
    }
    setDealCartData(tempDealData);
    setHasOutOfStockItems(outOfStockFound);
  }, [cartItems, cartDeals, products, deals, getProductStockInfo, getDealStockInfo]);

  const getItemDisplayData = (item) => {
    if (item.type === 'product') {
      const product = item.data;
      const unitPrice = product.discountprice > 0 ? product.discountprice : product.price;
      const itemTotalPrice = unitPrice * item.quantity;
      
      const stockInfo = item.stockInfo || getProductStockInfo(item.id, item.quantity);
      const availableStock = stockInfo.available || 0;
      
      const isOutOfStock = availableStock === 0;
      const canAddMore = availableStock > 0 && item.quantity < availableStock;

      return {
        name: product.name,
        image: product.image?.[0] || assets.placeholder_image,
        unitPrice,
        itemTotalPrice,
        type: 'product',
        description: product.description,
        fullData: product,
        originalPrice: product.price,
        hasDiscount: product.discountprice > 0,
        availableStock,
        isOutOfStock,
        canAddMore,
        stockMessage: getStockMessage(availableStock, item.quantity, isOutOfStock)
      };
    } else {
      const deal = item.data;
      const unitPrice = deal.dealFinalPrice || deal.dealTotal;
      const itemTotalPrice = unitPrice * item.quantity;
      
      const stockInfo = item.stockInfo || getDealStockInfo(item.id, item.quantity);
      const isOutOfStock = stockInfo.isOutOfStock;
      const canAddMore = !isOutOfStock;

      return {
        name: deal.dealName,
        image: deal.dealImages?.[0] || assets.placeholder_image,
        unitPrice,
        itemTotalPrice,
        type: 'deal',
        description: deal.dealDescription,
        fullData: deal,
        originalTotalPrice: deal.dealTotal,
        savings: deal.dealSavings,
        availableStock: 999,
        isOutOfStock,
        canAddMore,
        stockMessage: getStockMessage(999, item.quantity, isOutOfStock)
      };
    }
  };

  // Stock message logic
  const getStockMessage = (availableStock, currentQuantity, isOutOfStock) => {
    if (isOutOfStock) {
      return "Out of Stock";
    } else if (currentQuantity > availableStock) {
      return `Only ${availableStock} available`;
    } else if (availableStock < 5) {
      return `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} left!`;
    } else if (availableStock < 10) {
      return `${availableStock} items left`;
    } else if (availableStock < 20) {
      return "Limited items left";
    } else {
      return "In Stock";
    }
  };

  // Stock status rendering
  const renderStockStatus = (availableStock, currentQuantity, isOutOfStock) => {
    if (isOutOfStock) {
      return (
        <div>
          <p className="text-red-500 font-medium">Out of Stock</p>
        </div>
      );
    } else if (currentQuantity > availableStock) {
      return (
        <div>
          <p className="text-red-500 font-medium">Only {availableStock} available</p>
          <p className="text-red-400 text-sm mt-1">Quantity adjusted to available stock</p>
        </div>
      );
    } else if (availableStock < 5) {
      return (
        <div>
          <p className="text-red-500 font-medium">Only {availableStock} item{availableStock !== 1 ? 's' : ''} left!</p>
          <p className="text-red-400 text-sm mt-1">Hurry, low stock</p>
        </div>
      );
    } else if (availableStock < 10) {
      return (
        <div>
          <p className="text-orange-500">{availableStock} items left</p>
          <p className="text-orange-400 text-sm mt-1">Limited stock available</p>
        </div>
      );
    } else if (availableStock < 20) {
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

  // Fixed quantity update functions
  const handleQuantityUpdate = (itemId, quantity, itemType) => {
    console.log(`Updating ${itemType} ${itemId} to quantity ${quantity}`);
    
    if (itemType === 'deal') {
      updateDealQuantity(itemId, quantity);
    } else {
      updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = (itemId, itemType) => {
    handleQuantityUpdate(itemId, 0, itemType);
    toast.success('Item removed from cart');
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedItem(null);
  };

  const toggleDealExpansion = (dealId) => {
    setExpandedDeals(prev => ({
      ...prev,
      [dealId]: !prev[dealId]
    }));
  };

  const handleProceedToCheckout = () => {
    if (hasOutOfStockItems) {
      toast.error("Please remove out-of-stock items before proceeding to checkout");
      return;
    }
    
    if (productCartData.length === 0 && dealCartData.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    navigate('/place-order');
  };

  // Fixed Quantity Controls component
  const QuantityControls = ({ item, itemType }) => {
    const itemData = getItemDisplayData(item);
    
    if (itemData.isOutOfStock) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center border border-red-300 bg-red-50 text-red-700 px-3 py-2">
            <span className="text-sm font-medium">Out of Stock</span>
          </div>
        </div>
      );
    }

    const maxQuantity = Math.min(50, itemData.availableStock);
    
    const handleIncrement = () => {
      if (item.quantity < maxQuantity) {
        handleQuantityUpdate(item.id, item.quantity + 1, itemType);
      } else {
        toast.info(`Maximum quantity reached (${maxQuantity})`);
      }
    };

    const handleDecrement = () => {
      if (item.quantity > 1) {
        handleQuantityUpdate(item.id, item.quantity - 1, itemType);
      }
    };

    const handleDirectUpdate = (newQuantity) => {
      const parsedQuantity = parseInt(newQuantity) || 1;
      if (parsedQuantity >= 1 && parsedQuantity <= maxQuantity) {
        handleQuantityUpdate(item.id, parsedQuantity, itemType);
      } else if (parsedQuantity > maxQuantity) {
        toast.info(`Maximum quantity is ${maxQuantity}`);
        handleQuantityUpdate(item.id, maxQuantity, itemType);
      }
    };

    const isIncrementDisabled = item.quantity >= maxQuantity;
    const isDecrementDisabled = item.quantity <= 1;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center border border-gray-300 bg-white">
          <button
            onClick={handleDecrement}
            disabled={isDecrementDisabled}
            className={`px-3 py-1 ${
              isDecrementDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-black hover:bg-gray-100'
            }`}
          >
            <FaMinus className="w-3 h-3" />
          </button>
          
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleDirectUpdate(e.target.value)}
            min={1}
            max={maxQuantity}
            disabled={itemData.isOutOfStock}
            className={`w-16 rounded border-2 border-gray-300 px-2 py-1 text-center text-sm ${
              itemData.isOutOfStock ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
          
          <button
            onClick={handleIncrement}
            disabled={isIncrementDisabled}
            className={`px-3 py-1 ${
              isIncrementDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-black hover:bg-gray-100'
            }`}
          >
            <FaPlus className="w-3 h-3" />
          </button>
        </div>
        
        <div className="text-xs">
          {renderStockStatus(itemData.availableStock, item.quantity, itemData.isOutOfStock)}
        </div>
      </div>
    );
  };

  // Get deal products with proper data
  const getDealProducts = (deal) => {
    const dealProducts = getDealProductsFromDeal(deal);
    return dealProducts.map(product => {
      if (!product) return null;
      
      const availableStock = product.quantity || product.stock || 0;
      const isOutOfStock = availableStock === 0;
      
      return {
        ...product,
        quantity: product.quantity || 1,
        availableStock,
        stockMessage: getStockMessage(availableStock, product.quantity || 1, isOutOfStock),
        isOutOfStock
      };
    }).filter(Boolean);
  };

  // Render product details modal
  const renderProductDetails = (itemData) => {
    const product = itemData.fullData;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={itemData.image}
              alt={itemData.name}
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Product Details</h3>
              <p className="text-gray-700 leading-relaxed">{itemData.description || "No description available."}</p>
            </div>

            <div className="p-3 rounded border">
              {renderStockStatus(itemData.availableStock, selectedItem.quantity, itemData.isOutOfStock)}
            </div>

            <div className="space-y-3 bg-gray-50 p-4 border border-gray-200">
              <h4 className="font-semibold text-black">Pricing Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unit Price:</span>
                  <div className="text-right">
                    {itemData.hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-500 text-sm">
                          {currency}{itemData.originalPrice}
                        </span>
                        <span className="font-semibold text-black text-lg">
                          {currency}{itemData.unitPrice}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-black text-lg">{currency}{itemData.unitPrice}</span>
                    )}
                  </div>
                </div>
                
                {itemData.hasDiscount && (
                  <div className="flex justify-between items-center text-green-600 bg-green-50 p-2">
                    <span className="font-medium">You Save:</span>
                    <span className="font-semibold">
                      {currency}{(itemData.originalPrice - itemData.unitPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-medium">Quantity:</span>
                  <span className="font-semibold">{selectedItem.quantity}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-black text-lg">
                    {currency}{itemData.itemTotalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render deal details modal with products included
  const renderDealDetails = (itemData) => {
    const deal = itemData.fullData;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={itemData.image}
              alt={itemData.name}
              className="w-full h-48 md:h-64 object-cover"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Deal Details</h3>
              <p className="text-gray-700 leading-relaxed">{itemData.description || "No description available."}</p>
            </div>

            <div className="p-3 rounded border">
              {renderStockStatus(itemData.availableStock, selectedItem.quantity, itemData.isOutOfStock)}
            </div>

            <div className="space-y-3 bg-gray-50 p-4 border border-gray-200">
              <h4 className="font-semibold text-black">Deal Pricing</h4>
              <div className="space-y-2">
                {deal.dealTotal && deal.dealTotal > deal.dealFinalPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Original Total:</span>
                    <span className="line-through text-gray-500">
                      {currency}{deal.dealTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Deal Price:</span>
                  <span className="font-semibold text-black text-lg">
                    {currency}{itemData.unitPrice.toFixed(2)}
                  </span>
                </div>
                
                {deal.dealTotal && deal.dealTotal > deal.dealFinalPrice && (
                  <div className="flex justify-between items-center text-green-600 bg-green-50 p-2">
                    <span className="font-medium">You Save:</span>
                    <span className="font-semibold">
                      {currency}{(deal.dealTotal - deal.dealFinalPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-medium">Quantity:</span>
                  <span className="font-semibold">{selectedItem.quantity}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-black text-lg">
                    {currency}{itemData.itemTotalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(deal.dealProducts || deal.products) && (
          <div className="border-t border-gray-300 pt-6">
            <h3 className="font-semibold text-lg mb-4">
              Includes {(deal.dealProducts || deal.products).length} Products
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {getDealProducts(deal).map((product, index) => {
                if (!product) return null;
                
                const hasDiscount = product.discountprice > 0;
                const sellingPrice = hasDiscount ? product.discountprice : product.price;
                const quantity = product.quantity || 1;
                const productTotal = sellingPrice * quantity;
                
                return (
                  <div key={index} className={`flex items-center justify-between p-3 border border-gray-200 ${
                    product.isOutOfStock ? 'bg-red-50' : 'bg-white'
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          product.isOutOfStock ? 'text-gray-500' : 'text-black'
                        }`}>
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount ? (
                            <>
                              <span className="line-through text-gray-500 text-xs">
                                {currency}{product.price}
                              </span>
                              <span className={`font-semibold text-sm ${
                                product.isOutOfStock ? 'text-gray-500' : 'text-black'
                              }`}>
                                {currency}{sellingPrice}
                              </span>
                            </>
                          ) : (
                            <span className={`font-semibold text-sm ${
                              product.isOutOfStock ? 'text-gray-500' : 'text-black'
                            }`}>
                              {currency}{sellingPrice}
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-600">Qty: {quantity}</p>
                      <div className="mt-1">
                        <span className={`font-semibold text-sm ${
                          product.isOutOfStock ? 'text-gray-500' : 'text-black'
                        }`}>
                          {currency}{productTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render details modal
  const renderDetailsModal = () => {
    if (!selectedItem) return null;

    const itemData = getItemDisplayData(selectedItem);
    const isProduct = selectedItem.type === 'product';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-300">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6 border-b border-gray-300 pb-4">
              <h2 className="text-2xl font-bold text-black">{itemData.name}</h2>
              <button 
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-black text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {isProduct ? renderProductDetails(itemData) : renderDealDetails(itemData)}
          </div>
        </div>
      </div>
    );
  };

  // Render deal products in main cart view
  const renderDealProducts = (deal) => {
    const dealProducts = getDealProducts(deal);
    if (dealProducts.length === 0) return null;

    return (
      <div className="mt-4 border border-gray-200 bg-gray-50">
        <div className="p-3 border-b border-gray-200">
          <h4 className="font-semibold text-sm text-black">Includes {dealProducts.length} products:</h4>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {dealProducts.map((product, index) => {
            if (!product) return null;
            
            const hasDiscount = product.discountprice > 0;
            const sellingPrice = hasDiscount ? product.discountprice : product.price;
            const quantity = product.quantity || 1;
            const productTotal = sellingPrice * quantity;

            return (
              <div key={index} className={`flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0 ${
                product.isOutOfStock ? 'bg-red-50' : ''
              }`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={product.image?.[0] || assets.placeholder_image}
                    alt={product.name}
                    className="w-10 h-10 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-xs truncate ${
                      product.isOutOfStock ? 'text-gray-500' : 'text-black'
                    }`}>
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {hasDiscount ? (
                        <>
                          <span className="line-through text-gray-500 text-xs">
                            {currency}{product.price}
                          </span>
                          <span className={`font-semibold text-xs ${
                            product.isOutOfStock ? 'text-gray-500' : 'text-black'
                          }`}>
                            {currency}{sellingPrice}
                          </span>
                        </>
                      ) : (
                        <span className={`font-semibold text-xs ${
                          product.isOutOfStock ? 'text-gray-500' : 'text-black'
                        }`}>
                          {currency}{sellingPrice}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs">
                      {renderStockStatus(product.availableStock, product.quantity, product.isOutOfStock)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-600">Qty: {quantity}</p>
                  <div className="mt-1">
                    <span className={`font-semibold text-xs ${
                      product.isOutOfStock ? 'text-gray-500' : 'text-black'
                    }`}>
                      {currency}{productTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-gray-300 pt-8 md:pt-14 px-4 md:px-0">
      <div className="mb-6 md:mb-8 text-3xl text-center">
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {/* Products Section */}
      {productCartData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-3 text-black">
            PRODUCTS ({productCartData.length})
          </h3>
          <div className="space-y-4">
            {productCartData.map((item, index) => {
              const itemData = getItemDisplayData(item);

              return (
                <div
                  key={`product-${item.id}-${index}`}
                  className={`bg-white border ${
                    itemData.isOutOfStock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } p-4`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                      <img
                        className="w-20 h-20 object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        src={itemData.image}
                        alt={itemData.name}
                        onClick={() => handleViewDetails(item)}
                      />
                      {itemData.isOutOfStock && (
                        <div className="absolute top-0 left-0 bg-red-600 text-white text-xs px-2 py-1 font-bold">
                          OUT OF STOCK
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p 
                            className={`font-semibold text-base cursor-pointer hover:text-gray-700 transition-colors line-clamp-2 mb-2 ${
                              itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                            }`}
                            onClick={() => handleViewDetails(item)}
                          >
                            {itemData.name}
                          </p>
                          
                          <div className="flex items-center gap-3 mb-3">
                            {itemData.hasDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="line-through text-gray-500 text-sm">
                                  {currency}{itemData.originalPrice}
                                </span>
                                <span className={`font-bold text-lg ${
                                  itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                                }`}>
                                  {currency}{itemData.unitPrice}
                                </span>
                              </div>
                            ) : (
                              <span className={`font-bold text-lg ${
                                itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                              }`}>
                                {currency}{itemData.unitPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`font-bold text-lg mb-2 ${
                            itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                          }`}>
                            {currency}{itemData.itemTotalPrice.toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id, 'product')}
                            className="text-gray-500 hover:text-black transition-colors flex items-center gap-1 text-sm"
                          >
                            <FaTrash className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleViewDetails(item)}
                            className="text-black hover:text-gray-700 transition-colors flex items-center gap-2 font-medium"
                          >
                            <FaInfoCircle className="w-4 h-4" />
                            <span className="text-sm">View Details</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-medium ${
                            itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            Quantity:
                          </span>
                          <QuantityControls item={item} itemType="product" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deals Section */}
      {dealCartData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-3 text-black">
            DEALS ({dealCartData.length})
          </h3>
          <div className="space-y-4">
            {dealCartData.map((item, index) => {
              const itemData = getItemDisplayData(item);
              const deal = item.data;
              const isExpanded = expandedDeals[item.id];
              const dealProducts = getDealProducts(deal);

              return (
                <div
                  key={`deal-${item.id}-${index}`}
                  className={`bg-white border ${
                    itemData.isOutOfStock ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative">
                        <img
                          className="w-20 h-20 object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                          src={itemData.image}
                          alt={itemData.name}
                          onClick={() => handleViewDetails(item)}
                        />
                        {itemData.isOutOfStock && (
                          <div className="absolute top-0 left-0 bg-red-600 text-white text-xs px-2 py-1 font-bold">
                            OUT OF STOCK
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p 
                                className={`font-semibold text-base cursor-pointer hover:text-gray-700 transition-colors line-clamp-2 ${
                                  itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                                }`}
                                onClick={() => handleViewDetails(item)}
                              >
                                {itemData.name}
                              </p>
                              <span className={`text-xs px-2 py-1 font-medium flex-shrink-0 ${
                                itemData.isOutOfStock ? 'bg-gray-500 text-white' : 'bg-black text-white'
                              }`}>
                                DEAL
                              </span>
                            </div>
                            
                            {itemData.description && (
                              <p className={`text-sm line-clamp-2 mb-2 ${
                                itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-600'
                              }`}>
                                {itemData.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 mb-3">
                              {deal.dealTotal && deal.dealTotal > deal.dealFinalPrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="line-through text-gray-500 text-sm">
                                    {currency}{deal.dealTotal.toFixed(2)}
                                  </span>
                                  <span className={`font-bold text-lg ${
                                    itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                                  }`}>
                                    {currency}{itemData.unitPrice.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className={`font-bold text-lg ${
                                  itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                                }`}>
                                  {currency}{itemData.unitPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <div className="mb-3">
                              {renderStockStatus(itemData.availableStock, item.quantity, itemData.isOutOfStock)}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`font-bold text-lg mb-2 ${
                              itemData.isOutOfStock ? 'text-gray-500' : 'text-black'
                            }`}>
                              {currency}{itemData.itemTotalPrice.toFixed(2)}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(item.id, 'deal')}
                              className="text-gray-500 hover:text-black transition-colors flex items-center gap-1 text-sm"
                            >
                              <FaTrash className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleViewDetails(item)}
                              className="text-black hover:text-gray-700 transition-colors flex items-center gap-2 font-medium"
                            >
                              <FaInfoCircle className="w-4 h-4" />
                              <span className="text-sm">View Deal Details</span>
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-medium ${
                              itemData.isOutOfStock ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                              Quantity:
                            </span>
                            <QuantityControls item={item} itemType="deal" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {dealProducts.length > 0 && (
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => toggleDealExpansion(item.id)}
                        className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-sm text-black">
                          View {dealProducts.length} included products
                        </span>
                        {isExpanded ? (
                          <FaChevronUp className="w-4 h-4 text-gray-600" />
                        ) : (
                          <FaChevronDown className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      
                      {isExpanded && renderDealProducts(deal)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart Total and Checkout */}
      {(productCartData.length > 0 || dealCartData.length > 0) && (
        <div className="my-12 md:my-20">
          <div className="w-full md:w-[450px] ml-auto border border-gray-300 bg-white p-6">
            <CartTotal />
            <div className="w-full text-center md:text-end mt-6 pt-4 border-t border-gray-300">
              <button
                onClick={handleProceedToCheckout}
                disabled={hasOutOfStockItems}
                className={`px-8 py-4 font-semibold transition-colors w-full md:w-auto text-base ${
                  hasOutOfStockItems
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800 active:bg-gray-900'
                }`}
              >
               PROCEED TO CHECKOUT
              </button>
              {hasOutOfStockItems && (
                <p className="text-red-600 text-sm mt-2">
                  Please remove out-of-stock items before checkout
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product/Deal Details Modal */}
      {showDetailsModal && renderDetailsModal()}
    </div>
  );
};

export default Cart;