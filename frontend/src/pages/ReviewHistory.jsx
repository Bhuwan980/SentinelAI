// src/pages/ReviewHistory.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "../components/layout/MainLayout";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import { theme } from "../config/theme";
import { usePageTitle } from "../hook/userPageTitle";

const STATUS_CONFIG = {
  pending: { text: "Pending Review", color: "warning", icon: "⏳" },
  confirmed: { text: "Confirmed", color: "success", icon: "✓" },
  declined: { text: "Declined", color: "error", icon: "✕" },
};

export default function ReviewHistory() {
  usePageTitle("Review History")
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, confirmed: 0, declined: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, history]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      const response = await axios.get(
        buildUrl(API_CONFIG.endpoints.reviewHistory),
        {
          headers: getAuthHeaders(),
        }
      );

      const historyData = response.data.matches || response.data.history || [];
      setHistory(historyData);
      
      const confirmed = historyData.filter(m => m.status === 'confirmed').length;
      const declined = historyData.filter(m => m.status === 'declined').length;
      setStats({
        total: historyData.length,
        confirmed,
        declined
      });

    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === "all") {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(history.filter(match => match.status === filter));
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("profile");
      navigate("/signin", { replace: true });
      return;
    }
    setError(`Failed to fetch data: ${err.response?.data?.detail || err.message}`);
  };

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchData();
  }, []);

  const handleImageError = useCallback((e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingState />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <ErrorState error={error} onRetry={handleRetry} onBack={() => navigate("/dashboard")} />
        </div>
      </MainLayout>
    );
  }

  if (history.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <EmptyState onNavigate={() => navigate("/dashboard")} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Header onBack={() => navigate("/dashboard")} stats={stats} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard icon="📊" label="Total Reviewed" value={stats.total} color="blue" />
            <StatsCard icon="✅" label="Confirmed" value={stats.confirmed} color="green" />
            <StatsCard icon="❌" label="Declined" value={stats.declined} color="red" />
          </div>

          <FilterTabs
            filter={filter}
            setFilter={setFilter}
            confirmedCount={stats.confirmed}
            declinedCount={stats.declined}
            totalCount={stats.total}
          />

          {filteredHistory.length > 0 ? (
            <HistoryList history={filteredHistory} onImageError={handleImageError} />
          ) : (
            <EmptyFilterState filter={filter} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function LoadingState() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
      </div>
      <p className="text-gray-700 text-lg font-medium">Loading review history...</p>
    </motion.div>
  );
}

function ErrorState({ error, onRetry, onBack }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-white border border-red-200 rounded-2xl p-8 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">❌</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-xl mb-3">Error Loading History</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button onClick={onRetry} className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 transition">
              Try Again
            </button>
            <button onClick={onBack} className="px-4 py-2 rounded-xl font-semibold bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Header({ onBack, stats }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
      <button onClick={onBack} className="text-gray-600 hover:text-gray-900 transition mb-6 flex items-center gap-2 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      <h1 className="text-5xl font-bold text-gray-900 mb-3 flex items-center gap-4">
        <span className="text-6xl">📜</span>
        Review History
      </h1>
      <p className="text-gray-600 text-lg">View all your reviewed matches ({stats.total} total)</p>
    </motion.div>
  );
}

function StatsCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500 border-blue-200",
    green: "from-green-500 to-emerald-500 border-green-200",
    red: "from-red-500 to-rose-500 border-red-200",
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02, y: -4 }} className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-4xl">{icon}</span>
        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${colorClasses[color]} text-white font-bold text-2xl shadow-md`}>
          {value}
        </div>
      </div>
      <p className="text-gray-600 font-semibold text-lg">{label}</p>
    </motion.div>
  );
}

function FilterTabs({ filter, setFilter, confirmedCount, declinedCount, totalCount }) {
  const tabs = [
    { id: "all", label: "All", count: totalCount },
    { id: "confirmed", label: "Confirmed", count: confirmedCount },
    { id: "declined", label: "Declined", count: declinedCount },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-2 mb-6 shadow-sm flex gap-2">
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => setFilter(tab.id)} className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${filter === tab.id ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}

function HistoryList({ history, onImageError }) {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {history.map((match, index) => (
          <HistoryCard key={match.id} match={match} index={index} onImageError={onImageError} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function HistoryCard({ match, index, onImageError }) {
  const isConfirmed = match.status === 'confirmed';

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="relative h-48 lg:h-full bg-gray-100 rounded-xl overflow-hidden">
            {match.matched_image_url ? (
              <img src={match.matched_image_url} alt="Matched content" className="w-full h-full object-cover" onError={onImageError} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-6xl">🖼️</span>
              </div>
            )}
            
            <div className="absolute top-3 right-3">
              <div className={`px-3 py-1.5 rounded-lg font-bold text-white shadow-lg ${isConfirmed ? "bg-gradient-to-r from-green-600 to-emerald-600" : "bg-gradient-to-r from-red-600 to-rose-600"}`}>
                {isConfirmed ? "✓ Confirmed" : "✕ Declined"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Match #{match.id}</h3>
              <p className="text-gray-500 text-sm">Original Image #{match.original_image_id}</p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 px-4 py-2 rounded-xl">
              <p className="text-xs font-semibold text-blue-600 mb-0.5">Similarity</p>
              <p className="text-xl font-bold text-blue-700">{(match.similarity_score * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {match.source_url && (
              <HistoryInfo icon="🔗" label="Source URL" value={<a href={match.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">{match.source_url}</a>} />
            )}
            <HistoryInfo icon="📅" label="Reviewed On" value={new Date(match.reviewed_at || match.updated_at || match.created_at).toLocaleDateString()} />
            <HistoryInfo icon="📊" label="Confidence" value={getConfidenceLevel(match.similarity_score)} />
            <HistoryInfo icon="📝" label="Status" value={isConfirmed ? "Confirmed ✅" : "Declined ❌"} />
          </div>

          {isConfirmed && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">✨ Action Taken:</span> DMCA report generated
              </p>
              <button onClick={() => window.location.href = "/reports"} className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2">
                View Report →
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HistoryInfo({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <div className="text-sm font-semibold text-gray-700">{value}</div>
      </div>
    </div>
  );
}

function getConfidenceLevel(score) {
  if (score >= 0.9) return "Very High 🔥";
  if (score >= 0.8) return "High ✨";
  if (score >= 0.7) return "Medium ⚡";
  return "Low 💫";
}

function EmptyState({ onNavigate }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-200 shadow-lg p-16 text-center">
      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center border border-blue-100">
        <span className="text-6xl">📜</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">No Review History Yet</h3>
      <p className="text-gray-600 mb-8">Start reviewing matches to build your history</p>
      <button onClick={onNavigate} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition font-semibold shadow-md">
        Go to Dashboard
      </button>
    </motion.div>
  );
}

function EmptyFilterState({ filter }) {
  const messages = {
    all: { title: "No Review History", description: "Start reviewing matches to build your history" },
    confirmed: { title: "No Confirmed Matches", description: "Matches you confirm will appear here" },
    declined: { title: "No Declined Matches", description: "Matches you decline will appear here" },
  };

  const message = messages[filter] || messages.all;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center border border-blue-100">
        <span className="text-5xl">📜</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{message.title}</h3>
      <p className="text-gray-600">{message.description}</p>
    </motion.div>
  );
}