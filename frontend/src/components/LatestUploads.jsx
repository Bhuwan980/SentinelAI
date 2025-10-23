// src/components/LatestUploads.jsx
import React from "react";
import { motion } from "framer-motion";
import Button from "./ui/Button";

export default function LatestUploads({ images, onViewMatches }) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center">
          <span className="text-4xl">📁</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">No Uploads Yet</h3>
        <p className="text-gray-600">Upload your first image to start protecting your IP.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((img, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
          <div className="relative h-64 bg-gray-50 overflow-hidden cursor-pointer group">
            <img
              src={img.image_url || "https://via.placeholder.com/300?text=Image+Not+Available"}
              alt={img.img_alt || "Uploaded image"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              onClick={() => window.open(img.image_url, "_blank")}
            />
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span className="text-lg">📤</span>
              <span className="truncate flex-1">{img.img_alt || "Uploaded"}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{new Date(img.created_at).toLocaleDateString()}</span>
            </div>
            <Button
              size="sm"
              onClick={() => onViewMatches(img.id)}
              className="w-full"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            >
              View Matches
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}