import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ReportGen() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view reports.");
        return navigate("/signin");
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/ip/dmca/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Failed to fetch reports");
        }
        setReports(data.reports || []);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const handleDownloadReport = async (reportId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ip/dmca/report/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to download report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dmca_report_${reportId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">DMCA Reports</h1>
      {loading ? (
        <p className="text-gray-500 text-center">Loading reports...</p>
      ) : error ? (
        <p className="text-red-600 text-center">{error}</p>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                Report ID: {report.id}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Infringing URL: <a href={report.infringing_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{report.infringing_url}</a>
              </p>
              <p className="text-sm text-gray-600">
                Status: {report.status}
              </p>
              <p className="text-sm text-gray-600">
                Created: {new Date(report.created_at).toLocaleDateString()}
              </p>
              <button
                onClick={() => handleDownloadReport(report.id)}
                className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
              >
                Download Report
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No DMCA reports found.</p>
      )}
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
      >
        Back to Dashboard
      </button>
    </div>
  );
}