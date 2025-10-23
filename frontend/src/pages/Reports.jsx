// src/components/Reports.jsx - FINAL FIXED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import Navigation from "../components/layout/Navigation";
import Footer from "../components/layout/Footer";
import theme from "../config/theme";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewReport, setPreviewReport] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view reports.");
      navigate("/signin");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildUrl(API_CONFIG.endpoints.dmcaReports), {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched reports:", data);
      setReports(data.reports || data || []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to load DMCA reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewReport = async (reportId) => {
    setPreviewLoading(true);
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.dmcaReportDownload(reportId)),
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load report preview");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewReport({ id: reportId, url });
    } catch (err) {
      console.error("Preview error:", err);
      setError(`Failed to preview report: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.dmcaReportDownload(reportId)),
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dmca_report_${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError(`Failed to download report: ${err.message}`);
    }
  };

  const handleSendEmail = async (reportId) => {
    // Confirm before sending
    const confirmed = window.confirm(
      "⚠️ Are you sure you want to send this DMCA takedown notice via email?\n\nThis will send an official DMCA notice to tori.bhuwan@gmail.com"
    );
    
    if (!confirmed) return;

    setSendingEmail(reportId);
    setError("");
    setSuccess("");

    try {
      console.log("=== EMAIL SENDING ===");
      console.log("Report ID:", reportId);
      console.log("Recipient Email: tori.bhuwan@gmail.com");
      console.log("URL:", buildUrl(API_CONFIG.endpoints.sendDmcaEmail(reportId)));
      
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.sendDmcaEmail(reportId)),
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            recipient_email: "tori.bhuwan@gmail.com"
          }),
        }
      );

      console.log("Response status:", response.status);
      
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        data = { detail: responseText };
      }
      
      console.log("Parsed response data:", data);

      if (!response.ok) {
        if (response.status === 422) {
          console.error("Validation error details:", data);
          
          let errorMessage = "Validation error: ";
          if (data.detail && Array.isArray(data.detail)) {
            errorMessage += data.detail.map(err => 
              `${err.loc?.join('.')} - ${err.msg}`
            ).join(", ");
          } else if (data.detail) {
            errorMessage += data.detail;
          } else {
            errorMessage += "Invalid request format";
          }
          
          throw new Error(errorMessage);
        }
        
        throw new Error(data.detail || data.message || `Error ${response.status}: ${responseText}`);
      }

      // Show success message
      setSuccess(data.message || "✅ DMCA email sent successfully to tori.bhuwan@gmail.com!");
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
      
      // Refresh reports to update status
      await fetchReports();
    } catch (err) {
      console.error("=== EMAIL ERROR ===");
      console.error("Error:", err);
      
      const errorMessage = err.message || "An unexpected error occurred";
      setError(`Failed to send email: ${errorMessage}`);
      
      // Auto-hide error after 10 seconds
      setTimeout(() => setError(""), 10000);
    } finally {
      setSendingEmail(null);
    }
  };

  const closePreview = () => {
    if (previewReport?.url) {
      window.URL.revokeObjectURL(previewReport.url);
    }
    setPreviewReport(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="flex-grow">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">
            <LoadingState />
          </div>
        ) : (
          <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
              <Header reportCount={reports.length} />
              
              {error && <ErrorAlert message={error} onClose={() => setError("")} />}
              {success && <SuccessAlert message={success} onClose={() => setSuccess("")} />}
              
              {reports.length > 0 ? (
                <ReportsGrid 
                  reports={reports} 
                  onDownload={handleDownloadReport}
                  onPreview={handlePreviewReport}
                  onSendEmail={handleSendEmail}
                  previewLoading={previewLoading}
                  sendingEmail={sendingEmail}
                />
              ) : (
                <EmptyState onNavigate={() => navigate("/dashboard")} />
              )}
              
              <BackButton onNavigate={() => navigate("/dashboard")} />
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* PDF Preview Modal */}
      <PreviewModal 
        previewReport={previewReport} 
        onClose={closePreview}
        onDownload={handleDownloadReport}
      />
    </div>
  );
}

function PreviewModal({ previewReport, onClose, onDownload }) {
  if (!previewReport) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📄</span>
              <h3 className="text-2xl font-bold text-gray-900">
                DMCA Report Preview - #{previewReport.id}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDownload(previewReport.id)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition font-bold text-xl"
              >
                ✕
              </motion.button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            <iframe
              src={previewReport.url}
              className="w-full h-full border-0"
              title={`DMCA Report ${previewReport.id}`}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LoadingState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <p className="text-gray-700 text-lg font-medium">Loading reports...</p>
    </motion.div>
  );
}

function Header({ reportCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <h1 className="text-5xl font-bold text-gray-900 mb-3 flex items-center gap-3">
        <span className="text-6xl">📋</span>
        DMCA Reports
      </h1>
      <p className="text-gray-600 text-lg">
        {reportCount} {reportCount === 1 ? "report" : "reports"} available
      </p>
    </motion.div>
  );
}

function SuccessAlert({ message, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm"
    >
      <p className="text-green-700 font-medium flex items-center gap-2">
        <span className="text-xl">✅</span>
        {message}
      </p>
      <button
        onClick={onClose}
        className="text-green-600 hover:text-green-800 font-bold text-xl"
      >
        ✕
      </button>
    </motion.div>
  );
}

function ErrorAlert({ message, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm"
    >
      <div className="flex-1">
        <p className="text-red-600 font-medium flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span className="break-words">{message}</span>
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-red-600 hover:text-red-800 font-bold text-xl ml-4 flex-shrink-0"
      >
        ✕
      </button>
    </motion.div>
  );
}

function ReportsGrid({ reports, onDownload, onPreview, onSendEmail, previewLoading, sendingEmail }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {reports.map((report, index) => (
        <ReportCard
          key={report.id}
          report={report}
          index={index}
          onDownload={onDownload}
          onPreview={onPreview}
          onSendEmail={onSendEmail}
          previewLoading={previewLoading}
          sendingEmail={sendingEmail}
        />
      ))}
    </div>
  );
}

function ReportCard({ report, index, onDownload, onPreview, onSendEmail, previewLoading, sendingEmail }) {
  const isEmailSending = sendingEmail === report.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Report #{report.id}
        </h3>
        <StatusBadge status={report.status} />
      </div>

      <div className="space-y-3 mb-6">
        <ReportInfo
          icon="🔗"
          label="Infringing URL"
          value={report.infringing_url}
          isLink
        />
        <ReportInfo
          icon="📅"
          label="Created"
          value={new Date(report.created_at).toLocaleDateString()}
        />
        {report.similarity_score && (
          <ReportInfo
            icon="📊"
            label="Similarity"
            value={`${(report.similarity_score * 100).toFixed(1)}%`}
          />
        )}
        <ReportInfo
          icon="📧"
          label="Recipient"
          value="tori.bhuwan@gmail.com"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {/* Preview Button */}
        <button
          onClick={() => onPreview(report.id)}
          disabled={previewLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-2.5 rounded-lg font-semibold shadow-md hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {previewLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </>
          )}
        </button>

        {/* Download Button */}
        <button
          onClick={() => onDownload(report.id)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg font-semibold shadow-md hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>

        {/* Send Email Button */}
        <button
          onClick={() => onSendEmail(report.id)}
          disabled={isEmailSending}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-lg font-semibold shadow-md hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEmailSending ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send to My Email
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const getStatusStyle = () => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'approved':
      case 'active':
      case 'completed':
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle()}`}>
      {status || "Active"}
    </span>
  );
}

function ReportInfo({ icon, label, value, isLink = false }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-600 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold text-gray-700">{value}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNavigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl border border-gray-200 shadow-lg p-16 text-center mb-8"
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center border border-blue-100">
        <span className="text-6xl">📋</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        No Reports Yet
      </h3>
      <p className="text-gray-600 mb-8">
        Confirm matches to generate DMCA takedown reports
      </p>
      <button
        onClick={onNavigate}
        className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition font-semibold shadow-md"
      >
        Go to Dashboard
      </button>
    </motion.div>
  );
}

function BackButton({ onNavigate }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onNavigate}
      className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition font-semibold shadow-sm"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Dashboard
    </motion.button>
  );
}