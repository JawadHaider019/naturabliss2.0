import React, { useEffect, useState } from "react";

// Simple toast component
const Toast = ({ message, type = "success", onClose }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const OtherTab = () => {
  const [deliverySettings, setDeliverySettings] = useState({
    mode: "fixed",
    fixedCharge: 0,
    enableFreeDelivery: false,
    freeDeliveryAbove: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // API base URL - use the same as your dashboard
  const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Close toast manually
  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/delivery-settings`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setDeliverySettings({
          mode: data.mode || "fixed",
          fixedCharge: data.fixedCharge || 0,
          enableFreeDelivery: Boolean(data.enableFreeDelivery),
          freeDeliveryAbove: data.freeDeliveryAbove || 0,
        });
        showToast("Delivery settings loaded successfully", "success");
      } catch (err) {
        console.error("Error fetching delivery settings:", err);
        showToast("Using default delivery settings", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [API_BASE]);

  // Save/update settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/delivery-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliverySettings),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      showToast(data.message || "Delivery settings saved successfully!", "success");
    } catch (err) {
      console.error("Error saving delivery settings:", err);
      showToast("Failed to save delivery settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-xl space-y-6 max-w-3xl">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast}
        />
      )}

      {/* Delivery Settings */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Delivery & Shipping Settings</h3>
          <p className="text-sm text-gray-500">Configure standard shipping charges and optional free delivery threshold.</p>
        </div>

        {/* Fixed Charges Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Standard Delivery Charges (Rs) *
          </label>
          <input
            type="number"
            min="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
            value={deliverySettings.fixedCharge}
            onChange={(e) =>
              setDeliverySettings({
                ...deliverySettings,
                fixedCharge: parseInt(e.target.value) || 0,
              })
            }
            placeholder="e.g. 250"
          />
          <p className="text-xs text-gray-500 mt-1">
            Standard delivery fee charged to customers for regular orders.
          </p>
        </div>

        {/* Free Delivery Toggle Box */}
        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Free Delivery Option</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Allow customers to get free shipping when their order reaches a specific amount.
              </p>
            </div>
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() =>
                setDeliverySettings({
                  ...deliverySettings,
                  enableFreeDelivery: !deliverySettings.enableFreeDelivery,
                })
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                deliverySettings.enableFreeDelivery ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  deliverySettings.enableFreeDelivery ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* If Free Delivery is Enabled */}
          {deliverySettings.enableFreeDelivery ? (
            <div className="pt-3 border-t border-gray-200 animate-in fade-in duration-200 space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Minimum Order Amount for Free Delivery (Rs) *
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-colors"
                value={deliverySettings.freeDeliveryAbove}
                onChange={(e) =>
                  setDeliverySettings({
                    ...deliverySettings,
                    freeDeliveryAbove: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="e.g. 2000"
              />
              <p className="text-xs text-green-700 font-medium">
                ✓ Orders of Rs. {deliverySettings.freeDeliveryAbove || 0} or more will automatically receive free shipping.
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Free delivery is currently OFF.</span> Standard fee of Rs. {deliverySettings.fixedCharge} will apply to all orders regardless of cart total.
            </div>
          )}
        </div>

        {/* Settings Live Preview */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 mb-2">Live Rules Summary:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Standard Delivery Charge: <span className="font-bold">Rs. {deliverySettings.fixedCharge}</span></p>
            <p>
              • Free Delivery Status:{" "}
              {deliverySettings.enableFreeDelivery ? (
                <span className="font-bold text-green-700">
                  ON (Free on orders above Rs. {deliverySettings.freeDeliveryAbove})
                </span>
              ) : (
                <span className="font-bold text-red-600">OFF (Disabled)</span>
              )}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </div>
          ) : (
            "Save Delivery Settings"
          )}
        </button>
      </div>
    </div>
  );
};

export default OtherTab;