import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Navigation() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchProfile = async () => {
        try {
          const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const profileData = await profileRes.json();
          if (!profileRes.ok) {
            throw new Error(profileData.detail || "Failed to fetch profile");
          }
          setProfile(profileData);
          setProfileImageError(false); // Reset error state on new profile data
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
    const token = localStorage.getItem("token");
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/users/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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

  const handleImageError = () => {
    setProfileImageError(true);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const dropdownOptions = [
    { label: "View Profile", path: "/dashboard?view=viewprofile", icon: "👤" },
    { label: "Edit Profile", path: "/dashboard?view=editprofile", icon: "✏️" },
    { label: "Change Password", path: "/dashboard?view=changepassword", icon: "🔑" },
    { label: "Reports", path: "/reports", icon: "📄" },
  ];

  // Profile Avatar Component
  const ProfileAvatar = ({ size = "w-8 h-8", textSize = "text-sm" }) => {
    const showImage = profile?.profile_picture && !profileImageError;
    
    if (showImage) {
      return (
        <img
          src={profile.profile_picture}
          alt={profile.username || "Profile"}
          className={`${size} rounded-full object-cover border-2 border-emerald-400/50 shadow-lg`}
          onError={handleImageError}
        />
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center ${textSize} font-bold shadow-lg`}>
        {getInitials(profile?.full_name || profile?.username)}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/95 to-emerald-950/95 backdrop-blur-xl border-b border-emerald-500/20 shadow-xl shadow-emerald-500/5">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-2.5 text-xl font-bold shadow-lg shadow-emerald-500/30"
          >
            👁️
          </motion.div>
          <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight">
            <span className="text-emerald-100">Sentinel</span>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">AI</span>
          </h1>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
          {localStorage.getItem("token") ? (
            <>
              <Link 
                to="/dashboard" 
                className="text-emerald-200/80 hover:text-emerald-100 transition-colors relative group"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/reports" 
                className="text-emerald-200/80 hover:text-emerald-100 transition-colors relative group"
              >
                Reports
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/match-history" 
                className="text-emerald-200/80 hover:text-emerald-100 transition-colors relative group"
              >
                Matches
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-100 px-4 py-2 rounded-xl border border-emerald-500/30 transition-all backdrop-blur-sm"
                >
                  <ProfileAvatar />
                  <span className="hidden sm:inline">{profile?.username || "Profile"}</span>
                  <motion.svg
                    animate={{ rotate: showDropdown ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>
                
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-gradient-to-br from-slate-900/95 to-emerald-950/95 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden"
                    >
                      {/* Profile Info Header in Dropdown */}
                      <div className="px-4 py-3 border-b border-emerald-500/10 bg-emerald-500/5">
                        <div className="flex items-center gap-3">
                          <ProfileAvatar size="w-10 h-10" textSize="text-base" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-100 truncate">
                              {profile?.full_name || profile?.username || "User"}
                            </p>
                            <p className="text-xs text-emerald-200/60 truncate">
                              {profile?.email || ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {dropdownOptions.map((option, idx) => (
                        <Link
                          key={option.label}
                          to={option.path}
                          className="flex items-center gap-3 w-full text-left px-4 py-3 text-emerald-200/80 hover:text-emerald-100 hover:bg-emerald-500/10 transition-all border-b border-emerald-500/10 last:border-b-0"
                          onClick={() => setShowDropdown(false)}
                        >
                          <span className="text-lg">{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </Link>
                      ))}
                      <button
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold transition-all"
                        onClick={handleSignOut}
                      >
                        <span className="text-lg">🚪</span>
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/about" 
                className="text-emerald-200/80 hover:text-emerald-100 transition-colors relative group"
              >
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/contact" 
                className="text-emerald-200/80 hover:text-emerald-100 transition-colors relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signin"
                  className="border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 rounded-xl text-emerald-100 hover:bg-emerald-500/20 transition-all backdrop-blur-sm"
                >
                  Sign In
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2 rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 transition-all font-semibold"
                >
                  Get Started
                </Link>
              </motion.div>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-emerald-100 p-2 rounded-lg hover:bg-emerald-500/10 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gradient-to-br from-slate-900/98 to-emerald-950/98 backdrop-blur-xl border-t border-emerald-500/20 overflow-hidden"
          >
            <nav className="px-6 py-4 space-y-2">
              {localStorage.getItem("token") ? (
                <>
                  {/* Mobile Profile Header */}
                  <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <ProfileAvatar size="w-12 h-12" textSize="text-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-100 truncate">
                        {profile?.full_name || profile?.username || "User"}
                      </p>
                      <p className="text-xs text-emerald-200/60 truncate">
                        {profile?.email || ""}
                      </p>
                    </div>
                  </div>

                  <MobileLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </MobileLink>
                  <MobileLink to="/reports" onClick={() => setMobileMenuOpen(false)}>
                    Reports
                  </MobileLink>
                  <MobileLink to="/match-history" onClick={() => setMobileMenuOpen(false)}>
                    Matches
                  </MobileLink>
                  <div className="border-t border-emerald-500/20 my-2 pt-2">
                    {dropdownOptions.map((option) => (
                      <MobileLink
                        key={option.label}
                        to={option.path}
                        onClick={() => setMobileMenuOpen(false)}
                        icon={option.icon}
                      >
                        {option.label}
                      </MobileLink>
                    ))}
                  </div>
                  <button
                    className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-semibold flex items-center gap-2"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span>🚪</span>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <MobileLink to="/about" onClick={() => setMobileMenuOpen(false)}>
                    About
                  </MobileLink>
                  <MobileLink to="/contact" onClick={() => setMobileMenuOpen(false)}>
                    Contact
                  </MobileLink>
                  <div className="border-t border-emerald-500/20 my-2 pt-2 space-y-2">
                    <Link
                      to="/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 rounded-xl text-emerald-100 hover:bg-emerald-500/20 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30 transition-all font-semibold"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Mobile Link Component
function MobileLink({ to, onClick, children, icon }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left px-4 py-3 rounded-xl text-emerald-200/80 hover:text-emerald-100 hover:bg-emerald-500/10 transition-all"
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </Link>
  );
}