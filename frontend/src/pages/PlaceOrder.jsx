import React from 'react';
import { useState, useContext, useEffect, useCallback, useMemo } from 'react';
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
  // Add state for category mappings
  const [categoryIdMap, setCategoryIdMap] = useState({});
  const [subcategoryIdMap, setSubcategoryIdMap] = useState({});

  // Advance delivery payment state
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [activePaymentTab, setActivePaymentTab] = useState('easypaisa');

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (PNG, JPG, JPEG)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be under 10MB');
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };
  
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
    getCart,
    appliedCoupon,
    getCouponDiscount,
    currency,
    deliverySettings
  } = useContext(ShopContext);
  
  const navigate = useNavigate();

  // Fetch categories to build ID-to-name mapping
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/categories`);
        const data = response.data;
        
        let categories = data.data || data.categories || data;
        if (!Array.isArray(categories)) return;

        const idToNameMap = {};
        const subcategoryIdToNameMap = {};

        categories.forEach((cat) => {
          const categoryId = cat._id || cat.id;
          const categoryName = cat.name || cat.categoryName || cat.title || 'Category';

          if (categoryId) idToNameMap[categoryId] = categoryName;

          const subcategories = cat.subcategories || cat.subCategories || [];
          subcategories.forEach((sub) => {
            const subcategoryId = sub._id || sub.id;
            const subcategoryName = sub.name || sub.subcategoryName || sub.title || sub || 'Subcategory';
            if (subcategoryId) subcategoryIdToNameMap[subcategoryId] = subcategoryName;
          });
        });

        setCategoryIdMap(idToNameMap);
        setSubcategoryIdMap(subcategoryIdToNameMap);
      } catch (error) {
        // Silently handle error - no console
      }
    };

    fetchCategories();
  }, [backendUrl]);

  // Form data state - FIXED: Ensure phone always exists
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('orderFormData');
    
    // Base default data with all fields
    const defaultData = {
      fullName: '',
      email: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      phone: ''
    };
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Merge saved data with defaults to ensure all fields exist
      return {
        ...defaultData,
        ...parsedData
      };
    }
    
    // If user is logged in, pre-fill with their data
    if (user?.name || user?.email) {
      defaultData.fullName = user.name || '';
      defaultData.email = user.email || '';
      defaultData.phone = user.phone || '';
    }
    
    return defaultData;
  });

  // Check if all required address fields are filled
  const hasRequiredAddressFields = Boolean(
    formData.fullName?.trim() &&
    formData.street?.trim() &&
    formData.state?.trim() &&
    formData.city?.trim() &&
    formData.zipcode?.toString().trim() &&
    formData.phone?.trim()
  );

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
      // Silently handle error
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
        if (!value?.trim()) errors.fullName = 'Customer name is required';
        else if (value.trim().length < 2) errors.fullName = 'Customer name must be at least 2 characters';
        else if (!/^[a-zA-Z\s]{2,50}$/.test(value.trim())) errors.fullName = 'Customer name can only contain letters and spaces';
        break;
        
      case 'email':
        if (value?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address';
        }
        break;
        
      case 'street':
        if (!value?.trim()) errors.street = 'Street address is required';
        else if (value.trim().length < 5) errors.street = 'Please enter a complete street address';
        break;
        
      case 'city':
        if (!value?.trim()) errors.city = 'City is required';
        break;
        
      case 'state':
        if (!value?.trim()) errors.state = 'Province is required';
        else if (!pakistanStates.includes(value)) errors.state = 'Please select a valid province';
        break;
        
      case 'zipcode':
        if (!value?.trim()) errors.zipcode = 'ZIP code is required';
        else if (!/^\d{5}$/.test(value.trim())) errors.zipcode = 'ZIP code must be 5 digits';
        break;
        
      case 'phone':
        if (!value?.trim()) {
          errors.phone = 'Whatsapp number is required';
        } else {
          const digitsOnly = value.replace(/\D/g, '');
          if (!/^03\d{9}$/.test(digitsOnly)) {
            errors.phone = 'Please enter a valid Pakistani number (03XXXXXXXXX)';
          }
        }
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
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const onBlurHandler = async (e) => {
    const { name, value } = e.target;
    const errors = await validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: errors[name] || '' }));
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

  // Helper function to extract category name using the category mappings
  const getCategoryName = (productInfo) => {
    // If category doesn't exist, return default
    if (!productInfo.category) return 'Product';
    
    // If category is an object with a name property
    if (typeof productInfo.category === 'object' && productInfo.category !== null) {
      if (productInfo.category.name) {
        return productInfo.category.name;
      }
      return 'Product';
    }
    
    // If category is a string
    if (typeof productInfo.category === 'string') {
      const categoryString = productInfo.category;
      
      // Check if it looks like a MongoDB ID (24 hex characters)
      const isMongoId = /^[0-9a-f]{24}$/i.test(categoryString);
      
      if (isMongoId) {
        // Try to get from categoryIdMap first (from fetched categories)
        if (categoryIdMap[categoryString]) {
          return categoryIdMap[categoryString];
        }
        
        // Try to get from categoryName field
        if (productInfo.categoryName) {
          return productInfo.categoryName;
        }
        
        // Try to infer from product name
        if (productInfo.name) {
          const name = productInfo.name.toLowerCase();
          if (name.includes('hair')) return 'Hair Care';
          if (name.includes('oil')) return 'Hair Oil';
          if (name.includes('shampoo')) return 'Shampoo';
          if (name.includes('conditioner')) return 'Conditioner';
          if (name.includes('serum')) return 'Serum';
          if (name.includes('cream')) return 'Cream';
          if (name.includes('lotion')) return 'Lotion';
          if (name.includes('face')) return 'Face Care';
          if (name.includes('body')) return 'Body Care';
        }
        
        return 'Product';
      }
      
      // If it contains "Product" and looks like it has an ID, clean it
      if (categoryString.includes('Product') && categoryString.length > 10) {
        return 'Product';
      }
      
      // Try to clean any IDs from the string
      const words = categoryString.split(' ');
      const lastWord = words[words.length - 1];
      if (lastWord && /^[0-9a-f]{24}$/i.test(lastWord)) {
        words.pop();
        return words.join(' ') || 'Product';
      }
      
      // Return the category string if it's not an ID
      return categoryString;
    }
    
    return 'Product';
  };

  // Helper function to get subcategory name
  const getSubcategoryName = (productInfo) => {
    if (!productInfo.subcategory) return '';
    
    if (typeof productInfo.subcategory === 'object' && productInfo.subcategory !== null) {
      if (productInfo.subcategory.name) {
        return productInfo.subcategory.name;
      }
      return '';
    }
    
    if (typeof productInfo.subcategory === 'string') {
      const subcategoryString = productInfo.subcategory;
      const isMongoId = /^[0-9a-f]{24}$/i.test(subcategoryString);
      
      if (isMongoId) {
        if (subcategoryIdMap[subcategoryString]) {
          return subcategoryIdMap[subcategoryString];
        }
        if (productInfo.subcategoryName) {
          return productInfo.subcategoryName;
        }
        return '';
      }
      
      return subcategoryString;
    }
    
    return '';
  };

  // Process cart items for order
  const processCartItems = () => {
    let orderItems = [];
    let calculatedAmount = 0;

    // Process regular products
    if (cartItems && products) {
      Object.entries(cartItems).forEach(([itemId, quantity]) => {
        if (quantity > 0) {
          const [productId, variantName] = itemId.split('__');
          const productInfo = products.find(product => product._id === productId);
          if (productInfo?.name) {
            const variant = variantName && productInfo.variants
              ? productInfo.variants.find(v => v.name === variantName)
              : null;

            let unitPrice, originalPrice, hasDiscount, itemName, itemImage;
            if (variant) {
              hasDiscount = variant.discountprice !== undefined &&
                variant.discountprice !== null &&
                Number(variant.discountprice) > 0 &&
                Number(variant.discountprice) < Number(variant.price);
              unitPrice = hasDiscount ? Number(variant.discountprice) : Number(variant.price);
              originalPrice = Number(variant.price);
              itemName = `${productInfo.name} (${variant.name})`;
              itemImage = variant.image || productInfo.image?.[0] || assets.placeholder_image;
            } else {
              hasDiscount = productInfo.discountprice > 0 && productInfo.discountprice < productInfo.price;
              unitPrice = hasDiscount ? productInfo.discountprice : productInfo.price;
              originalPrice = productInfo.price;
              itemName = productInfo.name;
              itemImage = productInfo.image?.[0] || assets.placeholder_image;
            }

            const itemTotal = unitPrice * quantity;
            
            // Get proper category and subcategory names
            const categoryName = getCategoryName(productInfo);
            const subcategoryName = getSubcategoryName(productInfo);
            
            orderItems.push({
              id: productInfo._id,
              name: itemName,
              price: unitPrice,
              quantity: quantity,
              image: itemImage,
              category: categoryName,
              subcategory: subcategoryName,
              variant: variantName || null,
              isFromDeal: false,
              description: productInfo.description,
              originalPrice: originalPrice,
              hasDiscount: hasDiscount
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

  // Live cart totals & delivery calculations based on delivery settings
  const currentCartData = useMemo(() => {
    const { calculatedAmount } = processCartItems();
    const couponDiscount = getCouponDiscount ? getCouponDiscount(calculatedAmount) : 0;
    const discountedSubtotal = Math.max(0, calculatedAmount - couponDiscount);
    const deliveryCharge = getDeliveryCharge ? getDeliveryCharge(discountedSubtotal) : 0;
    const isFreeDelivery = deliveryCharge === 0;
    const finalAmount = discountedSubtotal + deliveryCharge;
    return {
      subtotal: calculatedAmount,
      couponDiscount,
      discountedSubtotal,
      deliveryCharge,
      isFreeDelivery,
      finalAmount
    };
  }, [cartItems, cartDeals, products, deals, appliedCoupon, getCouponDiscount, getDeliveryCharge, subcategoryIdMap]);

  // Form is complete when all address fields are filled AND (delivery is free OR screenshot is provided)
  const isFormComplete = Boolean(
    hasRequiredAddressFields &&
    (currentCartData.isFreeDelivery || screenshotFile)
  );

  // Clear cart after order
  const clearCartAfterOrder = async () => {
    if (token) {
      // Clear cart for logged-in users via API
      try {
        await axios.post(`${backendUrl}/api/user/clear-cart`, {}, {
          headers: { token }
        });
      } catch (error) {
        // Silently handle error
      }
    } else {
      // Clear localStorage for guests
      setCartItems({});
      setCartDeals({});
      localStorage.removeItem('cartItems');
      localStorage.removeItem('cartDeals');
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    // Explicit phone validation before anything else
    if (!formData.phone || !formData.phone.trim()) {
      toast.error('Whatsapp number is required');
      setValidationErrors(prev => ({ 
        ...prev, 
        phone: 'Whatsapp number is required' 
      }));
      return;
    }
    
    // Validate phone format
    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (!/^03\d{9}$/.test(digitsOnly)) {
      toast.error('Please enter a valid Whatsapp number');
      setValidationErrors(prev => ({ 
        ...prev, 
        phone: 'Please enter a valid Pakistani number (03XXXXXXXXX)' 
      }));
      return;
    }
    
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
      const couponDiscount = getCouponDiscount ? getCouponDiscount(calculatedAmount) : 0;
      const discountedSubtotal = Math.max(0, calculatedAmount - couponDiscount);
      const deliveryCharge = getDeliveryCharge ? getDeliveryCharge(discountedSubtotal) : 0;
      const finalAmount = discountedSubtotal + deliveryCharge;
      const isFreeDeliveryOrder = deliveryCharge === 0;

      if (orderItems.length === 0) {
        toast.error('Your cart is empty');
        setLoading(false);
        return;
      }

      if (!isFreeDeliveryOrder && !screenshotFile) {
        toast.error(`Please upload the payment screenshot of Rs. ${deliveryCharge} advance delivery fee`);
        setLoading(false);
        setIsValidatingAddress(false);
        return;
      }

      // Prepare order FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('items', JSON.stringify(orderItems));
      formDataToSend.append('amount', finalAmount.toString());
      formDataToSend.append('deliveryCharges', deliveryCharge.toString());
      formDataToSend.append('advanceAmount', deliveryCharge.toString());
      formDataToSend.append('transactionId', transactionId.trim());
      formDataToSend.append('couponCode', appliedCoupon?.code || '');
      formDataToSend.append('couponDiscount', couponDiscount.toString());
      formDataToSend.append('address', JSON.stringify({
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state,
        zipcode: formData.zipcode.trim()
      }));
      formDataToSend.append('customerDetails', JSON.stringify({
        name: formData.fullName.trim(),
        email: formData.email ? formData.email.trim() : '',
        phone: digitsOnly
      }));
      if (screenshotFile) {
        formDataToSend.append('paymentScreenshot', screenshotFile);
      }

      // Config for both guest and logged-in users
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { token } : {})
        }
      };

      // Call the unified order endpoint
      const response = await axios.post(
        `${backendUrl}/api/order/place`,
        formDataToSend,
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
        }
        // ==================== END FACEBOOK PIXEL ====================
        
        // ==================== TIKTOK PIXEL PURCHASE TRACKING ====================
        if (window.ttq) {
          const tiktokPurchaseData = {
            content_id: orderItems.map(item => item.id),
            content_type: 'product',
            quantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
            value: finalAmount,
            currency: 'PKR',
            order_id: response.data.orderId
          };

          window.ttq.track('CompletePayment', tiktokPurchaseData);
        }
        // ==================== END TIKTOK PIXEL ====================

        // Clear cart
        await clearCartAfterOrder();
        
        // Clear form data
        localStorage.removeItem('orderFormData');
        
        // Show success message
        toast.success(response.data.message);
        
        // Handle guest order storage - SAVE COMPLETE DATA
        if (!token) {
          // Prepare COMPLETE order data for localStorage with proper category
          const completeGuestOrder = {
            _id: response.data.orderId,
            userId: null,
            items: orderItems.map(item => ({
              id: item.id || item._id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image || assets.placeholder_image,
              category: item.category,
              subcategory: item.subcategory,
              variant: item.variant || null,
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
            paymentMethod: isFreeDeliveryOrder ? 'COD (Free Delivery)' : `COD (Rs. ${deliveryCharge} Advance)`,
            payment: false,
            paymentScreenshot: screenshotPreview || "",
            advanceAmount: deliveryCharge,
            advancePaymentStatus: isFreeDeliveryOrder ? 'not_required' : 'pending',
            transactionId: transactionId.trim(),
            status: 'Pending',
            date: Date.now(),
            customerDetails: {
              name: formData.fullName.trim(),
              email: formData.email ? formData.email.trim() : '',
              phone: digitsOnly
            },
            isGuest: true,
            isRecent: true
          };
          
          // Save to localStorage for immediate display
          localStorage.setItem('recentGuestOrder', JSON.stringify(completeGuestOrder));
          
          // Also save to guestOrders list for persistence
          const existingGuestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
          const updatedGuestOrders = [completeGuestOrder, ...existingGuestOrders.filter(o => o._id !== completeGuestOrder._id)];
          localStorage.setItem('guestOrders', JSON.stringify(updatedGuestOrders));
          
          // Save guest info for backend sync
          localStorage.setItem('guestOrderInfo', JSON.stringify({
            email: formData.email ? formData.email.trim() : '',
            phone: digitsOnly,
            timestamp: Date.now(),
            customerName: formData.fullName.trim()
          }));
        
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
        
        // Wait a moment before redirecting to show success message
        setTimeout(() => {
          navigate('/orders');
        }, 1000);
        
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }

    } catch (error) {
      // Improved error handling
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
        value={formData[name] || ''} 
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
        value={formData[name] || ''}
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
          value={formData.city || ''}
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
          value={formData.zipcode || ''} 
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
          onFocus={() => formData.street?.length >= 3 && setShowSuggestions(true)}
          name="street" 
          value={formData.street || ''} 
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
        {renderInputField('email', 'email', 'customer@example.com (optional)', 'Customer Email (Optional)', false)}
        
        {renderAddressInput()}
        
        <div className='flex gap-4'>
          {renderSelectField('state', pakistanStates, 'Select your province', 'Province')}
          {renderCityInput()}
        </div>
        
        <div className='flex gap-4'>
          {renderZipCodeInput()}
          {renderInputField('phone', 'tel', '03XX-XXXXXXX', 'Whatsapp Number', true)}
        </div>

      </div>

      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal/>
        </div>
    
        <div className='mt-12'>
          <Title text1={'PAYMENT'} text2={'METHOD'}/>
          {currentCartData.isFreeDelivery ? (
            /* FREE DELIVERY BANNER & COD BADGE */
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-950 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 font-extrabold text-base sm:text-lg text-emerald-800">
                <span className="text-xl">🎉</span>
                <span>Congratulations! FREE Delivery Unlocked</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                Your order qualifies for <strong>100% Free Shipping</strong>. No advance delivery charges or payment screenshot are required!
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300">
                  ✓ Payment Method: Cash on Delivery (COD)
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/80 text-gray-700 font-medium border border-emerald-200">
                  Pay total of <strong>Rs. {currentCartData.finalAmount.toFixed(0)}</strong> at doorstep
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* ADVANCE DELIVERY FEE BANNER */}
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                  <span>⚠️</span>
                  <span>Rs. {currentCartData.deliveryCharge} Advance Delivery Fee Required</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
                  To confirm your order, please transfer <strong className="font-bold underline">Rs. {currentCartData.deliveryCharge} (Delivery Charges)</strong> in advance. The remaining cart amount of <strong className="font-bold">Rs. {currentCartData.discountedSubtotal.toFixed(0)}</strong> will be paid via <strong>Cash on Delivery (COD)</strong> upon receiving your parcel.
                </p>
              </div>

              {/* PAYMENT ACCOUNTS SELECTOR */}
              <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="flex border-b border-gray-200 bg-gray-50 text-center">
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab('easypaisa')}
                    className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${
                      activePaymentTab === 'easypaisa'
                        ? 'bg-white text-green-700 border-b-2 border-green-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Easypaisa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab('bank')}
                    className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${
                      activePaymentTab === 'bank'
                        ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    UBL Bank Transfer
                  </button>
                </div>

                <div className="p-4 sm:p-5">
                  {activePaymentTab === 'easypaisa' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">ACCOUNT TITLE</p>
                          <p className="text-sm font-bold text-gray-900">Muhammad Noman</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">EASYPAISA NUMBER</p>
                          <p className="text-sm font-mono font-bold text-gray-900">0324 1572294</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03241572294', 'Easypaisa Number')}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#587a3b] text-white rounded-md hover:bg-[#486530] transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {activePaymentTab === 'bank' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">BANK NAME</p>
                          <p className="text-sm font-bold text-gray-900">UBL (United Bank Limited)</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">ACCOUNT TITLE</p>
                          <p className="text-sm font-bold text-gray-900">Muhammad Noman</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">IBAN</p>
                          <p className="text-sm font-mono font-bold text-gray-900 break-all">PK78UNIL0109000339235351</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('PK78UNIL0109000339235351', 'IBAN')}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#587a3b] text-white rounded-md hover:bg-[#486530] transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SCREENSHOT UPLOAD & TRANSACTION ID */}
              <div className="mt-5 border border-gray-200 rounded-xl p-4 sm:p-5 bg-white shadow-sm">
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  Upload Payment Screenshot (Required) *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Attach a screenshot of your Rs. {currentCartData.deliveryCharge} advance delivery fee payment receipt.
                </p>

                {screenshotPreview ? (
                  <div className="relative w-full max-w-xs border rounded-xl p-2 bg-gray-50 flex flex-col items-center">
                    <img
                      src={screenshotPreview}
                      alt="Payment Screenshot Preview"
                      className="max-h-52 w-auto object-contain rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800 underline"
                    >
                      Remove & Upload Another
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">
                        <span className="font-bold underline">Click to upload</span> payment screenshot
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Optional Transaction ID Input */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Transaction ID / Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TID-1234567890"
                    className="w-full border border-gray-300 px-3.5 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-[#587a3b] focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Additional info for guests */}
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
                loading || !isDataReady || isValidatingAddress || !isFormComplete
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                  : 'bg-[#587a3b] text-white hover:bg-[#486530] active:bg-[#3b5327] hover:shadow-lg transform hover:-translate-y-0.5'
              } transition-all duration-200 rounded-md`}
              disabled={loading || !isDataReady || isValidatingAddress || !isFormComplete}
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
              ) : !isFormComplete ? (
                !currentCartData.isFreeDelivery && !screenshotFile && hasRequiredAddressFields
                  ? `UPLOAD SCREENSHOT (RS. ${currentCartData.deliveryCharge})`
                  : 'FILL ALL FIELDS TO PLACE ORDER'
              ) : (
                'PLACE ORDER'
              )}
            </button>
            
            {!isFormComplete && isDataReady && !loading && (
              <p className="text-xs text-amber-700 mt-2 text-center md:text-end font-medium">
                {!currentCartData.isFreeDelivery && !screenshotFile && hasRequiredAddressFields
                  ? `⚠️ Please upload advance payment screenshot (Rs. ${currentCartData.deliveryCharge})`
                  : '⚠️ Please fill all required delivery address fields'}
              </p>
            )}

            {!token && !loading && isDataReady && isFormComplete && (
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