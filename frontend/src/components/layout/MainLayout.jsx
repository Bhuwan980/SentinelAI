// src/components/layout/MainLayout.jsx
import React from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";

/**
 * Main Layout Component
 * Wraps all pages with consistent navigation and footer
 * 
 * @param {ReactNode} children - Page content
 * @param {boolean} showNav - Show navigation bar (default: true)
 * @param {boolean} showFooter - Show footer (default: true)
 */
export default function MainLayout({ children, showNav = true, showFooter = true }) {
  return (
    <div className="flex flex-col min-h-screen">
      <link 
        href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" 
        rel="stylesheet" 
      />
      
      {showNav && <Navigation />}
      
      <main className="flex-grow">
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}