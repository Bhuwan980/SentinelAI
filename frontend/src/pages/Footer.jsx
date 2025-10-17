import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900/90 to-emerald-950/90 backdrop-blur-xl border-t border-emerald-500/10 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-2 text-lg font-bold shadow-lg">
                👁️
              </div>
              <span className="text-xl font-bold text-emerald-100">Sentinel AI</span>
            </div>
            <p className="text-emerald-200/60 text-sm leading-relaxed">
              Protecting intellectual property with AI-powered detection and monitoring.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-emerald-100 mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-emerald-100 mb-4 text-sm uppercase tracking-wider">Account</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/signin" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/match-history" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  Match History
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-emerald-200/60 hover:text-emerald-300 transition flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 group-hover:w-2 transition-all"></span>
                  Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-emerald-100 mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3 text-sm text-emerald-200/60">
              <li className="flex items-center gap-2">
                <span className="text-lg">📧</span>
                <a href="mailto:protect@sentinelai.com" className="hover:text-emerald-300 transition">
                  protect@sentinelai.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">📞</span>
                <a href="tel:+15559119111" className="hover:text-emerald-300 transition">
                  +1 (555) 911-9111
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🕐</span>
                <span>24/7 Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-emerald-500/10 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-emerald-200/60">
            <p>&copy; {new Date().getFullYear()} Sentinel AI. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-emerald-300 transition">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-emerald-300 transition">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-emerald-300 transition">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}