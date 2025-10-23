// src/pages/SignIn.jsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Navigation from "../components/layout/Navigation";
import Footer from "../components/layout/Footer";
import { buildUrl, API_CONFIG } from "../config/api";
import { EmailInput, PasswordInput } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { SuccessAlert, ErrorAlert, WarningAlert } from "../components/ui/Alert";
import { usePageTitle } from "../hook/userPageTitle";

export default function SignIn() {
  usePageTitle("Sign In")
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildUrl(API_CONFIG.endpoints.login), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      // Store user data if provided
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");

      // Decode the JWT token from Google
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google user info:", decoded);

      // Include full_name from Google
      const params = new URLSearchParams({
        email: decoded.email,
        username: decoded.name || decoded.email.split('@')[0],
        full_name: decoded.name || ""
      });

      // Send to your backend
      const response = await fetch(
        `${buildUrl(API_CONFIG.endpoints.googleLogin)}?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Google login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      // Store user data if provided
      if (data.user) {
        localStorage.setItem("profile", JSON.stringify(data.user));
      }
      
      setSuccess("Google login successful! Redirecting...");
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                👁️
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 font-display">
                Sentinel<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">AI</span>
              </h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Warning for protected routes */}
          {location.state?.from && (
            <WarningAlert className="mb-4">
              Please sign in to access this page
            </WarningAlert>
          )}

          {/* Alerts */}
          {error && <ErrorAlert className="mb-4">{error}</ErrorAlert>}
          {success && <SuccessAlert className="mb-4">{success}</SuccessAlert>}

          {/* Google Sign In Button */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500 font-medium">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <EmailInput
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />

            <PasswordInput
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Sign In
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot password?
            </Link>
          </div>

          {/* Sign Up Link */}
          <p className="mt-6 text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign up
            </Link>
          </p>

          {/* Back to Homepage */}
          <Link 
            to="/" 
            className="mt-6 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Homepage
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}