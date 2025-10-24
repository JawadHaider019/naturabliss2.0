import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import { notifyNewProduct } from '../controllers/newsletterController.js'; // ADDED IMPORT

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ------------------- ADD PRODUCT -------------------
const addProduct = async (req, res) => {
  try {
    const { name, description, cost, price, discountprice, quantity, category, subcategory, bestseller, status } = req.body;

    const imagesFiles = ['image1', 'image2', 'image3', 'image4']
      .map(key => req.files[key]?.[0])
      .filter(Boolean);

    const imagesUrl = await Promise.all(
      imagesFiles.map(async file => {
        const result = await cloudinary.uploader.upload(file.path, { resource_type: 'image' });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      category,
      subcategory,
      cost: Number(cost),
      price: Number(price),
      discountprice: Number(discountprice),
      quantity: Number(quantity),
      bestseller: bestseller === 'true' || bestseller === true,
      image: imagesUrl,
      status: status || 'draft',
      date: Date.now(),
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
    const { status = 'published' } = req.query;
    
    // Build query - default to only published products for public access
    let query = {};
    
    // If no specific status requested, default to published
    if (!req.query.status) {
      query.status = 'published';
    } else if (status !== 'all') {
      // If specific status requested (and it's not 'all'), use that status
      query.status = status;
    }
    // If status is 'all', no status filter will be applied
    
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
    const product = await productModel.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (error) {
    console.error("Single Product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------- UPDATE PRODUCT -------------------
const updateProduct = async (req, res) => {
  try {
    const fields = ['id', 'name', 'description', 'cost', 'price', 'discountprice', 'quantity', 'category', 'subcategory', 'bestseller', 'status', 'removedImages'];
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
      cost: Number(cost) || existingProduct.cost,
      price: Number(price) || existingProduct.price,
      discountprice: Number(discountprice) || existingProduct.discountprice,
      quantity: Number(quantity) || existingProduct.quantity,
      bestseller: bestseller === 'true' || bestseller === true,
      status: status || existingProduct.status // Use received status or keep existing
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
    if (req.files && Object.keys(req.files).length > 0) {
      const newImages = [];
      let index = 1;
      while (req.files[`image${index}`]) {
        newImages.push(req.files[`image${index}`][0]);
        index++;
      }

      if (newImages.length > 0) {
        const newImageUrls = await Promise.all(
          newImages.map(file => cloudinary.uploader.upload(file.path, { resource_type: "image", folder: "products" }).then(res => res.secure_url))
        );
        finalImages = [...finalImages, ...newImageUrls];
      }
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