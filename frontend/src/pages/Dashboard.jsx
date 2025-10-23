// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ImageUpload from "../components/ImageUpload";
import ChangePassword from "../components/ChangePassword";
import ViewProfile from "../components/ViewProfile";
import EditProfile from "../components/EditProfile";
import LatestUploads from "../components/LatestUploads";
import MainLayout from "../components/layout/MainLayout";
import { StatsCard } from "../components/ui/Card";
import { PageSpinner } from "../components/ui/Spinner";
import { ErrorAlert } from "../components/ui/Alert";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import { usePageTitle } from "../hook/userPageTitle";

export default function Dashboard() {
  usePageTitle("Dashboard")
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState(new URLSearchParams(location.search).get("view") || "dashboard");
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({ uploads: 0, matches: 0, reports: 0 });
  const [latestUploads, setLatestUploads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queryView = new URLSearchParams(location.search).get("view") || "dashboard";
    setView(queryView);
  }, [location.search]);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      try {
        const storedProfile = localStorage.getItem("profile");
        let profileData = storedProfile ? JSON.parse(storedProfile) : null;
        
        if (!profileData?.full_name) {
          const profileRes = await fetch(buildUrl(API_CONFIG.endpoints.me), { 
            headers: getAuthHeaders() 
          });
          profileData = await profileRes.json();
          if (!profileRes.ok) throw new Error(profileData.detail || "Failed to fetch profile");
          setProfile(profileData);
          localStorage.setItem("profile", JSON.stringify(profileData));
        } else {
          setProfile(profileData);
        }

        const uploadsRes = await fetch(buildUrl(API_CONFIG.endpoints.myImages), { 
          headers: getAuthHeaders() 
        });
        const uploadsData = await uploadsRes.json();
        if (!uploadsRes.ok) throw new Error(uploadsData.detail || "Failed to fetch uploads");
        
        const uploadsArray = Array.isArray(uploadsData.images) ? uploadsData.images : [];
        setLatestUploads(uploadsArray.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 3));

        const matchesRes = await fetch(buildUrl(API_CONFIG.endpoints.reviewHistory), { 
          headers: getAuthHeaders() 
        });
        const matchesData = await matchesRes.json();
        const matchesArray = Array.isArray(matchesData) ? matchesData : matchesData.matches || [];

        const reportsRes = await fetch(buildUrl(API_CONFIG.endpoints.dmcaReports), { 
          headers: getAuthHeaders() 
        });
        const reportsData = await reportsRes.json();

        setMetrics({
          uploads: uploadsArray.length,
          matches: matchesArray.length,
          reports: reportsData.reports?.length || 0,
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(`Error: ${err.message}`);
        if (err.message.includes("401")) {
          localStorage.removeItem("token");
          localStorage.removeItem("profile");
          navigate("/signin", { replace: true });
        }
        setLoading(false);
      }
    };
    
    fetchProfileAndData();
  }, [navigate, location]);

  const handleViewMatches = (imageId) => navigate(`/matches-confirm/${imageId}`);

  if (loading) return <MainLayout><PageSpinner text="Loading dashboard..." /></MainLayout>;
  if (error) return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <ErrorAlert title="Error Loading Dashboard">{error}</ErrorAlert>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <main className="max-w-7xl mx-auto">
          {view === "dashboard" && (
            <section>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h2 className="text-5xl font-bold text-gray-900 mb-2 font-display">Dashboard</h2>
                <p className="text-gray-600">Welcome back! Here's your security overview.</p>
              </motion.div>
              
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-3 gap-6 mb-10">
                <StatsCard label="Total Uploads" value={metrics.uploads} icon="📤" gradient="from-blue-600 to-blue-700" />
                <StatsCard label="Matches Found" value={metrics.matches} icon="🔍" gradient="from-purple-600 to-pink-600" />
                <StatsCard label="Reports Sent" value={metrics.reports} icon="📄" gradient="from-green-600 to-emerald-600" />
              </div>

              {/* Latest Uploads */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-10">
                <h3 className="text-2xl font-bold mb-5 text-gray-900 font-display">Latest Uploads</h3>
                <LatestUploads images={latestUploads} onViewMatches={handleViewMatches} />
              </motion.div>

              {/* Upload Section */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
                <h3 className="text-3xl font-bold mb-3 text-center text-gray-900 font-display">Upload & Detect</h3>
                <p className="text-gray-600 mb-8 text-center">Upload your image to run similarity detection and track potential copyright issues.</p>
                <ImageUpload metrics={metrics} setMetrics={setMetrics} />
              </motion.div>
            </section>
          )}
          
          {view === "changepassword" && <ChangePassword setView={setView} />}
          {view === "viewprofile" && <ViewProfile profile={profile} setProfile={setProfile} setView={setView} />}
          {view === "editprofile" && <EditProfile profile={profile} setProfile={setProfile} setView={setView} />}
        </main>
      </div>
    </MainLayout>
  );
}