// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "../components/layout/MainLayout";
import { EmailInput } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { SuccessAlert, ErrorAlert, InfoAlert } from "../components/ui/Alert";
import { usePageTitle } from "../hook/userPageTitle";

export default function ForgotPassword() {
  usePageTitle("Forgot Passwrod")
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-3xl shadow-lg">
              🔒
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 font-display">Forgot Password</h2>
            <p className="text-gray-600 text-sm">
              Enter your email to receive a password reset link
            </p>
          </div>

          {msg && <SuccessAlert className="mb-4">{msg}</SuccessAlert>}
          {error && <ErrorAlert className="mb-4">{error}</ErrorAlert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <EmailInput
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Button type="submit" loading={loading} size="lg" className="w-full" icon={!loading && "📧"}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          {token && (
            <InfoAlert className="mt-5">
              <p className="font-semibold text-sm mb-2">Test Token:</p>
              <code className="text-xs break-all block bg-gray-100 p-2 rounded font-mono">{token}</code>
            </InfoAlert>
          )}

          <Button
            variant="secondary"
            onClick={() => navigate("/signin")}
            size="lg"
            className="mt-6 w-full"
          >
            Back to Sign In
          </Button>
        </motion.div>
      </div>
    </MainLayout>
  );
}