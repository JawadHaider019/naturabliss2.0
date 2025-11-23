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
  faMapMarkerAlt,
  faCreditCard,
  faReceipt,
  faUser,
  faCalendar,
  faSearch,
  faFilter,
  faEnvelope 
} from '@fortawesome/free-solid-svg-icons';

// Constants
const STATUS_CONFIG = {
  'Order Placed': { icon: faClock, color: 'blue', label: 'Pending' },
  'Pending': { icon: faClock, color: 'blue', label: 'Pending' },
  'Packing': { icon: faBox, color: 'amber', label: 'Packing' },
  'Shipped': { icon: faShippingFast, color: 'purple', label: 'Shipped' },
  'Out for delivery': { icon: faMotorcycle, color: 'orange', label: 'Delivery' },
  'Delivered': { icon: faCheckCircle, color: 'green', label: 'Delivered' },
  'Cancelled': { icon: faTimesCircle, color: 'red', label: 'Cancelled' },
};

const TABS = [
  { id: 'all', label: 'All Orders', icon: faList, color: 'gray' },
  { id: 'pending', label: 'Pending', icon: faClock, color: 'blue' },
  { id: 'packing', label: 'Packing', icon: faBox, color: 'amber' },
  { id: 'shipped', label: 'Shipped', icon: faShippingFast, color: 'purple' },
  { id: 'out_for_delivery', label: 'Delivery', icon: faMotorcycle, color: 'orange' },
  { id: 'delivered', label: 'Delivered', icon: faCheckCircle, color: 'green' },
  { id: 'cancelled', label: 'Cancelled', icon: faTimesCircle, color: 'red' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'total_high', label: 'Total: High to Low' },
  { value: 'total_low', label: 'Total: Low to High' },
];

