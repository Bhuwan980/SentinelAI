// src/pages/Matches.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import MainLayout from "../components/layout/MainLayout";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import { usePageTitle } from "../hook/userPageTitle";

export default function Matches() {
  usePageTitle("Matches");
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      const response = await axios.get(buildUrl(API_CONFIG.endpoints.myImages), {
        headers: getAuthHeaders(),
      });

      setImages(response.data.images || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("profile");
        navigate("/signin", { replace: true });
        return;
      }
      setError(`Failed to fetch images: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            </div>
            <p className="text-gray-700 text-lg font-medium">Loading your images...</p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-white border border-red-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xl mb-3">Error Loading Images</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-xl hover:from-red-700 hover:to-red-800 transition font-semibold shadow-md">
                  Back to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (images.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">🖼️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Images Yet</h3>
            <p className="text-gray-600 mb-8">Upload an image to start detecting potential copyright infringement</p>
            <button onClick={() => navigate("/dashboard")} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition font-semibold shadow-md">
              Go to Dashboard
            </button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
            <button onClick={() => navigate("/dashboard")} className="text-gray-600 hover:text-gray-900 transition mb-6 flex items-center gap-2 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>

            <h1 className="text-5xl font-bold text-gray-900 mb-3 flex items-center gap-4">
              <span className="text-6xl">🔍</span>
              Review Matches
            </h1>
            <p className="text-gray-600 text-lg">Select an image to review potential copyright matches</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <motion.div key={image.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02, y: -4 }} onClick={() => navigate(`/matches-confirm/${image.id}`)} className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all">
                <div className="relative h-64 bg-gray-100">
                  <img src={image.image_url} alt={image.page_title} className="w-full h-full object-cover" onError={handleImageError} />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{image.page_title || "Untitled"}</h3>
                  <p className="text-sm text-gray-500 mb-4">Uploaded {new Date(image.created_at).toLocaleDateString()}</p>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition font-semibold flex items-center justify-center gap-2 shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Review Matches
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}