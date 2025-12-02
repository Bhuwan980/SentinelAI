// src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "../components/layout/MainLayout";
import { FeatureCard } from "../components/ui/Card";
import Button, { AccentButton } from "../components/ui/Button";
import { usePageTitle } from "../hook/userPageTitle";
import { LogoIcon } from "../components/ui/Logo";

export default function HomePage() {
  usePageTitle("Home")
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Protection",
      description: "Advanced machine learning algorithms detect unauthorized use of your intellectual property across the web."
    },
    {
      icon: "🔄",
      title: "Automated Monitoring",
      description: "24/7 scanning of websites, social media, and marketplaces to identify potential infringements."
    },
    {
      icon: "🚨",
      title: "Real-time Alerts",
      description: "Instant notifications when potential copyright violations are detected with detailed similarity analysis."
    },
    {
      icon: "⚖️",
      title: "DMCA Generation",
      description: "Automatically generate legally compliant DMCA takedown notices with one click."
    },
  ];

  const benefits = [
    {
      icon: "🎨",
      title: "Protect your creative works and brand assets",
      description: "Comprehensive protection for digital content, artwork, and intellectual property"
    },
    {
      icon: "⏱️",
      title: "Save hours of manual monitoring",
      description: "Automated scanning eliminates the need for time-consuming manual searches"
    },
    {
      icon: "📋",
      title: "Professional legal documentation",
      description: "Generate legally compliant DMCA notices instantly with proper formatting"
    },
    {
      icon: "📊",
      title: "Comprehensive infringement reports",
      description: "Detailed analytics and evidence collection for each detected violation"
    },
    {
      icon: "📈",
      title: "Scalable protection for any portfolio size",
      description: "From individual creators to large enterprises, scale seamlessly"
    },
  ];

  const setupSteps = [
    {
      number: "1",
      title: "Create your account",
      description: "Sign up in seconds with no credit card required",
      icon: "👤"
    },
    {
      number: "2",
      title: "Upload your intellectual property",
      description: "Add your images, artwork, or content to monitor",
      icon: "📤"
    },
    {
      number: "3",
      title: "AI starts monitoring automatically",
      description: "Sit back while our AI scans the web 24/7 for violations",
      icon: "🤖"
    },
  ];

  // If user is logged in, show welcome back section
  if (isLoggedIn) {
    return (
      <MainLayout>
        {/* WELCOME BACK HERO SECTION - Light Gray/White Gradient */}
        <section 
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #F8FAFC 0%, #E0F2FE 100%)',
            minHeight: '70vh'
          }}
        >
          {/* Subtle decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Logo Icon */}
              <div className="mb-8 flex justify-center">
                <LogoIcon size="xl" className="drop-shadow-2xl" />
              </div>

              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-blue-200 shadow-sm mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="font-bold text-blue-600 text-sm">Active Protection</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight font-display">
                Welcome Back! 👋
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                Your intellectual property is being monitored 24/7. Check your dashboard for the latest activity.
              </p>

              <div className="flex justify-center gap-4 flex-wrap">
                <AccentButton
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  }
                >
                  Go to Dashboard
                </AccentButton>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate("/reports")}
                  icon="📄"
                >
                  View Reports
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* QUICK STATS SECTION */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-extrabold text-gray-900 mb-4 font-display">
                Your Protection at a Glance
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Quick access to your most important tools and information
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "📊", title: "Dashboard", description: "View your protection overview", link: "/dashboard" },
                { icon: "🔍", title: "Matches", description: "Review detected matches", link: "/match-history" },
                { icon: "📄", title: "Reports", description: "Access DMCA reports", link: "/reports" },
                { icon: "👤", title: "Profile", description: "Manage your account", link: "/dashboard?view=viewprofile" },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(item.link)}
                  className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  // Original content for non-authenticated users
  return (
    <MainLayout>
      {/* HERO SECTION - Light Gradient (Slate to Sky Blue) */}
      <section 
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #F1F5F9 0%, #E0F2FE 100%)',
          minHeight: '90vh'
        }}
      >
        {/* Subtle decorative backdrop */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/40 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo Icon */}
            <div className="mb-8 flex justify-center">
              <LogoIcon size="xl" className="drop-shadow-2xl" />
            </div>

            {/* Trial Badge */}
            <div className="inline-flex flex-col items-center gap-2 mb-8 px-6 py-3 rounded-full bg-white border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                <span className="font-bold text-blue-600 text-sm">Free 14-day trial</span>
              </div>
              <span className="text-xs text-gray-600">No credit card required</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight font-display">
              Advanced Protection Features
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Comprehensive intellectual property protection powered by cutting-edge AI technology
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              <AccentButton
                size="lg"
                onClick={() => navigate("/signup")}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
              >
                Start Free Trial
              </AccentButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 border border-blue-200">
              ⚡ Powerful Features
            </div>
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4 font-display">
              Everything You Need to Protect Your IP
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Advanced AI-powered tools working 24/7 to safeguard your intellectual property
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-extrabold text-gray-900 mb-6 font-display">
              Why Choose Sentinel AI?
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Join thousands of creators, artists, and businesses who trust Sentinel AI to protect their most valuable digital assets
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-200 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK SETUP SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 border border-blue-200">
              ⚡ Quick Setup
            </div>
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4 font-display">
              Get started in minutes, not hours
            </h2>
            <p className="text-gray-600 text-lg">
              Three simple steps to complete IP protection
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {setupSteps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative bg-white rounded-xl border border-gray-200 p-8 text-center hover:shadow-xl transition-all duration-200"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl text-white text-2xl font-bold mb-6 shadow-lg">
                  {step.number}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="font-bold text-xl text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION - Lighter gradient */}
      <section 
        className="relative py-28 px-6 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #F1F5F9 0%, #DBEAFE 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-400/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/50 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-blue-200 shadow-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-blue-600 font-semibold text-sm">Ready to Protect Your IP?</span>
            </div>

            <h2 className="text-5xl font-bold text-gray-900 mb-6 font-display">
              Join the future of intellectual property protection
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
              AI-powered monitoring and enforcement for creators, artists, and businesses
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              <AccentButton
                size="lg"
                onClick={() => navigate("/signup")}
                icon="🚀"
              >
                Start Free Trial
              </AccentButton>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/contact")}
                icon="📅"
              >
                Schedule Demo
              </Button>
            </div>

            <p className="mt-8 text-sm text-gray-600">
              ✨ No credit card required • 🚀 Start in 2 minutes • ✅ Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}