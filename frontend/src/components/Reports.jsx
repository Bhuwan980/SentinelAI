import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please log in to view reports.");

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/ip/dmca/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Reports response:", response.data);
        setReports(response.data.reports || []);
        setLoading(false);
      } catch (err) {
        setError(`Failed to fetch reports: ${err.response?.data?.detail || err.message}`);
        console.error("Fetch error:", err.response?.data || err.message);
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDownload = async (reportId) => {
    try {
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
    } catch (err) {
      setError(`Failed to download report: ${err.response?.data?.detail || err.message}`);
      console.error("Download error:", err.response?.data || err.message);
    }
  };

  const toggleExpand = (reportId) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">DMCA Reports</h2>
          <p className="text-gray-600">
            {reports.length} {reports.length === 1 ? "report" : "reports"} generated
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-500 text-lg mb-4">No reports found.</p>
            <p className="text-gray-400 text-sm mb-6">
              Confirm matches to generate DMCA takedown reports
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isExpanded={expandedReport === report.id}
                onToggleExpand={() => toggleExpand(report.id)}
                onDownload={() => handleDownload(report.id)}
              />
            ))}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-8 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition inline-flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ========== Report Card Component ==========
function ReportCard({ report, isExpanded, onToggleExpand, onDownload }) {
  const hasMetadata = report.page_title || report.page_author || report.page_tags;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-800">Report #{report.id}</h3>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-sm text-gray-500">
              Created: {new Date(report.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onDownload}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Similarity Score */}
          <InfoBox
            icon="📊"
            label="Similarity Score"
            value={`${(report.similarity_score * 100 || 0).toFixed(1)}%`}
            color="emerald"
          />

          {/* Status */}
          <InfoBox
            icon="⏱️"
            label="Report Status"
            value={report.status?.toUpperCase() || "PENDING"}
            color="blue"
          />
        </div>

        {/* URLs */}
        <div className="space-y-2 mb-4">
          <URLDisplay
            label="🔗 Infringing URL"
            url={report.infringing_url}
            color="red"
          />
          <URLDisplay
            label="✅ Original Image"
            url={report.original_image_url}
            color="green"
          />
        </div>

        {/* Metadata Preview */}
        {hasMetadata && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-2">
                  📋 Page Metadata Available
                </p>
                {report.page_title && (
                  <p className="text-sm text-amber-800 mb-1">
                    <span className="font-medium">Title:</span> {report.page_title}
                  </p>
                )}
                {report.page_author && (
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Author:</span> {report.page_author}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expand Button */}
        <button
          onClick={onToggleExpand}
          className="w-full mt-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition flex items-center justify-center gap-2"
        >
          {isExpanded ? "Hide" : "Show"} Full Details
          <svg
            className={`w-4 h-4 transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-gray-50"
          >
            <div className="p-6 space-y-6">
              {/* Full Metadata Section */}
              {hasMetadata && (
                <MetadataSection report={report} />
              )}

              {/* Caption */}
              {report.image_caption && (
                <DetailSection
                  title="Image Caption"
                  icon="💬"
                  content={report.image_caption}
                />
              )}

              {/* Copyright Info */}
              {report.page_copyright && (
                <DetailSection
                  title="Copyright Notice"
                  icon="©️"
                  content={report.page_copyright}
                />
              )}

              {/* Description */}
              {report.page_description && (
                <DetailSection
                  title="Page Description"
                  icon="📝"
                  content={report.page_description}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ========== Helper Components ==========

function StatusBadge({ status }) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    submitted: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        colors[status?.toLowerCase()] || colors.pending
      }`}
    >
      {status?.toUpperCase() || "PENDING"}
    </span>
  );
}

function InfoBox({ icon, label, value, color }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    red: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-medium opacity-75">{label}</p>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function URLDisplay({ label, url, color }) {
  const colors = {
    red: "bg-red-50 border-red-200",
    green: "bg-green-50 border-green-200",
  };

  if (!url || url === "N/A") return null;

  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:text-blue-700 hover:underline break-all"
      >
        {url}
      </a>
    </div>
  );
}

function MetadataSection({ report }) {
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-800 flex items-center gap-2">
        <span className="text-xl">🔍</span>
        Scraped Page Metadata
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.page_title && (
          <MetadataItem label="Page Title" value={report.page_title} />
        )}
        {report.page_author && (
          <MetadataItem label="Author/Publisher" value={report.page_author} />
        )}
        {report.suspected_image_alt && (
          <MetadataItem label="Image Alt Text" value={report.suspected_image_alt} />
        )}
        {report.suspected_image_title && (
          <MetadataItem label="Image Title" value={report.suspected_image_title} />
        )}
      </div>

      {/* Tags */}
      {report.page_tags && report.page_tags.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tags & Keywords</p>
          <div className="flex flex-wrap gap-2">
            {report.page_tags.map((tag, index) => (
              <span
                key={index}
                className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full border border-purple-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataItem({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}

function DetailSection({ title, icon, content }) {
  return (
    <div>
      <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        {title}
      </h4>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}