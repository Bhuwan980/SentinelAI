// src/components/layout/Navigation.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_CONFIG, buildUrl, getAuthHeaders } from "../../config/api";
import Logo, { LogoGradient } from "../ui/Logo";

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchProfile = async () => {
        try {
          const profileRes = await fetch(buildUrl(API_CONFIG.endpoints.me), {
            headers: getAuthHeaders(),
          });
          const profileData = await profileRes.json();
          if (!profileRes.ok) throw new Error(profileData.detail || "Failed to fetch profile");
          setProfile(profileData);
          localStorage.setItem("profile", JSON.stringify(profileData));
        } catch (err) {
          console.error("Fetch error:", err);
          if (err.message.includes("401")) {
            localStorage.removeItem("token");
            localStorage.removeItem("profile");
            navigate("/signin", { replace: true });
          }
        }
      };
      fetchProfile();
    }

    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await fetch(buildUrl(API_CONFIG.endpoints.logout), {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("profile");
      setShowDropdown(false);
      navigate("/signin", { replace: true });
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const dropdownOptions = [
    { label: "View Profile", path: "/dashboard?view=viewprofile", icon: "👤" },
    { label: "Edit Profile", path: "/dashboard?view=editprofile", icon: "✏️" },
    { label: "Change Password", path: "/dashboard?view=changepassword", icon: "🔒" },
    { label: "Review History", path: "/review-history", icon: "📜" },
  ];

  // Helper function to check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // NavLink component with active state
  const NavLink = ({ to, children }) => {
    const active = isActive(to);
    return (
      <Link 
        to={to} 
        className={`relative font-medium transition ${
          active 
            ? 'text-blue-600' 
            : 'text-gray-700 hover:text-blue-600'
        }`}
      >
        {children}
        {active && (
          <motion.div
            layoutId="activeTab"
            className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-blue-600"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    );
  };

  const ProfileAvatar = ({ size = "w-9 h-9", textSize = "text-sm" }) => {
    if (profile?.profile_picture) {
      return (
        <img
          src={profile.profile_picture}
          alt={profile.username || "Profile"}
          className={`${size} rounded-full object-cover border-2 border-blue-500/50`}
        />
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center ${textSize} font-bold`}>
        {getInitials(profile?.full_name || profile?.username)}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
          onClick={() => navigate("/")}
        >
          <LogoGradient size="md" />
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 text-sm items-center">
          {localStorage.getItem("token") ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/matches">Matches</NavLink>
              <NavLink to="/reports">Reports</NavLink>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <ProfileAvatar />
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-2"
                    >
                      {dropdownOptions.map((option) => (
                        <Link
                          key={option.label}
                          to={option.path}
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition text-sm"
                        >
                          <span>{option.icon}</span>
                          {option.label}
                        </Link>
                      ))}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm flex items-center gap-2"
                      >
                        <span>🚪</span>
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              <Link to="/signin" className="px-5 py-2 rounded-xl text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600 transition">
                Sign In
              </Link>
              <Link to="/signup" className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-md transition">
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
          >
            <nav className="px-6 py-4 space-y-2">
              {localStorage.getItem("token") ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-xl">
                    <ProfileAvatar size="w-12 h-12" textSize="text-lg" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-gray-600">{profile?.email}</p>
                    </div>
                  </div>
                  <MobileLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} active={isActive("/dashboard")}>
                    Dashboard
                  </MobileLink>
                  <MobileLink to="/matches" onClick={() => setMobileMenuOpen(false)} active={isActive("/matches")}>
                    Matches
                  </MobileLink>
                  <MobileLink to="/reports" onClick={() => setMobileMenuOpen(false)} active={isActive("/reports")}>
                    Reports
                  </MobileLink>
                  {dropdownOptions.map((option) => (
                    <MobileLink key={option.label} to={option.path} onClick={() => setMobileMenuOpen(false)}>
                      {option.icon} {option.label}
                    </MobileLink>
                  ))}
                  <button
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition font-semibold"
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <>
                  <MobileLink to="/about" onClick={() => setMobileMenuOpen(false)} active={isActive("/about")}>
                    About
                  </MobileLink>
                  <MobileLink to="/contact" onClick={() => setMobileMenuOpen(false)} active={isActive("/contact")}>
                    Contact
                  </MobileLink>
                  <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-5 py-3 rounded-xl border border-gray-300 text-gray-700">
                    Sign In
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md">
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileLink({ to, onClick, children, active }) {
  return (
    <Link 
      to={to} 
      onClick={onClick} 
      className={`block px-4 py-3 rounded-xl transition font-medium ${
        active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
}