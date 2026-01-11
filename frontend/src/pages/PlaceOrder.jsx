import React from 'react';
import { useState, useContext, useEffect, useCallback } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from "react-router-dom"; 
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from "../assets/assets";

const PlaceOrder = () => {
  const [loading, setLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [pakistanStates, setPakistanStates] = useState([]);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [cityZipData, setCityZipData] = useState({});
  const [knownCitiesWithZips, setKnownCitiesWithZips] = useState({});
  
  const {
    backendUrl,
    token,
    user,
    cartItems,
    cartDeals,
    setCartItems,
    setCartDeals,
    getDeliveryCharge,
    products,
    deals,
    getCart
  } = useContext(ShopContext);
  
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('orderFormData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      return parsedData;
    }
    
    // Set defaults - user data if logged in, otherwise empty
    const defaultData = {
      fullName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      phone: ''
    };
    
    // If user is logged in, pre-fill with their data
    if (user?.name && user?.email) {
      defaultData.fullName = user.name;
      defaultData.email = user.email;
      if (user.phone) defaultData.phone = user.phone;
    }
    
    return defaultData;
  });

  // Load Pakistan states
  useEffect(() => {
    const loadPakistanStates = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/locations/pakistan/states`);
        if (response.data.success) {
          setPakistanStates(response.data.data.states.map(state => state.name));
        }
      } catch (error) {
        setPakistanStates(['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan']);
      }
    };
    loadPakistanStates();
  }, [backendUrl]);

  // Fetch cities with ZIP codes
  const fetchCitiesByState = useCallback(async (stateName) => {
    if (!stateName) {
      setCities([]);
      setCityZipData({});
      setKnownCitiesWithZips({});
      return;
    }

    setIsLoadingCities(true);
    try {
      const response = await axios.get(`${backendUrl}/api/locations/cities`, {
        params: { state: stateName }
      });

      if (response.data.success) {
        const citiesData = response.data.data.cities;
        if (citiesData.length > 0) {
          const cityNames = citiesData.map(city => city.name).sort();
          setCities(cityNames);
          
          // Create city-zip mapping
          const zipMapping = {};
          const knownCities = {};
          
          citiesData.forEach(city => {
            if (city.name && city.zipCode && city.zipCode !== 'N/A') {
              zipMapping[city.name] = city.zipCode;
              knownCities[city.name] = {
                zipCode: city.zipCode,
                state: stateName
              };
            }
          });
          
          setCityZipData(zipMapping);
          setKnownCitiesWithZips(knownCities);
        }
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  }, [backendUrl]);

  // Auto-fill ZIP code
  const autoFillZipCode = useCallback((cityName) => {
    if (cityName && cityZipData[cityName] && !formData.zipcode) {
      setFormData(prev => ({
        ...prev,
        zipcode: cityZipData[cityName]
      }));
      
      if (validationErrors.zipcode) {
        setValidationErrors(prev => ({ ...prev, zipcode: '' }));
      }
    }
  }, [cityZipData, formData.zipcode, validationErrors.zipcode]);

  // Validate address
  const validateAddress = useCallback(async (city, state, zipcode) => {
    if (!city || !state) return { isValid: false, message: 'City and state are required' };

    try {
      const response = await axios.post(`${backendUrl}/api/locations/validate-city-zip`, {
        city, state, zipCode: zipcode, country: 'Pakistan'
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        // Even if validation fails, allow the order with manual verification
        if (city && state && zipcode && /^\d{5}$/.test(zipcode)) {
          return { 
            isValid: true, 
            message: 'Address accepted with manual verification',
            requiresManualVerification: true
          };
        }
        // Even if basic validation fails, still allow with warning
        return { 
          isValid: true, 
          message: 'Address will be manually verified',
          requiresManualVerification: true
        };
      }
    } catch (error) {
      // If API fails, always allow the order
      return { 
        isValid: true, 
        message: 'Address accepted (validation service unavailable)',
        requiresManualVerification: true
      };
    }
  }, [backendUrl]);

  // Update cities when state changes
  useEffect(() => {
    if (formData.state) {
      fetchCitiesByState(formData.state);
    } else {
      setCities([]);
      setCityZipData({});
      setKnownCitiesWithZips({});
    }
  }, [formData.state, fetchCitiesByState]);

  // Auto-fill ZIP code when city changes
  useEffect(() => {
    if (formData.city && cityZipData[formData.city] && !formData.zipcode) {
      autoFillZipCode(formData.city);
    }
  }, [formData.city, formData.zipcode, cityZipData, autoFillZipCode]);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem('orderFormData', JSON.stringify(formData));
  }, [formData]);

  // Check if cart data is ready
  useEffect(() => {
    const hasCartItems = (cartItems && Object.keys(cartItems).length > 0) || 
                        (cartDeals && Object.keys(cartDeals).length > 0);
    
    const hasProductsData = products !== undefined;
    const hasDealsData = deals !== undefined;
    
    const ready = hasProductsData && hasDealsData;
    
    setIsDataReady(ready);
  }, [cartItems, cartDeals, products, deals]);

  // Address suggestions
  const fetchAddressSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const GEOAPIFY_API_KEY = '2d3f1042c3f94233a2e3347a80ad8c27';
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/autocomplete`,
        {
          params: {
            text: `${query}, Pakistan`,
            filter: `countrycode:pk`,
            format: 'json',
            apiKey: GEOAPIFY_API_KEY,
            limit: 5
          }
        }
      );

      const suggestions = (response.data?.results || []).map(item => ({
        fullAddress: item.formatted || '',
        street: item.street || item.address_line1 || '',
        city: item.city || item.municipality || '',
        state: item.state || item.region || '',
        zipcode: item.postcode || '',
        country: item.country || ''
      })).filter(suggestion => suggestion.fullAddress);

      setAddressSuggestions(suggestions);
    } catch (error) {
      setAddressSuggestions([]);
    } finally {
      setIsSearchingAddress(false);
    }
  }, []);

  // Field validation
  const validateField = async (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'fullName':
        if (!value.trim()) errors.fullName = 'Customer name is required';
        else if (value.trim().length < 2) errors.fullName = 'Customer name must be at least 2 characters';
        else if (!/^[a-zA-Z\s]{2,50}$/.test(value.trim())) errors.fullName = 'Customer name can only contain letters and spaces';
        break;
        
      case 'email':
        if (!value.trim()) errors.email = 'Customer email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Please enter a valid email address';
        break;
        
      case 'street':
        if (!value.trim()) errors.street = 'Street address is required';
        else if (value.trim().length < 5) errors.street = 'Please enter a complete street address';
        break;
        
      case 'city':
        if (!value.trim()) errors.city = 'City is required';
        break;
        
      case 'state':
        if (!value.trim()) errors.state = 'Province is required';
        else if (!pakistanStates.includes(value)) errors.state = 'Please select a valid province';
        break;
        
      case 'zipcode':
        if (!value.trim()) errors.zipcode = 'ZIP code is required';
        else if (!/^\d{5}$/.test(value.trim())) errors.zipcode = 'ZIP code must be 5 digits';
        break;
        
      case 'phone':
        if (!value.trim()) errors.phone = 'Phone number is required';
        else if (!/^03\d{9}$/.test(value.replace(/\D/g, ''))) errors.phone = 'Please enter a valid Pakistani phone number (03XXXXXXXXX)';
        break;
    }
    
    return errors;
  };

  const validateForm = async () => {
    const errors = {};
    
    // Validate all form fields
    for (const field of Object.keys(formData)) {
      const fieldErrors = await validateField(field, formData[field]);
      Object.assign(errors, fieldErrors);
    }
    
    setValidationErrors(errors);
    
    // Allow submission even if there are ZIP code errors
    const blockingErrors = { ...errors };
    delete blockingErrors.zipcode;
    
    return Object.keys(blockingErrors).length === 0;
  };

  const onChangeHandler = async (e) => {
    const { name, value } = e.target;
    
    // Format phone number
    let formattedValue = value;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      formattedValue = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4, 11)}` : digits;
    }
    
    // Don't allow numbers in name fields
    if ((name === 'fullName' || name === 'city') && /\d/.test(value)) return;
    
    // Clear city and zipcode when state changes
    if (name === 'state' && value !== formData.state) {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        city: '',
        zipcode: ''
      }));
      setKnownCitiesWithZips({});
    } else {
      setFormData(prev => ({ ...prev, [name]: formattedValue || value }));
    }
    
    // Auto-fill ZIP code only for known cities
    if (name === 'city' && value && cityZipData[value] && !formData.zipcode) {
      setTimeout(() => autoFillZipCode(value), 100);
    }
    
    // Address suggestions
    if (name === 'street') {
      if (value.length >= 3) {
        setShowSuggestions(true);
        fetchAddressSuggestions(value);
      } else {
        setAddressSuggestions([]);
      }
    }
    
    // Real-time ZIP validation
    if (name === 'zipcode' && value.length === 5 && /^\d{5}$/.test(value)) {
      setValidationErrors(prev => ({
        ...prev,
        zipcode: ''
      }));
    }
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const onBlurHandler = async (e) => {
    const { name, value } = e.target;
    const errors = await validateField(name, value);
    setValidationErrors(prev => ({ ...prev, ...errors }));
  };

  const selectAddressSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      street: suggestion.street || prev.street,
      city: suggestion.city || prev.city,
      state: suggestion.state || prev.state,
      zipcode: suggestion.zipcode || prev.zipcode
    }));
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Cart processing
  const getDealProducts = (deal) => {
    if (deal.dealProducts?.length > 0) {
      return deal.dealProducts.map(product => {
        const productData = products.find(p => p._id === product._id) || product;
        return { ...productData, quantity: product.quantity || 1 };
      });
    }
    return [];
  };

  // Process cart items for order
  const processCartItems = () => {
    let orderItems = [];
    let calculatedAmount = 0;

    // Process regular products
    if (cartItems && products) {
      Object.entries(cartItems).forEach(([itemId, quantity]) => {
        if (quantity > 0) {
          const productInfo = products.find(product => product._id === itemId);
          if (productInfo?.name) {
            const unitPrice = productInfo.discountprice > 0 ? productInfo.discountprice : productInfo.price;
            const itemTotal = unitPrice * quantity;
            
            orderItems.push({
              id: productInfo._id,
              name: productInfo.name,
              price: unitPrice,
              quantity: quantity,
              image: productInfo.image?.[0] || assets.placeholder_image,
              category: productInfo.category || 'Product',
              isFromDeal: false,
              description: productInfo.description,
              originalPrice: productInfo.price,
              hasDiscount: productInfo.discountprice > 0
            });
            
            calculatedAmount += itemTotal;
          }
        }
      });
    }

    // Process deals
    if (cartDeals && deals) {
      Object.entries(cartDeals).forEach(([dealId, dealQuantity]) => {
        if (dealQuantity > 0) {
          const dealInfo = deals.find(deal => deal._id === dealId);
          if (dealInfo?.dealName) {
            const dealPrice = dealInfo.dealFinalPrice || dealInfo.price || dealInfo.dealPrice || 0;
            const dealTotal = dealPrice * dealQuantity;
            
            let individualProductsTotal = 0;
            const dealProducts = getDealProducts(dealInfo);
            dealProducts.forEach(product => {
              const productPrice = product.discountprice > 0 ? product.discountprice : product.price;
              individualProductsTotal += (productPrice * (product.quantity || 1));
            });
            
            const savings = Math.max(0, individualProductsTotal - dealPrice);
            
            orderItems.push({
              id: dealInfo._id,
              name: dealInfo.dealName,
              price: dealPrice,
              quantity: dealQuantity,
              image: dealInfo.dealImages?.[0] || assets.placeholder_image,
              category: 'Deal',
              isFromDeal: true,
              description: dealInfo.dealDescription,
              originalTotalPrice: individualProductsTotal,
              savings: savings,
              dealProducts: dealProducts,
              type: 'deal'
            });
            
            calculatedAmount += dealTotal;
          }
        }
      });
    }

    return { orderItems, calculatedAmount };
  };

  // 🆕 Clear cart after order
  const clearCartAfterOrder = async () => {
    if (token) {
      // Clear cart for logged-in users via API
      try {
        await axios.post(`${backendUrl}/api/user/clear-cart`, {}, {
          headers: { token }
        });
        console.log('✅ Cleared cart for logged-in user');
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    } else {
      // Clear localStorage for guests
      setCartItems({});
      setCartDeals({});
      localStorage.removeItem('cartItems');
      localStorage.removeItem('cartDeals');
      console.log('✅ Cleared cart from localStorage for guest');
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (!await validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    if (!isDataReady) {
      toast.error('Cart data is still loading. Please wait...');
      return;
    }

    setLoading(true);
    
    try {
      // Validate address but don't block on failure
      setIsValidatingAddress(true);
      const addressValidation = await validateAddress(formData.city, formData.state, formData.zipcode);
      
      // Show warning but don't block submission
      if (!addressValidation.isValid) {
        toast.warning('Address may need manual verification: ' + addressValidation.message);
      } else if (addressValidation.requiresManualVerification) {
        toast.warning('Your address will be manually verified for delivery');
      }

      const { orderItems, calculatedAmount } = processCartItems();
      const deliveryCharge = getDeliveryCharge(calculatedAmount);
      const finalAmount = calculatedAmount + deliveryCharge;

      if (orderItems.length === 0) {
        toast.error('Your cart is empty');
        setLoading(false);
        return;
      }

      // Prepare order data
      const orderData = {
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state,
          zipcode: formData.zipcode.trim()
        },
        items: orderItems,
        amount: finalAmount,
        deliveryCharges: deliveryCharge,
        method: 'COD',
        addressVerified: addressValidation.isValid && !addressValidation.requiresManualVerification,
        customerDetails: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.replace(/\D/g, '') // Remove dashes
        }
      };

      console.log("📦 ORDER DATA BEING SENT:", {
        customerDetails: orderData.customerDetails,
        hasToken: !!token,
        isGuest: !token
      });

      // 🆕 Config for both guest and logged-in users
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Add token only if it exists (for logged-in users)
      if (token) {
        config.headers.token = token;
      }

      // 🆕 Call the unified order endpoint
      const response = await axios.post(
        `${backendUrl}/api/order/place`,
        orderData,
        config
      );
      
      if (response.data.success) {
        // ==================== FACEBOOK PIXEL PURCHASE TRACKING ====================
        if (window.fbq) {
          const purchaseData = {
            value: finalAmount,
            currency: 'PKR',
            content_type: 'product',
            contents: orderItems.map(item => ({
              id: item.id,
              quantity: item.quantity,
              item_price: item.price
            })),
            content_ids: orderItems.map(item => item.id),
            num_items: orderItems.length,
            order_id: response.data.orderId
          };
          
          window.fbq('track', 'Purchase', purchaseData);
          
          console.log('📊 Facebook Pixel: Purchase tracked', purchaseData);
        }
        // ==================== END FACEBOOK PIXEL ====================
        
        // Clear cart
        await clearCartAfterOrder();
        
        // Clear form data
        localStorage.removeItem('orderFormData');
        
        // Show success message
        toast.success(response.data.message);
        
        // 🆕 Handle guest order storage - SAVE COMPLETE DATA
        if (!token) {
          // 🆕 Prepare COMPLETE order data for localStorage
          const completeGuestOrder = {
            _id: response.data.orderId,
            userId: null,
            items: orderItems.map(item => ({
              id: item.id || item._id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image || assets.placeholder_image,
              category: item.category || 'Product',
              isFromDeal: item.isFromDeal || false,
              dealImage: item.dealImage,
              originalTotalPrice: item.originalTotalPrice,
              savings: item.savings,
              description: item.description
            })),
            amount: finalAmount,
            deliveryCharges: deliveryCharge,
            address: {
              street: formData.street.trim(),
              city: formData.city.trim(),
              state: formData.state,
              zipcode: formData.zipcode.trim()
            },
            paymentMethod: 'COD',
            payment: false,
            status: 'Order Placed',
            date: Date.now(),
            customerDetails: {
              name: formData.fullName.trim(),
              email: formData.email.trim(),
              phone: formData.phone.replace(/\D/g, '')
            },
            isGuest: true,
            isRecent: true
          };
          
          // 🆕 Save to localStorage for immediate display
          localStorage.setItem('recentGuestOrder', JSON.stringify(completeGuestOrder));
          
          // 🆕 Also save to guestOrders list for persistence
          const existingGuestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
          const updatedGuestOrders = [completeGuestOrder, ...existingGuestOrders.filter(o => o._id !== completeGuestOrder._id)];
          localStorage.setItem('guestOrders', JSON.stringify(updatedGuestOrders));
          
          // 🆕 Save guest info for backend sync
          localStorage.setItem('guestOrderInfo', JSON.stringify({
            email: formData.email.trim(),
            phone: formData.phone.replace(/\D/g, ''),
            timestamp: Date.now(),
            customerName: formData.fullName.trim()
          }));
          
          console.log("💾 Saved COMPLETE guest order to localStorage:", completeGuestOrder);
          
          // Show guest-specific success message
          toast.info(
            <div>
              <div className="font-semibold">🎉 Order Placed Successfully!</div>
              <div className="text-sm mt-1">
                Your order #<span className="font-medium">{response.data.orderId.slice(-6)}</span> has been placed.
                You can view your order on the orders page.
              </div>
            </div>,
            { autoClose: 5000 }
          );
        } else {
          // Logged-in user message
          toast.success(
            <div>
              <div className="font-semibold">🎉 Order Placed Successfully!</div>
              <div className="text-sm mt-1">
                Your order #<span className="font-medium">{response.data.orderId.slice(-6)}</span> has been placed.
              </div>
            </div>,
            { autoClose: 3000 }
          );
        }
        
        // 🆕 Wait a moment before redirecting to show success message
        setTimeout(() => {
          navigate('/orders');
        }, 1000);
        
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }

    } catch (error) {
      console.error('Order placement error:', error);
      
      // 🆕 Improved error handling
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your internet connection.');
      } else if (error.response?.status === 401 && token) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsValidatingAddress(false);
    }
  };

  // Render methods with proper labels
  const renderInputField = (name, type = 'text', placeholder, label, required = true) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <input 
        onChange={onChangeHandler}
        onBlur={onBlurHandler}
        name={name} 
        value={formData[name]} 
        className={`w-full border px-3.5 py-3 ${
          validationErrors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors`} 
        type={type}
        placeholder={placeholder}
        required={required}
      />
      {validationErrors[name] && (
        <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors[name]}</p>
      )}
    </div>
  );

  const renderSelectField = (name, options, placeholder, label, required = true) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <select
        onChange={onChangeHandler}
        onBlur={onBlurHandler}
        name={name}
        value={formData[name]}
        className={`w-full border px-3.5 py-3 ${
          validationErrors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors`}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {validationErrors[name] && (
        <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors[name]}</p>
      )}
    </div>
  );

  const renderCityInput = () => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        City *
      </label>
      <div className="relative">
        <input
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          name="city"
          value={formData.city}
          list="city-suggestions"
          className={`w-full border px-3.5 py-3 ${
            validationErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors`}
          type="text"
          placeholder={formData.state ? "Select from list or type your city" : "Select province first"}
          required
          disabled={!formData.state}
        />
        
        {isLoadingCities && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
          </div>
        )}
      </div>
      
      <datalist id="city-suggestions">
        {cities.map(city => (
          <option key={city} value={city} />
        ))}
      </datalist>
      
      {validationErrors.city && (
        <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.city}</p>
      )}
      {formData.state && cities.length > 0 && !isLoadingCities && (
        <p className="text-gray-500 text-xs mt-1">
          Select from list or type any city name in {formData.state}
        </p>
      )}
      {formData.state && cities.length === 0 && !isLoadingCities && (
        <p className="text-gray-500 text-xs mt-1">
          Type your city name
        </p>
      )}
    </div>
  );

  const renderZipCodeInput = () => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ZIP Code *
      </label>
      <div className="relative">
        <input 
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          name="zipcode" 
          value={formData.zipcode} 
          className={`w-full border px-3.5 py-3 ${
            validationErrors.zipcode ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors`} 
          type="number"
          placeholder="5-digit ZIP code"
          required
        />
        {formData.zipcode && cityZipData[formData.city] === formData.zipcode && (
          <div className="absolute right-3 top-3" title="Auto-filled based on city selection">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
        )}
      </div>
      {validationErrors.zipcode && (
        <p className="text-yellow-600 text-xs mt-1 font-medium">
          ⚠️ {validationErrors.zipcode} - Order can still be placed
        </p>
      )}
      {formData.zipcode && cityZipData[formData.city] === formData.zipcode && (
        <p className="text-green-600 text-xs mt-1">
          Auto-filled for {formData.city}
        </p>
      )}
      {formData.zipcode && /^\d{5}$/.test(formData.zipcode) && !validationErrors.zipcode && (
        <p className="text-green-600 text-xs mt-1">
          ✓ Valid ZIP code format
        </p>
      )}
    </div>
  );

  const renderAddressInput = () => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Street Address *
      </label>
      <div className="relative">
        <input 
          onChange={onChangeHandler}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => formData.street.length >= 3 && setShowSuggestions(true)}
          name="street" 
          value={formData.street} 
          className={`w-full border px-3.5 py-3 ${
            validationErrors.street ? 'border-red-500 bg-red-50' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors`} 
          type="text"
          placeholder="House number, street, area"
          required
        />
        
        {isSearchingAddress && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
          </div>
        )}
        
        {showSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {addressSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => selectAddressSuggestion(suggestion)}
              >
                <div className="font-medium text-sm text-gray-900">
                  {suggestion.fullAddress}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {validationErrors.street && (
        <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.street}</p>
      )}
      <p className="text-gray-500 text-xs mt-1">
        Start typing for address suggestions
      </p>
    </div>
  );

  return (
    <form onSubmit={onSubmitHandler} className="flex min-h-[80vh] flex-col justify-between gap-8 border-t border-gray-300 pt-8 sm:flex-row sm:pt-14">
      <div className="flex w-full flex-col gap-6 sm:max-w-[480px]">
        <div className="my-3 text-xl sm:text-2xl">
          <Title text1={'DELIVERY'} text2={'INFORMATION'}/>
        </div> 
        
        {renderInputField('fullName', 'text', 'Enter customer name for this order', 'Customer Name', true)}
        {renderInputField('email', 'email', 'customer@example.com', 'Customer Email', true)}
        
        {renderAddressInput()}
        
        <div className='flex gap-4'>
          {renderSelectField('state', pakistanStates, 'Select your province', 'Province')}
          {renderCityInput()}
        </div>
        
        <div className='flex gap-4'>
          {renderZipCodeInput()}
          {renderInputField('phone', 'tel', '03XX-XXXXXXX', 'Phone Number')}
        </div>

      </div>

      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal/>
        </div>
    
        <div className='mt-12'>
          <Title text1={'PAYMENT'} text2={'METHOD'}/>
          <div className='flex flex-col gap-3 lg:flex-row'>
            <div className='flex cursor-pointer items-center gap-3 border border-gray-300 p-3 px-4 bg-gray-50'>
              <p className='text-sm font-medium text-gray-700'>CASH ON DELIVERY</p>
            </div>
          </div>
          
          {/* 🆕 Additional info for guests */}
          {!token && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Note for guest orders:</span> Your order will be saved automatically. 
                You can view it on the orders page.
              </p>
            </div>
          )}
          
          <div className='mt-8 w-full text-end'>
            <button 
              type='submit' 
              className={`relative px-8 py-4 font-semibold w-full md:w-auto text-base ${
                loading || !isDataReady || isValidatingAddress
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800 active:bg-gray-900 hover:shadow-lg transform hover:-translate-y-0.5'
              } transition-all duration-200 rounded-md`}
              disabled={loading || !isDataReady || isValidatingAddress}
            >
              {isValidatingAddress ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  VALIDATING ADDRESS...
                </span>
              ) : loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  PLACING ORDER...
                </span>
              ) : !isDataReady ? (
                'LOADING CART...'
              ) : (
                'PLACE ORDER'
              )}
            </button>
            
            {!token && !loading && isDataReady && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                By placing this order, you agree to our Terms of Service
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;