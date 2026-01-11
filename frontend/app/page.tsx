"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Brain, ArrowRight, CheckCircle, Clock, FileText, Sparkles, Users, Lock, BarChart } from "lucide-react";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced language models understand context and generate accurate, policy-aligned responses."
  },
  {
    icon: Zap,
    title: "10x Faster Completion",
    description: "What used to take weeks now takes minutes. Process hundreds of questions in a single session."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 Type II certified. Your data stays in your environment with zero-trust architecture."
  }
];

const stats = [
  { value: "120+", label: "Questions Analyzed" },
  { value: "95%", label: "Auto-Answered" },
  { value: "10x", label: "Time Saved" },
  { value: "99.2%", label: "Accuracy Rate" }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 opacity-40 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.4) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)",
            top: "-150px",
            right: "-150px"
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
            bottom: "100px",
            left: "-100px"
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-200/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-800">SecureOS</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">How it Works</a>
          <Link href="/upload" className="bg-slate-800 text-white text-sm font-medium py-2.5 px-5 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-24">
        <motion.div
          className="text-center max-w-3xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Security Compliance</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-bold leading-tight mb-5 text-slate-800"
          >
            Answer Security Questionnaires
            <br />
            <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">10x Faster</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-slate-500 mb-8 max-w-xl mx-auto leading-relaxed"
          >
            Upload your security questionnaire and let AI analyze, categorize, 
            and generate accurate responses. Focus only on what needs expert review.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-4"
          >
            <Link href="/upload" className="bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-medium py-3.5 px-8 rounded-xl hover:shadow-xl hover:shadow-sky-200 transition-all flex items-center gap-2 text-base">
              Start Free Analysis <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="bg-white text-slate-700 font-medium py-3.5 px-8 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all text-base">
              Watch Demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="text-center p-4"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 relative"
        >
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200 p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-slate-500 ml-3 font-medium">security_questionnaire_2024.pdf</span>
              <div className="ml-auto flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle className="w-4 h-4" />
                120 questions analyzed
              </div>
            </div>
            <div className="space-y-3">
              {[
                { q: "Does your organization have a formal information security policy?", status: "auto", confidence: 98 },
                { q: "Are all employees required to complete security awareness training?", status: "auto", confidence: 96 },
                { q: "Describe your data encryption standards and key management practices.", status: "review", confidence: 82 }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  {item.status === "auto" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-700 flex-1 font-medium">{item.q}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    item.confidence > 90 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {item.confidence}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold mb-3 text-slate-800">Why Teams Choose SecureOS</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Built by security professionals, for security professionals. 
              Every feature designed to save time while maintaining accuracy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:border-sky-200 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-sky-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 py-24 px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold mb-3 text-slate-800">How It Works</h2>
            <p className="text-slate-500">Three simple steps to streamline your security compliance</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: FileText, title: "Upload Questionnaire", desc: "Drop your PDF or Excel file with security questions. We support all major questionnaire formats." },
              { step: 2, icon: Brain, title: "AI Analysis", desc: "Our AI processes each question, matches with policy documents, and generates responses with confidence scores." },
              { step: 3, icon: Users, title: "Triage & Review", desc: "Review AI answers, assign experts to low-confidence items, and export the completed questionnaire." }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm h-full">
                  <div className="absolute -top-4 -left-2 w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                  <div className="pt-3">
                    <item.icon className="w-10 h-10 text-sky-600 mb-5" />
                    <h3 className="text-lg font-semibold mb-2 text-slate-800">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-14"
          >
            <Link href="/upload" className="inline-flex items-center gap-2 bg-slate-800 text-white font-medium py-3.5 px-8 rounded-xl hover:bg-slate-900 transition-all shadow-lg">
              Try It Free <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative z-10 py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-sky-600 to-cyan-500 rounded-2xl p-10 text-center text-white shadow-xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lock className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Enterprise-Grade Security</h3>
            </div>
            <p className="text-sky-100 mb-6 max-w-lg mx-auto">
              SOC 2 Type II certified. Your questionnaire data is encrypted at rest and in transit. 
              Zero data retention policy available.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>ISO 27001</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-10 px-8 bg-white/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-700">SecureOS</span>
          </div>
          <p className="text-sm text-slate-500">© 2024 SecureOS. Built for security teams.</p>
        </div>
      </footer>
    </div>
  );
}
