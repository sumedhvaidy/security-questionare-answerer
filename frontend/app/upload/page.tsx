"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Upload, FileText, X, ArrowRight, Check, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ParsedQuestion {
  id: number;
  category: string;
  question: string;
}

// Generate 120 comprehensive security questions
const generateDemoQuestions = (): ParsedQuestion[] => {
  const categories = {
    "Access Control": [
      "Does your organization have a formal access control policy?",
      "How are user access rights reviewed and updated?",
      "Is multi-factor authentication (MFA) required for all users?",
      "How do you manage privileged access accounts?",
      "What is your process for onboarding new user access?",
      "How quickly are access rights revoked upon employee termination?",
      "Do you implement role-based access control (RBAC)?",
      "How are shared accounts managed and monitored?",
      "What authentication protocols are used for remote access?",
      "How do you enforce password complexity requirements?",
      "Are there time-based access restrictions in place?",
      "How do you manage access to sensitive data repositories?",
    ],
    "Data Protection": [
      "What encryption standards are used for data at rest?",
      "How is data classified and labeled within your organization?",
      "Describe your data backup and recovery procedures.",
      "What encryption is used for data in transit?",
      "How do you handle data retention and deletion?",
      "What DLP (Data Loss Prevention) tools are implemented?",
      "How is sensitive data masked in non-production environments?",
      "What is your process for secure data disposal?",
      "How do you protect data on mobile devices?",
      "Are there controls for data export and transfer?",
    ],
    "Incident Response": [
      "Do you have a documented incident response plan?",
      "How quickly are security incidents detected and reported?",
      "Describe your post-incident review process.",
      "What is your escalation procedure for critical incidents?",
      "How are incident response team members trained?",
      "Do you conduct regular incident response drills?",
      "What tools are used for incident detection and analysis?",
      "How do you communicate incidents to affected parties?",
      "What is your mean time to detect (MTTD) security incidents?",
      "What is your mean time to respond (MTTR) to incidents?",
    ],
    "Vendor Management": [
      "How do you assess third-party vendor security?",
      "Are vendors required to comply with your security policies?",
      "What due diligence is performed before vendor onboarding?",
      "How often are vendor security assessments conducted?",
      "Do you maintain a vendor risk register?",
      "What contractual security requirements are included in vendor agreements?",
      "How do you monitor vendor access to your systems?",
      "What is your process for vendor offboarding?",
    ],
    "Compliance": [
      "List all security certifications your organization holds.",
      "How often are security audits conducted?",
      "What regulatory frameworks do you comply with?",
      "How do you track and remediate audit findings?",
      "Do you have a dedicated compliance team?",
      "How do you stay updated on regulatory changes?",
      "What is your process for compliance gap analysis?",
      "How are compliance exceptions documented and approved?",
    ],
    "Network Security": [
      "Describe your network segmentation strategy.",
      "How is network traffic monitored for threats?",
      "What intrusion detection/prevention systems are in place?",
      "How are firewalls configured and managed?",
      "Do you perform regular network penetration testing?",
      "What is your process for managing network changes?",
      "How do you secure wireless networks?",
      "What VPN solutions are used for remote connectivity?",
      "How do you protect against DDoS attacks?",
      "Do you implement network access control (NAC)?",
    ],
    "Employee Training": [
      "Is security awareness training mandatory for all employees?",
      "How often is security training conducted?",
      "Do you conduct phishing simulation exercises?",
      "How do you measure training effectiveness?",
      "What topics are covered in security awareness training?",
      "Is there specialized training for IT and security staff?",
      "How do you train employees on data handling procedures?",
      "Are contractors and temporary staff included in training programs?",
    ],
    "Physical Security": [
      "Describe physical access controls to data centers.",
      "How are visitors managed in secure areas?",
      "What surveillance systems are in place?",
      "How is physical access logged and monitored?",
      "What environmental controls protect IT infrastructure?",
      "How do you secure office spaces after hours?",
      "What is your clean desk policy?",
      "How are hardware assets tracked and inventoried?",
    ],
    "Business Continuity": [
      "Do you have a business continuity plan?",
      "How often is the disaster recovery plan tested?",
      "What is your Recovery Time Objective (RTO)?",
      "What is your Recovery Point Objective (RPO)?",
      "Do you have geographically distributed backup sites?",
      "How do you ensure critical staff availability during disasters?",
      "What communication plans exist for business disruptions?",
      "How often is the BCP reviewed and updated?",
    ],
    "Application Security": [
      "Describe your secure software development lifecycle.",
      "How are application vulnerabilities identified and remediated?",
      "Do you perform code reviews for security?",
      "What SAST/DAST tools are used in development?",
      "How do you manage third-party libraries and dependencies?",
      "What is your process for security testing before deployment?",
      "How do you handle security bugs in production?",
      "Do you have a bug bounty or vulnerability disclosure program?",
    ],
    "Logging & Monitoring": [
      "What events are logged across your systems?",
      "How long are security logs retained?",
      "What SIEM solution is used for log analysis?",
      "How are alerts triaged and investigated?",
      "Do you have 24/7 security monitoring?",
      "What anomaly detection capabilities are in place?",
      "How do you ensure log integrity and tamper-resistance?",
      "Are logs correlated across multiple systems?",
    ],
    "Cloud Security": [
      "What cloud service providers do you use?",
      "How do you manage cloud security configurations?",
      "What controls are in place for cloud data protection?",
      "How do you monitor cloud resource usage and access?",
      "Do you use cloud security posture management (CSPM) tools?",
      "How are cloud workloads protected?",
      "What is your multi-cloud security strategy?",
      "How do you manage cloud identity and access?",
    ],
    "Identity Management": [
      "What identity provider (IdP) solutions are used?",
      "How do you manage service accounts?",
      "Is single sign-on (SSO) implemented across applications?",
      "How do you handle identity lifecycle management?",
      "What controls exist for privileged identity management?",
      "How do you detect and respond to compromised credentials?",
    ],
  };

  const questions: ParsedQuestion[] = [];
  let id = 1;

  for (const [category, questionList] of Object.entries(categories)) {
    for (const question of questionList) {
      questions.push({ id: id++, category, question });
    }
  }

  return questions;
};

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);

    // Simulate processing delay for demo
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, accept any file and generate demo questions
    const demoQuestions = generateDemoQuestions();
    setQuestions(demoQuestions);
    localStorage.setItem("secureOS_questions", JSON.stringify(demoQuestions));
    setIsProcessing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const handleContinue = () => {
    router.push("/processing");
  };

  const useDemoFile = () => {
    const demoQuestions = generateDemoQuestions();
    setFile(new File([], "security_questionnaire_2024.pdf"));
    setQuestions(demoQuestions);
    localStorage.setItem("secureOS_questions", JSON.stringify(demoQuestions));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-40 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.4) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-sky-200">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-800">SecureOS</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Ready to analyze</span>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Analysis
          </div>
          <h1 className="text-3xl font-semibold mb-3 text-slate-800">Upload Your Questionnaire</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Drop your security questionnaire file and let our AI analyze and generate responses in seconds.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative bg-white border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 shadow-sm ${
              isDragging
                ? "border-sky-400 bg-sky-50 shadow-lg shadow-sky-100"
                : file
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-slate-200 hover:border-sky-300 hover:shadow-md"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-base font-medium mb-1 text-slate-800">{file.name}</p>
                  <p className="text-sm text-emerald-600 font-medium">
                    {questions.length} questions detected
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setQuestions([]);
                    }}
                    className="mt-4 text-sm text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all ${
                    isDragging ? "bg-sky-100 scale-110" : "bg-slate-100"
                  }`}>
                    <Upload className={`w-7 h-7 transition-colors ${isDragging ? "text-sky-600" : "text-slate-400"}`} />
                  </div>
                  <p className="text-base font-medium mb-1 text-slate-700">
                    {isDragging ? "Drop to upload" : "Drag & drop your file"}
                  </p>
                  <p className="text-sm text-slate-400">PDF, XLSX, or CSV • Max 50MB</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-2xl backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full spinner" />
                  <span className="text-slate-600 font-medium">Extracting questions...</span>
                </div>
              </motion.div>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600 text-sm">{error}</span>
            </motion.div>
          )}

          <div className="mt-5 text-center">
            <button
              onClick={useDemoFile}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              No file? Try with sample questionnaire →
            </button>
          </div>
        </motion.div>

        {/* Questions Preview */}
        <AnimatePresence>
          {questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Detected Questions</h2>
                <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{questions.length} total</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                  {questions.slice(0, 8).map((q, index) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-slate-500">{q.id}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-sky-600 font-medium uppercase tracking-wide">{q.category}</span>
                        <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">{q.question}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {questions.length > 8 && (
                  <div className="border-t border-slate-100 px-4 py-3 text-center text-sm text-slate-500 bg-slate-50">
                    + {questions.length - 8} more questions
                  </div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 flex justify-center"
              >
                <button
                  onClick={handleContinue}
                  className="btn-primary py-3.5 px-8 flex items-center gap-2.5 text-base font-medium rounded-xl"
                >
                  <Check className="w-5 h-5" />
                  Analyze with AI
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