// Custom Hooks
const useOrdersFilter = (orders, activeTab, searchTerm, sortBy) => {
  return useMemo(() => {
    let filtered = orders;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => {
        switch (activeTab) {
          case 'pending':
            return order.status === 'Order Placed' || order.status === 'Pending';
          case 'packing':
            return order.status === 'Packing';
          case 'shipped':
            return order.status === 'Shipped';
          case 'out_for_delivery':
            return order.status === 'Out for delivery';
          case 'delivered':
            return order.status === 'Delivered';
          case 'cancelled':
            return order.status === 'Cancelled';
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(term) ||
        (order.customerDetails?.name?.toLowerCase().includes(term)) ||
        (order.customerDetails?.email?.toLowerCase().includes(term)) ||
        order.address?.phone?.includes(searchTerm)
      );
    }

    // Sort orders
    filtered = [...filtered].sort((a, b) => {
      const aTotal = a.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;
      const bTotal = b.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;

      switch (sortBy) {
        case 'newest':
          return new Date(b.date) - new Date(a.date);
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'total_high':
          return bTotal - aTotal;
        case 'total_low':
          return aTotal - bTotal;
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, activeTab, searchTerm, sortBy]);
};

// Sub-components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg font-medium">Loading orders...</p>
      <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your orders</p>
    </div>
  </div>
);

const AccessRequired = ({ navigate }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="mx-auto h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faReceipt} className="text-gray-500 text-2xl" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Access Required</h3>
      <p className="text-gray-600 mb-6">Please login to view and manage orders</p>
      <button
        onClick={() => navigate('/')}
        className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium w-full sm:w-auto"
      >
        Go to Login
      </button>
    </div>
  </div>
);

const EmptyState = ({ activeTab, searchTerm, onClearSearch }) => (
  <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <FontAwesomeIcon icon={faReceipt} className="text-gray-400 text-2xl" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">
      {searchTerm ? 'No orders found' : `No ${activeTab === 'all' ? '' : activeTab.replace('_', ' ')} orders`}
    </h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      {searchTerm 
        ? 'Try adjusting your search terms to find what you\'re looking for.'
        : activeTab !== 'all' 
          ? `There are no ${activeTab.replace('_', ' ')} orders at the moment.`
          : 'No orders have been placed yet.'
      }
    </p>
    {searchTerm && (
      <button
        onClick={onClearSearch}
        className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
      >
        Clear Search
      </button>
    )}
  </div>
);

const SearchAndFilterBar = ({ searchTerm, onSearchChange, sortBy, onSortChange }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            placeholder="Search orders by ID, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <FontAwesomeIcon 
            icon={faFilter} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white appearance-none min-w-[160px]"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  </div>
);

const TabsNavigation = ({ tabs, activeTab, onTabChange }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
    <div className="flex overflow-x-auto scrollbar-hide px-2 py-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap flex-shrink-0 mx-1 rounded-lg ${
            activeTab === tab.id
              ? `border-${tab.color}-500 text-${tab.color}-700 bg-${tab.color}-50`
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FontAwesomeIcon 
            icon={tab.icon} 
            className={`text-sm mr-3 ${
              activeTab === tab.id ? `text-${tab.color}-600` : 'text-gray-400'
            }`} 
          />
          <span className="font-medium">{tab.label}</span>
          <span className={`ml-2 px-2 py-1 text-xs rounded-full min-w-6 text-center ${
            activeTab === tab.id 
              ? `bg-${tab.color}-100 text-${tab.color}-700` 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  </div>
);

const OrderCard = ({ 
  order, 
  onStatusChange, 
  expandedDeals, 
  onToggleDeal 
}) => {
  const { dealGroups, regularItems } = useMemo(() => 
    groupItemsByDeal(order.items || []), 
    [order.items]
  );
  
  const allDeals = Object.values(dealGroups);
  const totalItemsCount = order.items?.length || 0;

  // 🆕 USE CUSTOMER DETAILS FROM ORDER INSTEAD OF FETCHING USER DATA
  const customerInfo = useMemo(() => 
    getCustomerInfo(order), 
    [order]
  );

  const subtotal = useMemo(() => 
    (order.items || []).reduce(
      (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)),
      0
    ), 
    [order.items]
  );
  
  const total = subtotal + (order.deliveryCharges || 0);
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all duration-200 hover:shadow-md ${
      order.status === 'Cancelled' ? 'border-red-200' : 'border-gray-200'
    }`}>
      <OrderHeader 
        order={order} 
        customerInfo={customerInfo} 
        total={total} 
        totalItemsCount={totalItemsCount}
        statusConfig={statusConfig}
      />
      <OrderContent 
        order={order}
        allDeals={allDeals}
        regularItems={regularItems}
        customerInfo={customerInfo}
        subtotal={subtotal}
        total={total}
        expandedDeals={expandedDeals}
        onToggleDeal={onToggleDeal}
        onStatusChange={onStatusChange}
        statusConfig={statusConfig}
      />
    </div>
  );
};

const OrderHeader = ({ order, customerInfo, total, totalItemsCount, statusConfig }) => (
  <div className={`px-4 sm:px-6 py-4 border-b ${
    order.status === 'Cancelled' ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
  }`}>
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex items-center flex-1 min-w-0">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mr-4 ${
          order.status === 'Cancelled' ? 'bg-red-100' : 'bg-gray-100'
        }`}>
          <FontAwesomeIcon 
            icon={statusConfig.icon} 
            className={`text-lg ${order.status === 'Cancelled' ? 'text-red-600' : 'text-gray-600'}`} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3">
              <h4 className={`text-lg font-bold ${
                order.status === 'Cancelled' ? 'text-red-800' : 'text-gray-900'
              }`}>
                #{order._id.substring(0, 8).toUpperCase()}
              </h4>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                {customerInfo.name}
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                {new Date(order.date).toLocaleDateString()}
              </div>
            </div>
          </div>
          {order.cancellationReason && (
            <p className="text-sm text-red-600 mt-2">
              <span className="font-medium">Cancellation Reason:</span> {order.cancellationReason}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{currency}{total.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{totalItemsCount} items</p>
        </div>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
  const colorClass = `bg-${config.color}-50 text-${config.color}-700 border border-${config.color}-200`;
  
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${colorClass}`}>
      <FontAwesomeIcon icon={config.icon} className="mr-2" />
      {status}
    </span>
  );
};

const OrderContent = ({
  order,
  allDeals,
  regularItems,
  customerInfo,
  subtotal,
  total,
  expandedDeals,
  onToggleDeal,
  onStatusChange,
  statusConfig
}) => (
  <div className="p-4 sm:p-6 flex flex-col xl:flex-row gap-6">
    <OrderItems 
      allDeals={allDeals}
      regularItems={regularItems}
      orderId={order._id}
      expandedDeals={expandedDeals}
      onToggleDeal={onToggleDeal}
    />
    <OrderSidebar 
      order={order}
      customerInfo={customerInfo}
      subtotal={subtotal}
      total={total}
      onStatusChange={onStatusChange}
    />
  </div>
);

