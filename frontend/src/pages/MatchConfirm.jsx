// src/pages/MatchesConfirm.jsx - UPDATED for Review History
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../components/layout/MainLayout";
import { buildUrl, getAuthHeaders, API_CONFIG } from "../config/api";
import theme from "../config/theme";
import { usePageTitle } from "../hook/userPageTitle";

export default function MatchesConfirm() {
  usePageTitle("Match Confirm")
  const { imageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [originalImage, setOriginalImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [processingStatus, setProcessingStatus] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please log in to view matches.");

        // Check if matches were passed via navigation state (from upload)
        if (location.state?.matches && location.state?.image_id) {
          // Filter to show only pending matches
          const pendingMatches = (location.state.matches || []).filter(
            match => match.status === 'pending' || !match.status
          );
          setMatches(pendingMatches);
          
          // Fetch the original image details
          const imageRes = await axios.get(buildUrl(API_CONFIG.endpoints.myImages), {
            headers: getAuthHeaders(),
          });
          const images = imageRes.data.images || [];
          const original = images.find((img) => img.id === parseInt(imageId));
          setOriginalImage(original || null);
          setLoading(false);
        } else {
          // Fetch from API if not in state
          const imageRes = await axios.get(buildUrl(API_CONFIG.endpoints.myImages), {
            headers: getAuthHeaders(),
          });
          const images = imageRes.data.images || [];
          const original = images.find((img) => img.id === parseInt(imageId));
          setOriginalImage(original || null);

          // ✅ Fetch matches (backend now returns only pending matches)
          const response = await axios.get(
            buildUrl(API_CONFIG.endpoints.matches(imageId)),
            {
              headers: getAuthHeaders(),
            }
          );
          setMatches(response.data.matches || []);
          setLoading(false);
        }
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
  }, [imageId, navigate, location.state]);

  // ✅ UPDATED: New confirm/decline function using action-based API
  const handleConfirm = async (matchId, action) => {
    try {
      setConfirmingId(matchId);
      setProcessingStatus(prev => ({ 
        ...prev, 
        [matchId]: action === 'confirm' ? 'scraping' : 'rejecting' 
      }));

      // ✅ NEW API FORMAT: Send action instead of user_confirmed
      const response = await axios.post(
        buildUrl(API_CONFIG.endpoints.confirmMatch(matchId)),
        { action: action },  // 'confirm' or 'decline'
        { 
          headers: getAuthHeaders()
        }
      );

      // Show success message
      if (action === 'confirm') {
        setProcessingStatus(prev => ({ ...prev, [matchId]: 'generating' }));
        setSuccessMessage("✅ Match confirmed! DMCA report generated successfully!");
        
        // Wait a bit to show the success message
        setTimeout(() => {
          // Remove from matches list
          setMatches(prev => prev.filter((match) => match.id !== matchId));
          setSuccessMessage("");
          
          // Navigate to reports after a short delay
          setTimeout(() => {
            navigate("/reports", { 
              state: { fromConfirm: true, message: "New DMCA report created!" } 
            });
          }, 1000);
        }, 1500);
      } else {
        setSuccessMessage("✅ Match declined and moved to history");
        setTimeout(() => {
          // Remove from matches list
          setMatches(prev => prev.filter((match) => match.id !== matchId));
          setSuccessMessage("");
          
          // Check if there are more matches
          if (matches.length <= 1) {
            setTimeout(() => {
              navigate("/review-history", {
                state: { message: "All matches reviewed!" }
              });
            }, 1000);
          }
        }, 1000);
      }
      
    } catch (err) {
      setError(`Failed to update match: ${err.response?.data?.detail || err.message}`);
      setProcessingStatus(prev => ({ ...prev, [matchId]: null }));
      
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("profile");
        navigate("/signin", { replace: true });
      }
    } finally {
      setConfirmingId(null);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const handleConfirmClick = (matchId) => {
    setPendingAction({ matchId, action: 'confirm' });
    setShowConfirmDialog(true);
  };

  const handleDeclineClick = (matchId) => {
    handleConfirm(matchId, 'decline');
  };

  const handleConfirmProceed = () => {
    if (pendingAction) {
      handleConfirm(pendingAction.matchId, pendingAction.action);
    }
  };

  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            <p className="text-gray-700 text-lg font-medium">Loading matches...</p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (error && !successMessage) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-white border border-red-200 rounded-2xl p-8 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{theme.icons.error}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-xl mb-3">Error Loading Matches</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-xl hover:from-red-700 hover:to-red-800 transition font-semibold shadow-md"
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

  // ✅ NEW: Empty state when all matches are reviewed
  if (matches.length === 0 && !loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full bg-white border border-gray-200 rounded-2xl p-12 shadow-lg text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="font-bold text-gray-900 text-2xl mb-3">All Matches Reviewed!</h3>
            <p className="text-gray-600 mb-8">
              You've reviewed all potential matches for this image. Check your review history or reports.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/review-history")}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition font-semibold shadow-md"
              >
                View Review History
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl hover:border-gray-400 transition font-semibold"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Success Message Toast */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-6 right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-green-400 max-w-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    ✓
                  </div>
                  <p className="font-semibold">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-900 transition mb-6 flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-5xl font-bold text-gray-900 mb-3 flex items-center gap-4">
                  <span className="text-6xl">🔍</span>
                  Review Potential Matches
                </h1>
                <p className="text-gray-600 text-lg">
                  Confirm or decline copyright infringement for Image #{imageId}
                </p>
              </div>
              
              {/* ✅ NEW: Remaining matches counter */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl shadow-lg">
                <p className="text-sm font-medium opacity-90">Pending Reviews</p>
                <p className="text-3xl font-bold">{matches.length}</p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {matches.map((match, index) => (
              <MatchCard
                key={match.id}
                match={match}
                index={index}
                originalImage={originalImage}
                confirmingId={confirmingId}
                processingStatus={processingStatus}
                onConfirm={handleConfirmClick}
                onDecline={handleDeclineClick}
                onImageError={handleImageError}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Confirm Match?</h3>
                  <p className="text-gray-600 text-sm">
                    This will generate a DMCA takedown notice for this match. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmProceed}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 font-semibold transition shadow-md"
                >
                  Yes, Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

function MatchCard({ match, index, originalImage, confirmingId, processingStatus, onConfirm, onDecline, onImageError }) {
  const isProcessing = confirmingId === match.id;
  const status = processingStatus[match.id];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl shadow-card border border-gray-200 overflow-hidden mb-8 relative"
    >
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            </div>
            <p className="text-gray-700 font-semibold text-lg">
              {status === 'scraping' && '🔍 Analyzing match...'}
              {status === 'generating' && '📄 Generating DMCA report...'}
              {status === 'rejecting' && '✕ Declining match...'}
            </p>
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Match Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">⚖️</span>
            Match #{match.id}
          </h3>
          <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl font-semibold text-sm border border-yellow-200">
            ⏳ Pending Review
          </span>
        </div>

        {/* Image Comparison */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <ImagePanel
            title="Your Original Image"
            icon="📸"
            color="primary"
            image={originalImage}
            onImageError={onImageError}
          />
          <ImagePanel
            title="Potential Match Found"
            icon="🎯"
            color="danger"
            image={{ ...match, url: match.source_url }}
            onImageError={onImageError}
            showUrl={true}
          />
        </div>

        {/* Similarity Score */}
        <SimilarityBadge score={match.similarity_score || 0} />

        {/* Match Details */}
        <div className="mt-6 bg-gray-50 rounded-xl p-5 space-y-3 border border-gray-200">
          <DetailRow label="Match ID" value={`#${match.id}`} />
          <DetailRow label="Detected" value={new Date(match.created_at).toLocaleString()} />
          {match.source_url && (
            <DetailRow 
              label="Source URL" 
              value={
                <a 
                  href={match.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {match.source_url}
                </a>
              } 
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onConfirm(match.id)}
            disabled={isProcessing}
            className={`flex-1 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg transition shadow-md ${
              isProcessing
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 hover:shadow-lg hover:shadow-green-500/30"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Confirm Match
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDecline(match.id)}
            disabled={isProcessing}
            className={`flex-1 px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 text-lg transition shadow-md ${
              isProcessing
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/30"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Not a Match
          </motion.button>
        </div>

        {/* Warning Note */}
        <div className="mt-5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-xs text-yellow-900 leading-relaxed">
            <span className="font-semibold">{theme.icons.warning} Important:</span> Confirming will automatically generate a DMCA takedown notice. 
            Only confirm if you're certain this is unauthorized use of your copyrighted work.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SimilarityBadge({ score }) {
  const percentage = (score * 100).toFixed(1);
  const getColor = () => {
    if (score >= 0.9) return { 
      bg: "from-red-50 to-rose-50", 
      text: "text-red-700", 
      border: "border-red-200",
      barBg: "from-red-500 to-rose-600",
      label: "Very High"
    };
    if (score >= 0.7) return { 
      bg: "from-orange-50 to-yellow-50", 
      text: "text-orange-700", 
      border: "border-orange-200",
      barBg: "from-orange-500 to-yellow-600",
      label: "High"
    };
    return { 
      bg: "from-yellow-50 to-amber-50", 
      text: "text-yellow-700", 
      border: "border-yellow-200",
      barBg: "from-yellow-500 to-amber-600",
      label: "Medium"
    };
  };
  
  const colors = getColor();

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} px-5 py-4`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-600">Similarity Score</p>
        <span className={`text-xs font-bold ${colors.text} px-2 py-1 rounded-full bg-white/50`}>
          {colors.label}
        </span>
      </div>
      <p className={`text-4xl font-bold ${colors.text}`}>{percentage}%</p>
      <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${colors.barBg}`}
        ></motion.div>
      </div>
    </div>
  );
}

function ImagePanel({ title, icon, color, image, onImageError, showUrl = false }) {
  const borderColors = {
    primary: "border-blue-200",
    danger: "border-red-200",
  };

  const bgColors = {
    primary: "from-blue-50 to-cyan-50",
    danger: "from-red-50 to-rose-50",
  };

  const headerBgColors = {
    primary: "from-blue-500 to-blue-600",
    danger: "from-red-500 to-red-600",
  };

  const getImageUrl = () => {
    if (!image) return "https://via.placeholder.com/300?text=Image+Not+Available";
    return image.image_url || image.url || image.matched_image_url || "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  const getImageAlt = () => {
    if (!image) return "Image not available";
    return image.img_alt || image.caption || image.page_title || "Image";
  };

  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${borderColors[color]} bg-white shadow-card`}>
      <div className={`px-5 py-4 bg-gradient-to-r ${headerBgColors[color]} border-b-2 ${borderColors[color]}`}>
        <h4 className="font-bold text-white flex items-center gap-2 text-lg">
          <span className="text-2xl">{icon}</span>
          {title}
        </h4>
      </div>
      <div className="p-5">
        <div className="relative bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-200" style={{ height: "350px" }}>
          {image ? (
            <img
              src={getImageUrl()}
              alt={getImageAlt()}
              className="w-full h-full object-contain"
              onError={onImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-5xl mb-3">🖼️</div>
                <p className="text-sm font-medium">Image not found</p>
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
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline break-all transition bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 font-medium w-full"
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
      <span className="text-sm font-medium text-gray-600 min-w-[90px]">{label}:</span>
      <span className="text-sm text-gray-900 flex-1 font-semibold break-words">
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );
}