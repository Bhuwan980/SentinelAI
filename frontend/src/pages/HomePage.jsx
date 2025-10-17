import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "./MainLayout";

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Detection",
      desc: "Machine learning detects threats in real time with 99.9% accuracy.",
      gradient: "from-emerald-500/20 to-teal-500/20"
    },
    {
      icon: "🔒",
      title: "Zero-Trust Security",
      desc: "Enterprise-grade protection with end-to-end encryption and zero-trust principles.",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: "👁️",
      title: "24/7 Monitoring",
      desc: "Continuous surveillance with smart alerts and automated response.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
  ];

  const handleStartScanning = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/signin");
  };

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/signup");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
        <motion.section
          className="text-center py-32 px-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 px-5 py-2.5 rounded-full text-sm font-semibold backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                AI-Powered Protection
              </div>
            </motion.div>
            
            <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Protecting Intellectual Property
              </span>
              <span className="block text-emerald-400 mt-3">in the Digital Age</span>
            </h1>
            <p className="text-emerald-200/70 text-lg sm:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
              Protect your digital assets with cutting-edge AI surveillance and
              real-time threat detection. Intelligent analysis meets proactive
              defense — for creators, businesses, and innovators.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartScanning}
                className="group bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition shadow-xl shadow-emerald-500/25 flex items-center gap-2"
              >
                Start Scanning
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.section>

        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Why Choose Sentinel AI?
              </h2>
              <p className="text-emerald-200/60 text-lg">
                Enterprise-grade security powered by artificial intelligence
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, idx) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className={`group relative bg-gradient-to-br ${f.gradient} backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-5xl mb-5">{f.icon}</div>
                    <h3 className="font-bold text-xl mb-3 text-emerald-100">{f.title}</h3>
                    <p className="text-emerald-200/70 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative text-center py-28 px-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-500/20"></div>
          <div className="absolute inset-0 backdrop-blur-xl"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-5 text-emerald-100">Ready to Secure Your Future?</h2>
            <p className="max-w-2xl mx-auto mb-12 text-lg text-emerald-200/80 leading-relaxed">
              Join hundreds of organizations already protected by SentinelAI's
              advanced AI-driven threat detection and digital-asset defense.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-10 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition shadow-2xl shadow-emerald-500/30 inline-flex items-center gap-2"
            >
              {localStorage.getItem("token") ? "Go to Dashboard" : "Start Your Free Trial"}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </div>
        </motion.section>
      </div>
    </MainLayout>
  );
}