const OrderItems = ({ allDeals, regularItems, orderId, expandedDeals, onToggleDeal }) => (
  <div className="xl:flex-1">
    <div className="flex items-center justify-between mb-4">
      <h5 className="text-lg font-semibold text-gray-900">Order Items</h5>
      <div className="flex gap-2">
        {allDeals.length > 0 && (
          <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm border border-amber-200 font-medium">
            <FontAwesomeIcon icon={faTag} className="mr-2" />
            {allDeals.length} Deal{allDeals.length !== 1 ? 's' : ''}
          </span>
        )}
        {regularItems.length > 0 && (
          <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm border border-blue-200 font-medium">
            <FontAwesomeIcon icon={faCube} className="mr-2" />
            {regularItems.length} Product{regularItems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
    
    <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto border border-gray-200">
      {allDeals.map((deal, dealIndex) => (
        <DealItem
          key={dealIndex}
          deal={deal}
          orderId={orderId}
          expandedDeals={expandedDeals}
          onToggleDeal={onToggleDeal}
        />
      ))}
      {regularItems.map((item, idx) => (
        <ProductItem key={idx} item={item} />
      ))}
    </div>
  </div>
);

const DealItem = ({ deal, orderId, expandedDeals, onToggleDeal }) => {
  const isExpanded = expandedDeals[`${orderId}-${deal.dealName}`];
  
  return (
    <div className="mb-4 last:mb-0">
      <div 
        className={`flex justify-between items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
          isExpanded ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-gray-200 hover:shadow-sm'
        }`}
        onClick={() => onToggleDeal(orderId, deal.dealName)}
      >
        <div className="flex items-center flex-1 min-w-0">
          <span className="bg-amber-500 text-white px-3 py-1.5 rounded text-sm font-semibold mr-4">
            <FontAwesomeIcon icon={faTag} className="mr-2" />
            Deal
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-base">{deal.dealName}</p>
            {deal.dealDescription && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{deal.dealDescription}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4 ml-4">
          <div className="text-right">
            <p className="font-semibold text-gray-900 text-base">
              {currency}{deal.totalPrice.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              {deal.totalQuantity} item{deal.totalQuantity !== 1 ? 's' : ''}
            </p>
          </div>
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
            className="text-gray-400 text-lg" 
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 pl-4">
          {deal.items.map((item, itemIndex) => (
            <div key={itemIndex} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{item.name}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">Qty: {item.quantity || 1}</span>
                  <span className="text-sm text-gray-500">• {currency}{item.price?.toFixed(2)} each</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  {currency}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductItem = ({ item }) => (
  <div className="flex justify-between items-center py-4 px-4 bg-white rounded-lg border border-gray-200 mb-3 last:mb-0 hover:bg-gray-50 transition-colors">
    <div className="flex-1 min-w-0">
      <div className="flex items-center mb-2">
        <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</p>
        <span className="ml-3 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200 font-medium">
          Product
        </span>
      </div>
      {item.description && (
        <p className="text-sm text-gray-600 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">Qty: {item.quantity || 1}</span>
        <span className="text-sm text-gray-500">• {currency}{item.price?.toFixed(2)} each</span>
      </div>
    </div>
    <div className="text-right ml-4">
      <p className="font-semibold text-gray-900 text-base sm:text-lg">
        {currency}{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </p>
    </div>
  </div>
);

const OrderSidebar = ({ order, customerInfo, subtotal, total, onStatusChange }) => (
  <div className="flex flex-col gap-6 xl:w-80">
    <CustomerInfo order={order} customerInfo={customerInfo} />
    <OrderSummary 
      order={order} 
      subtotal={subtotal} 
      total={total} 
      onStatusChange={onStatusChange} 
    />
  </div>
);

const CustomerInfo = ({ order, customerInfo }) => (
  <div>
    <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
      <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
      Customer Information
    </h5>
    <div className="bg-gray-50 rounded-xl p-4 text-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">CUSTOMER NAME</p>
          <p className="font-semibold text-gray-900 flex items-center">
            {customerInfo.name}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium mb-1">EMAIL</p>
          <p className="font-semibold text-gray-900 flex items-center">
            {customerInfo.email}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <p className="text-gray-500 text-xs font-medium mb-2">SHIPPING ADDRESS</p>
        {order.address ? (
          <>
            <p className="text-gray-600 mb-1">{order.address.street || 'Street not specified'}</p>
            <p className="text-gray-600 mb-1">
              {order.address.city || 'City'}, {order.address.state || 'State'}
            </p>
            <p className="text-gray-600 mb-3">{order.address.zipcode || 'Zipcode'}</p>
            {order.address.phone && (
              <p className="text-gray-600 flex items-center">
                <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400 w-4 h-4" />
                {order.address.phone}
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">Shipping address not available</p>
        )}
      </div>
    </div>
  </div>
);

const OrderSummary = ({ order, subtotal, total, onStatusChange }) => (
  <div className="space-y-6">
    <div>
      <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <FontAwesomeIcon icon={faReceipt} className="mr-2 text-gray-400" />
        Order Summary
      </h5>
      <div className={`rounded-xl p-4 border text-sm ${
        order.status === 'Cancelled' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-semibold text-gray-900">{currency}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-3">
          <span className="text-gray-600">Delivery Fee:</span>
          <span className="font-semibold text-gray-900">
            {order.deliveryCharges === 0 ? 'FREE' : `${currency}${order.deliveryCharges.toFixed(2)}`}
          </span>
        </div>
        <div className="pt-3 mt-3 border-t border-gray-300 flex justify-between font-semibold text-base">
          <span className="text-gray-900">Total:</span>
          <span className="text-gray-900">{currency}{total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div>
      <h5 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h5>
      <select
        onChange={(e) => onStatusChange(e, order._id)}
        value={order.status}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white shadow-sm text-sm font-medium"
        disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
      >
        <option value="Order Placed">Order Placed</option>
        <option value="Packing">Packing</option>
        <option value="Shipped">Shipped</option>
        <option value="Out for delivery">Out for Delivery</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      {(order.status === 'Cancelled' || order.status === 'Delivered') && (
        <p className="text-sm text-gray-500 mt-2">
          This order is {order.status.toLowerCase()} and cannot be updated.
        </p>
      )}
    </div>
  </div>
);

// Utility Functions
const groupItemsByDeal = (items) => {
  const dealGroups = {};
  const regularItems = [];
  
  items.forEach(item => {
    if (item.isFromDeal === true) {
      const dealKey = item.dealName || 'Unknown Deal';
      if (!dealGroups[dealKey]) {
        dealGroups[dealKey] = {
          dealName: dealKey,
          dealDescription: item.dealDescription,
          dealImage: item.dealImage,
          items: [],
          totalQuantity: 0,
          totalPrice: 0
        };
      }
      dealGroups[dealKey].items.push(item);
      dealGroups[dealKey].totalQuantity += item.quantity || 1;
      dealGroups[dealKey].totalPrice += (item.price || 0) * (item.quantity || 1);
    } else {
      regularItems.push(item);
    }
  });

  return { dealGroups, regularItems };
};

// 🆕 UPDATED: Get customer info from order's customerDetails
const getCustomerInfo = (order) => {
  // Use customerDetails from order if available (edited during checkout)
  if (order.customerDetails) {
    return {
      name: order.customerDetails.name || 'Customer',
      email: order.customerDetails.email || 'Email not available',
      phone: order.customerDetails.phone || order.address?.phone || 'Phone not available'
    };
  }

  // Fallback to address information
  if (order.address) {
    const addressName = `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim();
    return {
      name: addressName || 'Customer',
      email: order.address.email || 'Email not available',
      phone: order.address.phone || 'Phone not available'
    };
  }

  // Final fallback
  return {
    name: 'Customer',
    email: 'Email not available',
    phone: 'Phone not available'
  };
};

const calculateTabCounts = (orders) => {
  return TABS.map(tab => {
    let count = 0;
    switch (tab.id) {
      case 'all':
        count = orders.length;
        break;
      case 'pending':
        count = orders.filter(order =>
          order.status === 'Order Placed' ||
          order.status === 'Pending'
        ).length;
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
        count = orders.filter(order => order.status === 'Cancelled').length;
        break;
      default:
        count = 0;
    }
    return { ...tab, count };
  });
};

// Main Component
const Orders = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedDeals, setExpandedDeals] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredOrders = useOrdersFilter(orders, activeTab, searchTerm, sortBy);
  const tabsWithCounts = useMemo(() => calculateTabCounts(orders), [orders]);

  const handleUnauthorized = useCallback((endpoint) => {
    console.error(`❌ Unauthorized while calling ${endpoint}`);
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
        
        // 🆕 REMOVED: No need to fetch user details anymore since we use customerDetails from order
        
      } else if (response.data.message?.includes('Not Authorized') || response.status === 401) {
        handleUnauthorized('/api/order/list');
      } else {
        toast.error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized')) {
        handleUnauthorized('/api/order/list');
      } else {
        console.error('💥 Error fetching orders:', error);
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
        fetchAllOrders();
      } else if (response.data.message?.includes('Not Authorized') || response.status === 401) {
        handleUnauthorized('/api/order/status');
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized')) {
        handleUnauthorized('/api/order/status');
      } else {
        console.error('💥 Error updating status:', error);
        toast.error(error.response?.data?.message || error.message);
      }
    }
  }, [token, handleUnauthorized, fetchAllOrders]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const toggleDealExpansion = useCallback((orderId, dealName) => {
    const key = `${orderId}-${dealName}`;
    setExpandedDeals(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 px-3 sm:py-6 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Order Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage and track all customer orders in one place
              </p>
            </div>
          </div>

          <SearchAndFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        <TabsNavigation
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            activeTab={activeTab}
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
          />
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusChange={statusHandler}
                expandedDeals={expandedDeals}
                onToggleDeal={toggleDealExpansion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;