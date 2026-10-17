import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faClock,
  faBox,
  faShippingFast,
  faMotorcycle,
  faCheckCircle,
  faTimesCircle,
  faPhone,
  faSpinner,
  faTag,
  faCube,
  faChevronDown,
  faChevronUp,
  faReceipt,
  faUser,
  faCalendar,
  faSearch,
  faFilter,
  faEnvelope,
  faEye,
  faFileImage,
  faCheck,
  faTimes,
  faHourglassHalf,
  faXmark,
  faMoneyBillWave,
  faCreditCard,
  faWallet,
  faMoneyBill,
  faCaretDown,
  faExternalLinkAlt,
  faFileAlt,
  faPrint,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Constants
const STATUS_CONFIG = {
  'Pending Verification': { icon: faHourglassHalf, label: 'Pending Verification' },
  'Order Placed': { icon: faClock, label: 'Order Placed' },
  'Pending': { icon: faClock, label: 'Order Placed' },
  'Processing': { icon: faClock, label: 'Processing' },
  'Packing': { icon: faBox, label: 'Packing' },
  'Shipped': { icon: faShippingFast, label: 'Shipped' },
  'Out for delivery': { icon: faMotorcycle, label: 'Out for Delivery' },
  'Delivered': { icon: faCheckCircle, label: 'Delivered' },
  'Cancelled': { icon: faTimesCircle, label: 'Cancelled' },
  'Payment Rejected': { icon: faTimesCircle, label: 'Payment Rejected' },
};

const PAYMENT_METHOD_CONFIG = {
  'COD': {
    icon: faMoneyBill,
    label: 'Cash on Delivery',
    color: 'text-gray-900',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    autoVerified: true
  },
  'Advance Delivery Fee': {
    icon: faCreditCard,
    label: 'Advance Delivery Fee + COD',
    color: 'text-[#587a3b]',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    autoVerified: false
  },
  'online': {
    icon: faCreditCard,
    label: 'Online Payment',
    color: 'text-[#587a3b]',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    autoVerified: false
  },
  'easypaisa': {
    icon: faWallet,
    label: 'Easypaisa',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    autoVerified: false
  },
  'jazzcash': {
    icon: faWallet,
    label: 'JazzCash',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    autoVerified: false
  },
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Orders', icon: faList, count: 0 },
  { id: 'pending_verification', label: 'Pending Verification', icon: faHourglassHalf, count: 0 },
  { id: 'pending', label: 'Order Placed', icon: faClock, count: 0 },
  { id: 'packing', label: 'Packing', icon: faBox, count: 0 },
  { id: 'shipped', label: 'Shipped', icon: faShippingFast, count: 0 },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: faMotorcycle, count: 0 },
  { id: 'delivered', label: 'Delivered', icon: faCheckCircle, count: 0 },
  { id: 'cancelled', label: 'Cancelled', icon: faTimesCircle, count: 0 },
  { id: 'COD', label: 'COD Orders', icon: faMoneyBill, count: 0 },
  { id: 'advance', label: 'Advance Paid Orders', icon: faCreditCard, count: 0 },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'total_high', label: 'Total: High to Low' },
  { value: 'total_low', label: 'Total: Low to High' },
];

// Image Modal Component
const ImageModal = ({ imageUrl, isOpen, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[110] p-4 backdrop-blur-sm cursor-zoom-out"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] bg-white p-3 shadow-2xl flex flex-col items-center"
      >
        <div className="flex justify-between items-center w-full pb-2 mb-2 border-b border-gray-200">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-800">
            Advance Payment Receipt Screenshot
          </p>
          <button
            onClick={onClose}
            className="bg-black text-white w-7 h-7 flex items-center justify-center text-sm font-bold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Payment Screenshot"
          className="max-w-full max-h-[80vh] object-contain"
        />
      </div>
    </div>
  );
};

