import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, faChartLine, faClipboardList, faClock, faPlus, 
  faBoxes, faShoppingCart, faWarehouse, faChartPie, faTags,
  faArrowTrendUp, faArrowTrendDown, faUsers, faRocket, faPercent,
  faBell, faSync, faExclamationTriangle, faTimes, faFire,
  faUserCheck, faUserPlus, faMapMarkerAlt, faExclamationCircle,
  faComments, faStar, faReply, faChartBar, faCalendarAlt,
  faMoneyBillTrendUp, faChartSimple, faCalendarWeek
} from '@fortawesome/free-solid-svg-icons';
import { backendUrl } from "../App";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

// Constants
const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;
const TIME_RANGES = ['daily', 'weekly', 'monthly'];
const CHART_TYPES = ['pie', 'bar'];
const PROFIT_PERIODS = ['3months', '6months', '12months', '24months'];
const PROFIT_GROWTH_TYPES = ['monthly', 'yoy', 'detailed'];

// Reusable Components
const StatCard = React.memo(({ title, value, icon, color, change, subtitle, trend }) => (
  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm sm:shadow-lg border border-gray-100 hover:shadow-md sm:hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-gray-600 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 lg:mb-2 truncate">{title}</p>
        <p className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
          {typeof value === 'number' && value >= 1000 ? `₹${value.toLocaleString()}` : value}
        </p>
        {subtitle && <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
        {change && (
          <div className="flex items-center mt-0.5 sm:mt-1 lg:mt-2">
            <FontAwesomeIcon 
              icon={change > 0 ? faArrowTrendUp : faArrowTrendDown} 
              className={`text-[10px] sm:text-xs mr-0.5 sm:mr-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} 
            />
            <p className={`text-[10px] sm:text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          </div>
        )}
        {trend && <div className="flex items-center mt-0.5"><span className="text-[10px] sm:text-xs text-gray-500">{trend}</span></div>}
      </div>
      <div className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${color} shadow-sm sm:shadow-md flex-shrink-0 ml-1 sm:ml-2`}>
        <FontAwesomeIcon icon={icon} className="text-xs sm:text-sm lg:text-base text-white" />
      </div>
    </div>
  </div>
));

const StatusBadge = React.memo(({ status }) => {
  const colors = { 
    Delivered: 'bg-green-100 text-green-800', 
    Processing: 'bg-blue-100 text-blue-800', 
    Shipped: 'bg-yellow-100 text-yellow-800',
    'Order Placed': 'bg-purple-100 text-purple-800',
    Packing: 'bg-orange-100 text-orange-800'
  };
  return (
    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
});

const StockBadge = React.memo(({ stock }) => (
  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
    stock <= 2 ? 'bg-red-100 text-red-800' : 
    stock <= 5 ? 'bg-yellow-100 text-yellow-800' : 
    'bg-green-100 text-green-800'
  }`}>
    {stock} left
  </span>
));

const ChartToggle = React.memo(({ chartKey, currentView, onToggle, options = CHART_TYPES }) => (
  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
    {options.map(type => (
      <button
        key={type}
        onClick={() => onToggle(type)}
        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${
          currentView === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
        }`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </button>
    ))}
  </div>
));

const TimeRangeSelector = ({ currentRange, onRangeChange, options }) => (
  <div className="flex gap-1 flex-wrap">
    {options.map(range => (
      <button 
        key={range} 
        onClick={() => onRangeChange(range)} 
        className={`px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium ${
          currentRange === range ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}
      >
        {range.charAt(0).toUpperCase() + range.slice(1)}
      </button>
    ))}
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">Loading dashboard data...</p>
    </div>
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="flex items-center justify-center h-full text-gray-500 p-3 sm:p-4">
    <div className="text-center">
      <FontAwesomeIcon icon={icon} className="text-2xl sm:text-3xl lg:text-4xl text-gray-300 mb-1 sm:mb-2" />
      <p className="text-xs sm:text-sm">{message}</p>
    </div>
  </div>
);

// Custom Hook for API calls
const useApi = () => {
  const fetchData = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }, []);

  return { fetchData };
};

const Dashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    topProducts: [],
    lowStockProducts: [],
    customerInsights: {},
    dealData: { topDeals: [], dealPerformance: [], dealStats: {} },
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chartViews, setChartViews] = useState({
    revenue: 'pie',
    customers: 'pie',
    products: 'pie',
    deals: 'pie',
    profitGrowth: 'bar'
  });
  const [profitTimeRange, setProfitTimeRange] = useState('6months');
  const [profitGrowthType, setProfitGrowthType] = useState('monthly');
  const [profitTrend, setProfitTrend] = useState([]);
  const [profitGrowth, setProfitGrowth] = useState([]);
  const [yearOverYearProfit, setYearOverYearProfit] = useState([]);
  const [profitGrowthSummary, setProfitGrowthSummary] = useState({});

  const { fetchData } = useApi();

  // Memoized data calculations
  const combinedMetrics = useMemo(() => {
    const { stats } = dashboardData;
    const productRevenue = stats.totalProductRevenue || 0;
    const dealRevenue = stats.totalDealRevenue || 0;
    const totalRevenue = productRevenue + dealRevenue;
    
    const productCost = stats.totalProductCost || 0;
    const dealCost = stats.totalDealCost || 0;
    const totalCost = productCost + dealCost;
    
    const productProfit = stats.totalProductProfit || 0;
    const dealProfit = stats.totalDealProfit || 0;
    const totalProfit = productProfit + dealProfit;

    return {
      productRevenue,
      productCost,
      productProfit,
      dealRevenue,
      dealCost,
      dealProfit,
      totalRevenue,
      totalCost,
      totalProfit,
      totalProductSold: stats.totalItemsSold - (stats.dealsSold || 0),
      totalInventoryValue: (stats.inventoryValue || 0) + (stats.dealInventoryValue || 0)
    };
  }, [dashboardData.stats]);

  const totalNotificationsCount = useMemo(() => {
    return dashboardData.alerts.filter(alert => !alert.read).length;
  }, [dashboardData.alerts]);

  // API calls
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchData(`${API_BASE}/dashboard/stats?timeRange=${timeRange}`);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, fetchData]);

  // Fetch profit trend data
  const fetchProfitTrend = useCallback(async () => {
    try {
      const data = await fetchData(`${API_BASE}/dashboard/profit-trend?period=${profitTimeRange}`);
      if (data.trend && data.trend.length > 0) {
        setProfitTrend(data.trend);
      } else {
        setProfitTrend([]);
      }
    } catch (error) {
      console.error('Error fetching profit trend:', error);
      setProfitTrend([]);
    }
  }, [profitTimeRange, fetchData]);

  // Fetch detailed profit growth data
  const fetchProfitGrowth = useCallback(async () => {
    try {
      const data = await fetchData(`${API_BASE}/dashboard/profit-growth?period=${profitTimeRange}`);
      if (data.profitGrowth && data.profitGrowth.length > 0) {
        setProfitGrowth(data.profitGrowth);
        setProfitGrowthSummary(data.summary || {});
      } else {
        setProfitGrowth([]);
        setProfitGrowthSummary({});
      }
    } catch (error) {
      console.error('Error fetching profit growth:', error);
      setProfitGrowth([]);
      setProfitGrowthSummary({});
    }
  }, [profitTimeRange, fetchData]);

  // Fetch year-over-year profit growth
  const fetchYearOverYearProfit = useCallback(async () => {
    try {
      const data = await fetchData(`${API_BASE}/dashboard/profit-growth/yoy`);
      if (data.comparison && data.comparison.length > 0) {
        setYearOverYearProfit(data);
      } else {
        setYearOverYearProfit({ comparison: [], summary: {} });
      }
    } catch (error) {
      console.error('Error fetching year-over-year profit growth:', error);
      setYearOverYearProfit({ comparison: [], summary: {} });
    }
  }, [fetchData]);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(), 
      fetchProfitTrend(),
      fetchProfitGrowth(),
      fetchYearOverYearProfit()
    ]);
    setRefreshing(false);
  }, [fetchDashboardData, fetchProfitTrend, fetchProfitGrowth, fetchYearOverYearProfit]);

  const handleChartToggle = useCallback((chartKey, viewType) => {
    setChartViews(prev => ({
      ...prev,
      [chartKey]: viewType
    }));
  }, []);

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
  }, []);

  const handleProfitGrowthTypeChange = useCallback((type) => {
    setProfitGrowthType(type);
  }, []);

  // Effects
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchProfitTrend();
    fetchProfitGrowth();
    fetchYearOverYearProfit();
  }, [fetchProfitTrend, fetchProfitGrowth, fetchYearOverYearProfit]);

  // Chart data preparation using actual backend data
  const chartConfigs = useMemo(() => {
    const { customerInsights, topProducts, dealData } = dashboardData;

    const getDealNames = () => {
      if (dealData.topDeals?.length > 0) {
        return dealData.topDeals.map(deal => deal.dealName || deal.name || `Deal ${deal._id}`);
      }
      return ['No Deal Data'];
    };

    const getDealSalesData = () => {
      if (dealData.topDeals?.length > 0) {
        return dealData.topDeals.map(deal => deal.totalSales || 0);
      }
      return [0];
    };

    const getProductNames = () => {
      if (topProducts?.length > 0) {
        return topProducts.map(product => product.name || `Product ${product._id}`);
      }
      return ['No Product Data'];
    };

    const getProductSalesData = () => {
      if (topProducts?.length > 0) {
        return topProducts.map(product => product.totalSales || 0);
      }
      return [0];
    };

    // Profit Growth Chart Configurations
    const profitGrowthData = {
      monthly: {
        data: {
          labels: profitTrend.map(item => item.period),
          datasets: [{
            label: 'Profit (₹)',
            data: profitTrend.map(item => item.profit),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { 
              display: true, 
              text: `Monthly Profit Trend (${profitTimeRange === '3months' ? '3 Months' : profitTimeRange === '6months' ? '6 Months' : profitTimeRange === '12months' ? '12 Months' : '24 Months'})`,
              font: { size: window.innerWidth < 640 ? 10 : 12 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString();
                },
                font: { size: window.innerWidth < 640 ? 8 : 10 }
              }
            },
            x: {
              ticks: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
            }
          }
        }
      },
      detailed: {
        data: {
          labels: profitGrowth.map(item => item.period),
          datasets: [
            {
              label: 'Profit (₹)',
              data: profitGrowth.map(item => item.profit),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 2,
              type: 'bar',
              yAxisID: 'y'
            },
            {
              label: 'Growth %',
              data: profitGrowth.map(item => item.growthPercentage),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              type: 'line',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: { 
              display: true,
              position: window.innerWidth < 640 ? 'bottom' : 'top',
              labels: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
            },
            title: { 
              display: true, 
              text: `Profit Growth Analysis (${profitTimeRange})`,
              font: { size: window.innerWidth < 640 ? 10 : 12 }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Profit (₹)',
                font: { size: window.innerWidth < 640 ? 8 : 10 }
              },
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString();
                },
                font: { size: window.innerWidth < 640 ? 8 : 10 }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Growth %',
                font: { size: window.innerWidth < 640 ? 8 : 10 }
              },
              grid: {
                drawOnChartArea: false,
              },
              ticks: {
                callback: function(value) {
                  return value + '%';
                },
                font: { size: window.innerWidth < 640 ? 8 : 10 }
              }
            },
            x: {
              ticks: { 
                font: { size: window.innerWidth < 640 ? 8 : 10 },
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      },
      yoy: {
        data: {
          labels: yearOverYearProfit.comparison?.map(item => item.month) || [],
          datasets: [
            {
              label: 'Current Year Profit',
              data: yearOverYearProfit.comparison?.map(item => item.currentYearProfit) || [],
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 2,
            },
            {
              label: 'Previous Year Profit',
              data: yearOverYearProfit.comparison?.map(item => item.previousYearProfit) || [],
              backgroundColor: 'rgba(156, 163, 175, 0.8)',
              borderColor: 'rgb(156, 163, 175)',
              borderWidth: 2,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true,
              position: window.innerWidth < 640 ? 'bottom' : 'top',
              labels: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
            },
            title: { 
              display: true, 
              text: 'Year-over-Year Profit Comparison',
              font: { size: window.innerWidth < 640 ? 10 : 12 }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString();
                },
                font: { size: window.innerWidth < 640 ? 8 : 10 }
              }
            },
            x: {
              ticks: { 
                font: { size: window.innerWidth < 640 ? 8 : 10 },
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      }
    };

    return {
      revenue: {
        pie: {
          data: {
            labels: ['Product Revenue', 'Deal Revenue', 'Total Profit'],
            datasets: [{
              data: [combinedMetrics.productRevenue, combinedMetrics.dealRevenue, combinedMetrics.totalProfit],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(139, 92, 246)', 'rgb(16, 185, 129)'],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                position: window.innerWidth < 640 ? 'bottom' : 'top',
                labels: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              },
              title: { 
                display: true, 
                text: 'Revenue & Profit Breakdown',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            }
          }
        },
        bar: {
          data: {
            labels: ['Product Revenue', 'Deal Revenue', 'Total Cost', 'Total Profit'],
            datasets: [{
              label: 'Amount (₹)',
              data: [combinedMetrics.productRevenue, combinedMetrics.dealRevenue, combinedMetrics.totalCost, combinedMetrics.totalProfit],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(139, 92, 246)', 'rgb(239, 68, 68)', 'rgb(16, 185, 129)'],
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'Revenue & Cost Analysis',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            },
            scales: {
              y: {
                ticks: {
                  callback: function(value) {
                    return '₹' + value.toLocaleString();
                  },
                  font: { size: window.innerWidth < 640 ? 8 : 10 }
                }
              },
              x: {
                ticks: { 
                  font: { size: window.innerWidth < 640 ? 8 : 10 },
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }
        }
      },
      customers: {
        pie: {
          data: {
            labels: ['New Customers', 'Returning Customers'],
            datasets: [{
              data: [customerInsights.newCustomers || 0, customerInsights.repeatBuyers || 0],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                position: window.innerWidth < 640 ? 'bottom' : 'top',
                labels: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              },
              title: { 
                display: true, 
                text: 'Customer Distribution',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            }
          }
        },
        bar: {
          data: {
            labels: ['New Customers', 'Returning Customers'],
            datasets: [{
              label: 'Count',
              data: [customerInsights.newCustomers || 0, customerInsights.repeatBuyers || 0],
              backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
              borderColor: ['rgb(59, 130, 246)', 'rgb(16, 185, 129)'],
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'Customer Distribution',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            },
            scales: {
              y: {
                ticks: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              },
              x: {
                ticks: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              }
            }
          }
        }
      },
      products: {
        pie: {
          data: {
            labels: getProductNames(),
            datasets: [{
              data: getProductSalesData(),
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)', 
                'rgba(16, 185, 129, 0.8)', 
                'rgba(139, 92, 246, 0.8)', 
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(156, 163, 175, 0.8)'
              ],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                position: window.innerWidth < 640 ? 'bottom' : 'top',
                labels: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              },
              title: { 
                display: true, 
                text: 'Top Selling Products',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            }
          }
        },
        bar: {
          data: {
            labels: getProductNames(),
            datasets: [{
              label: 'Units Sold',
              data: getProductSalesData(),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'Top Selling Products',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            },
            scales: {
              y: {
                ticks: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              },
              x: {
                ticks: { 
                  font: { size: window.innerWidth < 640 ? 8 : 10 },
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }
        }
      },
      deals: {
        pie: {
          data: {
            labels: getDealNames(),
            datasets: [{
              data: getDealSalesData(),
              backgroundColor: [
                'rgba(139, 92, 246, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
              ],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { 
                position: window.innerWidth < 640 ? 'bottom' : 'top',
                labels: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              },
              title: { 
                display: true, 
                text: 'Top Performing Deals',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            }
          }
        },
        bar: {
          data: {
            labels: getDealNames(),
            datasets: [{
              label: 'Units Sold',
              data: getDealSalesData(),
              backgroundColor: 'rgba(139, 92, 246, 0.8)',
              borderColor: 'rgb(139, 92, 246)',
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'Top Performing Deals',
                font: { size: window.innerWidth < 640 ? 10 : 12 }
              }
            },
            scales: {
              y: {
                ticks: { font: { size: window.innerWidth < 640 ? 8 : 10 } }
              },
              x: {
                ticks: { 
                  font: { size: window.innerWidth < 640 ? 8 : 10 },
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }
        }
      },
      profitGrowth: profitGrowthData[profitGrowthType] || profitGrowthData.monthly
    };
  }, [dashboardData, combinedMetrics, profitTrend, profitGrowth, yearOverYearProfit, profitTimeRange, profitGrowthType]);

  // Quick actions configuration
  const quickActions = useMemo(() => [
    { to: "/add", icon: faPlus, text: "Add Product", color: "bg-blue-500" },
    { to: "/list", icon: faBoxes, text: "Manage Products", color: "bg-green-500" },
    { to: "/orders", icon: faShoppingCart, text: "View Orders", color: "bg-red-500" },
    { to: "/content-management", icon: faRocket, text: "Content", color: "bg-purple-500" },
  ], []);

  // Profit Growth Summary Cards
  const ProfitSummaryCards = useMemo(() => {
    if (!profitGrowthSummary || Object.keys(profitGrowthSummary).length === 0) {
      return null;
    }

    const {
      totalProfit = 0,
      averageMonthlyProfit = 0,
      totalMonths = 0,
      profitableMonths = 0,
      profitabilityRate = 0,
      bestMonth = null,
      worstMonth = null
    } = profitGrowthSummary;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-5 lg:mb-6">
        <StatCard 
          title="Total Profit" 
          value={`₹${totalProfit.toLocaleString()}`}
          icon={faMoneyBillTrendUp}
          color="bg-green-500"
          subtitle={`${totalMonths} months`}
        />
        <StatCard 
          title="Avg Monthly" 
          value={`₹${averageMonthlyProfit.toLocaleString()}`}
          icon={faChartSimple}
          color="bg-blue-500"
          subtitle={`${profitabilityRate.toFixed(1)}% profitable`}
        />
        <StatCard 
          title="Profitable Months" 
          value={profitableMonths}
          icon={faCalendarWeek}
          color="bg-emerald-500"
          subtitle={`${totalMonths} total`}
        />
        <StatCard 
          title="Best Month" 
          value={bestMonth ? `₹${bestMonth.profit.toLocaleString()}` : 'N/A'}
          icon={faChartLine}
          color="bg-purple-500"
          subtitle={bestMonth ? bestMonth.period : 'No data'}
        />
      </div>
    );
  }, [profitGrowthSummary]);

  // Alerts Modal Component
  const AlertsModal = useCallback(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white sticky top-0">
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            <FontAwesomeIcon icon={faBell} className="text-yellow-500 text-sm sm:text-base lg:text-lg" />
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Notifications</h3>
            <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 lg:px-2 py-0.5 sm:py-1 rounded-full">
              {totalNotificationsCount} new
            </span>
          </div>
          <button onClick={() => setShowAlertsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <FontAwesomeIcon icon={faTimes} className="text-sm sm:text-base" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          {/* Regular Alerts Section */}
          {dashboardData.alerts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {dashboardData.alerts.map(alert => (
                <div key={alert.id} className={`p-2 sm:p-3 lg:p-4 transition-colors ${!alert.read ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start gap-1.5 sm:gap-2 lg:gap-3">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      alert.priority === 'high' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <FontAwesomeIcon 
                        icon={faExclamationTriangle} 
                        className={`text-[10px] sm:text-xs lg:text-sm ${alert.priority === 'high' ? 'text-red-600' : 'text-yellow-600'}`} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 sm:gap-2 mb-0.5">
                        <h4 className={`font-medium text-xs sm:text-sm truncate ${!alert.read ? 'text-yellow-900' : 'text-gray-900'}`}>
                          {alert.title}
                        </h4>
                        {!alert.read && <span className="bg-yellow-500 text-white text-[8px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full whitespace-nowrap">New</span>}
                      </div>
                      <p className={`text-[10px] sm:text-xs mb-0.5 truncate ${!alert.read ? 'text-yellow-800' : 'text-gray-600'}`}>
                        {alert.message}
                      </p>
                      <p className="text-[8px] sm:text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-10 lg:py-12">
              <FontAwesomeIcon icon={faBell} className="text-gray-300 text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4" />
              <p className="text-xs sm:text-sm text-gray-500">No new notifications</p>
            </div>
          )}
        </div>
        <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200 bg-gray-50">
          <button 
            onClick={() => setShowAlertsModal(false)} 
            className="w-full bg-black text-white py-1.5 sm:py-2 lg:py-3 rounded-lg hover:bg-gray-800 transition-colors text-xs sm:text-sm"
          >
            Close Notifications
          </button>
        </div>
      </div>
    </div>
  ), [dashboardData.alerts, totalNotificationsCount]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const { stats, recentOrders, topProducts, lowStockProducts, dealData, customerInsights } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-3 lg:py-4 px-2 sm:px-3 lg:px-4">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-3 sm:mb-4 lg:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-0.5 text-[10px] sm:text-xs lg:text-sm">Welcome back! Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <TimeRangeSelector 
              currentRange={timeRange} 
              onRangeChange={handleTimeRangeChange}
              options={TIME_RANGES}
            />
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <FontAwesomeIcon 
                icon={faSync} 
                className={`text-xs sm:text-sm ${refreshing ? 'animate-spin' : ''}`} 
              />
            </button>
            <button 
              onClick={() => setShowAlertsModal(true)} 
              className="relative p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              title="View notifications"
            >
              <FontAwesomeIcon icon={faBell} className="text-xs sm:text-sm" />
              {totalNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center animate-pulse">
                  {totalNotificationsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
          <StatCard 
            title="Total Revenue" 
            value={`₹${combinedMetrics.totalRevenue?.toLocaleString()}`} 
            subtitle={`P: ₹${combinedMetrics.productRevenue?.toLocaleString()} | D: ₹${combinedMetrics.dealRevenue?.toLocaleString()}`}
            icon={faDollarSign} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Total Cost" 
            value={`₹${combinedMetrics.totalCost?.toLocaleString()}`} 
            subtitle={`P: ₹${combinedMetrics.productCost?.toLocaleString()} | D: ₹${combinedMetrics.dealCost?.toLocaleString()}`}
            icon={faChartLine} 
            color="bg-red-500" 
          />
          <StatCard 
            title="Total Profit" 
            value={`₹${combinedMetrics.totalProfit?.toLocaleString()}`} 
            subtitle={`P: ₹${combinedMetrics.productProfit?.toLocaleString()} | D: ₹${combinedMetrics.dealProfit?.toLocaleString()}`}
            icon={faChartPie} 
            color="bg-blue-500" 
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
          <StatCard 
            title="Active Deals" 
            value={stats.activeDeals || 0} 
            icon={faRocket} 
            color="bg-purple-500" 
          />
          <StatCard 
            title="Deals Sold" 
            value={stats.dealsSold || 0} 
            icon={faFire} 
            color="bg-orange-500" 
          />
          <StatCard 
            title="Total Products" 
            value={stats.totalProducts || 0} 
            icon={faBoxes} 
            color="bg-indigo-500" 
          />
          <StatCard 
            title="Products Sold" 
            value={combinedMetrics.totalProductSold || 0} 
            icon={faShoppingCart} 
            color="bg-blue-500" 
          />
        </div>

        {/* Tertiary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
          <StatCard 
            title="Inventory Value" 
            value={`₹${combinedMetrics.totalInventoryValue?.toLocaleString()}`} 
            subtitle={`P: ₹${stats.inventoryValue?.toLocaleString()} | D: ₹${stats.dealInventoryValue?.toLocaleString()}`}
            icon={faWarehouse} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders || 0} 
            subtitle={`Pending: ${stats.pendingOrders || 0}`}
            icon={faClipboardList} 
            color="bg-yellow-500" 
          />
          <StatCard 
            title="Pending Orders" 
            value={stats.pendingOrders || 0} 
            icon={faClock} 
            color="bg-yellow-500" 
          />
        </div>

        {/* Profit Summary Cards (if available) */}
        {ProfitSummaryCards}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
          {/* Revenue & Profit Chart */}
          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm sm:shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">Revenue & Profit</h3>
              <ChartToggle 
                chartKey="revenue" 
                currentView={chartViews.revenue} 
                onToggle={(view) => handleChartToggle('revenue', view)} 
              />
            </div>
            <div className="h-40 sm:h-48 lg:h-64">
              {chartViews.revenue === 'pie' ? (
                <Doughnut {...chartConfigs.revenue.pie} />
              ) : (
                <Bar {...chartConfigs.revenue.bar} />
              )}
            </div>
          </div>

          {/* Customer Distribution Chart */}
          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm sm:shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">Customer Analytics</h3>
              <ChartToggle 
                chartKey="customers" 
                currentView={chartViews.customers} 
                onToggle={(view) => handleChartToggle('customers', view)} 
              />
            </div>
            <div className="h-40 sm:h-48 lg:h-64">
              {customerInsights.newCustomers > 0 || customerInsights.repeatBuyers > 0 ? (
                chartViews.customers === 'pie' ? (
                  <Pie {...chartConfigs.customers.pie} />
                ) : (
                  <Bar {...chartConfigs.customers.bar} />
                )
              ) : (
                <EmptyState icon={faUsers} message="No customer data available" />
              )}
            </div>
          </div>

          {/* Product Sales Chart */}
          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm sm:shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">Top Selling Products</h3>
              <ChartToggle 
                chartKey="products" 
                currentView={chartViews.products} 
                onToggle={(view) => handleChartToggle('products', view)} 
              />
            </div>
            <div className="h-40 sm:h-48 lg:h-64">
              {topProducts.length > 0 ? (
                chartViews.products === 'pie' ? (
                  <Pie {...chartConfigs.products.pie} />
                ) : (
                  <Bar {...chartConfigs.products.bar} />
                )
              ) : (
                <EmptyState icon={faChartBar} message="No product sales data" />
              )}
            </div>
          </div>

          {/* Deal Performance Chart */}
          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm sm:shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">Top Performing Deals</h3>
              <ChartToggle 
                chartKey="deals" 
                currentView={chartViews.deals} 
                onToggle={(view) => handleChartToggle('deals', view)} 
              />
            </div>
            <div className="h-40 sm:h-48 lg:h-64">
              {dealData.topDeals && dealData.topDeals.length > 0 ? (
                chartViews.deals === 'pie' ? (
                  <Pie {...chartConfigs.deals.pie} />
                ) : (
                  <Bar {...chartConfigs.deals.bar} />
                )
              ) : (
                <EmptyState icon={faRocket} message="No deal performance data" />
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm sm:shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">Recent Orders</h3>
              <NavLink to="/orders" className="text-blue-600 hover:text-blue-700 text-[10px] sm:text-xs font-medium">
                View all →
              </NavLink>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <div key={order._id} className="flex items-center justify-between p-1.5 sm:p-2 bg-gray-50 rounded hover:bg-blue-50 transition-colors">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-blue-100 rounded-full flex items-center justify-center mr-1 sm:mr-2 flex-shrink-0">
                        <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-[8px] sm:text-xs" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-[10px] sm:text-xs truncate">#{order._id?.toString().slice(-6)}</p>
                        <div className="flex items-center text-[8px] sm:text-xs text-gray-600">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[6px] sm:text-xs mr-0.5 flex-shrink-0" />
                          <span className="truncate">{order.user?.location || 'Unknown'}</span>
                        </div>
                        <p className="text-[8px] sm:text-xs text-gray-500 truncate">
                          {order.items?.slice(0, 1).map(item => `${item.quantity}x ${item.name}`).join(', ')}
                          {order.items?.length > 1 && ` +${order.items.length - 1}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-1 sm:ml-2 flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-[10px] sm:text-xs">₹{order.amount}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={faShoppingCart} message="No recent orders" />
              )}
            </div>
          </div>

          {/* Low Stock Section */}
          <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm sm:shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900">Low Stock Alert</h3>
              <NavLink to="/list" className="text-blue-600 hover:text-blue-700 text-[10px] sm:text-xs font-medium">
                Manage Inventory →
              </NavLink>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-1.5 sm:p-2 bg-red-50 rounded hover:bg-red-100 transition-colors">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-red-100 rounded-full flex items-center justify-center mr-1 sm:mr-2 flex-shrink-0">
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-[8px] sm:text-xs" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-[10px] sm:text-xs truncate">{product.name}</p>
                        <p className="text-[8px] sm:text-xs text-gray-600 truncate">{product.category} • Ideal: {product.idealStock}</p>
                      </div>
                    </div>
                    <div className="text-right ml-1 sm:ml-2 flex-shrink-0">
                      <StockBadge stock={product.quantity} />
                      <p className="text-[8px] sm:text-xs text-gray-600">₹{(product.quantity * product.cost).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={faBoxes} message="All products are well stocked" />
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-sm sm:shadow-lg border border-gray-100">
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3">
            {quickActions.map((action, i) => (
              <NavLink 
                key={i} 
                to={action.to} 
                className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-gray-50 transition-all hover:bg-gray-100 hover:shadow-sm"
              >
                <div className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <FontAwesomeIcon icon={action.icon} className="text-white text-[8px] sm:text-xs" />
                </div>
                <span className="font-medium text-gray-900 text-[8px] sm:text-xs truncate">{action.text}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Notifications Modal */}
        {showAlertsModal && <AlertsModal />}
      </div>
    </div>
  );
};

export default Dashboard;