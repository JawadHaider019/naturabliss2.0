import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFolder, 
  faFolderTree, 
  faEdit, 
  faTrash, 
  faCheck, 
  faTimes, 
  faPlus,
  faTag,
  faTags,
  faExclamationTriangle,
  faImage,
  faUpload
} from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

// Toast Component
const Toast = ({ message, type = 'error', onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-xs sm:max-w-md md:min-w-80 mx-2 sm:mx-0`}>
      <span className="text-sm sm:text-base">{message}</span>
      <button 
        onClick={onClose}
        className="ml-3 text-white hover:text-gray-200 flex-shrink-0"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, itemType, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm sm:max-w-md w-full mx-2">
        <div className="flex items-center p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-shrink-0">
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              className="text-yellow-500 text-lg sm:text-xl mr-3" 
            />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Confirm Deletion
          </h3>
        </div>
        
        <div className="p-4 sm:p-6">
          <p className="text-gray-700 mb-1 text-sm sm:text-base">
            Are you sure you want to delete this {itemType}?
          </p>
          {itemName && (
            <p className="text-gray-900 font-medium text-sm sm:text-base">
              "{itemName}"
            </p>
          )}
          <p className="text-red-600 text-xs sm:text-sm mt-2">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center text-sm sm:text-base"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2 text-xs sm:text-sm" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoriesTab = ({ categories: propCategories, setCategories: propSetCategories }) => {
  const [categories, setCategories] = useState([]);
  const [dealTypes, setDealTypes] = useState([]);
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    parentId: '', 
    type: 'category', 
    description: '',
    imageFile: null,
    imagePreview: '' 
  });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemType: '',
    itemName: '',
    onConfirm: null
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Fetch data from backend
  useEffect(() => {
    fetchCategories();
    fetchDealTypes();
  }, []);

  // Cleanup blob URLs on unmount or change
  useEffect(() => {
    return () => {
      if (newCategory.imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(newCategory.imagePreview);
      }
      if (editingItem?.imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(editingItem.imagePreview);
      }
    };
  }, [newCategory.imagePreview, editingItem?.imagePreview]);

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 3000);
  };

  const showConfirmation = (itemType, itemName, onConfirm) => {
    setConfirmationModal({
      isOpen: true,
      itemType,
      itemName,
      onConfirm: () => {
        setConfirmationModal({ isOpen: false, itemType: '', itemName: '', onConfirm: null });
        onConfirm();
      }
    });
  };

  const closeConfirmation = () => {
    setConfirmationModal({ isOpen: false, itemType: '', itemName: '', onConfirm: null });
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
      if (propSetCategories) {
        propSetCategories(data);
      }
    } catch (error) {
      showToast('Error fetching categories');
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDealTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/deal-types`);
      if (!response.ok) throw new Error('Failed to fetch deal types');
      const data = await response.json();
      setDealTypes(data);
    } catch (error) {
      showToast('Error fetching deal types');
      console.error('Error fetching deal types:', error);
    }
  };

  const handleNewImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (newCategory.imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(newCategory.imagePreview);
      }
      setNewCategory(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleRemoveNewImage = () => {
    if (newCategory.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(newCategory.imagePreview);
    }
    setNewCategory(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (editingItem?.imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(editingItem.imagePreview);
      }
      setEditingItem(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleRemoveEditImage = () => {
    if (editingItem?.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editingItem.imagePreview);
    }
    setEditingItem(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: '',
      image: '' // marks for removal in backend
    }));
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    if (newCategory.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(newCategory.imagePreview);
    }
    if (editingItem?.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editingItem.imagePreview);
    }
    setNewCategory({ 
      name: '', 
      parentId: '', 
      type: 'category', 
      description: '', 
      imageFile: null, 
      imagePreview: '' 
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (editFileInputRef.current) editFileInputRef.current.value = '';
    setEditingItem(null);
  };

  // Category Functions
  const addCategory = async () => {
    if (newCategory.name.trim() === '') {
      showToast('Please enter a name');
      return;
    }
    
    setLoading(true);
    
    try {
      if (newCategory.type === 'dealType') {
        // Add new deal type
        const response = await fetch(`${API_BASE_URL}/deal-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCategory.name.trim(),
            description: newCategory.description || ''
          })
        });
        
        if (response.ok) {
          const newDealType = await response.json();
          setDealTypes(prev => [...prev, newDealType]);
          resetForm();
          showToast('Deal type created successfully!', 'success');
        } else {
          const errorData = await response.json();
          showToast(errorData.error || 'Failed to create deal type');
        }
      } else {
        if (newCategory.parentId) {
          // Add as subcategory
          const response = await fetch(`${API_BASE_URL}/categories/${newCategory.parentId}/subcategories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCategory.name.trim() })
          });
          
          if (response.ok) {
            await fetchCategories();
            resetForm();
            showToast('Subcategory created successfully!', 'success');
          } else {
            const errorData = await response.json();
            showToast(errorData.error || 'Failed to create subcategory');
          }
        } else {
          // Add as main category (supports image upload)
          let response;
          if (newCategory.imageFile) {
            const formData = new FormData();
            formData.append('name', newCategory.name.trim());
            formData.append('image', newCategory.imageFile);
            response = await fetch(`${API_BASE_URL}/categories`, {
              method: 'POST',
              body: formData
            });
          } else {
            response = await fetch(`${API_BASE_URL}/categories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newCategory.name.trim() })
            });
          }
          
          if (response.ok) {
            const newCat = await response.json();
            setCategories(prev => {
              const updated = [...prev, newCat];
              if (propSetCategories) propSetCategories(updated);
              return updated;
            });
            resetForm();
            showToast('Category created successfully!', 'success');
          } else {
            const errorData = await response.json();
            showToast(errorData.error || 'Failed to create category');
          }
        }
      }
    } catch (error) {
      showToast('Network error occurred');
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async () => {
    if (!editingItem || editingItem.name.trim() === '') {
      showToast('Please enter a name');
      return;
    }
    
    setLoading(true);
    
    try {
      if (editingItem.type === 'dealType') {
        const response = await fetch(`${API_BASE_URL}/deal-types/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingItem.name.trim(),
            description: editingItem.description || ''
          })
        });
        
        if (response.ok) {
          await fetchDealTypes();
          resetForm();
          showToast('Deal type updated successfully!', 'success');
        } else {
          const errorData = await response.json();
          showToast(errorData.error || 'Failed to update deal type');
        }
      } else if (editingItem.type === 'subcategory') {
        const response = await fetch(`${API_BASE_URL}/categories/${editingItem.parentId}/subcategories/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editingItem.name.trim() })
        });
        
        if (response.ok) {
          await fetchCategories();
          resetForm();
          showToast('Subcategory updated successfully!', 'success');
        } else {
          const errorData = await response.json();
          showToast(errorData.error || 'Failed to update subcategory');
        }
      } else {
        // Update main category
        let response;
        if (editingItem.imageFile) {
          const formData = new FormData();
          formData.append('name', editingItem.name.trim());
          formData.append('image', editingItem.imageFile);
          response = await fetch(`${API_BASE_URL}/categories/${editingItem._id}`, {
            method: 'PUT',
            body: formData
          });
        } else {
          response = await fetch(`${API_BASE_URL}/categories/${editingItem._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: editingItem.name.trim(),
              image: editingItem.imagePreview || '' // retains or clears image
            })
          });
        }
        
        if (response.ok) {
          await fetchCategories();
          resetForm();
          showToast('Category updated successfully!', 'success');
        } else {
          const errorData = await response.json();
          showToast(errorData.error || 'Failed to update category');
        }
      }
    } catch (error) {
      showToast('Network error occurred');
      console.error('Error updating item:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id, type, parentId = null, itemName = '') => {
    showConfirmation(type, itemName, async () => {
      setLoading(true);
      
      try {
        if (type === 'dealType') {
          const response = await fetch(`${API_BASE_URL}/deal-types/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            setDealTypes(prev => prev.filter(deal => deal._id !== id));
            showToast('Deal type deleted successfully!', 'success');
          } else {
            const errorData = await response.json();
            showToast(errorData.error || 'Failed to delete deal type');
          }
        } else if (type === 'subcategory' && parentId) {
          const response = await fetch(`${API_BASE_URL}/categories/${parentId}/subcategories/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            await fetchCategories();
            showToast('Subcategory deleted successfully!', 'success');
          } else {
            const errorData = await response.json();
            showToast(errorData.error || 'Failed to delete subcategory');
          }
        } else {
          const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            setCategories(prev => {
              const updated = prev.filter(cat => cat._id !== id);
              if (propSetCategories) propSetCategories(updated);
              return updated;
            });
            showToast('Category deleted successfully!', 'success');
          } else {
            const errorData = await response.json();
            showToast(errorData.error || 'Failed to delete category');
          }
        }
      } catch (error) {
        showToast('Network error occurred');
        console.error('Error deleting item:', error);
      } finally {
        setLoading(false);
      }
    });
  };

  const startEditing = (item, type = 'category', parentId = null) => {
    if (editingItem?.imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(editingItem.imagePreview);
    }
    setEditingItem({
      ...item,
      type,
      parentId,
      imageFile: null,
      imagePreview: item.image || ''
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'error' })}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationModal.onConfirm}
        itemType={confirmationModal.itemType}
        itemName={confirmationModal.itemName}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-3 sm:p-4 rounded-lg flex items-center text-sm sm:text-base">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-black mr-3"></div>
            Loading...
          </div>
        </div>
      )}

      {/* Add New Item / Edit Section */}
      <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg flex items-center">
          <FontAwesomeIcon 
            icon={editingItem ? faEdit : faPlus} 
            className="mr-2 text-black text-sm sm:text-base" 
          />
          {editingItem ? `Edit ${editingItem.type === 'dealType' ? 'Deal Type' : (editingItem.type === 'subcategory' ? 'Subcategory' : 'Category')}` : 'Add New Item'}
        </h3>
        
        {!editingItem && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base bg-white"
              value={newCategory.type}
              onChange={(e) => {
                if (newCategory.imagePreview?.startsWith('blob:')) {
                  URL.revokeObjectURL(newCategory.imagePreview);
                }
                setNewCategory({
                  ...newCategory, 
                  type: e.target.value, 
                  parentId: '',
                  imageFile: null,
                  imagePreview: ''
                });
              }}
            >
              <option value="category">Category</option>
              <option value="dealType">Deal Type</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editingItem 
                ? (editingItem.type === 'dealType' ? 'Deal Type Name' : (editingItem.type === 'subcategory' ? 'Subcategory Name' : 'Category Name')) 
                : (newCategory.type === 'dealType' ? 'Deal Type Name' : 'Category Name')}
            </label>
            <input
              type="text"
              placeholder={editingItem ? (editingItem.type === 'dealType' ? 'Deal Type Name' : 'Category Name') : (newCategory.type === 'dealType' ? 'Deal Type Name' : 'Category Name')}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base bg-white"
              value={editingItem ? editingItem.name : newCategory.name}
              onChange={(e) => editingItem 
                ? setEditingItem({...editingItem, name: e.target.value})
                : setNewCategory({...newCategory, name: e.target.value})
              }
            />
          </div>
          
          {(editingItem?.type === 'dealType' || newCategory.type === 'dealType') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                placeholder="Description (optional)"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base bg-white"
                value={editingItem ? editingItem.description || '' : newCategory.description || ''}
                onChange={(e) => editingItem 
                  ? setEditingItem({...editingItem, description: e.target.value})
                  : setNewCategory({...newCategory, description: e.target.value})
                }
              />
            </div>
          )}
        </div>
        
        {!editingItem && newCategory.type === 'category' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional for subcategories)</label>
            <select
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black text-sm sm:text-base bg-white"
              value={newCategory.parentId}
              onChange={(e) => {
                if (e.target.value && newCategory.imagePreview?.startsWith('blob:')) {
                  URL.revokeObjectURL(newCategory.imagePreview);
                }
                setNewCategory({
                  ...newCategory, 
                  parentId: e.target.value,
                  imageFile: e.target.value ? null : newCategory.imageFile,
                  imagePreview: e.target.value ? '' : newCategory.imagePreview
                });
              }}
            >
              <option value="">None (Creates Main Category)</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category Image Upload (for creating main category) */}
        {!editingItem && newCategory.type === 'category' && !newCategory.parentId && (
          <div className="mb-5 p-3.5 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center">
              <FontAwesomeIcon icon={faImage} className="mr-2 text-black" />
              Category Image
              <span className="ml-1 text-xs text-gray-500 font-normal">(Used across "Shop By Category")</span>
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0">
                {newCategory.imagePreview ? (
                  <div className="relative group">
                    <img
                      src={newCategory.imagePreview}
                      alt="Category preview"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border-2 border-gray-200 shadow-sm cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveNewImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md transition-colors"
                      title="Remove image"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FontAwesomeIcon icon={faImage} className="text-2xl text-gray-400" />
                    <span className="text-[10px] text-gray-500 font-medium mt-1">Upload</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleNewImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-gray-300 flex items-center gap-2 transition-colors"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                  <span>{newCategory.imageFile ? 'Change Category Image' : 'Choose Category Image'}</span>
                </button>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Upload an image for this category. JPG, PNG, or WebP. This replaces product photos on the home page category section.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Category Image Upload (for editing main category) */}
        {editingItem && editingItem.type === 'category' && (
          <div className="mb-5 p-3.5 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-800 mb-2 flex items-center">
              <FontAwesomeIcon icon={faImage} className="mr-2 text-black" />
              Category Image
              <span className="ml-1 text-xs text-gray-500 font-normal">(Used across "Shop By Category")</span>
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0">
                {editingItem.imagePreview ? (
                  <div className="relative group">
                    <img
                      src={editingItem.imagePreview}
                      alt="Category preview"
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border-2 border-gray-200 shadow-sm cursor-pointer"
                      onClick={() => editFileInputRef.current?.click()}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveEditImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md transition-colors"
                      title="Remove image"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <FontAwesomeIcon icon={faImage} className="text-2xl text-gray-400" />
                    <span className="text-[10px] text-gray-500 font-medium mt-1">Upload</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleEditImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-gray-300 flex items-center gap-2 transition-colors"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-xs" />
                  <span>{editingItem.imagePreview ? 'Replace Image' : 'Upload Category Image'}</span>
                </button>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Upload an image for this category. JPG, PNG, or WebP. This replaces product photos on the home page category section.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2">
          {editingItem ? (
            <>
              <button
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center disabled:opacity-50 text-sm sm:text-base font-medium shadow-sm transition-colors"
                onClick={updateItem}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2 text-xs sm:text-sm" />
                Update {editingItem.type === 'dealType' ? 'Deal Type' : (editingItem.type === 'subcategory' ? 'Subcategory' : 'Category')}
              </button>
              <button
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center text-sm sm:text-base font-medium transition-colors"
                onClick={resetForm}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2 text-xs sm:text-sm" />
                Cancel
              </button>
            </>
          ) : (
            <button
              className="w-full sm:w-auto px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center disabled:opacity-50 text-sm sm:text-base font-medium shadow-sm transition-colors"
              onClick={addCategory}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs sm:text-sm" />
              Add {newCategory.type === 'dealType' 
                ? 'Deal Type' 
                : newCategory.parentId ? 'Subcategory' : 'Category'
              }
            </button>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <FontAwesomeIcon icon={faFolder} className="mr-2 text-black text-sm sm:text-base" />
          Categories & Subcategories
        </h3>
        {categories.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base bg-white rounded-lg border border-gray-200">
            No categories found. Create your first category above.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="min-w-full">
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2.5 p-2.5">
                {categories.map(category => (
                  <div key={category._id} className="space-y-2">
                    {/* Main Category Card */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 min-w-0">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-12 h-12 object-cover rounded-md border border-gray-200 shadow-xs flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-md border border-gray-300 flex items-center justify-center flex-shrink-0">
                              <FontAwesomeIcon icon={faImage} className="text-base" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 text-sm block truncate">{category.name}</span>
                            {category.image ? (
                              <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                                Image uploaded
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                                No image
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            className="text-black hover:text-blue-900 disabled:opacity-50 p-1.5"
                            onClick={() => startEditing(category, 'category')}
                            disabled={loading}
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-sm" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1.5"
                            onClick={() => deleteItem(category._id, 'category', null, category.name)}
                            disabled={loading}
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block font-medium">
                        Main Category
                      </div>
                    </div>

                    {/* Subcategories */}
                    {category.subcategories?.map(subcategory => (
                      <div key={subcategory._id} className="bg-white p-3 rounded-lg border border-gray-200 ml-4 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0">
                            <FontAwesomeIcon icon={faFolderTree} className="mr-2 text-green-600 text-sm flex-shrink-0" />
                            <span className="font-medium text-gray-900 text-sm truncate">{subcategory.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                              className="text-black hover:text-blue-900 disabled:opacity-50 p-1.5"
                              onClick={() => startEditing(subcategory, 'subcategory', category._id)}
                              disabled={loading}
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-xs" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1.5"
                              onClick={() => deleteItem(subcategory._id, 'subcategory', category._id, subcategory.name)}
                              disabled={loading}
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded inline-block mt-1 font-medium">
                          Subcategory
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map(category => (
                    <React.Fragment key={category._id}>
                      {/* Main Category Row */}
                      <tr className="bg-gray-50/70 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center space-x-3">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-12 h-12 object-cover rounded-md border border-gray-200 shadow-xs flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-md border border-gray-300 flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faImage} className="text-base" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center">
                                <FontAwesomeIcon icon={faFolder} className="mr-2 text-black text-xs" />
                                <span className="font-semibold text-gray-900 text-base">{category.name}</span>
                              </div>
                              {category.image ? (
                                <span className="inline-block text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                                  Custom image uploaded
                                </span>
                              ) : (
                                <span className="inline-block text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                                  No image uploaded
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                            Main Category
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <button
                            className="text-black hover:text-blue-900 mr-3 disabled:opacity-50 p-1.5"
                            onClick={() => startEditing(category, 'category')}
                            disabled={loading}
                            title="Edit Category"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1.5"
                            onClick={() => deleteItem(category._id, 'category', null, category.name)}
                            disabled={loading}
                            title="Delete Category"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>

                      {/* Subcategories */}
                      {category.subcategories?.map(subcategory => (
                        <tr key={subcategory._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 pl-12">
                            <div className="flex items-center">
                              <FontAwesomeIcon icon={faFolderTree} className="mr-2 text-green-600 text-xs" />
                              <span>{subcategory.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                              Subcategory
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            <button
                              className="text-black hover:text-blue-900 mr-3 disabled:opacity-50 p-1.5"
                              onClick={() => startEditing(subcategory, 'subcategory', category._id)}
                              disabled={loading}
                              title="Edit Subcategory"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1.5"
                              onClick={() => deleteItem(subcategory._id, 'subcategory', category._id, subcategory.name)}
                              disabled={loading}
                              title="Delete Subcategory"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Deal Types Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <FontAwesomeIcon icon={faTags} className="mr-2 text-purple-600 text-sm sm:text-base" />
          Deal Types
        </h3>
        {dealTypes.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base bg-white rounded-lg border border-gray-200">
            No deal types found. Create your first deal type above.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="min-w-full">
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2 p-2.5">
                {dealTypes.map(dealType => (
                  <div key={dealType._id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faTag} className="mr-2 text-purple-600 text-sm" />
                        <span className="font-semibold text-gray-900 text-sm">{dealType.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-black hover:text-blue-900 disabled:opacity-50 p-1"
                          onClick={() => startEditing(dealType, 'dealType')}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                          onClick={() => deleteItem(dealType._id, 'dealType', null, dealType.name)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {dealType.description || 'No description'}
                    </p>
                    <div className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium inline-block">
                      Deal Type
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dealTypes.map(dealType => (
                    <tr key={dealType._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                        <FontAwesomeIcon icon={faTag} className="mr-2 text-purple-600" />
                        {dealType.name}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">
                        {dealType.description || 'No description'}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium">
                        <button
                          className="text-black hover:text-blue-900 mr-3 disabled:opacity-50 p-1.5"
                          onClick={() => startEditing(dealType, 'dealType')}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1.5"
                          onClick={() => deleteItem(dealType._id, 'dealType', null, dealType.name)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesTab;