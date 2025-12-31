// Banner.jsx - Updated for linked desktop/mobile banners
import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';

// API service configuration
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 shadow-lg z-50 flex items-center gap-3 max-w-md`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="text-white hover:text-gray-200">
        ✕
      </button>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, banner }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Banner</h3>
              <p className="text-gray-600">This will delete both desktop and mobile images.</p>
            </div>
          </div>
          
          {banner && (
            <div className="bg-gray-50 p-4 mb-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium mb-1">Desktop:</p>
                <img 
                  src={banner.desktopImageUrl} 
                  alt="Desktop preview" 
                  className="h-20 w-full object-contain border"
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Mobile:</p>
                <img 
                  src={banner.mobileImageUrl} 
                  alt="Mobile preview" 
                  className="h-20 w-full object-contain border"
                />
              </div>
            </div>
          )}

          <p className="text-gray-700 mb-6">
            Are you sure you want to delete this banner?
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Banner Manager Component
export const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, banner: null, index: null });
  const previewUrlsRef = useRef([]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Load banners from backend
  const loadBanners = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/banners');
      
      if (response.data.success) {
        const sortedBanners = response.data.data.sort((a, b) => a.order - b.order);
        const bannersWithPreviews = sortedBanners.map(banner => ({
          ...banner,
          desktopPreview: banner.desktopImageUrl,
          mobilePreview: banner.mobileImageUrl,
          desktopFile: null,
          mobileFile: null,
          isEditing: false
        }));
        setBanners(bannersWithPreviews);
        showToast('Banners loaded successfully', 'success');
      }
    } catch (error) {
      showToast('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save individual banner
  const handleSaveBanner = async (bannerData) => {
    try {
      const formData = new FormData();
      
      // Append all fields to formData
      formData.append('title', bannerData.title || '');
      formData.append('linkUrl', bannerData.linkUrl || '');
      formData.append('openInNewTab', bannerData.openInNewTab || false);
      formData.append('isActive', bannerData.isActive !== false);
      formData.append('order', bannerData.order || 0);

      // Append image files if they exist
      if (bannerData.desktopFile) {
        formData.append('desktopImage', bannerData.desktopFile);
      }
      if (bannerData.mobileFile) {
        formData.append('mobileImage', bannerData.mobileFile);
      }

      let response;
      if (bannerData._id) {
        response = await api.put(`/api/banners/${bannerData._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/api/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to save banner');
    }
  };

  // Delete banner
  const handleDeleteBanner = async (bannerId, index) => {
    try {
      if (bannerId) {
        await api.delete(`/api/banners/${bannerId}`);
      }
      
      const updatedBanners = banners.filter((_, i) => i !== index);
      setBanners(updatedBanners);
      showToast('Banner deleted successfully', 'success');
    } catch (error) {
      throw new Error('Failed to delete banner');
    }
  };

  // Add new banner
  const handleAddBanner = () => {
    const newOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0;
    
    const newBanner = {
      title: '',
      linkUrl: '',
      openInNewTab: false,
      desktopFile: null,
      mobileFile: null,
      desktopPreview: '',
      mobilePreview: '',
      isActive: true,
      order: newOrder,
      isEditing: true
    };

    setBanners([...banners, newBanner]);
    showToast('New banner added - Upload both desktop and mobile images', 'info');
  };

  // Save all banners
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      // Save each banner
      for (let i = 0; i < banners.length; i++) {
        const banner = banners[i];
        await handleSaveBanner(banner);
      }
      
      // Reload banners
      await loadBanners();
      showToast('All banners saved successfully', 'success');
      
    } catch (error) {
      showToast('Failed to save banners', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete modal handlers
  const openDeleteModal = (index) => {
    setDeleteModal({
      isOpen: true,
      banner: banners[index],
      index: index
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, banner: null, index: null });
  };

  const confirmDeleteBanner = async () => {
    const { index } = deleteModal;
    
    try {
      await handleDeleteBanner(deleteModal.banner._id, index);
      closeDeleteModal();
    } catch (error) {
      showToast('Error deleting banner', 'error');
      closeDeleteModal();
    }
  };

  // Toggle edit mode
  const toggleEditMode = (index) => {
    const updated = [...banners];
    updated[index].isEditing = !updated[index].isEditing;
    setBanners(updated);
  };

  // Reorder banners
  const moveBannerUp = (index) => {
    if (index === 0) return;
    
    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    
    // Update orders
    updated.forEach((b, i) => {
      b.order = i;
    });
    
    setBanners(updated);
    showToast('Banner order updated', 'info');
  };

  const moveBannerDown = (index) => {
    if (index === banners.length - 1) return;
    
    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    
    // Update orders
    updated.forEach((b, i) => {
      b.order = i;
    });
    
    setBanners(updated);
    showToast('Banner order updated', 'info');
  };

  // Load banners on component mount
  useEffect(() => {
    loadBanners();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">
          Loading banners...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteBanner}
        banner={deleteModal.banner}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Banner Management</h1>
        <p className="text-gray-600 mt-1">
          {banners.length} banner{banners.length !== 1 ? 's' : ''} total
          <span className="text-xs text-gray-500 ml-2">
            (Each banner contains both desktop & mobile images)
          </span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAddBanner}
          className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          + Add New Banner
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-black text-white px-4 py-2 hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Save All Banners'}
        </button>
      </div>

      {/* Banner List */}
      <div className="space-y-6">
        {banners.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No banners created yet</p>
            <p className="text-gray-400 text-sm mt-1">Each banner requires both desktop and mobile images</p>
            <button
              onClick={handleAddBanner}
              className="mt-4 bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              Create Your First Banner
            </button>
          </div>
        ) : (
          banners.map((banner, index) => (
            <BannerCard
              key={banner._id || `banner-${index}`}
              banner={banner}
              index={index}
              banners={banners}
              setBanners={setBanners}
              previewUrlsRef={previewUrlsRef}
              setSelectedImage={setSelectedImage}
              onRemove={() => openDeleteModal(index)}
              onSave={handleSaveBanner}
              onReload={loadBanners}
              onToggleEdit={() => toggleEditMode(index)}
              onMoveUp={() => moveBannerUp(index)}
              onMoveDown={() => moveBannerDown(index)}
              showToast={showToast}
            />
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 p-2 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Banner Card Component
const BannerCard = ({ 
  banner, 
  index, 
  banners, 
  setBanners, 
  previewUrlsRef, 
  setSelectedImage, 
  onRemove,
  onSave,
  onReload,
  onToggleEdit,
  onMoveUp,
  onMoveDown,
  showToast
}) => {
  const [isActive, setIsActive] = useState(banner.isActive !== false);
  const [saving, setSaving] = useState(false);
  const [linkUrl, setLinkUrl] = useState(banner.linkUrl || '');
  const [openInNewTab, setOpenInNewTab] = useState(banner.openInNewTab || false);
  const [title, setTitle] = useState(banner.title || '');

  const handleImageChange = (type, file) => {
    if (!file) return;

    const updated = [...banners];

    // Remove old preview if exists
    const old = updated[index]?.[`${type}Preview`];
    if (old && old.startsWith('blob:')) {
      URL.revokeObjectURL(old);
      previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== old);
    }

    // Create new preview
    const preview = URL.createObjectURL(file);
    previewUrlsRef.current.push(preview);

    updated[index] = {
      ...updated[index],
      [`${type}File`]: file,
      [`${type}Preview`]: preview,
    };

    setBanners(updated);
  };

  const removeImage = (type) => {
    const updated = [...banners];
    const old = updated[index]?.[`${type}Preview`];
    if (old && old.startsWith('blob:')) {
      URL.revokeObjectURL(old);
      previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== old);
    }

    updated[index] = {
      ...updated[index],
      [`${type}File`]: null,
      [`${type}Preview`]: "",
    };

    setBanners(updated);
  };

  const handleActiveToggle = (checked) => {
    setIsActive(checked);
    const updated = [...banners];
    updated[index].isActive = checked;
    setBanners(updated);
  };

  const handleSaveSingle = async () => {
    try {
      setSaving(true);
      
      const bannerData = {
        ...banners[index],
        title: title,
        linkUrl: linkUrl,
        openInNewTab: openInNewTab,
        isActive: isActive,
        order: index
      };
      
      const result = await onSave(bannerData);
      
      if (result && result.data) {
        // Update local state
        const updated = [...banners];
        updated[index] = {
          ...result.data,
          desktopPreview: result.data.desktopImageUrl,
          mobilePreview: result.data.mobileImageUrl,
          desktopFile: null,
          mobileFile: null,
          isEditing: false
        };
        setBanners(updated);
        
        showToast('Banner saved successfully', 'success');
        
        // Reload all banners
        if (onReload) {
          setTimeout(onReload, 1000);
        }
      }
    } catch (error) {
      showToast('Error saving banner: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasBothImages = () => {
    const hasDesktop = banner.desktopPreview || banner.desktopImageUrl;
    const hasMobile = banner.mobilePreview || banner.mobileImageUrl;
    return hasDesktop && hasMobile;
  };

  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Order: {index + 1}</span>
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="bg-gray-200 text-gray-700 p-1 hover:bg-gray-300 disabled:opacity-30 text-xs"
              >
                ↑
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === banners.length - 1}
                className="bg-gray-200 text-gray-700 p-1 hover:bg-gray-300 disabled:opacity-30 text-xs"
              >
                ↓
              </button>
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => handleActiveToggle(e.target.checked)}
              className="border-gray-300"
            />
            <span className="text-sm text-gray-600">Active</span>
          </label>
          
          <span className={`px-2 py-1 text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>

          {!hasBothImages() && banner.isEditing && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800">
              Need both images
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={banner.isEditing ? handleSaveSingle : onToggleEdit}
            disabled={saving || (banner.isEditing && !hasBothImages() && !banner._id)}
            className={`flex items-center gap-1 px-3 py-2 ${banner.isEditing ? 'bg-black text-white disabled:opacity-50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {saving ? 'Saving...' : banner.isEditing ? 'Save' : 'Edit'}
          </button>
          <button
            onClick={onRemove}
            className="bg-red-600 text-white px-3 py-2 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {banner.isEditing ? (
          /* Edit Mode */
          <div className="space-y-6">
            {/* Title (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Summer Sale"
                className="w-full p-2 border border-gray-300"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Image Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desktop Image * <span className="text-xs text-gray-500">(1920x600px recommended)</span>
                </label>
                <div className="space-y-3">
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className="text-3xl text-gray-400 mb-2">🖥️</span>
                        <p className="text-sm text-gray-500">Desktop Image</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageChange('desktop', file);
                        }}
                      />
                    </label>
                  </div>

                  {(banner.desktopPreview || banner.desktopImageUrl) && (
                    <div className="relative">
                      <img
                        src={banner.desktopPreview || banner.desktopImageUrl}
                        alt="Desktop preview"
                        className="h-32 w-full object-contain border cursor-pointer"
                        onClick={() => setSelectedImage(banner.desktopPreview || banner.desktopImageUrl)}
                      />
                      <button
                        onClick={() => removeImage('desktop')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 text-xs hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Image * <span className="text-xs text-gray-500">(600x800px recommended)</span>
                </label>
                <div className="space-y-3">
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className="text-3xl text-gray-400 mb-2">📱</span>
                        <p className="text-sm text-gray-500">Mobile Image</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageChange('mobile', file);
                        }}
                      />
                    </label>
                  </div>

                  {(banner.mobilePreview || banner.mobileImageUrl) && (
                    <div className="relative">
                      <img
                        src={banner.mobilePreview || banner.mobileImageUrl}
                        alt="Mobile preview"
                        className="h-32 w-full object-contain border cursor-pointer"
                        onClick={() => setSelectedImage(banner.mobilePreview || banner.mobileImageUrl)}
                      />
                      <button
                        onClick={() => removeImage('mobile')}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 text-xs hover:bg-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Link Settings */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="/shop or https://example.com"
                  className="w-full p-2 border border-gray-300"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  className="border-gray-300"
                />
                <span className="text-sm text-gray-600">Open link in new tab</span>
              </label>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            {/* Title */}
            {title && (
              <div>
                <span className="font-medium">Title:</span>
                <span className="ml-2">{title}</span>
              </div>
            )}

            {/* Banner Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Desktop Version:</p>
                <div className="border border-gray-300">
                  {banner.desktopImageUrl ? (
                    <img
                      src={banner.desktopImageUrl}
                      alt="Desktop banner"
                      className="w-full h-48 object-contain cursor-pointer"
                      onClick={() => setSelectedImage(banner.desktopImageUrl)}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No desktop image</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Mobile Version:</p>
                <div className="border border-gray-300">
                  {banner.mobileImageUrl ? (
                    <img
                      src={banner.mobileImageUrl}
                      alt="Mobile banner"
                      className="w-full h-48 object-contain cursor-pointer"
                      onClick={() => setSelectedImage(banner.mobileImageUrl)}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No mobile image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Banner Details */}
            <div className="space-y-2 text-sm">
              {linkUrl && (
                <div>
                  <span className="font-medium">Link:</span>
                  <a 
                    href={linkUrl} 
                    target={openInNewTab ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    {linkUrl}
                    {openInNewTab && ' (new tab)'}
                  </a>
                </div>
              )}
              
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Frontend Banner Display Component
export const BannerDisplay = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/banners/active');
        if (response.data.success) {
          const sortedBanners = response.data.data.sort((a, b) => a.order - b.order);
          setBanners(sortedBanners);
        }
      } catch (error) {
        console.error('Error loading banners:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Auto-rotate banners if multiple
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  if (loading) {
    return (
      <div className="w-full bg-gray-200 animate-pulse" style={{ height: '400px' }}></div>
    );
  }

  if (banners.length === 0) {
    return null; // Don't show anything if no banners
  }

  const currentBanner = banners[currentIndex];

  // Check if on mobile or desktop
  const isMobile = window.innerWidth < 768;
  const imageUrl = isMobile ? currentBanner.mobileImageUrl : currentBanner.desktopImageUrl;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Banner Image */}
      {currentBanner.linkUrl ? (
        <a 
          href={currentBanner.linkUrl}
          target={currentBanner.openInNewTab ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={imageUrl}
            alt="Banner"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '600px' }}
          />
        </a>
      ) : (
        <img
          src={imageUrl}
          alt="Banner"
          className="w-full h-auto object-cover"
          style={{ maxHeight: '600px' }}
        />
      )}

      {/* Navigation Dots for multiple banners */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white scale-110' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCard;