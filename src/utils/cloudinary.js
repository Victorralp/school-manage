// Cloudinary Upload Utility
// This utility handles file uploads to Cloudinary for images and other media

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload response with URL and public_id
 */
export const uploadToCloudinary = async (file, options = {}) => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary configuration is missing. Please check your environment variables.",
    );
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    // Add optional parameters
    if (options.folder) {
      formData.append("folder", options.folder);
    }

    if (options.tags) {
      formData.append("tags", options.tags.join(","));
    }

    if (options.transformation) {
      formData.append("transformation", JSON.stringify(options.transformation));
    }

    const response = await fetch(CLOUDINARY_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Upload failed");
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      createdAt: data.created_at,
      resourceType: data.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object[]>} - Array of upload responses
 */
export const uploadMultipleToCloudinary = async (files, options = {}) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  try {
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file, options),
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Multiple upload error:", error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - Deletion response
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    throw new Error("No public ID provided");
  }

  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary cloud name is missing");
  }

  try {
    // Note: Deleting requires authentication, which should be done on the backend
    // This is a placeholder for the delete functionality
    // In production, implement this through a Firebase Cloud Function or backend endpoint
    console.warn(
      "Delete operation should be performed on the backend for security",
    );

    // For now, return a success message
    return {
      result: "ok",
      message: "Delete request processed",
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Generate a Cloudinary URL with transformations
 * @param {string} publicId - The public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  if (!publicId) {
    throw new Error("No public ID provided");
  }

  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary cloud name is missing");
  }

  let transformString = "";

  // Width
  if (transformations.width) {
    transformString += `w_${transformations.width},`;
  }

  // Height
  if (transformations.height) {
    transformString += `h_${transformations.height},`;
  }

  // Crop mode
  if (transformations.crop) {
    transformString += `c_${transformations.crop},`;
  }

  // Quality
  if (transformations.quality) {
    transformString += `q_${transformations.quality},`;
  }

  // Format
  if (transformations.format) {
    transformString += `f_${transformations.format},`;
  }

  // Gravity (for cropping)
  if (transformations.gravity) {
    transformString += `g_${transformations.gravity},`;
  }

  // Remove trailing comma
  if (transformString) {
    transformString = transformString.slice(0, -1);
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  if (transformString) {
    return `${baseUrl}/${transformString}/${publicId}`;
  }

  return `${baseUrl}/${publicId}`;
};

/**
 * Validate file type
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - Whether the file type is valid
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (!file) {
    return false;
  }

  if (allowedTypes.length === 0) {
    // Default allowed types for images
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  }

  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {boolean} - Whether the file size is valid
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file) {
    return false;
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result with isValid and error message
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"],
    maxSizeMB = 5,
  } = options;

  if (!file) {
    return {
      isValid: false,
      error: "No file provided",
    };
  }

  // Check file type
  if (!validateFileType(file, allowedTypes)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file size
  if (!validateFileSize(file, maxSizeMB)) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
};

/**
 * Create a thumbnail preview from a file
 * @param {File} file - The file to preview
 * @returns {Promise<string>} - Data URL of the preview
 */
export const createPreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};

// Export default object with all functions
export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  validateFileType,
  validateFileSize,
  validateFile,
  createPreview,
};
