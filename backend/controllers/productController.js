import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import productModel from '../models/productModel.js';
import { notifyNewProduct } from '../controllers/newsletterController.js'; // ADDED IMPORT

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to parse array fields (JSON string, comma-separated string, or array)
const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field.map(item => String(item).trim()).filter(Boolean);
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
    } catch (e) {
      // If not JSON, split by comma or newline
      return field
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

// Helper function to extract a file by fieldname whether req.files is array or object
const getFileByFieldname = (files, fieldname) => {
  if (!files) return null;
  if (Array.isArray(files)) {
    return files.find(f => f.fieldname === fieldname) || null;
  }
  if (typeof files === 'object') {
    const val = files[fieldname];
    if (Array.isArray(val)) return val[0] || null;
    return val || null;
  }
  return null;
};

// Helper function to parse variants and upload variant images if provided
const parseVariantsField = async (field, files) => {
  if (!field) return [];
  let arr = field;
  if (typeof field === 'string') {
    try {
      arr = JSON.parse(field);
    } catch (e) {
      return [];
    }
  }
  if (Array.isArray(arr)) {
    const parsedList = [];
    for (let idx = 0; idx < arr.length; idx++) {
      const v = arr[idx];
      if (!v || (!v.name && v.price === undefined)) continue;

      let variantImage = typeof v.image === 'string' ? v.image.trim() : '';

      // Check if a file was uploaded for this variant
      const variantFile = getFileByFieldname(files, `variantImage_${idx}`);
      if (variantFile) {
        try {
          const uploadRes = await cloudinary.uploader.upload(variantFile.path, { resource_type: 'image', folder: 'products' });
          variantImage = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error(`Error uploading variant image at index ${idx}:`, uploadErr);
        }
      }

      parsedList.push({
        name: String(v.name || '').trim(),
        price: Number(v.price) || 0,
        discountprice: Number(v.discountprice) || 0,
        quantity: Number(v.quantity) || 0,
        sku: String(v.sku || '').trim(),
        image: variantImage
      });
    }
    return parsedList.filter(v => v.name.length > 0);
  }
  return [];
};

// ------------------- ADD PRODUCT -------------------
const addProduct = async (req, res) => {
  try {
    const { name, description, cost, price, discountprice, quantity, category, subcategory, bestseller, status, ingredients, howToUse, benefits, variants } = req.body;

    const mainImageKeys = ['image1', 'image2', 'image3', 'image4'];
    const imagesFiles = mainImageKeys
      .map(key => getFileByFieldname(req.files, key))
      .filter(Boolean);

    const imagesUrl = await Promise.all(
      imagesFiles.map(async file => {
        const result = await cloudinary.uploader.upload(file.path, { resource_type: 'image', folder: 'products' });
        return result.secure_url;
      })
    );

    const parsedVariants = await parseVariantsField(variants, req.files);

    const productData = {
      name,
      description,
      category,
      subcategory,
      ingredients: parseArrayField(ingredients),
      howToUse: typeof howToUse === 'string' ? howToUse.trim() : (howToUse || ''),
      benefits: parseArrayField(benefits),
      variants: parsedVariants,
      cost: Number(cost),
      price: Number(price),
      discountprice: Number(discountprice),
      quantity: Number(quantity),
      bestseller: bestseller === 'true' || bestseller === true,
      image: imagesUrl,
      status: status || 'draft',
      date: Date.now(),
      slug: generateSlug(name)
    };

    const product = new productModel(productData);
    await product.save();

    // ✅ ADDED: Send newsletter notification if product is published
    if (status === 'published') {
      try {
        await notifyNewProduct(product);
        console.log('📢 New product notification sent to subscribers');
      } catch (notificationError) {
        console.error('❌ Failed to send product notification:', notificationError);
        // Don't fail the whole request if notification fails
      }
    }

    res.json({ success: true, message: 'Product added successfully', product });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- LIST PRODUCTS -------------------

const listProducts = async (req, res) => {
  try {
    const { status = 'all' } = req.query; // Default to 'all'

    // Build query
    let query = {};

    // If status is specified and not 'all', apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    // If status is 'all' or not provided, no status filter (get all products)

    const products = await productModel.find(query);

    console.log('📦 Products found:', products.length);
    console.log('🔍 Query used:', query);
    console.log('📊 Status breakdown:', {
      published: products.filter(p => p.status === 'published').length,
      draft: products.filter(p => p.status === 'draft').length,
      archived: products.filter(p => p.status === 'archived').length
    });

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error("List Products Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// ------------------- REMOVE PRODUCT -------------------
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.error("Remove Product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- SINGLE PRODUCT -------------------
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;

    let product;

    // Try finding by ID first if it looks like one
    if (productId && productId.length === 24) {
      try {
        product = await productModel.findById(productId);
      } catch (err) {
        // Not a valid ID, ignore and move to slug
      }
    }

    // If not found by ID, try finding by slug
    if (!product) {
      product = await productModel.findOne({ slug: productId });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error("Single Product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- UPDATE PRODUCT -------------------
const updateProduct = async (req, res) => {
  try {
    const fields = ['id', 'name', 'description', 'cost', 'price', 'discountprice', 'quantity', 'category', 'subcategory', 'bestseller', 'status', 'ingredients', 'howToUse', 'benefits', 'variants', 'removedImages'];
    fields.forEach(field => {
      console.log(`${field}:`, req.body[field]);
    });

    const {
      id,
      name,
      description,
      cost,
      price,
      discountprice,
      quantity,
      category,
      subcategory,
      bestseller,
      status,
      ingredients,
      howToUse,
      benefits,
      variants,
      removedImages
    } = req.body;

    if (!id) {
      console.log("ERROR: No product ID provided");
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const existingProduct = await productModel.findById(id);
    if (!existingProduct) {
      console.log("ERROR: Product not found with ID:", id);
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    console.log("Existing product status:", existingProduct.status);

    // Base update data - ensure status is properly handled
    const updateData = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      category: category || existingProduct.category,
      subcategory: subcategory || existingProduct.subcategory,
      ingredients: ingredients !== undefined ? parseArrayField(ingredients) : existingProduct.ingredients,
      howToUse: howToUse !== undefined ? (typeof howToUse === 'string' ? howToUse.trim() : howToUse) : existingProduct.howToUse,
      benefits: benefits !== undefined ? parseArrayField(benefits) : existingProduct.benefits,
      variants: variants !== undefined ? await parseVariantsField(variants, req.files) : existingProduct.variants,
      cost: Number(cost) || existingProduct.cost,
      price: Number(price) || existingProduct.price,
      discountprice: Number(discountprice) || existingProduct.discountprice,
      quantity: Number(quantity) || existingProduct.quantity,
      bestseller: bestseller === 'true' || bestseller === true,
      status: status || existingProduct.status, // Use received status or keep existing
      slug: name ? generateSlug(name) : existingProduct.slug
    };

    console.log("=== UPDATE DATA TO BE SAVED ===");
    console.log("Update data:", updateData);
    console.log("Status in updateData:", updateData.status);

    // ------------------- IMAGE HANDLING -------------------
    let finalImages = [...existingProduct.image];

    // Handle removed images
    let removedImageUrls = [];
    try {
      removedImageUrls = typeof removedImages === "string" ? JSON.parse(removedImages) : removedImages || [];
      console.log("Removed images:", removedImageUrls);
    } catch (e) {
      console.error("Error parsing removedImages:", e);
    }

    if (removedImageUrls.length > 0) {
      const normalizeUrl = url => url.replace(/^https?:/, "").trim();
      finalImages = finalImages.filter(img => !removedImageUrls.some(removed => normalizeUrl(removed) === normalizeUrl(img)));

      // Delete removed images from Cloudinary
      for (const imgUrl of removedImageUrls) {
        try {
          const match = imgUrl.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/);
          const publicId = match ? match[1] : null;
          if (publicId) await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Cloudinary deletion error:", err);
        }
      }
    }

    // Handle new image uploads
    const newMainFiles = [];
    if (Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (/^image\d+$/.test(file.fieldname)) {
          newMainFiles.push(file);
        }
      });
    } else if (req.files && typeof req.files === 'object') {
      let index = 1;
      while (req.files[`image${index}`]) {
        const file = req.files[`image${index}`][0] || req.files[`image${index}`];
        if (file) newMainFiles.push(file);
        index++;
      }
    }

    if (newMainFiles.length > 0) {
      const newImageUrls = await Promise.all(
        newMainFiles.map(file => cloudinary.uploader.upload(file.path, { resource_type: "image", folder: "products" }).then(res => res.secure_url))
      );
      finalImages = [...finalImages, ...newImageUrls];
    }

    updateData.image = finalImages;

    // Perform the update
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // ✅ ADDED: Send newsletter notification if status changed to published
    if (status === 'published' && existingProduct.status !== 'published') {
      try {
        await notifyNewProduct(updatedProduct);
        console.log('📢 New product notification sent to subscribers');
      } catch (notificationError) {
        console.error('❌ Failed to send product notification:', notificationError);
        // Don't fail the whole request if notification fails
      }
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- UPDATE PRODUCT STATUS -------------------
const updateProductStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ success: false, message: "Product ID and status are required" });

    const validStatuses = ['draft', 'published', 'archived', 'scheduled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: `Invalid status. Must be: ${validStatuses.join(', ')}` });

    const existingProduct = await productModel.findById(id);
    if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found" });

    const updatedProduct = await productModel.findByIdAndUpdate(id, { status }, { new: true });

    // ✅ ADDED: Send newsletter notification when status changes to published
    if (status === 'published' && existingProduct.status !== 'published') {
      try {
        await notifyNewProduct(updatedProduct);
        console.log('📢 New product notification sent to subscribers');
      } catch (notificationError) {
        console.error('❌ Failed to send product notification:', notificationError);
        // Don't fail the whole request if notification fails
      }
    }

    res.json({ success: true, message: "Product status updated successfully", product: updatedProduct });
  } catch (error) {
    console.error("Update Product Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- GET PRODUCTS BY STATUS -------------------
const getProductsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const products = await productModel.find({ status });
    res.json({ success: true, products });
  } catch (error) {
    console.error("Get Products By Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  updateProduct,
  updateProductStatus,
  getProductsByStatus
};