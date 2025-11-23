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
  const [hasUserDataLoaded, setHasUserDataLoaded] = useState(false);
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
    return savedData ? JSON.parse(savedData) : {
      fullName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      phone: ''
    };
  });

  // 🆕 LOAD USER DATA AS DEFAULTS
  useEffect(() => {
    if (user?.name && user?.email && !hasUserDataLoaded) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name,
        email: user.email
      }));
      setHasUserDataLoaded(true);
    }
  }, [user, hasUserDataLoaded]);

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

  // Validate address - UPDATED to be more flexible
  const validateAddress = useCallback(async (city, state, zipcode) => {
    if (!city || !state) return { isValid: false, message: 'City and state are required' };

    try {
      const response = await axios.post(`${backendUrl}/api/locations/validate-city-zip`, {
        city, state, zipCode: zipcode, country: 'Pakistan'
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        // If validation fails but we have basic info, allow manual entry with warning
        if (city && state && zipcode && /^\d{5}$/.test(zipcode)) {
          return { 
            isValid: true, 
            message: 'Address accepted with manual verification',
            requiresManualVerification: true
          };
        }
        return { 
          isValid: false, 
          message: response.data.message || 'Please verify your address details' 
        };
      }
    } catch (error) {
      // If API fails, allow basic validation to pass
      if (city && state && zipcode && /^\d{5}$/.test(zipcode)) {
        return { 
          isValid: true, 
          message: 'Address accepted (validation service unavailable)',
          requiresManualVerification: true
        };
      }
      return { 
        isValid: false, 
        message: 'Address validation service unavailable' 
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

  // ZIP code validation - UPDATED to be more flexible with known cities
  const validateZipCode = useCallback(async (zipcode, state, city) => {
    if (!zipcode) return 'ZIP code is required';
    if (!/^\d{5}$/.test(zipcode)) return 'ZIP code must be 5 digits';

    // Check if this is a known city with a specific ZIP code
    const isKnownCity = city && knownCitiesWithZips[city] && knownCitiesWithZips[city].zipCode === zipcode;
    
    if (isKnownCity) {
      // Allow known city ZIP codes even if outside typical range
      return true;
    }

    // Basic state-based ZIP code validation for unknown cities
    const stateZipRanges = {
      'Punjab': { min: 30000, max: 49999 },
      'Sindh': { min: 65000, max: 79999 },
      'Khyber Pakhtunkhwa': { min: 12000, max: 29000 },
      'Balochistan': { min: 82000, max: 92000 }
    };

    const zipNum = parseInt(zipcode, 10);
    const stateRange = stateZipRanges[state];

    if (stateRange && (zipNum < stateRange.min || zipNum > stateRange.max)) {
      return `ZIP code typically ranges from ${stateRange.min} to ${stateRange.max} for ${state}`;
    }

    return true;
  }, [knownCitiesWithZips]);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem('orderFormData', JSON.stringify(formData));
  }, [formData]);

  // Check authentication
  useEffect(() => {
    if (!token || !user) {
      sessionStorage.setItem('redirectAfterLogin', '/place-order');
      navigate('/login');
    }
  }, [token, user, navigate]);

  // FIXED: Check if cart data is ready - simplified logic
  useEffect(() => {
    // Check if we have any cart items OR if products/deals are loaded
    const hasCartItems = (cartItems && Object.keys(cartItems).length > 0) || 
                        (cartDeals && Object.keys(cartDeals).length > 0);
    
    // Products and deals might be empty arrays, that's fine
    const hasProductsData = products !== undefined;
    const hasDealsData = deals !== undefined;
    
    // Data is ready if we have the necessary data structures, even if cart is empty
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

  // Field validation - UPDATED to remove city restriction
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
        // Removed city validation against predefined list - users can type any city
        break;
        
      case 'state':
        if (!value.trim()) errors.state = 'Province is required';
        else if (!pakistanStates.includes(value)) errors.state = 'Please select a valid province';
        break;
        
      case 'zipcode':
        if (!value.trim()) errors.zipcode = 'ZIP code is required';
        else if (!/^\d{5}$/.test(value.trim())) errors.zipcode = 'ZIP code must be 5 digits';
        else if (formData.state) {
          const zipValidation = await validateZipCode(value, formData.state, formData.city);
          if (zipValidation !== true) errors.zipcode = zipValidation;
        }
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
    return Object.keys(errors).length === 0;
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
      const zipError = await validateZipCode(value, formData.state, formData.city);
      setValidationErrors(prev => ({
        ...prev,
        zipcode: zipError !== true ? zipError : ''
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

// Cart processing - FIXED DEAL PRICING
const getDealProducts = (deal) => {
  if (deal.dealProducts?.length > 0) {
    return deal.dealProducts.map(product => {
      const productData = products.find(p => p._id === product._id) || product;
      return { ...productData, quantity: product.quantity || 1 };
    });
  }
  return [];
};

// Process cart items for order - FIXED DEAL PRICING
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
            image: productInfo.image?.[0],
            category: productInfo.category,
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

  // Process deals - FIXED: Use the deal's fixed price, not individual product prices
  if (cartDeals && deals) {
    Object.entries(cartDeals).forEach(([dealId, dealQuantity]) => {
      if (dealQuantity > 0) {
        const dealInfo = deals.find(deal => deal._id === dealId);
        if (dealInfo?.dealName) {
          // FIXED: Use the deal's fixed price
          const dealPrice = dealInfo.dealFinalPrice || dealInfo.price || dealInfo.dealPrice || 0;
          const dealTotal = dealPrice * dealQuantity;
          
          // Calculate what the individual products would cost (for display only)
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
            price: dealPrice, // This is the fixed deal price
            quantity: dealQuantity,
            image: dealInfo.dealImages?.[0] || assets.placeholder_image,
            category: 'Deal',
            isFromDeal: true,
            description: dealInfo.dealDescription,
            originalTotalPrice: individualProductsTotal, // For display purposes
            savings: savings, // For display purposes
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

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (!await validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    if (!token || !user) {
      sessionStorage.setItem('redirectAfterLogin', '/place-order');
      navigate('/login');
      return;
    }
    
    if (!isDataReady) {
      toast.error('Cart data is still loading. Please wait...');
      return;
    }

    setLoading(true);
    
    try {
      // Validate address with more flexible approach
      setIsValidatingAddress(true);
      const addressValidation = await validateAddress(formData.city, formData.state, formData.zipcode);
      
      if (!addressValidation.isValid) {
        toast.error('Please check your address details: ' + addressValidation.message);
        setIsValidatingAddress(false);
        setLoading(false);
        return;
      }

      // Show warning if manual verification is required
      if (addressValidation.requiresManualVerification) {
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

      // 🆕 SIMPLIFIED: Always use the form data for customer details
      const orderData = {
        address: formData,
        items: orderItems,
        amount: finalAmount,
        deliveryCharges: deliveryCharge,
        method: 'COD',
        addressVerified: !addressValidation.requiresManualVerification,
        // 🆕 Always send customerDetails using the form data
        customerDetails: {
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone
        }
      };

      console.log("📦 ORDER DATA BEING SENT:", {
        customerDetails: orderData.customerDetails
      });

      const response = await axios.post(backendUrl + '/api/order/place', orderData, {
        headers: { token, 'Content-Type': 'application/json' }
      });
      
      if (response.data.success) {
        setCartItems({});
        setCartDeals({});
        localStorage.removeItem('orderFormData');
        toast.success(response.data.message);
        navigate('/orders');
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }

    } catch (error) {
      console.error('Order placement error:', error);
      if (error.response?.status === 401) {
        sessionStorage.setItem('redirectAfterLogin', '/place-order');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    } finally {
      setLoading(false);
      setIsValidatingAddress(false);
    }
  };

  if (!token || !user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Redirecting to login...</div>
        </div>
      </div>
    );
  }

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
            validationErrors.zipcode ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
        <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.zipcode}</p>
      )}
      {formData.zipcode && cityZipData[formData.city] === formData.zipcode && (
        <p className="text-green-600 text-xs mt-1">
          Auto-filled for {formData.city}
          {knownCitiesWithZips[formData.city] && (
            <span className="text-gray-500 ml-1">(Known city ZIP code)</span>
          )}
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
        
      
        {/* 🆕 SIMPLIFIED: Just use the same input fields */}
        {renderInputField('fullName', 'text', 'Enter customer name for this order', 'Customer Name', true, true)}
        {renderInputField('email', 'email', 'customer@example.com', 'Customer Email', true, true)}
        
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
          <div className='mt-8 w-full text-end'>
            <button 
              type='submit' 
              className={`bg-black text-white px-8 py-4 font-semibold hover:bg-gray-800 active:bg-gray-900 transition-colors w-full md:w-auto text-base   ${
                loading || !isDataReady || Object.keys(validationErrors).length > 0 || isValidatingAddress
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
              disabled={loading || !isDataReady || Object.keys(validationErrors).length > 0 || isValidatingAddress}
            >
              {isValidatingAddress ? 'VALIDATING ADDRESS...' : 
               loading ? 'PLACING ORDER...' : 
               !isDataReady ? 'LOADING...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;