import React, { useState } from "react";

export default function ChangePassword({ setView }) {
  const [form, setForm] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setMessage("⚠️ New passwords do not match!");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("❌ Please log in first.");
      return;
    }
    setLoading(true);
    setMessage("Updating password...");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: form.current,
          new_password: form.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("✅ Password changed successfully!");
        setTimeout(() => setView("dashboard"), 1500);
      } else {
        setMessage(`❌ ${data.detail || data.message || "Password change failed."}`);
      }
    } catch (err) {
      setMessage(`⚠️ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {["current", "newPassword", "confirm"].map((field, i) => (
          <input
            key={i}
            type="password"
            placeholder={
              field === "current"
                ? "Current Password"
                : field === "newPassword"
                ? "New Password"
                : "Confirm New Password"
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          />
        ))}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg font-semibold transition ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
      {message && (
        <p
          className={`text-center text-sm mt-4 font-medium ${
            message.includes("✅")
              ? "text-green-600"
              : message.includes("⚠️")
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
      <button
        onClick={() => setView("dashboard")}
        className="mt-4 text-emerald-600 text-sm hover:underline"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}