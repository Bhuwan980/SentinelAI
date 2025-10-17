import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ImageUpload from "../components/ImageUpload";
import ChangePassword from "../components/ChangePassword";
import ViewProfile from "../components/ViewProfile";
import EditProfile from "../components/EditProfile";
import LatestUploads from "../components/LatestUploads";
import MainLayout from "./MainLayout";

export default function Dashboard() {
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
        setError("Please log in.");
        navigate("/signin", { replace: true });
        return;
      }

      try {
        const storedProfile = localStorage.getItem("profile");
        let profileData = storedProfile ? JSON.parse(storedProfile) : null;
        
        if (!profileData || !profileData.full_name || !profileData.phone_number) {
          const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          profileData = await profileRes.json();
          if (!profileRes.ok) {
            throw new Error(profileData.detail || "Failed to fetch profile");
          }
          setProfile(profileData);
          localStorage.setItem("profile", JSON.stringify(profileData));
        } else {
          setProfile(profileData);
        }

        const uploadsRes = await fetch(`${import.meta.env.VITE_API_URL}/ip/my-images`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const uploadsData = await uploadsRes.json();
        if (!uploadsRes.ok) {
          throw new Error(uploadsData.detail || "Failed to fetch uploads");
        }
        
        const uploadsArray = Array.isArray(uploadsData.images) ? uploadsData.images : [];
        const sortedUploads = uploadsArray.sort((a, b) => 
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setLatestUploads(sortedUploads.slice(0, 3));

        const matchesRes = await fetch(`${import.meta.env.VITE_API_URL}/ip/match-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const matchesData = await matchesRes.json();
        if (!matchesRes.ok) {
          throw new Error(matchesData.detail || "Failed to fetch matches");
        }
        
        const matchesArray = Array.isArray(matchesData) ? matchesData : matchesData.matches || [];

        const reportsRes = await fetch(`${import.meta.env.VITE_API_URL}/ip/dmca/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reportsData = await reportsRes.json();
        if (!reportsRes.ok) {
          throw new Error(reportsData.detail || "Failed to fetch reports");
        }

        let notificationsArray = [];
        try {
          const notificationsRes = await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (notificationsRes.ok) {
            const notificationsData = await notificationsRes.json();
            notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
          }
        } catch (notifError) {
          console.log("Notifications endpoint not available:", notifError);
        }
        
        setNotifications(notificationsArray);

        setMetrics({
          uploads: uploadsArray.length,
          matches: matchesArray.length,
          reports: reportsData.reports?.length || 0,
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(`Error: ${err.message}`);
        
        if (err.message.includes("401") || err.message.includes("Unauthorized")) {
          localStorage.removeItem("token");
          localStorage.removeItem("profile");
          navigate("/signin", { replace: true });
        }
        
        setLoading(false);
      }
    };
    
    fetchProfileAndData();
  }, [navigate, location]);

  const handleViewMatches = (imageId) => {
    navigate(`/matches-confirm/${imageId}`);
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
            <p className="text-emerald-100 text-lg font-medium">Loading dashboard...</p>
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
                <h3 className="font-bold text-red-100 text-xl mb-3">Error Loading Dashboard</h3>
                <p className="text-red-200/80 mb-6">{error}</p>
                <button
                  onClick={() => navigate("/signin")}
                  className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2.5 rounded-xl hover:from-red-600 hover:to-rose-700 transition font-medium shadow-lg shadow-red-500/20"
                >
                  Go to Sign In
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
        <main className="max-w-7xl mx-auto">
          {view === "dashboard" && (
            <section>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-10"
              >
                <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                  Dashboard
                </h2>
                <p className="text-emerald-200/60">Welcome back! Here's your security overview.</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="grid sm:grid-cols-3 gap-6 mb-10">
                  {[
                    { label: "Total Uploads", value: metrics.uploads, color: "from-emerald-500 to-teal-600", icon: "📤", gradient: "from-emerald-500/20 to-teal-500/20" },
                    { label: "Matches Found", value: metrics.matches, color: "from-blue-500 to-cyan-600", icon: "🔍", gradient: "from-blue-500/20 to-cyan-500/20" },
                    { label: "Reports Sent", value: metrics.reports, color: "from-purple-500 to-pink-600", icon: "📄", gradient: "from-purple-500/20 to-pink-500/20" },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 + 0.2 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className={`group relative bg-gradient-to-br ${m.gradient} backdrop-blur-xl p-6 rounded-3xl border border-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-emerald-200/70 font-medium">{m.label}</p>
                          <span className="text-3xl">{m.icon}</span>
                        </div>
                        <p className="text-5xl font-bold text-emerald-100 mb-3">{m.value}</p>
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${m.color} shadow-lg`}></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {notifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mb-10"
                >
                  <h3 className="text-2xl font-bold mb-5 text-emerald-100 flex items-center gap-3">
                    <span>🔔</span>
                    Notifications
                  </h3>
                  <div className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl border border-emerald-500/10 divide-y divide-emerald-500/10 overflow-hidden">
                    {notifications.slice(0, 5).map((notification, idx) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-5 hover:bg-emerald-500/5 transition ${
                          notification.read ? "opacity-60" : ""
                        }`}
                      >
                        <p className={`text-sm ${notification.read ? "text-emerald-200/60" : "text-emerald-100 font-medium"}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-emerald-200/40 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mb-10"
              >
                <h3 className="text-2xl font-bold mb-5 text-emerald-100 flex items-center gap-3">
                  <span>🖼️</span>
                  Latest Uploads
                </h3>
                <LatestUploads images={latestUploads} onViewMatches={handleViewMatches} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl border border-emerald-500/10 p-10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all"
              >
                <h3 className="text-3xl font-bold mb-3 text-center text-emerald-100">
                  Upload & Detect
                </h3>
                <p className="text-emerald-200/70 mb-8 text-center">
                  Upload your image to run similarity detection and track potential copyright issues.
                </p>
                <ImageUpload metrics={metrics} setMetrics={setMetrics} />
              </motion.div>
            </section>
          )}
          
          {view === "changepassword" && <ChangePassword setView={setView} />}
          {view === "viewprofile" && <ViewProfile profile={profile} setView={setView} />}
          {view === "editprofile" && <EditProfile profile={profile} setProfile={setProfile} setView={setView} />}
        </main>
      </div>
    </MainLayout>
  );
}