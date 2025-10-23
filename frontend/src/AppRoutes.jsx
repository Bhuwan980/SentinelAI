import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import MatchesConfirm from "./pages/MatchConfirm";
import NoMatch from "./pages/NoMatch";
import Reports from "./pages/Reports";
import Matches from "./pages/Matches";
import ReviewHistory from "./pages/ReviewHistory";
import ProtectedRoute from "./components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches"
        element={
          <ProtectedRoute>
            <Matches />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matches-confirm/:imageId"
        element={
          <ProtectedRoute>
            <MatchesConfirm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review-history"
        element={
          <ProtectedRoute>
            <ReviewHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/no-match"
        element={
          <ProtectedRoute>
            <NoMatch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}