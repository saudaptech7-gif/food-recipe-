import { useState } from "react";

function CloudinaryTest() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.length > 6) {
      setMessage("You can select maximum 6 images.");
      return;
    }

    setImages(selectedFiles);
    setMessage("");
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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Cloudinary Image Test</h1>

        <p style={styles.subtitle}>
          Select up to 6 images and upload them to Cloudinary.
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />

        {images.length > 0 && (
          <p style={styles.selected}>
            {images.length} image{images.length > 1 ? "s" : ""} selected
          </p>
        )}

        <button onClick={handleUpload} disabled={loading} style={styles.button}>
          {loading ? "Uploading..." : "Upload Images"}
        </button>

        {message && <p style={styles.message}>{message}</p>}

        {uploadedImages.length > 0 && (
          <div style={styles.results}>
            <h2>Uploaded Images</h2>

            {uploadedImages.map((url, index) => (
              <div key={index} style={styles.imageBox}>
                <img
                  src={url}
                  alt={`Uploaded ${index + 1}`}
                  style={styles.image}
                />

                <p style={styles.url}>{url}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f7f7f7",
    padding: "40px 20px",
    fontFamily: "Poppins, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "700px",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  },

  subtitle: {
    color: "#666",
    marginBottom: "25px",
  },

  selected: {
    marginTop: "15px",
    fontWeight: "500",
  },

  button: {
    marginTop: "20px",
    padding: "12px 22px",
    border: "none",
    borderRadius: "8px",
    background: "#f97316",
    color: "#ffffff",
    fontSize: "16px",
    cursor: "pointer",
  },

  message: {
    marginTop: "20px",
    fontWeight: "500",
  },

  results: {
    marginTop: "30px",
  },

  imageBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#f5f5f5",
    borderRadius: "10px",
  },

  image: {
    width: "100%",
    maxHeight: "350px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  url: {
    marginTop: "10px",
    fontSize: "12px",
    wordBreak: "break-all",
    color: "#555",
  },
};

export default CloudinaryTest;
