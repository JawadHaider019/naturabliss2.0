import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaTimes, FaInfoCircle } from 'react-icons/fa'

const ProductDetails = ({ product, mode, token, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    ...product,
    name: product.name || '',
    description: product.description || '',
    category: product.category || '',
    subcategory: product.subcategory || '',
    ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : (product.ingredients || ''),
    howToUse: product.howToUse || '',
    benefits: Array.isArray(product.benefits) ? product.benefits.join(', ') : (product.benefits || ''),
    variants: Array.isArray(product.variants) ? product.variants : [],
    cost: product.cost || 0,
    price: product.price || 0,
    discountprice: product.discountprice || 0,
    quantity: product.quantity || 0,
    bestseller: product.bestseller || false,
    status: product.status || 'draft'
  })
  
  const [loading, setLoading] = useState(false)
  const [newImages, setNewImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  
  // Fetch categories and subcategories from backend
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Fetch categories from backend
  useEffect(() => {
 // Fix the fetchCategories function
const fetchCategories = async () => {
  try {
    setCategoriesLoading(true)
    const response = await axios.get(backendUrl + '/api/categories')
    
    console.log('Categories API Response:', response.data) // Debug log
    
    if (response.data && Array.isArray(response.data)) {
      setCategories(response.data)
      
      // If product has a category, load its subcategories
      if (product.category) {
        console.log('Product category:', product.category) // Debug log
        
        // Try to find category by _id first, then by name if needed
        const selectedCategory = response.data.find(cat => 
          cat._id === product.category || cat.name === product.category
        )
        
        if (selectedCategory && selectedCategory.subcategories) {
          console.log('Found subcategories:', selectedCategory.subcategories) // Debug log
          setSubcategories(selectedCategory.subcategories)
        }
      }
    } else {
      console.warn('Unexpected categories response format:', response.data)
      toast.error('Failed to load categories: Invalid response format')
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    toast.error('Failed to load categories')
  } finally {
    setCategoriesLoading(false)
  }
}
    fetchCategories()
  }, [product.category])

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(cat => cat._id === formData.category)
      if (selectedCategory && selectedCategory.subcategories) {
        setSubcategories(selectedCategory.subcategories)
        
        // Reset subcategory if it doesn't belong to the new category
        if (formData.subcategory) {
          const subcategoryExists = selectedCategory.subcategories.find(
            sub => sub._id === formData.subcategory
          )
          if (!subcategoryExists) {
            setFormData(prev => ({ ...prev, subcategory: '' }))
          }
        }
      } else {
        setSubcategories([])
        setFormData(prev => ({ ...prev, subcategory: '' }))
      }
    } else {
      setSubcategories([])
      setFormData(prev => ({ ...prev, subcategory: '' }))
    }
  }, [formData.category, categories])

  // Helper functions to get names for display
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Select Category'
    const category = categories.find(cat => cat._id === categoryId)
    return category ? category.name : 'Unknown Category'
  }

  const getSubcategoryName = (subcategoryId) => {
    if (!subcategoryId) return 'Select Subcategory'
    const subcategory = subcategories.find(sub => sub._id === subcategoryId)
    return subcategory ? subcategory.name : 'Unknown Subcategory'
  }

  // Calculate basic pricing metrics
  const calculatePricingSummary = () => {
    const cost = parseFloat(formData.cost) || 0;
    const price = parseFloat(formData.price) || 0;
    const discountPrice = parseFloat(formData.discountprice) || 0;

    const actualSellingPrice = discountPrice > 0 ? discountPrice : price;
    const discountAmount = discountPrice > 0 ? price - discountPrice : 0;
    const discountPercentage = price > 0 ? ((discountAmount / price) * 100) : 0;

    return {
      discountAmount: isNaN(discountAmount) ? 0 : discountAmount,
      discountPercentage: isNaN(discountPercentage) ? 0 : discountPercentage,
      actualSellingPrice: isNaN(actualSellingPrice) ? 0 : actualSellingPrice
    };
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
  }

  // Remove existing image
  const removeExistingImage = (index) => {
    setRemovedImages(prev => [...prev, formData.image[index]])
    setFormData(prev => ({
      ...prev,
      image: prev.image.filter((_, i) => i !== index)
    }))
  }

  // Remove new image (before upload)
  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { name: '', price: '', discountprice: '', quantity: '', image: '', imageFile: null, imagePreview: '' }]
    }))
  }

  const handleRemoveVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index)
    }))
  }

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).map((v, i) => i === index ? { ...v, [field]: value } : v)
    }))
  }

  const handleVariantImageChange = (index, file) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).map((v, i) => {
        if (i === index) {
          return {
            ...v,
            imageFile: file,
            imagePreview: file ? URL.createObjectURL(file) : ''
          }
        }
        return v
      })
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Create FormData for file upload
      const formDataToSend = new FormData()
      
      // Add basic fields
      formDataToSend.append('id', product._id)
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('subcategory', formData.subcategory)
      formDataToSend.append('ingredients', formData.ingredients || '')
      formDataToSend.append('howToUse', formData.howToUse || '')
      formDataToSend.append('benefits', formData.benefits || '')

      const cleanVariants = (formData.variants || [])
        .filter(v => v.name && v.name.trim())
        .map((v, idx) => {
          if (v.imageFile) {
            formDataToSend.append(`variantImage_${idx}`, v.imageFile)
          }
          return {
            name: v.name,
            price: v.price,
            discountprice: v.discountprice,
            quantity: v.quantity,
            sku: v.sku || '',
            image: v.image || ''
          }
        })
      formDataToSend.append('variants', JSON.stringify(cleanVariants))

      formDataToSend.append('cost', formData.cost.toString())
      formDataToSend.append('price', formData.price.toString())
      formDataToSend.append('discountprice', formData.discountprice.toString())
      formDataToSend.append('quantity', formData.quantity.toString())
      formDataToSend.append('bestseller', formData.bestseller.toString())
      formDataToSend.append('status', formData.status)
      
      // Send removedImages as a proper JSON string
      formDataToSend.append('removedImages', JSON.stringify(removedImages))
      
      // Add new images
      newImages.forEach((image, index) => {
        formDataToSend.append(`image${index + 1}`, image)
      })

      const response = await axios.post(
        backendUrl + '/api/product/update',
        formDataToSend,
        { 
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          } 
        }
      )
      
      if (response.data.success) {
        toast.success('Product updated successfully')
        
        // Clear the image states after successful save
        setNewImages([])
        setRemovedImages([])
        
        onSave()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Product update error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }
    
    try {
      const response = await axios.post(
        backendUrl + '/api/product/remove', 
        { id: product._id }, 
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        onBack()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2 transition-colors duration-200"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'view' ? 'Product Details' : 'Edit Product'}
            </h2>
            {mode === 'edit' && (
              <p className="text-gray-600 mt-1">Make changes to your product information</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {mode === 'edit' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 font-medium flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            {mode === 'view' ? (
              <ViewMode 
                product={product} 
                getCategoryName={getCategoryName}
                getSubcategoryName={getSubcategoryName}
              />
            ) : (
              <EditMode 
                formData={formData}
                onChange={handleChange}
                loading={loading}
                categories={categories}
                subcategories={subcategories}
                categoriesLoading={categoriesLoading}
                // Image management props
                newImages={newImages}
                removedImages={removedImages}
                onImageUpload={handleImageUpload}
                onRemoveExistingImage={removeExistingImage}
                onRemoveNewImage={removeNewImage}
                // Pricing summary
                pricingSummary={calculatePricingSummary()}
                // Variants props
                onAddVariant={handleAddVariant}
                onRemoveVariant={handleRemoveVariant}
                onVariantChange={handleVariantChange}
                onVariantImageChange={handleVariantImageChange}
                // Helper functions
                getCategoryName={getCategoryName}
                getSubcategoryName={getSubcategoryName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ViewMode = ({ product, getCategoryName, getSubcategoryName }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Images */}
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Product Images</h3>
      <div className="grid grid-cols-2 gap-4">
        {product.image && product.image.map((img, index) => (
          <div key={index} className="relative">
            <img
              src={img}
              alt={`${product.name} ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
            />
          </div>
        ))}
      </div>
    </div>

    {/* Details */}
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Product Information</h3>
        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <DetailRow label="Name" value={product.name} />
          <DetailRow label="Description" value={product.description} />
          <DetailRow label="Ingredients" value={Array.isArray(product.ingredients) ? product.ingredients.join(', ') : (product.ingredients || 'N/A')} />
          <DetailRow label="How to Use" value={product.howToUse || 'N/A'} />
          <DetailRow label="Benefits" value={Array.isArray(product.benefits) ? product.benefits.join(', ') : (product.benefits || 'N/A')} />
          {product.variants && product.variants.length > 0 && (
            <div className="py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700 block mb-2">Variants ({product.variants.length}):</span>
              <div className="space-y-2 pl-2">
                {product.variants.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-gray-200 gap-3">
                    <div className="flex items-center gap-2.5">
                      {v.image ? (
                        <img src={v.image} alt={v.name} className="w-8 h-8 rounded object-cover border border-gray-200" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">
                          No img
                        </div>
                      )}
                      <span className="font-semibold text-gray-900">{v.name}</span>
                    </div>
                    <span className="text-gray-600">
                      Price: {currency}{v.price} {v.discountprice ? `(Disc: ${currency}${v.discountprice})` : ''} | Stock: {v.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DetailRow label="Category" value={getCategoryName(product.category)} />
          <DetailRow label="Subcategory" value={getSubcategoryName(product.subcategory) || 'N/A'} />
          <DetailRow label="Cost Price" value={`${currency}${product.cost}`} />
          <DetailRow label="Original Price" value={`${currency}${product.price}`} />
          <DetailRow label="Discount Price" value={`${currency}${product.discountprice}`} />
          <DetailRow label="Quantity" value={product.quantity} />
          <DetailRow label="Bestseller" value={product.bestseller ? 'Yes' : 'No'} />
          <DetailRow label="Status" value={product.status || 'draft'} />
          <DetailRow label="Date Added" value={new Date(product.date).toLocaleDateString()} />
        </div>
      </div>
    </div>
  </div>
)

const EditMode = ({ 
  formData, 
  onChange, 
  loading,
  categories,
  subcategories,
  categoriesLoading,
  newImages,
  removedImages,
  onImageUpload,
  onRemoveExistingImage,
  onRemoveNewImage,
  pricingSummary,
  onAddVariant,
  onRemoveVariant,
  onVariantChange,
  onVariantImageChange,
  getCategoryName,
  getSubcategoryName
}) => {
  const {
    discountAmount,
    discountPercentage,
    actualSellingPrice
  } = pricingSummary;

  return (
    <div className="space-y-8">
      {/* Product Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            {categoriesLoading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
                Loading categories...
              </div>
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={onChange}
              disabled={!formData.category || categoriesLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Subcategory</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory._id} value={subcategory._id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {!formData.category && !categoriesLoading && (
              <p className="text-sm text-gray-500 mt-1">Please select a category first</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price ({currency})</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={onChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Original Price ({currency})</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={onChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Price ({currency})</label>
            <input
              type="number"
              name="discountprice"
              value={formData.discountprice}
              onChange={onChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={onChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">Current status: <span className="font-medium capitalize">{formData.status}</span></p>
          </div>

          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              name="bestseller"
              checked={formData.bestseller}
              onChange={onChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 font-medium">Mark as Bestseller</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter product description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients (comma-separated)</label>
            <textarea
              name="ingredients"
              value={formData.ingredients}
              onChange={onChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="e.g. Aloe Vera, Rose Water, Vitamin E"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">How to Use</label>
            <textarea
              name="howToUse"
              value={formData.howToUse}
              onChange={onChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Directions for using the product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Benefits (comma-separated)</label>
            <textarea
              name="benefits"
              value={formData.benefits}
              onChange={onChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="e.g. Deeply Hydrating, 100% Organic"
            />
          </div>
        </div>
      </div>

      {/* Product Variants (e.g. 250ml, 500ml, 750ml) */}
      <div className="border-t pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Product Variants (Sizes / Volumes)</h3>
            <p className="text-sm text-gray-500">
              Manage size variations (e.g. 250ml, 500ml, 1L) with custom pricing and stock.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddVariant}
            className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            + Add Variant
          </button>
        </div>

        {(!formData.variants || formData.variants.length === 0) ? (
          <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 bg-gray-50">
            No variants created yet. Click &quot;+ Add Variant&quot; to add sizes like 250ml, 500ml, etc.
          </div>
        ) : (
          <div className="space-y-3">
            {formData.variants.map((v, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 items-center">
                {/* Variant Image */}
                <div className="sm:col-span-2 flex flex-col items-center">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Image</label>
                  <label htmlFor={`editVariantImg_${idx}`} className="cursor-pointer relative group block w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-black overflow-hidden flex items-center justify-center bg-white transition-colors">
                    {v.imagePreview || v.image ? (
                      <img src={v.imagePreview || v.image} alt={v.name || 'Variant'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400">Photo</span>
                    )}
                    <input
                      type="file"
                      id={`editVariantImg_${idx}`}
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          onVariantImageChange(idx, e.target.files[0])
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Variant Name */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Variant Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. 250ml"
                    value={v.name || ''}
                    onChange={(e) => onVariantChange(idx, 'name', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-black bg-white"
                    required
                  />
                </div>

                {/* Price */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price ({currency}) *</label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={v.price !== undefined ? v.price : ''}
                    onChange={(e) => onVariantChange(idx, 'price', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-black bg-white"
                    required
                  />
                </div>

                {/* Discount Price */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Disc Price</label>
                  <input
                    type="number"
                    placeholder="Discount"
                    value={v.discountprice !== undefined ? v.discountprice : ''}
                    onChange={(e) => onVariantChange(idx, 'discountprice', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-black bg-white"
                  />
                </div>

                {/* Stock */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={v.quantity !== undefined ? v.quantity : ''}
                    onChange={(e) => onVariantChange(idx, 'quantity', e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-black bg-white"
                  />
                </div>

                {/* Remove Button */}
                <div className="sm:col-span-1 flex justify-end sm:justify-center">
                  <button
                    type="button"
                    onClick={() => onRemoveVariant(idx)}
                    className="p-2 text-red-500 hover:text-red-700 rounded transition-colors"
                    title="Remove variant"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Management */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Product Images</h3>
        
        {/* Removed Images Info */}
        {removedImages.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">{removedImages.length} image(s)</span> will be removed when you save changes.
            </p>
          </div>
        )}
        
        {/* Existing Images */}
        {formData.image && formData.image.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-700">Current Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.image.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveExistingImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        {newImages.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-700">New Images to Upload</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Add More Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onImageUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-sm text-gray-500 mt-2">You can select multiple images. New images will be added to existing ones.</p>
        </div>
      </div>

      {/* Simple Pricing Summary */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
          <FaInfoCircle className="w-5 h-5 mr-2 text-blue-600" />
          Pricing Summary
        </h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cost Price */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {currency}{parseFloat(formData.cost || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Cost Price</div>
            </div>

            {/* Selling Price */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currency}{actualSellingPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Selling Price</div>
            </div>

            {/* Discount */}
            <div className="text-center">
              {discountAmount > 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-600">
                    {discountPercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Discount 
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-500">No Discount</div>
                  <div className="text-sm text-gray-600 mt-1">Discount Applied</div>
                </>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {discountAmount > 0 && (
            <div className="mt-4 p-3 bg-white rounded border border-blue-100">
              <div className="text-sm text-gray-600 text-center">
                Original Price: <span className="font-medium line-through">{currency}{parseFloat(formData.price || 0).toFixed(2)}</span>
                {' '}→{' '}
                Discount Price: <span className="font-medium text-green-600">{currency}{actualSellingPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900 font-medium">{value}</span>
  </div>
)

export default ProductDetails