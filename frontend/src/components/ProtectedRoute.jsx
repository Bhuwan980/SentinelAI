import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    console.log("No token found, redirecting to /signin");
    // ✅ Save where they were trying to go so we can redirect back after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}