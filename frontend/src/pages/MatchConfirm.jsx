import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import MainLayout from "./MainLayout";

export default function MatchesConfirm() {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [originalImage, setOriginalImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [scrapingMetadata, setScrapingMetadata] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please log in to view matches.");

        const imageRes = await axios.get(`${import.meta.env.VITE_API_URL}/ip/my-images`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const images = imageRes.data.images || [];
        const original = images.find((img) => img.id === parseInt(imageId));
        setOriginalImage(original || null);

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/ip/matches/${imageId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMatches(response.data.matches || []);
        setLoading(false);
      } catch (err) {
        setError(`Failed to fetch data: ${err.response?.data?.detail || err.message}`);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("profile");
          navigate("/signin", { replace: true });
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [imageId, navigate]);

  const handleConfirm = async (matchId, userConfirmed) => {
    try {
      setConfirmingId(matchId);
      const token = localStorage.getItem("token");
      
      if (userConfirmed) {
        setScrapingMetadata((prev) => ({ ...prev, [matchId]: true }));
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ip/confirm-match/${matchId}`,
        { user_confirmed: userConfirmed },
        { 
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json" 
          } 
        }
      );
      
      setMatches(matches.filter((match) => match.id !== matchId));
      
      setScrapingMetadata((prev) => ({ ...prev, [matchId]: false }));
      
      if (userConfirmed) {
        setTimeout(() => {
          navigate("/reports");
        }, 1500);
      }
    } catch (err) {
      setError(`Failed to update match: ${err.response?.data?.detail || err.message}`);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("profile");
        navigate("/signin", { replace: true });
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <p className="text-emerald-100 text-lg font-medium">Loading matches...</p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-gradient-to-br from-red-950/50 to-rose-900/30 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-100 text-xl mb-3">Error Loading Matches</h3>
                <p className="text-red-200/80 mb-6">{error}</p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-rose-700 transition font-medium shadow-lg shadow-red-500/20"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="group inline-flex items-center gap-2 text-emerald-300/70 hover:text-emerald-300 transition mb-6"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-3">
              Confirm Matches
            </h2>
            <p className="text-emerald-200/60 text-lg">Review and confirm potential matches for your uploaded image.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ImagePanel
                title="Your Uploaded Image"
                icon="🖼️"
                color="green"
                image={originalImage}
                onImageError={handleImageError}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {matches.length === 0 ? (
                <div className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl border border-emerald-500/10 p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-100 mb-3">No Matches Found</h3>
                  <p className="text-emerald-200/60">No potential matches were detected for this image.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {matches.map((match, index) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      index={index}
                      onImageError={handleImageError}
                      onConfirm={() => handleConfirm(match.id, true)}
                      onReject={() => handleConfirm(match.id, false)}
                      isConfirming={confirmingId === match.id}
                      isScraping={scrapingMetadata[match.id]}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function MatchCard({ match, index, onImageError, onConfirm, onReject, isConfirming, isScraping }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="group bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl border border-emerald-500/10 overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/20 transition-all"
    >
      <ImagePanel
        title="Potential Match"
        icon="🚨"
        color="red"
        image={match}
        onImageError={onImageError}
        showUrl={true}
      />
      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <SimilarityBadge score={match.similarity_score || 0} />
          <div className="space-y-3">
            <DetailRow label="Match ID" value={`#${match.id}`} />
            <DetailRow
              label="Detected"
              value={new Date(match.created_at).toLocaleString()}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex-1 py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg ${
              isConfirming
                ? "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
            }`}
          >
            {isScraping ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Report...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Confirm & Generate Report
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReject}
            disabled={isConfirming}
            className={`flex-1 py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg ${
              isConfirming
                ? "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-red-500/25"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Reject
          </motion.button>
        </div>
        <div className="mt-5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-4 backdrop-blur-sm">
          <p className="text-xs text-yellow-200/90 leading-relaxed">
            <span className="font-semibold">⚠️ Note:</span> Confirming will scrape metadata from the 
            suspected page and generate a legal DMCA takedown notice. Make sure this is truly 
            an unauthorized use of your work.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SimilarityBadge({ score }) {
  const percentage = (score * 100).toFixed(1);
  const getColor = () => {
    if (score >= 0.9) return { bg: "from-red-500/20 to-rose-500/20", text: "text-red-300", border: "border-red-500/30" };
    if (score >= 0.7) return { bg: "from-orange-500/20 to-yellow-500/20", text: "text-orange-300", border: "border-orange-500/30" };
    return { bg: "from-yellow-500/20 to-amber-500/20", text: "text-yellow-300", border: "border-yellow-500/30" };
  };
  
  const colors = getColor();

  return (
    <div className={`bg-gradient-to-br ${colors.bg} backdrop-blur-xl rounded-2xl border ${colors.border} px-5 py-4`}>
      <p className="text-xs font-medium text-emerald-200/70 mb-2">Similarity Score</p>
      <p className={`text-4xl font-bold ${colors.text}`}>{percentage}%</p>
      <div className="mt-3 h-2 bg-slate-800/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${colors.bg.replace('/20', '')}`}
        ></motion.div>
      </div>
    </div>
  );
}

function ImagePanel({ title, icon, color, image, onImageError, showUrl = false }) {
  const borderColors = {
    green: "border-emerald-500/30",
    red: "border-red-500/30",
  };

  const bgColors = {
    green: "from-emerald-500/20 to-teal-500/20",
    red: "from-red-500/20 to-rose-500/20",
  };

  const getImageUrl = () => {
    if (!image) return "https://via.placeholder.com/300?text=Image+Not+Available";
    return image.image_url || image.url || "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  const getImageAlt = () => {
    if (!image) return "Image not available";
    return image.img_alt || image.caption || "Image";
  };

  return (
    <div className={`border-2 rounded-3xl overflow-hidden ${borderColors[color]} bg-gradient-to-br from-slate-900/30 to-transparent backdrop-blur-sm`}>
      <div className={`px-5 py-4 bg-gradient-to-r ${bgColors[color]} backdrop-blur-xl border-b-2 ${borderColors[color]}`}>
        <h4 className="font-bold text-emerald-100 flex items-center gap-2 text-lg">
          <span className="text-2xl">{icon}</span>
          {title}
        </h4>
      </div>
      <div className="p-5">
        <div className="relative bg-slate-900/50 rounded-2xl overflow-hidden mb-4" style={{ height: "350px" }}>
          {image ? (
            <img
              src={getImageUrl()}
              alt={getImageAlt()}
              className="w-full h-full object-contain"
              onError={onImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald-200/40">
              <div className="text-center">
                <div className="text-5xl mb-3">🖼️</div>
                <p className="text-sm">Image not found</p>
              </div>
            </div>
          )}
        </div>
        {showUrl && image?.url && (
          <motion.a
            whileHover={{ scale: 1.02 }}
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline break-all transition bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2.5 backdrop-blur-sm"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="truncate">View Source</span>
          </motion.a>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm font-medium text-emerald-200/70 min-w-[90px]">{label}:</span>
      <span className="text-sm text-emerald-100 flex-1 font-medium">
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );
}