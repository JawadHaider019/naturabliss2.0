import { v2 as cloudinary } from "cloudinary";
import dealModel from "../models/dealModel.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------- Add Deal ----------------
const addDeal = async (req, res) => {
  try {
    const {
      dealName,
      dealDescription,
      dealDiscountType,
      dealDiscountValue,
      dealProducts,
      dealTotal,
      dealFinalPrice,
      dealStartDate,
      dealEndDate,
      dealType 
    } = req.body;
    
    // Get deal images from req.files
    const dealImage1 = req.files.dealImage1 && req.files.dealImage1[0];
    const dealImage2 = req.files.dealImage2 && req.files.dealImage2[0];
    const dealImage3 = req.files.dealImage3 && req.files.dealImage3[0];
    const dealImage4 = req.files.dealImage4 && req.files.dealImage4[0];

    const dealImages = [dealImage1, dealImage2, dealImage3, dealImage4].filter((item) => item !== undefined);

    // Upload deal images to Cloudinary
    let dealImagesUrl = await Promise.all(
      dealImages.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: 'image',
          folder: "deals"
        });
        return result.secure_url;
      })
    );

    // Parse deal products
    let parsedDealProducts = [];
    if (dealProducts) {
      if (typeof dealProducts === 'string') {
        try {
          parsedDealProducts = JSON.parse(dealProducts);
        } catch (parseError) {
          console.error("Error parsing deal products:", parseError);
          return res.status(400).json({ 
            success: false, 
            message: "Invalid deal products format" 
          });
        }
      } else {
        parsedDealProducts = dealProducts;
      }
    }

    const dealData = {
      dealName,
      dealDescription: dealDescription || "",
      dealDiscountType: dealDiscountType || "percentage",
      dealDiscountValue: Number(dealDiscountValue),
      dealProducts: parsedDealProducts,
      dealImages: dealImagesUrl,
      dealTotal: Number(dealTotal || 0),
      dealFinalPrice: Number(dealFinalPrice || 0),
      dealStartDate: dealStartDate ? new Date(dealStartDate) : new Date(),
      dealEndDate: dealEndDate ? new Date(dealEndDate) : null,
      dealType: dealType || 'flash_sale', 
      status: 'draft',
      date: Date.now()
    };

    console.log("Deal data with dealType:", dealData);

    const deal = new dealModel(dealData);
    await deal.save();

    console.log("Deal saved successfully with dealType");
    console.log("Saved deal document:", deal); // Add this log to see the actual saved document

    // FIX: Return the actual saved document, not dealData
    res.json({ 
      success: true, 
      message: "Deal Created Successfully",
      deal: deal // Return the saved MongoDB document
    });

  } catch (error) {
    console.error("Add Deal Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ---------------- Update Deal ----------------

const updateDeal = async (req, res) => {
  try {
    const {
      id,
      dealName,
      dealDescription,
      dealDiscountType,
      dealDiscountValue,
      dealProducts,
      dealTotal,
      dealFinalPrice,
      dealStartDate,
      dealEndDate,
      dealType,
      status,
      removedImages
    } = req.body;

    console.log("=== UPDATE DEAL ===");
    console.log("Request body:", req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Deal ID is required",
      });
    }

    // Get the existing deal
    const existingDeal = await dealModel.findById(id);
    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // ====== BASIC FIELD UPDATES ======
    const updateData = {
      dealName,
      dealDescription: dealDescription || "",
      dealDiscountType: dealDiscountType || "percentage",
      dealDiscountValue: Number(dealDiscountValue),
      dealTotal: Number(dealTotal || 0),
      dealFinalPrice: Number(dealFinalPrice || 0),
      dealStartDate: dealStartDate ? new Date(dealStartDate) : new Date(),
      dealEndDate: dealEndDate ? new Date(dealEndDate) : null,
      dealType: dealType || "flash_sale",
      status: status || "draft",
    };

    // ====== DEAL PRODUCTS ======
    if (dealProducts) {
      let parsedProducts = [];
      try {
        parsedProducts =
          typeof dealProducts === "string"
            ? JSON.parse(dealProducts)
            : dealProducts;
      } catch (err) {
        console.error("Error parsing dealProducts:", err);
        return res.status(400).json({
          success: false,
          message: "Invalid dealProducts format",
        });
      }
      updateData.dealProducts = parsedProducts;
    }

    // ====== IMAGE HANDLING ======
    let finalImages = [...(existingDeal.dealImages || [])];

    // --- Step 1: Remove selected images ---
    let removedImageUrls = [];
    try {
      removedImageUrls =
        typeof removedImages === "string"
          ? JSON.parse(removedImages)
          : removedImages || [];
    } catch (err) {
      console.error("Error parsing removedImages:", err);
    }

    if (removedImageUrls.length > 0) {
      console.log("🔸 Removing deal images:", removedImageUrls);

      const getPublicId = (url) => {
        const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)\.\w+$/);
        return match ? match[1] : null;
      };

      const removedPublicIds = removedImageUrls.map(getPublicId).filter(Boolean);

      finalImages = finalImages.filter((url) => {
        const publicId = getPublicId(url);
        return !removedPublicIds.includes(publicId);
      });

      // Delete removed images from Cloudinary
      for (const publicId of removedPublicIds) {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          console.log("✅ Deleted from Cloudinary:", publicId, result.result);
        } catch (err) {
          console.error("❌ Error deleting from Cloudinary:", err);
        }
      }
    }

    // --- Step 2: Add new images (append, not replace) ---
    if (req.files && Object.keys(req.files).length > 0) {
      const newImages = Object.keys(req.files)
        .filter((key) => key.startsWith("dealImage"))
        .map((key) => req.files[key][0])
        .filter(Boolean);

      if (newImages.length > 0) {
        console.log("📤 Uploading new deal images:", newImages.length);
        const newImageUrls = await Promise.all(
          newImages.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
              resource_type: "image",
              folder: "deals",
            });
            return result.secure_url;
          })
        );
        finalImages = [...finalImages, ...newImageUrls];
      }
    }

    updateData.dealImages = finalImages;

    // ====== UPDATE IN DATABASE ======
    const updatedDeal = await dealModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    console.log("✅ DEAL UPDATED SUCCESSFULLY");
    console.log("Final image count:", finalImages.length);

    res.json({
      success: true,
      message: "Deal Updated Successfully",
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Update Deal Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- List Deals ----------------
const listDeals = async (req, res) => {
  try {
    const deals = await dealModel.find({}).sort({ date: -1 });
    res.json({ 
      success: true, 
      deals,
      count: deals.length 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ---------------- Remove Deal ----------------
const removeDeal = async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Deal ID is required" 
      });
    }

    const deal = await dealModel.findByIdAndDelete(id);
    
    if (!deal) {
      return res.status(404).json({ 
        success: false, 
        message: "Deal not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Deal Removed Successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ---------------- Get Single Deal ----------------
const singleDeal = async (req, res) => {
  try {
    const { dealId } = req.body;
    
    if (!dealId) {
      return res.status(400).json({ 
        success: false, 
        message: "Deal ID is required" 
      });
    }

    const deal = await dealModel.findById(dealId);
    
    if (!deal) {
      return res.status(404).json({ 
        success: false, 
        message: "Deal not found" 
      });
    }

    res.json({ 
      success: true, 
      deal 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ---------------- Update Deal Status ----------------
const updateDealStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    console.log("=== UPDATE DEAL STATUS ===");
    console.log("Request body:", req.body);

    if (!id || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Deal ID and status are required" 
      });
    }

    const validStatuses = ['draft', 'published', 'archived', 'scheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Must be: draft, published, archived, or scheduled" 
      });
    }

    const updatedDeal = await dealModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedDeal) {
      return res.status(404).json({ 
        success: false, 
        message: "Deal not found" 
      });
    }

    console.log("Deal status updated successfully:", updatedDeal);

    res.json({ 
      success: true, 
      message: "Deal status updated successfully",
      deal: updatedDeal
    });

  } catch (error) {
    console.error("Update Deal Status Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export {
  addDeal,
  listDeals,
  removeDeal,
  singleDeal,
  updateDeal,
  updateDealStatus
};