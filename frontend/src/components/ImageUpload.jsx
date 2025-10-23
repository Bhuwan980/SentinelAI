// src/components/ImageUpload.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_CONFIG, buildUrl, getAuthHeadersForUpload } from "../config/api";
import Button from "./ui/Button";
import { ErrorAlert, SuccessAlert } from "./ui/Alert";

export default function ImageUpload({ metrics, setMetrics }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setError("No file selected");
      setFile(null);
      setPreview(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file");
      setFile(null);
      setPreview(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      setFile(null);
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
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

    try {
      // Use the runPipeline endpoint to upload and detect matches
      const res = await axios.post(
        buildUrl(API_CONFIG.endpoints.runPipeline),
        formData,
        {
          headers: getAuthHeadersForUpload(),
          timeout: 120000, // 2 minutes timeout for pipeline processing
        }
      );

      console.log("Pipeline response:", res.data);

      if (res.data.success) {
        // Update metrics
        setMetrics((prev) => ({
          ...prev,
          uploads: prev.uploads + 1,
          matches: prev.matches + (res.data.matches?.length || 0),
        }));

        // Navigate to matches confirmation page with the results
        navigate(`/matches-confirm/${res.data.image_id}`, {
          state: { 
            matches: res.data.matches || [], 
            image_id: res.data.image_id 
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
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.detail || "Invalid file or request");
      } else if (err.response?.status === 500) {
        setError(err.response?.data?.detail || "Server error while processing image");
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timeout. The image is taking too long to process. Please try again.");
      } else {
        setError(err.response?.data?.detail || err.message || "Failed to upload and detect matches");
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
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-500 transition bg-gray-50 hover:bg-blue-50 group"
        >
          {preview ? (
            <div className="relative w-full h-full p-6">
              <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute top-8 right-8 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-700 shadow-lg"
              >
                ✕
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-4xl border border-blue-200 group-hover:scale-110 transition-transform">
                📤
              </div>
              <p className="mb-2 text-lg font-semibold text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, GIF, WebP (max 10MB)</p>
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

      {/* Error Alert */}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      {/* File Info */}
      {file && (
        <SuccessAlert>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Selected: {file.name}</p>
              <p className="text-xs mt-1">Size: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        </SuccessAlert>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        loading={uploading}
        size="lg"
        className="w-full"
        icon={
          !uploading && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )
        }
      >
        {uploading ? "Processing Pipeline..." : "Upload & Detect IP Matches"}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Your image will be analyzed using AI to detect potential copyright matches. This may take 30-60 seconds.
      </p>
    </div>
  );
}