import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "./MainLayout";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/signin", { replace: true });
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/ip/dmca/reports`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        setReports(response.data.reports || []);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("profile");
          navigate("/signin", { replace: true });
          return;
        }
        setError(`Failed to fetch reports: ${err.response?.data?.detail || err.message}`);
        setLoading(false);
      }
    };
    
    fetchReports();
  }, [navigate]);

  const handleDownload = async (reportId) => {
    try {
      setDownloadingId(reportId);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ip/dmca/report/${reportId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dmca_report_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setDownloadingId(null);
    } catch (err) {
      setError(`Failed to download report: ${err.response?.data?.detail || err.message}`);
      setDownloadingId(null);
    }
  };

  const handlePreview = async (reportId) => {
    try {
      setPreviewingId(reportId);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ip/dmca/report/${reportId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewingId(null);
    } catch (err) {
      setError(`Failed to preview report: ${err.response?.data?.detail || err.message}`);
      setPreviewingId(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const toggleExpand = (reportId) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
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
            <p className="text-emerald-100 text-lg font-medium">Loading reports...</p>
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
                <h3 className="font-bold text-red-100 text-xl mb-3">Error Loading Reports</h3>
                <p className="text-red-200/80 mb-6">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-rose-700 transition font-medium shadow-lg shadow-red-500/20"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="bg-slate-800/50 backdrop-blur text-slate-100 px-6 py-2.5 rounded-xl hover:bg-slate-700/50 transition font-medium border border-slate-700/50"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
        <div className="p-6 pb-20">
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
                DMCA Reports
              </h2>
              <p className="text-emerald-200/60 text-lg">View and manage your generated DMCA takedown notices.</p>
            </motion.div>

            {reports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl border border-emerald-500/10 p-16 text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <span className="text-5xl">📄</span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-100 mb-3">No Reports Yet</h3>
                <p className="text-emerald-200/60 mb-8 text-lg">
                  Confirm matches in Match History to generate DMCA reports.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/match-history")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition font-semibold shadow-xl shadow-emerald-500/25"
                >
                  Go to Match History
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {reports.map((report, index) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    index={index}
                    isExpanded={expandedReport === report.id}
                    toggleExpand={() => toggleExpand(report.id)}
                    onDownload={() => handleDownload(report.id)}
                    onPreview={() => handlePreview(report.id)}
                    isDownloading={downloadingId === report.id}
                    isPreviewing={previewingId === report.id}
                  />
                ))}
              </motion.div>
            )}

            <AnimatePresence>
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                  onClick={closePreview}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-3xl p-6 w-full max-w-5xl h-[85vh] relative border border-emerald-500/20 shadow-2xl"
                  >
                    <button
                      onClick={closePreview}
                      className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition flex items-center justify-center z-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <iframe
                      src={previewUrl}
                      title="Report Preview"
                      className="w-full h-full rounded-2xl bg-white"
                    ></iframe>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-br from-slate-900/90 to-emerald-950/90 backdrop-blur-xl border-t border-emerald-500/10 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-2 text-lg font-bold shadow-lg">
                    👁️
                  </div>
                  <span className="text-xl font-bold text-emerald-100">Sentinel AI</span>
                </div>
                <p className="text-emerald-200/60 text-sm">
                  Protecting intellectual property with AI-powered detection and monitoring.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-100 mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/about" className="text-emerald-200/60 hover:text-emerald-300 transition">About</a></li>
                  <li><a href="/contact" className="text-emerald-200/60 hover:text-emerald-300 transition">Contact</a></li>
                  <li><a href="/dashboard" className="text-emerald-200/60 hover:text-emerald-300 transition">Dashboard</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-100 mb-3">Contact</h3>
                <ul className="space-y-2 text-sm text-emerald-200/60">
                  <li>protect@sentinelai.com</li>
                  <li>+1 (555) 911-9111</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-emerald-500/10 pt-6 text-center text-sm text-emerald-200/60">
              <p>&copy; {new Date().getFullYear()} Sentinel AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
}

function ReportCard({ report, index, isExpanded, toggleExpand, onDownload, onPreview, isDownloading, isPreviewing }) {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300?text=Image+Not+Available";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl border border-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-100">
                DMCA Report #{report.id}
              </h3>
              <p className="text-emerald-200/60 text-sm">Generated {new Date(report.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleExpand}
            className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition flex items-center justify-center"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <DetailRow label="Status" value={
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {report.status || "Pending"}
              </span>
            } />
            <DetailRow label="Image ID" value={`#${report.image_id}`} />
            <DetailRow label="Match ID" value={`#${report.match_id}`} />
          </div>
          <div className="space-y-3">
           <DetailRow
  label="Infringing URL"
  value={
    <a
      href={report.infringing_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 hover:underline break-all transition inline-flex items-center gap-1"
    >
      <span className="truncate max-w-[200px]">{report.infringing_url}</span>
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  }
/>
          </div>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPreview}
            disabled={isPreviewing || isDownloading}
            className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              isPreviewing || isDownloading
                ? "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
            }`}
          >
            {isPreviewing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownload}
            disabled={isDownloading || isPreviewing}
            className={`flex-1 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              isDownloading || isPreviewing
                ? "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
            }`}
          >
            {isDownloading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </>
            )}
          </motion.button>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-emerald-500/10 p-6 bg-gradient-to-br from-slate-900/70 to-emerald-950/50"
          >
            <h4 className="text-xl font-bold text-emerald-100 mb-5 flex items-center gap-2">
              <span>📋</span>
              Report Details
            </h4>
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div>
                <h5 className="font-semibold text-emerald-200/80 mb-3 text-sm">Original Image</h5>
                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20">
                  <img
                    src={report.original_image_url || "https://via.placeholder.com/300?text=Image+Not+Available"}
                    alt="Original image"
                    className="w-full h-56 object-cover"
                    onError={handleImageError}
                  />
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-emerald-200/80 mb-3 text-sm">Infringing Image</h5>
                <div className="relative rounded-2xl overflow-hidden border border-red-500/30">
                  <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/90 text-white text-xs font-bold">
                      <span>⚠️</span>
                      Infringement
                    </span>
                  </div>
                  <img
                    src={report.infringing_image_url || "https://via.placeholder.com/300?text=Image+Not+Available"}
                    alt="Infringing image"
                    className="w-full h-56 object-cover"
                    onError={handleImageError}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3 bg-slate-800/30 rounded-2xl p-5 border border-emerald-500/10">
              <DetailRow label="Complainant" value={report.complainant_name || "N/A"} />
              <DetailRow label="Description" value={report.description || "No description provided"} />
              <DetailRow
                label="Submitted"
                value={report.submitted_at ? new Date(report.submitted_at).toLocaleString() : "Not submitted"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm font-semibold text-emerald-200/70 min-w-[120px]">{label}:</span>
      <span className="text-sm text-emerald-100 flex-1">
        {typeof value === "string" ? value : value}
      </span>
    </div>
  );
}