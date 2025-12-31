import multer from "multer";

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    callback(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
  }
});

// Add limits configuration
const upload = multer({ 
  storage,
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10MB
    fileSize: 10 * 1024 * 1024, // 10MB per file
    fields: 50,
    files: 10,
  }
});

// Special upload for banners that accepts both desktop and mobile images
export const bannerUpload = upload.fields([
  { name: 'desktopImage', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 }
]);

export default upload;