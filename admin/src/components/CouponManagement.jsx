import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTicketAlt,
  faPlus,
  faTrash,
  faToggleOn,
  faToggleOff,
  faCopy,
  faCalendarAlt,
  faPercent,
  faMoneyBillWave,
  faSearch,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { backendUrl } from "../App";
import { useAuth } from "../context/AuthContext";

const CouponManagement = () => {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    expiryDate: "",
    usageLimit: "",
    isActive: true,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/coupon/list`, {
        headers: { token },
      });
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
      } else {
        toast.error(res.data.message || "Failed to load promo codes");
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCoupons();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.discountValue) {
      toast.error("Please enter a code and discount value");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : 0,
        expiryDate: formData.expiryDate || null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 0,
        isActive: formData.isActive,
      };

      const res = await axios.post(`${backendUrl}/api/coupon/add`, payload, {
        headers: { token },
      });

      if (res.data.success) {
        toast.success("Promo code created successfully!");
        setShowAddModal(false);
        setFormData({
          code: "",
          description: "",
          discountType: "percentage",
          discountValue: "",
          minOrderAmount: "",
          maxDiscountAmount: "",
          expiryDate: "",
          usageLimit: "",
          isActive: true,
        });
        fetchCoupons();
      } else {
        toast.error(res.data.message || "Failed to create promo code");
      }
    } catch (err) {
      console.error("Error adding coupon:", err);
      toast.error(err.response?.data?.message || "Failed to create promo code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/coupon/toggle-status`,
        { id, isActive: !currentStatus },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setCoupons((prev) =>
          prev.map((c) => (c._id === id ? { ...c, isActive: !currentStatus } : c))
        );
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to update promo code status");
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${code}"?`)) {
      return;
    }

    try {
      const res = await axios.post(
        `${backendUrl}/api/coupon/delete`,
        { id },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(`Promo code "${code}" deleted`);
        setCoupons((prev) => prev.filter((c) => c._id !== id));
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to delete promo code");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied to clipboard!`);
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date() > new Date(expiryDate);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faTicketAlt} className="text-[#587a3b]" />
            Promo Codes & Discounts
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage discount codes for customers to use during checkout.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#587a3b] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#486530] transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faPlus} />
          Create Promo Code
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search promo codes..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b]"
          />
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Total: {coupons.length} | Active: {coupons.filter((c) => c.isActive && !isExpired(c.expiryDate)).length}
        </div>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#587a3b] border-t-transparent rounded-full mb-3"></div>
          <p>Loading promo codes...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FontAwesomeIcon icon={faTicketAlt} className="text-gray-300 text-4xl mb-3" />
          <p className="text-gray-600 font-medium">No promo codes found</p>
          <p className="text-gray-400 text-xs mt-1">
            {searchTerm ? "Try adjusting your search query." : "Click 'Create Promo Code' to add your first discount code."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Code & Description</th>
                <th className="py-3.5 px-4 font-semibold">Discount</th>
                <th className="py-3.5 px-4 font-semibold">Min Order / Cap</th>
                <th className="py-3.5 px-4 font-semibold">Usage</th>
                <th className="py-3.5 px-4 font-semibold">Expiry</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon.expiryDate);
                const limitReached = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;

                return (
                  <tr key={coupon._id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Code */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded text-xs tracking-wider border border-gray-200">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          title="Copy Code"
                          className="text-gray-400 hover:text-gray-700 p-1 transition"
                        >
                          <FontAwesomeIcon icon={faCopy} className="text-xs" />
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{coupon.description}</p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {coupon.discountType === "percentage" ? (
                        <span className="text-[#587a3b] font-bold">
                          {coupon.discountValue}% OFF
                        </span>
                      ) : (
                        <span className="text-[#587a3b] font-bold">
                          Rs. {coupon.discountValue.toLocaleString()} OFF
                        </span>
                      )}
                    </td>

                    {/* Conditions */}
                    <td className="py-4 px-4 text-xs text-gray-600">
                      <div>Min: {coupon.minOrderAmount > 0 ? `Rs. ${coupon.minOrderAmount.toLocaleString()}` : "None"}</div>
                      {coupon.discountType === "percentage" && coupon.maxDiscountAmount > 0 && (
                        <div className="text-gray-400">Cap: Rs. {coupon.maxDiscountAmount.toLocaleString()}</div>
                      )}
                    </td>

                    {/* Usage */}
                    <td className="py-4 px-4 text-xs">
                      <span className="font-medium text-gray-800">{coupon.usedCount || 0}</span>
                      <span className="text-gray-400">
                        {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit} uses` : " uses (Unlimited)"}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="py-4 px-4 text-xs">
                      {coupon.expiryDate ? (
                        <span className={expired ? "text-red-500 font-medium" : "text-gray-600"}>
                          {new Date(coupon.expiryDate).toLocaleDateString()}
                          {expired && " (Expired)"}
                        </span>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                          <FontAwesomeIcon icon={faTimesCircle} /> Expired
                        </span>
                      ) : limitReached ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                          Limit Reached
                        </span>
                      ) : coupon.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          <FontAwesomeIcon icon={faCheckCircle} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                          title={coupon.isActive ? "Deactivate" : "Activate"}
                          className={`p-1.5 rounded transition ${
                            coupon.isActive
                              ? "text-[#587a3b] hover:text-[#486530]"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={coupon.isActive ? faToggleOn : faToggleOff}
                            className="text-xl"
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                          title="Delete Code"
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded transition"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Promo Code Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faTicketAlt} className="text-[#587a3b]" />
                Create New Promo Code
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCoupon} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Promo Code *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. WELCOME10, GLOW20"
                  className="w-full px-3.5 py-2.5 text-sm font-mono uppercase font-bold border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. 10% discount on all natural skincare"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Discount Type *
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b] bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder={formData.discountType === "percentage" ? "10 (for 10%)" : "200 (for Rs. 200)"}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b]"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Min Order Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    placeholder="0 (No minimum)"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Max Discount Cap (Rs.)
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    min="0"
                    disabled={formData.discountType === "fixed"}
                    value={formData.maxDiscountAmount}
                    onChange={handleInputChange}
                    placeholder="0 (No cap)"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b] disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Expiry Date & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Max Total Uses (Optional)
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    min="0"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="0 (Unlimited)"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#587a3b]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#587a3b] rounded focus:ring-[#587a3b] accent-[#587a3b]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Activate this promo code immediately
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#587a3b] text-white text-sm font-medium rounded-lg hover:bg-[#486530] transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
