// src/components/Reports.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import { theme } from "../config/theme";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please log in to view reports.");
      }

      const response = await axios.get(buildUrl(API_CONFIG.endpoints.reports), {
        headers: getAuthHeaders(),
      });
      
      setReports(response.data.reports || []);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to fetch reports";
      setError(errorMessage);
      console.error("Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(async (reportId) => {
    try {
      const response = await axios.get(
        buildUrl(API_CONFIG.endpoints.reportDownload(reportId)),
        {
          headers: getAuthHeaders(),
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
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || "Failed to download report";
      setError(errorMessage);
      console.error("Download error:", err.response?.data || err.message);
    }
  }, []);

  const toggleExpand = useCallback((reportId) => {
    setExpandedReport(prev => prev === reportId ? null : reportId);
  }, []);

  const containerStyles = {
    minHeight: '100vh',
    background: theme.colors.background.gradient,
    padding: theme.spacing.md,
  };

  if (loading) {
    return (
      <div style={containerStyles} className="flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <ErrorState error={error} onBack={() => navigate("/dashboard")} />
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div className="max-w-7xl mx-auto">
        <Header reportCount={reports.length} />
        
        {reports.length === 0 ? (
          <EmptyState onNavigate={() => navigate("/dashboard")} />
        ) : (
          <ReportsList
            reports={reports}
            expandedReport={expandedReport}
            onToggleExpand={toggleExpand}
            onDownload={handleDownload}
          />
        )}

        <BackButton onNavigate={() => navigate("/dashboard")} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center">
      <div 
        className="animate-spin rounded-full h-16 w-16 mx-auto mb-4"
        style={{
          border: `4px solid ${theme.colors.primary[200]}`,
          borderTopColor: theme.colors.primary[600],
        }}
      />
      <p 
        className="text-gray-600"
        style={{ 
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        Loading reports...
      </p>
    </div>
  );
}

function Header({ reportCount }) {
  return (
    <div style={{ marginBottom: theme.spacing.lg }}>
      <h2 
        className="font-bold text-gray-800 mb-2"
        style={{ 
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
        }}
      >
        DMCA Reports
      </h2>
      <p 
        className="text-gray-600"
        style={{ fontSize: theme.typography.fontSize.base }}
      >
        {reportCount} {reportCount === 1 ? "report" : "reports"} generated
      </p>
    </div>
  );
}

function ErrorState({ error, onBack }) {
  const containerStyles = {
    maxWidth: '42rem',
    margin: '0 auto',
    background: theme.colors.error.light,
    border: `1px solid ${theme.colors.error.DEFAULT}40`,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.md,
  };

  const buttonStyles = {
    background: theme.colors.text.secondary,
    color: theme.colors.text.white,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.xl,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.md,
    transition: `all ${theme.animations.transition.DEFAULT}`,
  };

  return (
    <div style={containerStyles}>
      <p 
        className="font-medium mb-2 flex items-center gap-2"
        style={{ 
          color: theme.colors.error.DEFAULT,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        <span style={{ fontSize: theme.typography.fontSize.xl }}>
          {theme.icons.error}
        </span>
        Error Loading Reports
      </p>
      <p style={{ color: theme.colors.error.dark, fontSize: theme.typography.fontSize.sm }}>
        {error}
      </p>
      <button
        onClick={onBack}
        className="hover:opacity-80 transition"
        style={buttonStyles}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

function EmptyState({ onNavigate }) {
  const containerStyles = {
    background: theme.colors.background.light,
    borderRadius: theme.borderRadius['2xl'],
    border: `1px solid ${theme.colors.text.tertiary}40`,
    boxShadow: theme.shadows.sm,
    padding: `${theme.spacing['2xl']} ${theme.spacing.md}`,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  };

  const buttonStyles = {
    background: theme.gradients.accent,
    color: theme.colors.text.white,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.xl,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    boxShadow: theme.shadows.md,
    transition: `all ${theme.animations.transition.DEFAULT}`,
  };

  return (
    <div style={containerStyles}>
      <div style={{ fontSize: theme.typography.fontSize['6xl'], marginBottom: theme.spacing.md }}>
        {theme.icons.report}
      </div>
      <p 
        className="text-gray-500 mb-4"
        style={{ 
          fontSize: theme.typography.fontSize.lg,
          marginBottom: theme.spacing.md,
        }}
      >
        No reports found.
      </p>
      <p 
        className="text-gray-400 mb-6"
        style={{ 
          fontSize: theme.typography.fontSize.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        Confirm matches to generate DMCA takedown reports
      </p>
      <button
        onClick={onNavigate}
        className="hover:shadow-lg transition"
        style={buttonStyles}
      >
        Go to Dashboard
      </button>
    </div>
  );
}

function ReportsList({ reports, expandedReport, onToggleExpand, onDownload }) {
  return (
    <div className="space-y-6" style={{ marginBottom: theme.spacing.lg }}>
      {reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          isExpanded={expandedReport === report.id}
          onToggleExpand={() => onToggleExpand(report.id)}
          onDownload={() => onDownload(report.id)}
        />
      ))}
    </div>
  );
}

function ReportCard({ report, isExpanded, onToggleExpand, onDownload }) {
  const cardStyles = {
    background: theme.colors.background.light,
    borderRadius: theme.borderRadius['2xl'],
    border: `1px solid ${theme.colors.text.tertiary}40`,
    boxShadow: theme.shadows.sm,
    overflow: 'hidden',
    transition: `all ${theme.animations.transition.DEFAULT}`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hover:shadow-md transition"
      style={cardStyles}
    >
      <div style={{ padding: theme.spacing.md }}>
        <CardHeader report={report} />
        <CardInfo report={report} />
        <CardActions onDownload={onDownload} onToggleExpand={onToggleExpand} isExpanded={isExpanded} />
      </div>

      <ExpandedContent report={report} isExpanded={isExpanded} />
    </motion.div>
  );
}

function CardHeader({ report }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 
        className="font-semibold text-gray-800"
        style={{ 
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
        }}
      >
        Report ID: {report.id}
      </h3>
      <StatusBadge status={report.status} />
    </div>
  );
}

function CardInfo({ report }) {
  return (
    <div style={{ marginBottom: theme.spacing.md }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: theme.spacing.md }}>
        <URLDisplay
          label="Infringing URL"
          url={report.infringing_url}
          color={theme.colors.error.DEFAULT}
        />
        <URLDisplay
          label="Original URL"
          url={report.original_url || "N/A"}
          color={theme.colors.success.DEFAULT}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoBox
          icon={theme.icons.calendar}
          label="Created"
          value={new Date(report.created_at).toLocaleDateString()}
          color={theme.colors.primary.DEFAULT}
        />
        <InfoBox
          icon={theme.icons.image}
          label="Image ID"
          value={report.image_id || "N/A"}
          color={theme.colors.info.DEFAULT}
        />
        <InfoBox
          icon={theme.icons.alert}
          label="Matches"
          value={report.match_count || 0}
          color={theme.colors.error.DEFAULT}
        />
      </div>
    </div>
  );
}

function CardActions({ onDownload, onToggleExpand, isExpanded }) {
  const downloadButtonStyles = {
    flex: 1,
    background: theme.gradients.primary,
    color: theme.colors.text.white,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.xl,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    transition: `all ${theme.animations.transition.DEFAULT}`,
    boxShadow: theme.shadows.md,
  };

  const detailsButtonStyles = {
    flex: 1,
    background: theme.colors.text.tertiary + '20',
    color: theme.colors.text.primary,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.xl,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    transition: `all ${theme.animations.transition.DEFAULT}`,
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={onDownload}
        className="hover:shadow-lg transition flex items-center justify-center gap-2"
        style={downloadButtonStyles}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </button>
      <button
        onClick={onToggleExpand}
        className="hover:bg-gray-200 transition flex items-center justify-center gap-2"
        style={detailsButtonStyles}
      >
        <svg
          className={`w-5 h-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {isExpanded ? "Collapse" : "Details"}
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { bg: theme.colors.warning.light, text: theme.colors.warning.dark, border: theme.colors.warning.DEFAULT },
    approved: { bg: theme.colors.success.light, text: theme.colors.success.dark, border: theme.colors.success.DEFAULT },
    rejected: { bg: theme.colors.error.light, text: theme.colors.error.dark, border: theme.colors.error.DEFAULT },
    default: { bg: theme.colors.text.tertiary + '20', text: theme.colors.text.secondary, border: theme.colors.text.tertiary },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.default;

  return (
    <span
      className="px-3 py-1 text-xs font-medium"
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}40`,
        borderRadius: theme.borderRadius.full,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
      }}
    >
      {status || "Unknown"}
    </span>
  );
}

function URLDisplay({ label, url, color }) {
  return (
    <div>
      <p 
        className="font-medium text-gray-600"
        style={{ 
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold truncate block hover:underline"
        style={{ color, fontSize: theme.typography.fontSize.sm }}
      >
        {url}
      </a>
    </div>
  );
}

function InfoBox({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: theme.typography.fontSize['2xl'] }}>{icon}</span>
      <div>
        <p 
          className="font-medium text-gray-600"
          style={{ 
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          {label}
        </p>
        <p 
          className="font-semibold"
          style={{ 
            color,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ExpandedContent({ report, isExpanded }) {
  const hasMetadata = report.page_title || report.page_author || report.page_tags;

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t"
          style={{ 
            borderColor: theme.colors.text.tertiary + '40',
            background: theme.colors.text.tertiary + '10',
          }}
        >
          <div className="space-y-6" style={{ padding: theme.spacing.md }}>
            {hasMetadata && <MetadataSection report={report} />}
            {report.image_caption && (
              <DetailSection
                title="Image Caption"
                icon={theme.icons.info}
                content={report.image_caption}
              />
            )}
            {report.notes && (
              <DetailSection
                title="Notes"
                icon="📝"
                content={report.notes}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MetadataSection({ report }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span style={{ fontSize: theme.typography.fontSize['2xl'] }}>🔖</span>
        <h4 
          className="font-semibold text-gray-800"
          style={{ 
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
          }}
        >
          Page Metadata
        </h4>
      </div>
      {report.page_title && (
        <p className="text-gray-600" style={{ fontSize: theme.typography.fontSize.sm }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>Title:</span> {report.page_title}
        </p>
      )}
      {report.page_author && (
        <p className="text-gray-600" style={{ fontSize: theme.typography.fontSize.sm }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>Author:</span> {report.page_author}
        </p>
      )}
      {report.page_tags && (
        <p className="text-gray-600" style={{ fontSize: theme.typography.fontSize.sm }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>Tags:</span>{" "}
          {Array.isArray(report.page_tags) ? report.page_tags.join(", ") : report.page_tags}
        </p>
      )}
    </div>
  );
}

function DetailSection({ title, icon, content }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span style={{ fontSize: theme.typography.fontSize['2xl'] }}>{icon}</span>
        <h4 
          className="font-semibold text-gray-800"
          style={{ 
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
          }}
        >
          {title}
        </h4>
      </div>
      <p 
        className="text-gray-600 whitespace-pre-wrap"
        style={{ fontSize: theme.typography.fontSize.sm }}
      >
        {content}
      </p>
    </div>
  );
}

function BackButton({ onNavigate }) {
  const buttonStyles = {
    background: theme.colors.text.secondary,
    color: theme.colors.text.white,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.xl,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    transition: `all ${theme.animations.transition.DEFAULT}`,
    marginTop: theme.spacing.lg,
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onNavigate}
      className="inline-flex items-center gap-2 hover:opacity-80 transition"
      style={buttonStyles}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Dashboard
    </motion.button>
  );
}