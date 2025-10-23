// src/pages/AboutPage.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { FeatureCard } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { usePageTitle } from "../hook/userPageTitle";
export default function AboutPage() {
  usePageTitle("About");
  const navigate = useNavigate();

  const team = [
    {
      ini: "RP",
      name: "Ms. Rashmi Purandare",
      role: "Frontend Developer",
      desc: "Master's in Computer Science, passionate about creating user-friendly and engaging web interfaces.",
      color: "from-blue-600 to-cyan-500"
    },
    {
      ini: "BN",
      name: "Mr. Bhuwan Neupane",
      role: "Backend Developer",
      desc: "Master's in Computer Science. Enthusiastic about AI model integration and cloud infrastructure.",
      color: "from-purple-600 to-pink-500"
    },
    {
      ini: "HK",
      name: "Ms. Harpreet Kaur",
      role: "Project Manager",
      desc: "Master's in Computer Science. Passionate about Agile, Scrum, and managing teams for impactful results.",
      color: "from-green-600 to-emerald-500"
    },
  ];

  const cards = [
    {
      icon: "🎯",
      title: "Our Mission",
      desc: "To democratize a robust, intuitive, and highly efficient solution for safeguarding intellectual property in the digital realm."
    },
    {
      icon: "👁️",
      title: "Our Vision",
      desc: "A world where cyber threats are detected and neutralized before they can cause harm, powered by intelligent AI systems."
    },
    {
      icon: "🏆",
      title: "Our Values",
      desc: "Innovation, transparency, and unwavering commitment to protecting our clients' digital assets and privacy."
    },
  ];

  return (
    <MainLayout>
      <div className="bg-white">
        {/* Hero Section */}
        <section className="text-center py-24 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold mb-6"
            >
              ✨ Our Story
            </motion.div>
            <h1 className="text-6xl font-extrabold mb-6 leading-tight font-display">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Protecting Intellectual Property
              </span>
              <span className="block text-gray-900 mt-2">Since 2025</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Founded by leading minds in cybersecurity and AI, SentinelAI was
              built on a vision of intelligent defense — one that evolves with
              every new threat in the digital landscape.
            </p>
          </div>
        </section>

        {/* Mission/Vision/Values */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <FeatureCard
                  icon={card.icon}
                  title={card.title}
                  description={card.desc}
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-extrabold mb-4 text-gray-900 font-display">
                Leadership Team
              </h2>
              <p className="text-gray-600 mb-16 text-lg max-w-2xl mx-auto">
                Meet the experts behind SentinelAI's revolutionary security platform.
              </p>
            </motion.div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((t, idx) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-xl transition-all"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${t.color} text-white text-2xl font-bold flex items-center justify-center shadow-lg`}
                  >
                    {t.ini}
                  </motion.div>
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{t.name}</h3>
                  <p className="text-blue-600 text-sm font-semibold mb-3">{t.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - UPDATED */}
        <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-cyan-500">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-4 text-white font-display">Join Our Mission</h2>
              <p className="text-white/90 mb-10 text-lg">
                Ready to protect your digital work? Let's safeguard it together.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                {/* ✅ FIXED: Crisp white button with better contrast */}
                <button
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all font-bold text-lg"
                >
                  <span>🚀</span>
                  <span>Get Started Today</span>
                </button>
                
                {/* Secondary button with outline style */}
                <button
                  onClick={() => navigate("/contact")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-transparent border-2 border-white text-white hover:bg-white/10 transition-all font-bold text-lg"
                >
                  <span>📅</span>
                  <span>Schedule Demo</span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}