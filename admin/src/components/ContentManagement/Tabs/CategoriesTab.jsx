import React, { useState, useEffect } from 'react';
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
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const API_BASE_URL = 'http://localhost:4000/api';

// Toast Component
const Toast = ({ message, type = 'error', onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between min-w-80`}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center p-6 border-b border-gray-200">
          <div className="flex-shrink-0">
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              className="text-yellow-500 text-xl mr-3" 
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Deletion
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-1">
            Are you sure you want to delete this {itemType}?
          </p>
          {itemName && (
            <p className="text-gray-900 font-medium">
              "{itemName}"
            </p>
          )}
          <p className="text-red-600 text-sm mt-2">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center"
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoriesTab = () => {
  const [categories, setCategories] = useState([]);
  const [dealTypes, setDealTypes] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', parentId: '', type: 'category', description: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemType: '',
    itemName: '',
    onConfirm: null
  });

  // Fetch data from backend
  useEffect(() => {
    fetchCategories();
    fetchDealTypes();
  }, []);

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

  const resetForm = () => {
    setNewCategory({ name: '', parentId: '', type: 'category', description: '' });
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
            name: newCategory.name,
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
            body: JSON.stringify({ name: newCategory.name })
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
          // Add as main category
          const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCategory.name })
          });
          
          if (response.ok) {
            const newCat = await response.json();
            setCategories(prev => [...prev, newCat]);
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
            name: editingItem.name,
            description: editingItem.description || ''
          })
        });
        
        if (response.ok) {
          await fetchDealTypes();
          setEditingItem(null);
          showToast('Deal type updated successfully!', 'success');
        } else {
          const errorData = await response.json();
          showToast(errorData.error || 'Failed to update deal type');
        }
      } else if (editingItem.type === 'subcategory') {
        const response = await fetch(`${API_BASE_URL}/categories/${editingItem.parentId}/subcategories/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editingItem.name })
        });
        
        if (response.ok) {
          await fetchCategories();
          setEditingItem(null);
          showToast('Subcategory updated successfully!', 'success');
        } else {
          const errorData = await response.json();
          showToast(errorData.error || 'Failed to update subcategory');
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/categories/${editingItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editingItem.name })
        });
        
        if (response.ok) {
          await fetchCategories();
          setEditingItem(null);
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
            setCategories(prev => prev.filter(cat => cat._id !== id));
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
    setEditingItem({
      ...item,
      type,
      parentId
    });
  };

  return (
    <div className="space-y-8">
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
          <div className="bg-white p-4 rounded-lg flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
            Loading...
          </div>
        </div>
      )}

      {/* Add New Item Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">
          {editingItem ? `Edit ${editingItem.type === 'dealType' ? 'Deal Type' : 'Category'}` : 'Add New Item'}
        </h3>
        
        {!editingItem && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              value={newCategory.type}
              onChange={(e) => setNewCategory({...newCategory, type: e.target.value, parentId: ''})}
            >
              <option value="category">Category</option>
              <option value="dealType">Deal Type</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder={editingItem ? (editingItem.type === 'dealType' ? 'Deal Type Name' : 'Category Name') : (newCategory.type === 'dealType' ? 'Deal Type Name' : 'Category Name')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
            value={editingItem ? editingItem.name : newCategory.name}
            onChange={(e) => editingItem 
              ? setEditingItem({...editingItem, name: e.target.value})
              : setNewCategory({...newCategory, name: e.target.value})
            }
          />
          
          {(editingItem?.type === 'dealType' || newCategory.type === 'dealType') && (
            <input
              type="text"
              placeholder="Description (optional)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              value={editingItem ? editingItem.description || '' : newCategory.description || ''}
              onChange={(e) => editingItem 
                ? setEditingItem({...editingItem, description: e.target.value})
                : setNewCategory({...newCategory, description: e.target.value})
              }
            />
          )}
        </div>
        
        {!editingItem && newCategory.type === 'category' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (for subcategories)</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              value={newCategory.parentId}
              onChange={(e) => setNewCategory({...newCategory, parentId: e.target.value})}
            >
              <option value="">Select Parent Category (optional)</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex gap-2">
          {editingItem ? (
            <>
              <button
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center disabled:opacity-50"
                onClick={updateItem}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Update {editingItem.type === 'dealType' ? 'Deal Type' : 'Category'}
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 flex items-center"
                onClick={() => setEditingItem(null)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <button
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center disabled:opacity-50"
              onClick={addCategory}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FontAwesomeIcon icon={faFolder} className="mr-2 text-black" />
          Categories & Subcategories
        </h3>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No categories found. Create your first category above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map(category => (
                  <React.Fragment key={category._id}>
                    {/* Main Category Row */}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        <FontAwesomeIcon icon={faFolder} className="mr-2 text-black" />
                        {category.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">Main Category</td>
                      <td className="px-4 py-4 text-sm font-medium">
                        <button
                          className="text-black hover:text-blue-900 mr-3 disabled:opacity-50"
                          onClick={() => startEditing(category, 'category')}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          onClick={() => deleteItem(category._id, 'category', null, category.name)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>

                    {/* Subcategories */}
                    {category.subcategories?.map(subcategory => (
                      <tr key={subcategory._id}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 pl-8">
                          <FontAwesomeIcon icon={faFolderTree} className="mr-2 text-green-500" />
                          {subcategory.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">Subcategory</td>
                        <td className="px-4 py-4 text-sm font-medium">
                          <button
                            className="text-black hover:text-blue-900 mr-3 disabled:opacity-50"
                            onClick={() => startEditing(subcategory, 'subcategory', category._id)}
                            disabled={loading}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            onClick={() => deleteItem(subcategory._id, 'subcategory', category._id, subcategory.name)}
                            disabled={loading}
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
        )}
      </div>

      {/* Deal Types Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FontAwesomeIcon icon={faTags} className="mr-2 text-purple-500" />
          Deal Types
        </h3>
        {dealTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No deal types found. Create your first deal type above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dealTypes.map(dealType => (
                  <tr key={dealType._id}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      <FontAwesomeIcon icon={faTag} className="mr-2 text-purple-500" />
                      {dealType.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {dealType.description || 'No description'}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <button
                        className="text-black hover:text-blue-900 mr-3 disabled:opacity-50"
                        onClick={() => startEditing(dealType, 'dealType')}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
        )}
      </div>
    </div>
  );
};

export default CategoriesTab;