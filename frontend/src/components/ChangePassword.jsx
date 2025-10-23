// src/components/ChangePassword.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../config/api";
import { PasswordInput } from "./ui/Input";
import Button from "./ui/Button";
import { SuccessAlert, ErrorAlert, WarningAlert, InfoAlert } from "./ui/Alert";

export default function ChangePassword({ setView }) {
  const [form, setForm] = useState({ current: "", newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.newPassword !== form.confirm) {
      setMessageType("warning");
      setMessage("New passwords do not match!");
      return;
    }

    if (form.newPassword.length < 8) {
      setMessageType("warning");
      setMessage("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(buildUrl(API_CONFIG.endpoints.changePassword), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: form.current,
          new_password: form.newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessageType("success");
        setMessage("Password changed successfully!");
        setForm({ current: "", newPassword: "", confirm: "" });
        setTimeout(() => setView("dashboard"), 1500);
      } else {
        setMessageType("error");
        setMessage(data.detail || "Password change failed");
      }
    } catch (err) {
      setMessageType("error");
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = () => {
    if (!message) return null;
    switch (messageType) {
      case "success": return <SuccessAlert>{message}</SuccessAlert>;
      case "error": return <ErrorAlert>{message}</ErrorAlert>;
      case "warning": return <WarningAlert>{message}</WarningAlert>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => setView("dashboard")} className="text-gray-600 hover:text-gray-900 transition mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-display">Change Password</h1>
          <p className="text-gray-600">Update your account password</p>
        </motion.div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-3xl border border-blue-200">
              🔒
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 font-display">Security Settings</h3>
              <p className="text-sm text-gray-600">Keep your account secure</p>
            </div>
          </div>

          {renderMessage()}

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <PasswordInput
              label="Current Password"
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
              required
            />

            <PasswordInput
              label="New Password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />

            <PasswordInput
              label="Confirm New Password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />

            <div className="flex gap-4 pt-6">
              <Button type="submit" loading={loading} className="flex-1" icon={!loading && "✓"}>
                Update Password
              </Button>
              <Button type="button" variant="secondary" onClick={() => setView("dashboard")} className="flex-1" icon="✕">
                Cancel
              </Button>
            </div>
          </form>

          <InfoAlert className="mt-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="text-sm">
                <p className="font-semibold mb-2">Password Tips:</p>
                <ul className="list-disc list-inside space-y-1.5 opacity-80">
                  <li>Use at least 8 characters</li>
                  <li>Include uppercase and lowercase</li>
                  <li>Add numbers and special characters</li>
                  <li>Avoid common words</li>
                </ul>
              </div>
            </div>
          </InfoAlert>
        </div>
      </div>
    </div>
  );
}