// Custom Hooks
const useOrdersFilter = (orders, activeFilter, searchTerm, sortBy) => {
  return useMemo(() => {
    let filtered = [...orders];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => {
        const isAdvance = Boolean(
          order.advancePaymentStatus !== 'not_required' &&
          order.deliveryCharges !== 0 &&
          ((order.advanceAmount && order.advanceAmount > 0) || 
           order.paymentScreenshot || 
           (order.paymentMethod && order.paymentMethod.includes('Advance')))
        );

        switch (activeFilter) {
          case 'pending_verification':
            return isAdvance && order.advancePaymentStatus !== 'verified' && order.advancePaymentStatus !== 'rejected';
          case 'pending':
            return (order.status === 'Order Placed' || order.status === 'Pending' || order.status === 'Processing') &&
              (!isAdvance || order.advancePaymentStatus === 'verified');
          case 'packing':
            return order.status === 'Packing';
          case 'shipped':
            return order.status === 'Shipped';
          case 'out_for_delivery':
            return order.status === 'Out for delivery';
          case 'delivered':
            return order.status === 'Delivered';
          case 'cancelled':
            return order.status === 'Cancelled' || order.advancePaymentStatus === 'rejected';
          case 'COD':
            return !isAdvance;
          case 'advance':
            return isAdvance;
          default:
            return true;
        }
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        const custInfo = getCustomerInfo(order);
        const name = (custInfo.name || '').toLowerCase();
        const email = (custInfo.email || '').toLowerCase();
        const phone = (custInfo.phone || '').replace(/[\s+-]/g, '');
        const searchPhone = term.replace(/[\s+-]/g, '');
        const city = (order.address?.city || '').toLowerCase();
        const coupon = (order.couponCode || '').toLowerCase();

        return (
          (order._id || '').toLowerCase().includes(term) ||
          name.includes(term) ||
          email.includes(term) ||
          (searchPhone && phone.includes(searchPhone)) ||
          city.includes(term) ||
          coupon.includes(term)
        );
      });
    }

    filtered.sort((a, b) => {
      const aTotal = Number(a.amount) || a.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;
      const bTotal = Number(b.amount) || b.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;

      switch (sortBy) {
        case 'newest':
          return new Date(b.date || 0) - new Date(a.date || 0);
        case 'oldest':
          return new Date(a.date || 0) - new Date(b.date || 0);
        case 'total_high':
          return bTotal - aTotal;
        case 'total_low':
          return aTotal - bTotal;
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, activeFilter, searchTerm, sortBy]);
};

// Sub-components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center bg-white p-8 border border-gray-200 shadow-sm max-w-sm w-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#587a3b] mx-auto mb-4"></div>
      <p className="text-gray-900 text-lg font-bold">Loading orders...</p>
    </div>
  </div>
);

const AccessRequired = ({ navigate }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center max-w-md bg-white p-8 border border-gray-200 shadow-sm w-full">
      <div className="mx-auto h-16 w-16 bg-gray-100 flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faReceipt} className="text-gray-600 text-2xl" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Access Required</h3>
      <p className="text-gray-600 text-sm mb-6">Please login to view and manage orders</p>
      <button
        onClick={() => navigate('/')}
        className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-colors w-full"
      >
        Go to Login
      </button>
    </div>
  </div>
);

const EmptyState = ({ activeFilter, searchTerm, onClearSearch }) => {
  const getFilterLabel = (filterId) => {
    const filter = FILTER_OPTIONS.find(f => f.id === filterId);
    return filter ? filter.label : 'orders';
  };

  return (
    <div className="text-center py-16 bg-white border border-gray-200 shadow-sm px-4">
      <div className="mx-auto h-20 w-20 bg-gray-100 flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-3xl" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {searchTerm ? 'No orders found' : `No ${activeFilter === 'all' ? '' : getFilterLabel(activeFilter).toLowerCase()}`}
      </h3>
      <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
        {searchTerm
          ? 'Try adjusting your search terms.'
          : activeFilter !== 'all'
            ? `No ${getFilterLabel(activeFilter).toLowerCase()} available.`
            : 'No orders have been placed yet.'
        }
      </p>
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="bg-black text-white px-6 py-2.5 text-xs font-bold hover:bg-gray-800 transition-colors uppercase tracking-wider"
        >
          Clear Search
        </button>
      )}
    </div>
  );
};

