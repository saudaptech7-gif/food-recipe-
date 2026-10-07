import { useState } from "react";;

function CloudinaryTest() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.length > 6) {
      setMessage("You can select maximum 6 images.");
      setImages([]);
      return;
    }

    setImages(selectedFiles);
    setMessage("");
    setUploadedImages([]);
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      setMessage("Please select at least one image.");
      return;
    }

    const formData = new FormData();

    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      setLoading(true);
      setMessage("");
      setUploadedImages([]);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/recipes/upload-images`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Upload failed.");
        return;
      }

      setMessage("Images uploaded successfully!");
      setUploadedImages(data.images || []);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Something went wrong while uploading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cloudinary-page">
      <div className="cloudinary-card">
        <h1>Cloudinary Image Test</h1>

        <p className="cloudinary-subtitle">
          Select up to 6 images and upload them to Cloudinary.
        </p>

        <input
          className="cloudinary-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />

        {images.length > 0 && (
          <p className="cloudinary-selected">
            {images.length} image{images.length > 1 ? "s" : ""} selected
          </p>
        )}

        <button
          className="cloudinary-upload-button"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload Images"}
        </button>

        {message && <p className="cloudinary-message">{message}</p>}

        {uploadedImages.length > 0 && (
          <div className="cloudinary-results">
            <h2>Uploaded Images</h2>

            {uploadedImages.map((url, index) => (
              <div className="cloudinary-image-box" key={index}>
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  className="cloudinary-image"
                />

                <p className="cloudinary-url">{url}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CloudinaryTest;
