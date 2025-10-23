// src/pages/ContactPage.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import MainLayout from "../components/layout/MainLayout";
import Input, { EmailInput, TextArea } from "../components/ui/Input";
import Button from "../components/ui/Button";
import { SuccessAlert, ErrorAlert } from "../components/ui/Alert";
import { usePageTitle } from "../hook/userPageTitle";

export default function ContactPage() {
  usePageTitle("Contact")
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
  const [noticeType, setNoticeType] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.id]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await new Promise((r) => setTimeout(r, 700));
      setNotice("Message sent! We'll get back to you within 24 hours.");
      setNoticeType("success");
      setForm({ firstName: "", lastName: "", email: "", company: "", subject: "", message: "" });
    } catch {
      setNotice("Something went wrong. Please try again.");
      setNoticeType("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-white">
        {/* Hero */}
        <section className="text-center py-24 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <div className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold mb-6">
              📧 Get In Touch
            </div>
            <h1 className="text-6xl font-extrabold mb-6 leading-tight font-display">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Contact Our Security
              </span>
              <span className="block text-gray-900 mt-2">Experts</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Ready to secure your organization? Our experts are here to help you implement the perfect AI-powered security solution.
            </p>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm"
            >
              <h2 className="text-3xl font-bold mb-3 text-gray-900 font-display">Send Us a Message</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Fill out the form below and our security team will get back to you within 24 hours.
              </p>

              {notice && (
                noticeType === "success" ? (
                  <SuccessAlert className="mb-4">{notice}</SuccessAlert>
                ) : (
                  <ErrorAlert className="mb-4">{notice}</ErrorAlert>
                )
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="firstName" label="First Name" icon="👤" value={form.firstName} onChange={onChange} required />
                  <Input id="lastName" label="Last Name" icon="👤" value={form.lastName} onChange={onChange} required />
                </div>
                <EmailInput id="email" label="Email" value={form.email} onChange={onChange} required />
                <Input id="company" label="Company" icon="🏢" value={form.company} onChange={onChange} />
                <Input id="subject" label="Subject" icon="📋" value={form.subject} onChange={onChange} required />
                <TextArea id="message" label="Message" value={form.message} onChange={onChange} rows={5} required />

                <Button type="submit" loading={sending} size="lg" className="w-full" icon={!sending && "📨"}>
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-3 text-gray-900 font-display">Get in Touch</h2>
                <p className="text-gray-600 text-sm">
                  Our team of experts is ready to help you protect your organization with SentinelAI's advanced security platform.
                </p>
              </div>

              <InfoRow icon="✉️" title="Email Us" text="protect@sentinelai.com" />
              <InfoRow icon="📞" title="Call Us" text="+1 (123) 123-1234 (24/7 Support)" />
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-2xl text-white shadow-lg">
                    🕐
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Business Hours</p>
                    <p className="text-gray-600 text-sm">Mon-Fri: 9AM - 6PM EST</p>
                  </div>
                </div>
                <p className="text-gray-600 text-xs">
                  Emergency support available 24/7 for enterprise customers
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Emergency CTA - UPDATED WITH SOFTER COLORS */}
        <section className="py-24 px-6 bg-gradient-to-br from-slate-800 via-slate-700 to-gray-800">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-semibold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400"></span>
                </span>
                Priority Support Available
              </div>
              
              <h2 className="text-4xl font-bold mb-4 text-white font-display">
                Need Immediate Support?
              </h2>
              <p className="text-gray-300 mb-10 text-lg max-w-2xl mx-auto">
                Existing customers can reach our emergency response team anytime, day or night.
              </p>
              
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => alert("Emergency hotline: +1 (123) 123-1234")}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-800 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all font-bold text-lg"
                >
                  <span>📞</span>
                  <span>Call Emergency Hotline</span>
                </button>
                
                <button
                  onClick={() => window.location.href = "mailto:emergency@sentinelai.com"}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-transparent border-2 border-white text-white hover:bg-white/10 transition-all font-bold text-lg"
                >
                  <span>✉️</span>
                  <span>Email Support</span>
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-10 grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="text-white font-semibold text-sm">Instant Response</p>
                  <p className="text-gray-400 text-xs mt-1">Average 2min response time</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                  <div className="text-3xl mb-2">🛡️</div>
                  <p className="text-white font-semibold text-sm">Expert Team</p>
                  <p className="text-gray-400 text-xs mt-1">Certified security specialists</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                  <div className="text-3xl mb-2">🌐</div>
                  <p className="text-white font-semibold text-sm">24/7 Availability</p>
                  <p className="text-gray-400 text-xs mt-1">Global support coverage</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

function InfoRow({ icon, title, text }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
}