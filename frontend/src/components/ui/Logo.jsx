// src/components/ui/Logo.jsx
import React from "react";

// ============================================
// LOGO CONFIGURATION - Change logo path here
// ============================================
const LOGO_PATH = "/assets/logo.png";

export default function Logo({ className = "", size = "md" }) {
  const sizes = {
    sm: "h-16",   // 64px
    md: "h-20",   // 80px
    lg: "h-28",   // 112px
    xl: "h-36"    // 144px
  };

  return (
    <img 
      src={LOGO_PATH}
      alt="Sentinel AI"
      className={`${sizes[size]} ${className}`}
    />
  );
}

// Logo Light - Same as Logo (since logo already has text)
export function LogoLight({ className = "", size = "md" }) {
  const sizes = {
    sm: "h-16",
    md: "h-20",
    lg: "h-28",
    xl: "h-36"
  };

  return (
    <img 
      src={LOGO_PATH}
      alt="Sentinel AI"
      className={`${sizes[size]} ${className}`}
    />
  );
}

// Logo Icon - Same as Logo
export function LogoIcon({ className = "", size = "md" }) {
  const sizes = {
    sm: "h-16",
    md: "h-20",
    lg: "h-28",
    xl: "h-36"
  };

  return (
    <img 
      src={LOGO_PATH}
      alt="Sentinel AI"
      className={`${sizes[size]} ${className}`}
    />
  );
}

// Logo Gradient - Same as Logo
export function LogoGradient({ className = "", size = "md" }) {
  const sizes = {
    sm: "h-16",
    md: "h-20",
    lg: "h-28",
    xl: "h-36"
  };

  return (
    <img 
      src={LOGO_PATH}
      alt="Sentinel AI"
      className={`${sizes[size]} ${className}`}
    />
  );
}