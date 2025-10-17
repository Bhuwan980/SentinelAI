import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import MainLayout from "./MainLayout";

export default function MatchHistory() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin", { replace: true });
          return;
        }

        const imagesRes = await axios.get(`${import.meta.env.VITE_API_URL}/ip/my-images`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const matchesRes = await axios.get(`${import.meta.env.VITE_API_URL}/ip/match-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const matchesData = Array.isArray(matchesRes.data) ? matchesRes.data : matchesRes.data.matches || [];
        const imagesData = imagesRes.data.images || [];

        const matchImageIds = new Set(matchesData.map((match) => match.source_image_id));
        const filteredImages = imagesData.filter((image) => matchImageIds.has(image.id));

        setImages(filteredImages);
        setMatches(matchesData);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("profile");
          navigate("/signin", { replace: true });
          return;
        }
        setError(`Failed to fetch data: ${err.response?.data?.detail || err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading match history...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 mb-2">Error Loading Match History</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition mr-3"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (images.length === 0) {
    return (
      <MainLayout>
        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Match History</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Matches Yet</h3>
              <p className="text-gray-500 mb-6">
                Upload images and run detection to find potential IP matches.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h2 className="text-3xl font-extrabold text-gray-800">Match History</h2>
            <p className="text-gray-600">Review all matches found for your uploaded images.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Images</h3>
              <div className="space-y-4">
                {images.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    isSelected={selectedImageId === image.id}
                    onSelect={() => setSelectedImageId(image.id)}
                    onViewMatches={() => navigate(`/matches-confirm/${image.id}`)}
                    onImageError={handleImageError}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Matches for Image #{selectedImageId || images[0]?.id}
              </h3>
              {selectedImageId ? (
                matches
                  .filter((match) => match.source_image_id === selectedImageId)
                  .map((match, index) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      index={index}
                      onImageError={handleImageError}
                      onViewDetails={() => navigate(`/matches-confirm/${match.source_image_id}`)}
                    />
                  ))
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Select an Image</h3>
                  <p className="text-gray-500">Choose an image to view its matches.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function ImageCard({ image, isSelected, onSelect, onViewMatches, onImageError }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white rounded-xl border ${
        isSelected ? "border-emerald-400 shadow-md" : "border-gray-200 shadow-sm"
      } overflow-hidden hover:shadow-md transition cursor-pointer`}
      onClick={onSelect}
    >
      <div className="h-48 bg-gray-100">
        <img
          src={image.image_url || "https://via.placeholder.com/300?text=Image+Not+Available"}
          alt={image.img_alt || "Uploaded image"}
          className="w-full h-full object-contain"
          onError={onImageError}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 truncate">
          {image.page_title || "Untitled Image"}
        </h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>ID: {image.id}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(image.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={onViewMatches}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          View Matches
        </button>
      </div>
    </motion.div>
  );
}

function MatchCard({ match, index, onImageError, onViewDetails }) {
  const getConfirmationStatus = () => {
    if (match.user_confirmed === null) return { text: "Pending", color: "yellow" };
    if (match.user_confirmed) return { text: "Confirmed", color: "green" };
    return { text: "Rejected", color: "red" };
  };

  const status = getConfirmationStatus();
  const statusColors = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
    >
      <div className="h-48 bg-gray-100 relative">
        <img
          src={match.matched_image_url || "https://via.placeholder.com/300?text=Match+Image"}
          alt="Matched image"
          className="w-full h-full object-contain"
          onError={onImageError}
        />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColors[status.color]}`}>
            {status.text}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Match ID:</span>
            <span className="font-medium text-gray-800">#{match.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Similarity:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${(match.similarity_score || 0) * 100}%` }}
                ></div>
              </div>
              <span className="font-bold text-emerald-600">
                {((match.similarity_score || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Detected:</span>
            <span className="text-sm text-gray-800">
              {new Date(match.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {match.user_confirmed === null && (
          <button
            onClick={onViewDetails}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            Review Match
          </button>
        )}
        {match.user_confirmed !== null && (
          <button
            onClick={onViewDetails}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition font-medium"
          >
            View Details
          </button>
        )}
      </div>
    </motion.div>
  );
}