// pages/NoMatch.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function NoMatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { image } = location.state || {};

  const handleScanAgain = () => navigate("/dashboard");

  return (
    <div className="max-w-3xl mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Congrats!</h1>
      <p className="mb-6">No matches were found for your uploaded image.</p>
      <button
        onClick={handleScanAgain}
        className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
      >
        Scan Another Image
      </button>
    </div>
  );
}