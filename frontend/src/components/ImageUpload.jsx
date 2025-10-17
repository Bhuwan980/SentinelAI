import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ImageUpload({ metrics, setMetrics }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Validate file
    if (!selectedFile) {
      setError("No file selected");
      setFile(null);
      setPreview(null);
      return;
    }

    // Check file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      setFile(null);
      setPreview(null);
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError("Image size must be less than 10MB");
      setFile(null);
      setPreview(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to upload images");
      navigate("/signin");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    // ✅ REMOVED: formData.append("user_id", 2);
    // Backend gets user_id from JWT token via current_user dependency

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/ip/run-pipeline`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - axios will set it automatically with boundary
          },
          timeout: 120000, // 2 minute timeout for processing
        }
      );

      console.log("Upload response:", res.data);

      if (res.data.success) {
        // Update metrics
        setMetrics((prev) => ({
          ...prev,
          uploads: prev.uploads + 1,
          matches: prev.matches + (res.data.matches?.length || 0),
        }));

        // Navigate to matches page
        navigate(`/matches-confirm/${res.data.image_id}`, {
          state: {
            matches: res.data.matches || [],
            image_id: res.data.image_id,
          },
        });
      } else {
        setError(res.data.error || "Failed to process image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("profile");
        setTimeout(() => navigate("/signin"), 2000);
      } else if (err.code === "ECONNABORTED") {
        setError("Upload timeout. Please try with a smaller image.");
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          "Failed to upload image. Please try again."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError("");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* File Input */}
      <div className="w-full max-w-md">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition bg-gray-50 hover:bg-emerald-50"
        >
          {preview ? (
            <div className="relative w-full h-full p-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleClear();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF, WebP (max 10MB)
              </p>
            </div>
          )}
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="w-full max-w-md bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Selected:</span> {file.name}
          </p>
          <p className="text-xs text-emerald-600">
            Size: {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`w-full max-w-md px-6 py-3 rounded-lg text-white font-semibold transition ${
          !file || uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-md"
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          "Upload & Detect IP Matches"
        )}
      </button>

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center max-w-md">
        Your image will be analyzed using AI to detect potential copyright matches.
        This process may take 30-60 seconds.
      </p>
    </div>
  );
}