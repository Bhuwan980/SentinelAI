import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const validateForm = () => {
    if (!form.full_name || form.full_name.length > 100) {
      setError("Full name is required and must be under 100 characters");
      return false;
    }
    if (!form.username || !/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
      setError("Username must be 3-30 characters (letters, numbers, underscores)");
      return false;
    }
    if (form.phone_number && !/^\+?[\d\s-]{7,15}$/.test(form.phone_number)) {
      setError("Invalid phone number format");
      return false;
    }
    if (form.bio && form.bio.length > 500) {
      setError("Bio must be under 500 characters");
      return false;
    }
    return true;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, GIF, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setUploadingImage(true);

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);

      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/upload-avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload image");
      }

      const data = await response.json();
      
      // Update profile with presigned URL returned from backend
      const updatedProfile = { ...profile, profile_picture: data.url };
      setProfile(updatedProfile);
      localStorage.setItem("profile", JSON.stringify(updatedProfile));
      
      setSuccess("Profile picture updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setPreviewImage(profile?.profile_picture || null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profile?.profile_picture) {
      setError("No profile picture to remove");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/delete-avatar`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete image");
      }

      // Clear preview and update profile
      setPreviewImage(null);
      
      const updatedProfile = { ...profile, profile_picture: null };
      setProfile(updatedProfile);
      localStorage.setItem("profile", JSON.stringify(updatedProfile));
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      setSuccess("Profile picture removed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          phone_number: form.phone_number,
          bio: form.bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update profile");
      }

      // Update local storage and state with response data
      const updatedProfile = { 
        ...profile, 
        ...form,
        profile_picture: data.profile_picture || profile.profile_picture // Keep existing picture
      };
      setProfile(updatedProfile);
      localStorage.setItem("profile", JSON.stringify(updatedProfile));
      
      setSuccess("Profile updated successfully! Redirecting...");
      
      // Redirect to ViewProfile after 1.5 seconds
      setTimeout(() => setView("viewprofile"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    {
      label: "Full Name",
      key: "full_name",
      placeholder: "Enter your full name",
      icon: "👤",
      type: "text",
    },
    {
      label: "Username",
      key: "username",
      placeholder: "Enter your username",
      icon: "🏷️",
      type: "text",
    },
    {
      label: "Phone Number",
      key: "phone_number",
      placeholder: "+1 (555) 000-0000",
      icon: "📱",
      type: "tel",
    },
    {
      label: "Bio",
      key: "bio",
      placeholder: "Tell us about yourself...",
      icon: "📝",
      type: "textarea",
      rows: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => setView("viewprofile")}
            className="group inline-flex items-center gap-2 text-emerald-300/70 hover:text-emerald-300 transition mb-4"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent mb-2">
            Edit Profile
          </h1>
          <p className="text-emerald-200/60 text-lg">Update your personal information</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/10 p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 backdrop-blur-sm"
            >
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-red-300 font-semibold">Error</p>
                <p className="text-red-200/80 text-sm">{error}</p>
              </div>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 backdrop-blur-sm"
            >
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="text-emerald-300 font-semibold">Success</p>
                <p className="text-emerald-200/80 text-sm">{success}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture Section */}
            <div className="pb-8 border-b border-emerald-500/10">
              <h3 className="text-xl font-bold text-emerald-100 mb-6 flex items-center gap-2">
                <span className="text-2xl">📸</span>
                Profile Picture
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500/30 shadow-xl shadow-emerald-500/20"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-emerald-500/30">
                      {getInitials(form.full_name || form.username)}
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploadingImage}
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <motion.label
                      whileHover={{ scale: uploadingImage ? 1 : 1.05 }}
                      whileTap={{ scale: uploadingImage ? 1 : 0.95 }}
                      htmlFor="avatar-upload"
                      className={`cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition shadow-lg shadow-emerald-500/30 ${
                        uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {uploadingImage ? "Uploading..." : "Upload Photo"}
                    </motion.label>
                    {previewImage && (
                      <motion.button
                        whileHover={{ scale: uploadingImage ? 1 : 1.05 }}
                        whileTap={{ scale: uploadingImage ? 1 : 0.95 }}
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                        className={`inline-flex items-center justify-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 px-6 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition ${
                          uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </motion.button>
                    )}
                  </div>
                  <p className="text-xs text-emerald-200/50 mt-3">
                    JPG, PNG, GIF, or WEBP. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-emerald-100 flex items-center gap-2">
                <span className="text-2xl">✏️</span>
                Personal Information
              </h3>

              {formFields.map((field, index) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <label className="block text-sm font-semibold text-emerald-200/80 mb-2 flex items-center gap-2">
                    <span>{field.icon}</span>
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-200/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition resize-none backdrop-blur-sm"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-200/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition backdrop-blur-sm"
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-emerald-500/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || uploadingImage}
                className={`flex-1 py-3.5 rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2 ${
                  loading || uploadingImage
                    ? "bg-gray-600/50 cursor-not-allowed text-gray-400"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/30"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setView("viewprofile")}
                disabled={loading || uploadingImage}
                className="flex-1 border border-emerald-500/30 bg-slate-800/50 px-6 py-3.5 rounded-xl text-emerald-100 font-semibold hover:bg-slate-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-5 flex items-start gap-3 backdrop-blur-sm"
        >
          <span className="text-2xl">💡</span>
          <div className="flex-1 text-sm text-blue-200">
            <p className="font-semibold mb-2 text-blue-100">Tips for a great profile:</p>
            <ul className="list-disc list-inside space-y-1.5 text-blue-200/80">
              <li>Use a clear, professional photo</li>
              <li>Keep your bio concise and informative</li>
              <li>Make sure your contact information is up to date</li>
              <li>Images are securely stored and accessible only to you</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}