import { Banner } from "../models/bannerModel.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// 🟩 Get all banners (for admin)
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching banners",
      error: error.message,
    });
  }
};

// 🟩 Get active banners (for frontend)
export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active banners",
      error: error.message,
    });
  }
};

// 🟩 Get banner by ID
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }
    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching banner",
      error: error.message,
    });
  }
};

// 🟩 Create banner - Both desktop and mobile images required
export const createBanner = async (req, res) => {
  try {
    const {
      title = "",
      linkUrl,
      openInNewTab = false,
      isActive = true,
      order = 0,
    } = req.body;

    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    // Check for both desktop and mobile images
    if (!req.files || !req.files.desktopImage || !req.files.mobileImage) {
      return res.status(400).json({
        success: false,
        message: "Both desktop and mobile images are required",
        receivedFiles: req.files ? Object.keys(req.files) : 'No files'
      });
    }

    // Validate both images exist
    const desktopImage = req.files.desktopImage[0];
    const mobileImage = req.files.mobileImage[0];
    
    if (!desktopImage || !mobileImage) {
      return res.status(400).json({
        success: false,
        message: "Both desktop and mobile images must be provided"
      });
    }

    let desktopImageUrl = "";
    let desktopImagePublicId = "";
    let mobileImageUrl = "";
    let mobileImagePublicId = "";

    // Upload desktop image - NO TRANSFORMATIONS, keep original dimensions
    if (process.env.FILE_STORAGE === "local") {
      desktopImageUrl = `/uploads/${desktopImage.filename}`;
    } else {
      try {
        console.log('Uploading desktop image to Cloudinary...');
        // Upload without any transformations - keep original dimensions
        const desktopResult = await cloudinary.uploader.upload(desktopImage.path, {
          folder: "banners/desktop"
          // NO transformations - keep original size and dimensions
        });
        desktopImageUrl = desktopResult.secure_url;
        desktopImagePublicId = desktopResult.public_id;
        fs.unlinkSync(desktopImage.path);
        console.log('Desktop image uploaded:', desktopResult.secure_url);
      } catch (error) {
        console.error('Desktop upload error:', error);
        throw new Error(`Desktop image upload failed: ${error.message}`);
      }
    }

    // Upload mobile image - NO TRANSFORMATIONS, keep original dimensions
    if (process.env.FILE_STORAGE === "local") {
      mobileImageUrl = `/uploads/${mobileImage.filename}`;
    } else {
      try {
        console.log('Uploading mobile image to Cloudinary...');
        // Upload without any transformations - keep original dimensions
        const mobileResult = await cloudinary.uploader.upload(mobileImage.path, {
          folder: "banners/mobile"
          // NO transformations - keep original size and dimensions
        });
        mobileImageUrl = mobileResult.secure_url;
        mobileImagePublicId = mobileResult.public_id;
        fs.unlinkSync(mobileImage.path);
        console.log('Mobile image uploaded:', mobileResult.secure_url);
      } catch (error) {
        console.error('Mobile upload error:', error);
        throw new Error(`Mobile image upload failed: ${error.message}`);
      }
    }

    const banner = new Banner({
      title,
      desktopImageUrl,
      desktopImagePublicId,
      mobileImageUrl,
      mobileImagePublicId,
      linkUrl: linkUrl || "",
      openInNewTab,
      isActive,
      order,
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: "Banner created successfully with both images",
      data: banner,
    });
  } catch (error) {
    console.error('❌ Error creating banner:', error);
    
    // Clean up uploaded files if they exist
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating banner",
      error: error.message,
    });
  }
};

// 🟩 Update banner - Can update individual images or both
export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    const {
      title,
      linkUrl,
      openInNewTab,
      isActive,
      order,
    } = req.body;

    if (title !== undefined) banner.title = title;
    if (linkUrl !== undefined) banner.linkUrl = linkUrl;
    if (openInNewTab !== undefined) banner.openInNewTab = openInNewTab;
    if (isActive !== undefined) banner.isActive = isActive;
    if (order !== undefined) banner.order = order;

    // Update desktop image if provided
    if (req.files && req.files.desktopImage) {
      const desktopImage = req.files.desktopImage[0];
      
      // Delete old desktop image if exists
      if (banner.desktopImagePublicId && process.env.FILE_STORAGE !== "local") {
        await cloudinary.uploader.destroy(banner.desktopImagePublicId);
      }

      if (process.env.FILE_STORAGE === "local") {
        banner.desktopImageUrl = `/uploads/${desktopImage.filename}`;
      } else {
        // Upload new desktop image without transformations
        const desktopResult = await cloudinary.uploader.upload(desktopImage.path, {
          folder: "banners/desktop"
          // NO transformations - keep original dimensions
        });
        banner.desktopImageUrl = desktopResult.secure_url;
        banner.desktopImagePublicId = desktopResult.public_id;
        fs.unlinkSync(desktopImage.path);
      }
    }

    // Update mobile image if provided
    if (req.files && req.files.mobileImage) {
      const mobileImage = req.files.mobileImage[0];
      
      // Delete old mobile image if exists
      if (banner.mobileImagePublicId && process.env.FILE_STORAGE !== "local") {
        await cloudinary.uploader.destroy(banner.mobileImagePublicId);
      }

      if (process.env.FILE_STORAGE === "local") {
        banner.mobileImageUrl = `/uploads/${mobileImage.filename}`;
      } else {
        // Upload new mobile image without transformations
        const mobileResult = await cloudinary.uploader.upload(mobileImage.path, {
          folder: "banners/mobile"
          // NO transformations - keep original dimensions
        });
        banner.mobileImageUrl = mobileResult.secure_url;
        banner.mobileImagePublicId = mobileResult.public_id;
        fs.unlinkSync(mobileImage.path);
      }
    }

    await banner.save();

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error('❌ Error updating banner:', error);
    
    // Clean up uploaded files if they exist
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating banner",
      error: error.message,
    });
  }
};

// 🟩 Delete banner
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete images from Cloudinary if using cloud storage
    if (process.env.FILE_STORAGE !== "local") {
      if (banner.desktopImagePublicId) {
        await cloudinary.uploader.destroy(banner.desktopImagePublicId);
      }
      if (banner.mobileImagePublicId) {
        await cloudinary.uploader.destroy(banner.mobileImagePublicId);
      }
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error('❌ Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: "Error deleting banner",
      error: error.message,
    });
  }
};

// 🟩 Update banner order
export const updateBannerOrder = async (req, res) => {
  try {
    const { banners } = req.body; // array of { id, order }

    await Promise.all(
      banners.map((b) =>
        Banner.findByIdAndUpdate(b.id, { order: b.order }, { new: true })
      )
    );

    res.json({
      success: true,
      message: "Banner order updated successfully",
    });
  } catch (error) {
    console.error('❌ Error updating banner order:', error);
    res.status(500).json({
      success: false,
      message: "Error updating banner order",
      error: error.message,
    });
  }
};