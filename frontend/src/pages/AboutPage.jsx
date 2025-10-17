import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MainLayout from "./MainLayout";

export default function AboutPage() {
  const navigate = useNavigate();
  const go = (path) => () => navigate(path);

  const team = [
    {
      ini: "RP",
      name: "Ms. Rashmi Purandare",
      role: "Frontend Developer",
      desc: "Master's in Computer Science, passionate about creating user-friendly and engaging web interfaces.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      ini: "BN",
      name: "Mr. Bhuwan Neupane",
      role: "Backend Developer",
      desc: "Master's in Computer Science. Enthusiastic about AI model integration and cloud infrastructure.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      ini: "HK",
      name: "Ms. Harpreet Kaur",
      role: "Project Manager",
      desc: "Master's in Computer Science. Passionate about Agile, Scrum, and managing teams for impactful results.",
      color: "from-purple-500 to-pink-600"
    },
  ];

  const cards = [
    {
      icon: "🎯",
      title: "Our Mission",
      desc: "To democratize a robust, intuitive, and highly efficient solution for safeguarding intellectual property in the digital realm.",
      gradient: "from-emerald-500/20 to-teal-500/20"
    },
    {
      icon: "👁️",
      title: "Our Vision",
      desc: "A world where cyber threats are detected and neutralized before they can cause harm, powered by intelligent AI systems.",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: "🏆",
      title: "Our Values",
      desc: "Innovation, transparency, and unwavering commitment to protecting our clients' digital assets and privacy.",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
        <motion.section
          className="text-center py-24 px-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>
          <div className="max-w-3xl mx-auto relative z-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm"
            >
              ✨ Our Story
            </motion.div>
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Protecting Intellectual Property
              </span>
              <span className="block text-emerald-400 mt-2">Since 2025</span>
            </h1>
            <p className="text-emerald-200/70 text-lg max-w-2xl mx-auto">
              Founded by leading minds in cybersecurity and AI, SentinelAI was
              built on a vision of intelligent defense — one that evolves with
              every new threat in the digital landscape.
            </p>
          </div>
        </motion.section>

        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.3 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className={`group relative bg-gradient-to-br ${card.gradient} backdrop-blur-xl rounded-3xl border border-emerald-500/10 p-8 text-center hover:shadow-2xl hover:shadow-emerald-500/20 transition-all`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-5xl mb-5">{card.icon}</div>
                  <h3 className="font-bold text-xl mb-3 text-emerald-100">{card.title}</h3>
                  <p className="text-emerald-200/70">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"></div>
                <span className="text-emerald-400 font-semibold">Our Team</span>
                <div className="w-12 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"></div>
              </div>
              <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Leadership Team
              </h2>
              <p className="text-emerald-200/70 mb-16 text-lg max-w-2xl mx-auto">
                Meet the experts behind SentinelAI's revolutionary security platform.
              </p>
            </motion.div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((t, idx) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                  whileHover={{ y: -12 }}
                  className="group relative bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${t.color} text-white text-2xl font-bold flex items-center justify-center shadow-xl shadow-emerald-500/20`}
                    >
                      {t.ini}
                    </motion.div>
                    <h3 className="font-bold text-xl text-emerald-100 mb-1">{t.name}</h3>
                    <p className="text-emerald-400 text-sm font-semibold mb-3">{t.role}</p>
                    <p className="text-emerald-200/60 text-sm leading-relaxed">{t.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative text-center py-24 px-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-500/20"></div>
          <div className="absolute inset-0 backdrop-blur-xl"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 text-emerald-100">Join Our Mission</h2>
            <p className="max-w-2xl mx-auto mb-10 text-lg text-emerald-200/80">
              Ready to protect your digital work? Let's safeguard it together.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={go("/signup")}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition shadow-xl shadow-emerald-500/25"
              >
                Get Started Today
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={go("/contact")}
                className="bg-slate-800/50 backdrop-blur text-emerald-100 border border-emerald-500/30 px-8 py-3 rounded-xl font-semibold hover:bg-slate-700/50 transition shadow-xl"
              >
                Schedule Demo
              </motion.button>
            </div>
          </div>
        </motion.section>
      </div>
    </MainLayout>
  );
}