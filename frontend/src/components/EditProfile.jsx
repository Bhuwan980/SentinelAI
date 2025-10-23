// src/components/EditProfile.jsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import Input, { PhoneInput, TextArea } from "./ui/Input";
import Button from "./ui/Button";
import { SuccessAlert, ErrorAlert, InfoAlert } from "./ui/Alert";

export default function EditProfile({ profile, setProfile, setView }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    phone_number: profile?.phone_number || "",
    bio: profile?.bio || "",
  });
  const [previewImage, setPreviewImage] = useState(profile?.profile_picture || null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fetchUpdatedProfile = async () => {
    try {
      const response = await fetch(buildUrl(API_CONFIG.endpoints.me), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        localStorage.setItem("profile", JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, GIF, or WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setSuccess("");
    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please log in again");
      }

      const uploadUrl = buildUrl(API_CONFIG.endpoints.uploadAvatar);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Upload failed");
      }

      const data = await response.json();
      const imageUrl = data.url || data.profile_picture || data.avatar_url || data.file_url;

      if (!imageUrl) {
        const updatedProfile = await fetchUpdatedProfile();
        if (updatedProfile?.profile_picture) {
          setPreviewImage(updatedProfile.profile_picture);
        }
      } else {
        const updated = { ...profile, profile_picture: imageUrl };
        setProfile(updated);
        localStorage.setItem("profile", JSON.stringify(updated));
        setPreviewImage(imageUrl);
      }
      
      setSuccess("✅ Profile picture updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Image upload error:", err);
      setError(err.message || "Failed to upload image. Please try again.");
      setPreviewImage(profile?.profile_picture || null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setUploadingImage(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(buildUrl(API_CONFIG.endpoints.deleteAvatar), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Delete failed");
      }

      const updated = { ...profile, profile_picture: null };
      setProfile(updated);
      localStorage.setItem("profile", JSON.stringify(updated));
      setPreviewImage(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      setSuccess("✅ Profile picture removed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Image delete error:", err);
      setError(err.message || "Failed to remove image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Only send fields that have values (remove empty strings)
      const updateData = {};
      if (form.full_name) updateData.full_name = form.full_name;
      if (form.username) updateData.username = form.username;
      if (form.phone_number) updateData.phone_number = form.phone_number;
      if (form.bio !== undefined) updateData.bio = form.bio; // Allow empty bio

      console.log("Sending update data:", updateData);

      const res = await fetch(buildUrl(API_CONFIG.endpoints.me), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      console.log("Response:", data);
      
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Update failed");
      }

      const updated = { 
        ...profile, 
        ...updateData, 
        profile_picture: data.profile_picture || profile.profile_picture 
      };
      
      setProfile(updated);
      localStorage.setItem("profile", JSON.stringify(updated));
      
      setSuccess("✅ Profile updated successfully!");
      setTimeout(() => {
        fetchUpdatedProfile().then(() => {
          setView("viewprofile");
        });
      }, 1500);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-8"
        >
          <button 
            onClick={() => {
              fetchUpdatedProfile().then(() => {
                setView("viewprofile");
              });
            }}
            className="text-gray-600 hover:text-gray-900 transition mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-display">Edit Profile</h1>
          <p className="text-gray-600">Update your personal information and profile picture</p>
        </motion.div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {success && <SuccessAlert>{success}</SuccessAlert>}
            {error && <ErrorAlert>{error}</ErrorAlert>}

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Picture Section */}
              <div className="lg:w-1/3 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 font-display">Profile Picture</h3>
                
                <div className="flex justify-center relative">
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center z-10">
                      <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  
                  {previewImage ? (
                    <div className="relative">
                      <img 
                        src={previewImage} 
                        alt="Profile" 
                        className="w-40 h-40 rounded-full object-cover border-4 border-blue-100 shadow-lg" 
                        onError={(e) => {
                          console.error("Image failed to load:", previewImage);
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute bottom-0 right-0 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                      {getInitials(form.full_name || form.username)}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/jpeg,image/png,image/gif,image/webp" 
                    onChange={handleImageChange} 
                    disabled={uploadingImage} 
                    className="hidden" 
                  />
                  
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={uploadingImage}
                    className="w-full bg-white border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📤</span>
                    {uploadingImage ? "Uploading..." : "Upload New Image"}
                  </button>
                  
                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                      className="w-full bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl hover:bg-red-100 hover:border-red-300 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🗑️</span>
                      Remove Picture
                    </button>
                  )}
                  
                  <p className="text-xs text-gray-500 text-center">
                    JPG, PNG, GIF, or WEBP. Max size: 5MB
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="lg:w-2/3 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 font-display">Personal Information</h3>
                
                <Input 
                  label="Full Name" 
                  icon="👤" 
                  value={form.full_name} 
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                  required 
                  placeholder="Enter your full name"
                />
                
                <Input 
                  label="Username" 
                  icon="🏷️" 
                  value={form.username} 
                  onChange={(e) => setForm({ ...form, username: e.target.value })} 
                  required 
                  placeholder="Choose a username"
                />
                
                <PhoneInput 
                  label="Phone Number" 
                  value={form.phone_number} 
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })} 
                  placeholder="+1 (555) 000-0000"
                />
                
                <TextArea 
                  label="Bio" 
                  value={form.bio} 
                  onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                  rows={4} 
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-600 transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="text-xl">✓</span>
                    Save Changes
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  fetchUpdatedProfile().then(() => {
                    setView("viewprofile");
                  });
                }}
                disabled={loading || uploadingImage}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:border-gray-400 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="text-xl">✕</span>
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Tips for a great profile:</p>
                <ul className="list-disc list-inside space-y-1.5 opacity-80">
                  <li>Use a clear, professional photo for better recognition</li>
                  <li>Keep your bio concise and informative</li>
                  <li>Ensure contact information is up to date</li>
                  <li>Choose a unique username that represents you</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}