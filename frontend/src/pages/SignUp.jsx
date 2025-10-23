// src/pages/SignUp.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Navigation from "../components/layout/Navigation";
import Footer from "../components/layout/Footer";
import { buildUrl, API_CONFIG } from "../config/api";
import Input, { EmailInput, PasswordInput, PhoneInput } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { SuccessAlert, ErrorAlert } from "../components/ui/Alert";
import { usePageTitle } from "../hook/userPageTitle";

export default function SignUp() {
  usePageTitle("Sign Up")
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildUrl(API_CONFIG.endpoints.signup), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profile_image_url: "",
          bio: "",
          location: "",
          language: "en",
          timezone: "UTC",
          notification_preferences: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      setSuccess("Account created! Redirecting to sign in...");
      setTimeout(() => navigate("/signin"), 2000);
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

      // Send to your backend (same endpoint - it creates account if doesn't exist)
      const response = await fetch(
        `${buildUrl(API_CONFIG.endpoints.googleLogin)}?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Google sign up failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      
      // Store user data if provided
      if (data.user) {
        localStorage.setItem("profile", JSON.stringify(data.user));
      }
      
      setSuccess("Account created with Google! Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      console.error("Google sign up error:", err);
      setError(err.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign up failed. Please try again.");
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600 text-sm">Join thousands protecting their IP</p>
          </div>

          {/* Alerts */}
          {error && <ErrorAlert className="mb-4">{error}</ErrorAlert>}
          {success && <SuccessAlert className="mb-4">{success}</SuccessAlert>}

          {/* Google Sign Up Button */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text="signup_with"
              shape="rectangular"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500 font-medium">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Manual Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              icon="👤"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={loading}
              placeholder="johndoe"
            />

            <Input
              label="Full Name"
              icon="✏️"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              disabled={loading}
              placeholder="John Doe"
            />

            <EmailInput
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
              placeholder="john@example.com"
            />

            <PhoneInput
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              required
              disabled={loading}
              placeholder="+1 234 567 8900"
            />

            <PasswordInput
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
              placeholder="••••••••"
            />

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Create Account
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <Link to="/signin" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign in
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