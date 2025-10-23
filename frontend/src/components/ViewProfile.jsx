// src/components/ViewProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import Button from "./ui/Button";

export default function ViewProfile({ profile, setProfile, setView }) {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(buildUrl(API_CONFIG.endpoints.me), { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          localStorage.setItem("profile", JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, [setProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(buildUrl(API_CONFIG.endpoints.me), { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        localStorage.setItem("profile", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-sm">
          <span className="text-5xl mb-4 block">⚠️</span>
          <p className="text-red-600 font-semibold text-lg">Profile data not available</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const fields = [
    { label: "Full Name", value: profile.full_name, icon: "👤" },
    { label: "Username", value: profile.username, icon: "🏷️" },
    { label: "Email", value: profile.email, icon: "📧" },
    { label: "Phone", value: profile.phone_number, icon: "📱" },
    { label: "Bio", value: profile.bio, icon: "📝", multiline: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => setView("dashboard")} className="text-gray-600 hover:text-gray-900 transition mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-display">Your Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm sticky top-6">
              <div className="mb-6">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 mx-auto shadow-lg" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-lg">
                    {getInitials(profile.full_name || profile.username)}
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{profile.full_name || profile.username}</h3>
              <p className="text-gray-600 mb-6 text-sm">{profile.email}</p>

              <div className="space-y-3">
                <Button onClick={() => setView("editprofile")} className="w-full" icon="✏️">Edit Profile</Button>
                <Button variant="secondary" onClick={handleRefresh} loading={refreshing} className="w-full" icon={!refreshing && "🔄"}>
                  Refresh
                </Button>
                <Button variant="danger" onClick={() => { localStorage.clear(); navigate("/signin"); }} className="w-full" icon="🚪">
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 font-display">Profile Information</h3>
              <div className="space-y-5">
                {fields.map((field, idx) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{field.icon}</span>
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                        <p className={`text-gray-900 font-medium ${field.multiline ? "whitespace-pre-wrap" : ""}`}>
                          {field.value || <span className="text-gray-400 italic">Not provided</span>}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Account Status</h4>
                      <p className="text-sm text-gray-600">
                        Your account is <span className="font-bold text-blue-600">Active</span> and all features are enabled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => navigate("/dashboard?view=changepassword")} icon="🔒">
                  Change Password
                </Button>
                <Button variant="secondary" onClick={() => navigate("/reports")} icon="📄">
                  View Reports
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}