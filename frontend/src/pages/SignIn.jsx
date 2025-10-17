import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "./Footer"; // Import Footer component

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || "/dashboard";
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    const payload = {
      email: formData.email,
      password: formData.password,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed. Please try again.");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      if (data.user) {
        localStorage.setItem("profile", JSON.stringify(data.user));
      }
      
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/10 p-8 relative z-10"
        >
          <div className="flex justify-center items-center gap-3 mb-8">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-2.5 text-xl font-bold shadow-lg shadow-emerald-500/30"
            >
              👁️
            </motion.div>
            <h1 className="text-2xl font-extrabold text-emerald-100 tracking-tight">
              Sign In to <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Sentinel AI</span>
            </h1>
          </div>

          {location.state?.from && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm"
            >
              <p className="text-sm text-yellow-300 text-center flex items-center justify-center gap-2">
                <span>🔒</span>
                Please sign in to access this page
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
            >
              <p className="text-red-300 text-sm text-center">{error}</p>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm"
            >
              <p className="text-emerald-300 text-sm text-center">{success}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { label: "Email", key: "email", type: "email", placeholder: "you@example.com", icon: "📧" },
              { label: "Password", key: "password", type: "password", placeholder: "Enter password", icon: "🔑" },
            ].map((input) => (
              <div key={input.key}>
                <label className="block text-sm font-medium text-emerald-200/80 mb-2 flex items-center gap-2">
                  <span>{input.icon}</span>
                  {input.label}
                </label>
                <input
                  type={input.type}
                  value={formData[input.key]}
                  onChange={(e) => handleChange(input.key, e.target.value)}
                  placeholder={input.placeholder}
                  required
                  className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-200/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition backdrop-blur-sm"
                />
              </div>
            ))}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Logging in...
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 transition">
              Forgot your password?
            </Link>
          </div>

          <p className="mt-6 text-sm text-center text-emerald-200/60">
            Don't have an account?{" "}
            <Link to="/signup" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">
              Sign up
            </Link>
          </p>

          <Link
            to="/"
            className="mt-6 flex items-center justify-center gap-2 text-emerald-200/80 hover:text-emerald-300 transition text-sm font-medium group"
          >
            <motion.div
              whileHover={{ rotate: -10 }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg p-2 text-xs font-bold shadow-lg group-hover:shadow-emerald-500/30 transition"
            >
              👁️
            </motion.div>
            Back to Homepage
          </Link>
        </motion.div>
      </div>

      {/* Use Footer Component */}
      <Footer />
    </div>
  );
}