const SearchAndFilterBar = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  activeFilter,
  onFilterChange,
  filterOptions
}) => (
  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
    {/* Filter Pills */}
    <div className="flex items-center gap-1.5 p-1 bg-gray-100 border border-gray-200 overflow-x-auto scrollbar-none max-w-full">
      {filterOptions.map((option) => {
        const isActive = activeFilter === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
              isActive
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-600 hover:text-black hover:bg-white'
            }`}
          >
            <span>{option.label}</span>
            {option.count > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] font-extrabold ${
                isActive ? 'bg-white text-black' : 'bg-gray-200 text-gray-700'
              }`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>

    {/* Search and Sort */}
    <div className="flex items-center gap-3 w-full lg:w-auto">
      <div className="relative flex-1 lg:w-72">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
        />
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 focus:ring-1 focus:ring-black focus:border-black text-xs font-medium transition-all text-gray-900"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      <div className="relative min-w-[140px]">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full pl-4 pr-8 py-2.5 bg-white border border-gray-300 focus:ring-1 focus:ring-black appearance-none text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
      </div>
    </div>
  </div>
);

// Order Details Modal Component
const OrderDetailsModal = ({ order, customerInfo, isOpen, onClose, onVerifyPayment }) => {
  if (!isOpen || !order) return null;

  const isAdvance = Boolean(
    order.advancePaymentStatus !== 'not_required' &&
    order.deliveryCharges !== 0 &&
    ((order.advanceAmount && order.advanceAmount > 0) || 
     order.paymentScreenshot || 
     (order.paymentMethod && order.paymentMethod.includes('Advance')))
  );

  const advanceAmountVal = order.advanceAmount !== undefined ? order.advanceAmount : (order.deliveryCharges || 0);

  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)),
    0
  );
  
  const totalAmount = Number(order.amount) || (isAdvance ? subtotal : subtotal + (order.deliveryCharges || 0));
  const rawPhone = (customerInfo.phone || '').replace(/[^0-9]/g, '');
  const waPhone = rawPhone.startsWith('0') ? `92${rawPhone.slice(1)}` : rawPhone;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-300 p-6 md:p-8 my-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10 text-xl font-bold"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Details</h2>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-6">
          Order Reference #{order._id?.substring(0, 12).toUpperCase()}
        </p>

        {/* Customer + Shipping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-[#587a3b]" /> Customer
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-black flex items-center justify-center font-bold text-white text-xs shrink-0">
                {customerInfo.name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{customerInfo.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{order.isGuest ? 'Guest Checkout' : 'Registered User'}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 w-3.5 shrink-0" />
                <span className="break-all">{customerInfo.email}</span>
              </div>
              <div className="flex items-center justify-between text-gray-900 font-semibold">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} className="text-gray-400 w-3.5 shrink-0" />
                  <a href={`tel:${customerInfo.phone}`} className="hover:underline text-blue-700">{customerInfo.phone}</a>
                </div>
                {waPhone && (
                  <a 
                    href={`https://wa.me/${waPhone}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 font-bold flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faWhatsapp} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border border-gray-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faShippingFast} className="text-[#587a3b]" /> Delivery Address
            </h3>
            <div className="space-y-1 text-xs mb-3 text-gray-700">
              {order.address?.firstName && <p className="font-bold text-gray-900">{order.address.firstName} {order.address.lastName}</p>}
              {order.address?.street && <p className="text-gray-800">{order.address.street}</p>}
              <p className="text-gray-800">{[order.address?.city, order.address?.state, order.address?.zipcode || order.address?.zipCode].filter(Boolean).join(', ')}</p>
            </div>
            <div className="border-t border-gray-200 pt-2.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Payment Mode</p>
                <p className="font-bold text-gray-900">{isAdvance ? 'Advance Delivery Fee + COD' : 'Cash On Delivery'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Order Date</p>
                <p className="font-bold text-gray-900">{new Date(order.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Advance Payment Verification Section (if applicable) */}
        {isAdvance && (
          <div className="bg-amber-50/80 border border-amber-200 p-4 mb-6 text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCreditCard} />
                Advance Delivery Payment (Rs. {advanceAmountVal})
              </span>
              <span className={`px-2 py-0.5 font-bold uppercase text-[10px] ${
                order.advancePaymentStatus === 'verified'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : order.advancePaymentStatus === 'rejected'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-amber-200 text-amber-900 animate-pulse'
              }`}>
                {order.advancePaymentStatus || 'pending review'}
              </span>
            </div>

            {order.transactionId && (
              <p className="text-gray-700 mb-2">
                <strong>Transaction ID:</strong> <span className="font-mono">{order.transactionId}</span>
              </p>
            )}

            {order.paymentScreenshot && (
              <div className="mb-3">
                <p className="text-gray-500 font-bold mb-1">Receipt Screenshot:</p>
                <a href={order.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={order.paymentScreenshot} 
                    alt="Receipt" 
                    className="max-h-40 border border-amber-300 object-contain bg-white hover:opacity-90"
                  />
                </a>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-amber-200">
              <button
                onClick={() => onVerifyPayment(order._id, 'verified')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FontAwesomeIcon icon={faCheck} />
                <span>Approve Advance Payment</span>
              </button>
              <button
                onClick={() => onVerifyPayment(order._id, 'rejected')}
                className="px-4 py-2 bg-white border border-red-300 hover:bg-red-600 hover:text-white text-red-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* Summary Bar */}
        <div className="bg-black text-white p-4 mb-6 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Status</p>
            <p className="text-white font-bold text-sm uppercase">{order.status}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Items Count</p>
            <p className="text-white font-bold text-sm">{order.items?.length || 0}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Delivery Fee</p>
            <p className="text-white font-bold text-sm">
              {isAdvance ? `Rs. ${advanceAmountVal} (Adv)` : order.deliveryCharges === 0 ? 'FREE' : `${currency}${order.deliveryCharges}`}
            </p>
          </div>
          {order.couponCode && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-green-400 font-bold mb-0.5">Promo Discount</p>
              <p className="text-green-400 font-bold text-sm">- {currency}{Number(order.couponDiscount || 0).toFixed(2)}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Order Total (COD)</p>
            <p className="text-[#a4d47c] font-extrabold text-2xl">{currency}{totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Products Ordered */}
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
          <FontAwesomeIcon icon={faBox} className="text-[#587a3b]" /> Products Ordered
        </h3>
        <div className="space-y-2.5">
          {order.items?.map((item, idx) => {
            const imgSrc = Array.isArray(item.image)
              ? item.image[0]
              : typeof item.image === 'string' && item.image.length > 10
                ? item.image
                : null;

            return (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 border border-gray-200">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={item.name}
                    className="w-14 h-14 object-contain bg-white border border-gray-200 shrink-0 p-0.5"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faBox} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate mb-0.5">{item.name}</h4>
                  <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                    {item.variant && (
                      <span className="px-1.5 py-0.2 bg-gray-200 text-gray-800 font-bold">{item.variant}</span>
                    )}
                    <span className="px-1.5 py-0.2 bg-gray-200 text-black font-bold">Qty: {item.quantity || 1}</span>
                    <span>{currency}{Number(item.price || 0).toFixed(2)} each</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 text-sm">{currency}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Order Card Component (Legacy Furniture Style)
const OrderCard = ({
  order,
  onStatusChange,
  onVerifyPayment,
  onPreviewImage
}) => {
  const customerInfo = useMemo(() => getCustomerInfo(order), [order]);
  const isAdvance = Boolean(
    order.advancePaymentStatus !== 'not_required' &&
    order.deliveryCharges !== 0 &&
    ((order.advanceAmount && order.advanceAmount > 0) || 
     order.paymentScreenshot || 
     (order.paymentMethod && order.paymentMethod.includes('Advance')))
  );

  const needsVerification = isAdvance && order.advancePaymentStatus !== 'verified' && order.advancePaymentStatus !== 'rejected';
  const canUpdateStatus = (!isAdvance || order.advancePaymentStatus === 'verified') &&
    order.status !== 'Cancelled' &&
    order.status !== 'Delivered';

  const screenshotUrl = order.paymentScreenshot;
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);

  // Initials for avatar
  const getInitials = (name) => {
    return (name || 'C')
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Status badge styles
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Packing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Out for delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const totalAmount = Number(order.amount) || (order.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 group">
      {/* Card Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 flex items-center justify-center font-bold text-white shadow-sm ${
              isAdvance ? 'bg-[#587a3b]' : 'bg-black'
            }`}>
              {getInitials(customerInfo.name)}
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 leading-tight">{customerInfo.name}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Order #{order._id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${getStatusStyles(order.status)}`}>
            {order.status}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCalendar} className="text-[#587a3b]" />
            <span>{new Date(order.date || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="text-[#587a3b]" />
            <span>{new Date(order.date || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 p-5 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-100">
          <span>Items</span>
          <div className="flex gap-8">
            <span>Qty</span>
            <span className="w-12 text-right">Price</span>
          </div>
        </div>

        <div className="space-y-2.5 pr-1">
          {(order.items || []).slice(0, 4).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-800 truncate flex-1 pr-3">{item.name}</span>
              <div className="flex items-center gap-8 text-gray-600">
                <span className="text-center w-6 font-bold text-black">{item.quantity || 1}</span>
                <span className="font-bold text-gray-900 w-12 text-right">{currency}{Number(item.price || 0).toFixed(0)}</span>
              </div>
            </div>
          ))}
          {(order.items || []).length > 4 && (
            <p className="text-center text-xs font-bold text-[#587a3b] py-1.5 bg-green-50 border border-green-100">
              +{order.items.length - 4} more items
            </p>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-5 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total COD</span>
          <span className="text-xl font-extrabold text-gray-900">{currency}{totalAmount.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setShowOrderDetailsModal(true)}
            className="px-3 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-900 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FontAwesomeIcon icon={faFileAlt} className="text-[#587a3b]" />
            Details
          </button>

          {canUpdateStatus ? (
            <div className="relative">
              <select
                onChange={(e) => onStatusChange(e, order._id)}
                value={order.status}
                className="w-full h-full px-3 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors cursor-pointer appearance-none text-center"
              >
                <option value="Order Placed">Process</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Transit</option>
                <option value="Delivered">Finish</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <FontAwesomeIcon icon={faChevronDown} className="text-white/60 text-[10px]" />
              </div>
            </div>
          ) : needsVerification ? (
            <button
              className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              onClick={() => onPreviewImage(screenshotUrl)}
            >
              <FontAwesomeIcon icon={faHourglassHalf} />
              Verify Proof
            </button>
          ) : (
            <div className="px-3 py-2.5 bg-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider flex items-center justify-center text-center">
              Locked
            </div>
          )}
        </div>
      </div>

      <OrderDetailsModal
        order={order}
        customerInfo={customerInfo}
        isOpen={showOrderDetailsModal}
        onClose={() => setShowOrderDetailsModal(false)}
        onVerifyPayment={onVerifyPayment}
      />
    </div>
  );
};

const getCustomerInfo = (order) => {
  if (order.customerDetails) {
    return {
      name: order.customerDetails.name || 'Customer',
      email: order.customerDetails.email || 'Email not available',
      phone: order.customerDetails.phone || order.address?.phone || 'Phone not available'
    };
  }

  if (order.address) {
    const addressName = `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim();
    return {
      name: addressName || 'Customer',
      email: order.address.email || 'Email not available',
      phone: order.address.phone || 'Phone not available'
    };
  }

  return {
    name: 'Customer',
    email: 'Email not available',
    phone: 'Phone not available'
  };
};

const calculateFilterCounts = (orders) => {
  return FILTER_OPTIONS.map(filter => {
    let count = 0;
    switch (filter.id) {
      case 'all':
        count = orders.length;
        break;
      case 'pending_verification':
        count = orders.filter(order => {
          const isAdv = Boolean(
            order.advancePaymentStatus !== 'not_required' &&
            order.deliveryCharges !== 0 &&
            ((order.advanceAmount && order.advanceAmount > 0) || order.paymentScreenshot)
          );
          return isAdv && order.advancePaymentStatus !== 'verified' && order.advancePaymentStatus !== 'rejected';
        }).length;
        break;
      case 'pending':
        count = orders.filter(order => {
          const isAdv = Boolean(
            order.advancePaymentStatus !== 'not_required' &&
            order.deliveryCharges !== 0 &&
            ((order.advanceAmount && order.advanceAmount > 0) || order.paymentScreenshot)
          );
          return (order.status === 'Order Placed' || order.status === 'Pending' || order.status === 'Processing') &&
            (!isAdv || order.advancePaymentStatus === 'verified');
        }).length;
        break;
      case 'packing':
        count = orders.filter(order => order.status === 'Packing').length;
        break;
      case 'shipped':
        count = orders.filter(order => order.status === 'Shipped').length;
        break;
      case 'out_for_delivery':
        count = orders.filter(order => order.status === 'Out for delivery').length;
        break;
      case 'delivered':
        count = orders.filter(order => order.status === 'Delivered').length;
        break;
      case 'cancelled':
        count = orders.filter(order =>
          order.status === 'Cancelled' || order.advancePaymentStatus === 'rejected'
        ).length;
        break;
      case 'COD':
        count = orders.filter(order => {
          const isAdv = Boolean(
            order.advancePaymentStatus !== 'not_required' &&
            order.deliveryCharges !== 0 &&
            ((order.advanceAmount && order.advanceAmount > 0) || order.paymentScreenshot)
          );
          return !isAdv;
        }).length;
        break;
      case 'advance':
        count = orders.filter(order => Boolean(
          order.advancePaymentStatus !== 'not_required' &&
          order.deliveryCharges !== 0 &&
          ((order.advanceAmount && order.advanceAmount > 0) || order.paymentScreenshot)
        )).length;
        break;
      default:
        count = 0;
    }
    return { ...filter, count };
  });
};

// Main Component
const Orders = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [previewImage, setPreviewImage] = useState(null);

  const filteredOrders = useOrdersFilter(orders, activeFilter, searchTerm, sortBy);
  const filtersWithCounts = useMemo(() => calculateFilterCounts(orders), [orders]);

  const handleUnauthorized = useCallback((endpoint) => {
    toast.error('Session expired. Please login again.');
    logout();
    navigate('/');
  }, [logout, navigate]);

  const fetchAllOrders = useCallback(async () => {
    if (!token) {
      handleUnauthorized('/api/order/list');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/order/list`, {
        headers: { token },
      });

      if (response.data.success) {
        const ordersData = response.data.orders || [];
        setOrders(ordersData);
      } else if (response.data.message?.includes('Not Authorized') || response.status === 401) {
        handleUnauthorized('/api/order/list');
      } else {
        toast.error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized')) {
        handleUnauthorized('/api/order/list');
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  const statusHandler = useCallback(async (event, orderId) => {
    const newStatus = event.target.value;

    if (!token) {
      handleUnauthorized('/api/order/status');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: newStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Order status updated');
        // Optimistic update
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      } else if (response.data.message?.includes('Not Authorized') || response.status === 401) {
        handleUnauthorized('/api/order/status');
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized')) {
        handleUnauthorized('/api/order/status');
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    }
  }, [token, handleUnauthorized]);

  const verifyPaymentHandler = useCallback(async (orderId, status) => {
    if (!token) {
      handleUnauthorized('/api/order/verify-payment');
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/verify-payment`,
        { orderId, status },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || `Payment marked as ${status}`);
        fetchAllOrders();
      } else {
        toast.error(response.data.message || 'Failed to update payment status');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [token, handleUnauthorized, fetchAllOrders]);

  const handleFilterChange = useCallback((filterId) => {
    setActiveFilter(filterId);
  }, []);

  useEffect(() => {
    if (token) {
      fetchAllOrders();
    } else {
      setLoading(false);
    }
  }, [token, fetchAllOrders]);

  if (loading) return <LoadingSpinner />;
  if (!token) return <AccessRequired navigate={navigate} />;

  return (
    <div className="w-full pb-10">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 text-left">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Order Management</h1>
              <p className="text-gray-500 mt-1 text-sm font-medium">
                Manage all store orders, track live statuses, and verify advance delivery receipts.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 border border-gray-200">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">COD Orders</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Verified Advance</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Pending Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          filterOptions={filtersWithCounts}
        />

        {/* Order Grid */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            activeFilter={activeFilter}
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusChange={statusHandler}
                onVerifyPayment={verifyPaymentHandler}
                onPreviewImage={setPreviewImage}
              />
            ))}
          </div>
        )}
      </div>

      <ImageModal
        imageUrl={previewImage}
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default Orders;