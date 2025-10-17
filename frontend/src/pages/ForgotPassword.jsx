import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "./MainLayout";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send reset request");

      setMsg(data.message || "Password reset token generated.");
      if (data.token) setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-4 relative overflow-hidden">
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
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="inline-block bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-3 text-2xl font-bold shadow-lg shadow-emerald-500/30 mb-4"
            >
              🔐
            </motion.div>
            <h2 className="text-3xl font-bold text-emerald-100 mb-2">Forgot Password</h2>
            <p className="text-emerald-200/60 text-sm">
              Enter your email to receive a password reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-emerald-200/80 mb-2 flex items-center gap-2">
                <span>📧</span>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 placeholder-emerald-200/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition backdrop-blur-sm"
              />
            </div>
            
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
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </motion.button>
          </form>

          {msg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm"
            >
              <p className="text-emerald-300 text-sm text-center">{msg}</p>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
            >
              <p className="text-red-300 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {token && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 bg-slate-800/50 border border-emerald-500/20 rounded-xl backdrop-blur-sm"
            >
              <p className="text-emerald-200/80 text-xs mb-2 font-semibold">Test Token:</p>
              <code className="text-emerald-300 text-xs break-all block bg-slate-900/50 p-2 rounded">{token}</code>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 w-full bg-slate-800/50 border border-emerald-500/20 text-emerald-100 py-3 rounded-xl font-semibold hover:bg-slate-700/50 transition backdrop-blur-sm"
            onClick={() => navigate("/signin")}
          >
            Back to Sign In
          </motion.button>
        </motion.div>
      </div>
    </MainLayout>
  );
}