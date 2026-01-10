"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Brain, ArrowRight, CheckCircle, Clock, FileSpreadsheet, Sparkles } from "lucide-react";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Our advanced AI understands context and generates accurate, compliant responses instantly."
  },
  {
    icon: Zap,
    title: "10x Faster Response",
    description: "What used to take weeks now takes minutes. Answer hundreds of questions in a single session."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC2 compliant. Your data never leaves your environment. Zero-trust architecture."
  }
];

const stats = [
  { value: "100+", label: "Questions Analyzed" },
  { value: "95%", label: "Auto-Answered" },
  { value: "10x", label: "Time Saved" },
  { value: "99.2%", label: "Accuracy Rate" }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] grid-pattern relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(3, 105, 161, 0.08) 0%, transparent 70%)",
            top: "-200px",
            right: "-200px"
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(8, 145, 178, 0.08) 0%, transparent 70%)",
            bottom: "-100px",
            left: "-100px"
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">SecureOS</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">How it Works</a>
          <Link href="/upload" className="btn-primary text-sm py-3 px-6 flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm text-slate-600">AI-Powered Security Compliance</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-6xl md:text-7xl font-bold leading-tight mb-6"
          >
            Answer Security Questions
            <br />
            <span className="gradient-text">10x Faster</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto"
          >
            Upload your security questionnaire, and let our AI analyze, categorize, 
            and generate accurate responses. Focus only on what needs human attention.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-4"
          >
            <Link href="/upload" className="btn-primary text-lg py-4 px-10 flex items-center gap-3">
              Start Free Analysis <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="btn-secondary text-lg py-4 px-10">
              Watch Demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating UI Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-20 relative"
        >
          <div className="glass-card p-6 max-w-4xl mx-auto glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-sm text-slate-500 ml-4">security_questionnaire.xlsx</span>
            </div>
            <div className="space-y-3">
              {[
                { q: "Does your organization have a formal information security policy?", status: "auto", confidence: 98 },
                { q: "Are all employees required to complete security awareness training?", status: "auto", confidence: 95 },
                { q: "Describe your data encryption standards and key management.", status: "review", confidence: 72 }
              ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.15 }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-slate-50/80 border border-slate-200"
                  >
                    {item.status === "auto" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-slate-700 flex-1">{item.q}</span>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      item.confidence > 90 ? 'confidence-high' : 'confidence-medium'
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
      <section id="features" className="relative z-10 py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-800">Why Teams Choose SecureOS</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Built by security professionals, for security professionals. 
              Every feature designed to save you time while maintaining accuracy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass-card p-8 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-secondary)]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-800">How It Works</h2>
            <p className="text-slate-500">Three simple steps to streamline your security compliance</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: FileSpreadsheet, title: "Upload Questionnaire", desc: "Drop your XLSX file with security questions. We support all major questionnaire formats." },
              { step: 2, icon: Brain, title: "AI Analysis", desc: "Our AI processes each question, matches with your policy documents, and generates responses." },
              { step: 3, icon: CheckCircle, title: "Review & Export", desc: "Review AI-generated answers, focus on low-confidence items, and export completed questionnaire." }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="glass-card p-8 h-full">
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <item.icon className="w-12 h-12 text-[var(--accent)] mb-6" />
                    <h3 className="text-xl font-semibold mb-3 text-slate-800">{item.title}</h3>
                    <p className="text-slate-500">{item.desc}</p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link href="/upload" className="btn-primary text-lg py-4 px-10 inline-flex items-center gap-3">
              Try It Now - It&apos;s Free <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 py-12 px-8 bg-white/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-700">SecureOS</span>
          </div>
          <p className="text-sm text-slate-500">© 2026 SecureOS. Built for security teams.</p>
        </div>
      </footer>
    </div>
  );
}
