/* eslint-disable no-undef */
const cloudinary = require("../config/cloudinary");

const uploadRecipeImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one image",
      });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "foodrecipe/recipes",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    return res.status(200).json({
      message: "Images uploaded successfully",
      images: imageUrls,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    return res.status(500).json({
      message: "Failed to upload images",
    });
  }
};

module.exports = {
  uploadRecipeImages,
};