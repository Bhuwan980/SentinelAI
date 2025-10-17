import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ViewProfile({ profile, setProfile, setView }) {
  const navigate = useNavigate();
  const [refreshingImage, setRefreshingImage] = useState(false);

  // Fetch fresh profile data on component mount to get updated presigned URL
  useEffect(() => {
    const fetchFreshProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const freshProfile = await response.json();
          setProfile(freshProfile);
          localStorage.setItem("profile", JSON.stringify(freshProfile));
        }
      } catch (error) {
        console.error("Failed to fetch fresh profile:", error);
      }
    };

    fetchFreshProfile();
  }, [setProfile]);

  const handleRefreshImage = async () => {
    setRefreshingImage(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const freshProfile = await response.json();
        setProfile(freshProfile);
        localStorage.setItem("profile", JSON.stringify(freshProfile));
      }
    } catch (error) {
      console.error("Failed to refresh profile image:", error);
    } finally {
      setRefreshingImage(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-red-950/50 to-rose-900/30 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl"
        >
          <span className="text-5xl mb-4 block">⚠️</span>
          <p className="text-red-200 font-semibold text-lg">
            Profile data not available. Please try again.
          </p>
        </motion.div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const profileFields = [
    { label: "Full Name", value: profile.full_name, icon: "👤" },
    { label: "Username", value: profile.username, icon: "🏷️" },
    { label: "Email", value: profile.email, icon: "📧" },
    { label: "Phone Number", value: profile.phone_number, icon: "📱" },
    { label: "Bio", value: profile.bio, icon: "📝", multiline: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => setView("dashboard")}
            className="group inline-flex items-center gap-2 text-emerald-300/70 hover:text-emerald-300 transition mb-4"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-2">
            Your Profile
          </h1>
          <p className="text-emerald-200/60 text-lg">
            Manage your personal information and settings
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/10 p-8 text-center sticky top-6">
              <div className="relative inline-block mb-6">
                {profile.profile_picture ? (
                  <div className="relative">
                    <img
                      src={profile.profile_picture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500/30 shadow-xl shadow-emerald-500/20"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full hidden items-center justify-center text-white text-4xl font-bold shadow-xl shadow-emerald-500/30">
                      {getInitials(profile.full_name || profile.username)}
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-emerald-500/30">
                    {getInitials(profile.full_name || profile.username)}
                  </div>
                )}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 border-4 border-slate-900 rounded-full"></div>
              </div>

              {profile.profile_picture && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefreshImage}
                  disabled={refreshingImage}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition mb-4 flex items-center justify-center gap-1 mx-auto"
                >
                  {refreshingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-emerald-400"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh Image
                    </>
                  )}
                </motion.button>
              )}

              <h2 className="text-2xl font-bold text-emerald-100 mb-1">
                {profile.full_name || profile.username || "User"}
              </h2>
              <p className="text-emerald-200/60 text-sm mb-6">
                {profile.email || "No email provided"}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-emerald-500/10">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    0
                  </div>
                  <div className="text-xs text-emerald-200/60 uppercase tracking-wide mt-1">
                    Scans
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    0
                  </div>
                  <div className="text-xs text-emerald-200/60 uppercase tracking-wide mt-1">
                    Reports
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/dashboard?view=editprofile")}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-500/30 mb-3 flex items-center justify-center gap-2"
              >
                ✏️ Edit Profile
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("profile");
                  navigate("/signin");
                }}
                className="w-full bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition flex items-center justify-center gap-2"
              >
                🚪 Logout
              </motion.button>
            </div>
          </motion.div>

          {/* Right: Profile Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/10 p-8">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-emerald-500/10">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center text-3xl border border-emerald-500/30">
                  📋
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-100">
                    Profile Information
                  </h3>
                  <p className="text-sm text-emerald-200/60">
                    Manage your personal details
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {profileFields.map((field, index) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="group"
                  >
                    <div className="bg-gradient-to-br from-slate-800/30 to-emerald-900/20 rounded-2xl p-5 border border-emerald-500/10 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl flex-shrink-0 mt-1">
                          {field.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-semibold text-emerald-200/70 mb-2">
                            {field.label}
                          </label>
                          <p
                            className={`text-emerald-100 font-medium ${
                              field.multiline
                                ? "whitespace-pre-wrap"
                                : "truncate"
                            }`}
                          >
                            {field.value || (
                              <span className="text-emerald-200/40 italic">
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-emerald-500/10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-5 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-200 mb-1">
                        Account Status
                      </h4>
                      <p className="text-sm text-blue-200/80">
                        Your account is{" "}
                        <span className="font-bold text-blue-100">Active</span>{" "}
                        and all features are enabled.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/dashboard?view=changepassword")}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-200 px-5 py-3 rounded-xl font-semibold hover:from-purple-500/30 hover:to-pink-500/30 transition flex items-center justify-center gap-2"
                >
                  🔑 Change Password
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/reports")}
                  className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-200 px-5 py-3 rounded-xl font-semibold hover:from-orange-500/30 hover:to-amber-500/30 transition flex items-center justify-center gap-2"
                >
                  📄 View Reports
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}