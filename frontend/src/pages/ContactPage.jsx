import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MainLayout from "./MainLayout";

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const go = (path) => () => navigate(path);
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.id]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setNotice("✅ Message sent! We'll get back to you within 24 hours.");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        subject: "",
        message: "",
      });
    } catch {
      setNotice("❌ Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

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
              📧 Get In Touch
            </motion.div>
            <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Contact Our Security
              </span>
              <span className="block text-emerald-400 mt-2">Experts</span>
            </h1>
            <p className="text-emerald-200/70 text-lg max-w-2xl mx-auto">
              Ready to secure your organization? Our experts are here to help you
              implement the perfect AI-powered security solution.
            </p>
          </div>
        </motion.section>

        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all"
            >
              <h2 className="text-3xl font-bold mb-3 text-emerald-100">Send Us a Message</h2>
              <p className="text-emerald-200/60 mb-6 text-sm">
                Fill out the form below and our security team will get back to you
                within 24 hours.
              </p>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="firstName" label="First Name" value={form.firstName} onChange={onChange} />
                  <Field id="lastName" label="Last Name" value={form.lastName} onChange={onChange} />
                </div>
                <Field id="email" label="Email" type="email" value={form.email} onChange={onChange} />
                <Field id="company" label="Company" value={form.company} onChange={onChange} />
                <Field id="subject" label="Subject" value={form.subject} onChange={onChange} />
                <Field
                  id="message"
                  label="Message"
                  textarea
                  value={form.message}
                  onChange={onChange}
                  placeholder="Tell us about your security needs..."
                />
                {notice && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm font-medium ${
                      notice.startsWith("✅")
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {notice}
                  </motion.p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={sending}
                  className={`w-full py-3 rounded-xl font-semibold transition shadow-xl ${
                    sending
                      ? "bg-emerald-400/50 text-emerald-100 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
                  }`}
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sending...
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </motion.button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-3 text-emerald-100">Get in Touch</h2>
                <p className="text-emerald-200/60 text-sm leading-relaxed">
                  Our team of experts is ready to help you protect your
                  organization with SentinelAI's advanced security platform.
                </p>
              </div>

              <InfoRow 
                icon="✉️" 
                title="Email Us" 
                text="protect@sentinelai.com" 
              />
              <InfoRow
                icon="📞"
                title="Call Us"
                text="+1 (555) 911-9111 (24/7 Support)"
              />
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg">
                    🕐
                  </div>
                  <div>
                    <p className="font-bold text-emerald-100">Business Hours</p>
                    <p className="text-emerald-200/60 text-sm">Mon-Fri: 9AM - 6PM EST</p>
                  </div>
                </div>
                <p className="text-emerald-200/60 text-xs">
                  Emergency support available 24/7 for enterprise customers
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative text-center py-24 px-6 overflow-hidden mt-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-500/20"></div>
          <div className="absolute inset-0 backdrop-blur-xl"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 text-emerald-100">Need Immediate Support?</h2>
            <p className="max-w-2xl mx-auto mb-10 text-lg text-emerald-200/80">
              Existing customers can reach our emergency response team anytime.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => alert("Emergency hotline: +1 (555) 911-9111")}
              className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold px-8 py-3 rounded-xl hover:from-red-600 hover:to-rose-700 transition shadow-xl shadow-red-500/25"
            >
              🚨 Call Emergency Hotline
            </motion.button>
          </div>
        </motion.section>
      </div>
    </MainLayout>
  );
}

function Field({ id, label, value, onChange, type = "text", textarea, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm text-emerald-200/80 font-medium mb-2 block">{label}</span>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={5}
          className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl p-3 text-emerald-100 placeholder-emerald-200/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition backdrop-blur-sm"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-slate-800/50 border border-emerald-500/20 rounded-xl p-3 text-emerald-100 placeholder-emerald-200/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition backdrop-blur-sm"
        />
      )}
    </label>
  );
}

function InfoRow({ icon, title, text }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      className="flex items-center gap-4 bg-gradient-to-br from-slate-900/50 to-emerald-950/30 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all"
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-3xl border border-emerald-500/20">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-emerald-100">{title}</p>
        <p className="text-emerald-200/60 text-sm">{text}</p>
      </div>
    </motion.div>
  );
}