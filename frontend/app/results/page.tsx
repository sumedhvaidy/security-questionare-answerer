"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Eye,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Search,
  Sparkles,
  BarChart3,
  Clock,
  Check,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  category: string;
  question: string;
}

interface AnsweredQuestion extends Question {
  answer: string;
  confidence: number;
  status: "auto" | "review" | "manual";
  sources: string[];
  approved?: boolean;
}

// Demo answers with varying confidence levels
const generateDemoAnswers = (questions: Question[]): AnsweredQuestion[] => {
  const answers: Record<string, { answer: string; baseConfidence: number; sources: string[] }> = {
    "access control": {
      answer: "Yes, our organization maintains a comprehensive access control policy aligned with ISO 27001 and SOC 2 requirements. The policy is reviewed annually and includes provisions for role-based access control (RBAC), least privilege principles, and regular access reviews.",
      baseConfidence: 95,
      sources: ["Information Security Policy v3.2", "Access Control Procedure Doc"]
    },
    "mfa": {
      answer: "Yes, multi-factor authentication (MFA) is mandatory for all users across all systems. We utilize a combination of hardware tokens, authenticator apps, and biometric verification where applicable.",
      baseConfidence: 98,
      sources: ["Authentication Standards", "Security Policy Section 4.2"]
    },
    "encryption": {
      answer: "We employ AES-256 encryption for data at rest and TLS 1.3 for data in transit. Our key management system follows NIST guidelines with regular key rotation every 90 days.",
      baseConfidence: 92,
      sources: ["Encryption Standards Doc", "Data Protection Policy"]
    },
    "incident": {
      answer: "Yes, we maintain a documented incident response plan that follows the NIST Cybersecurity Framework. Our IR team conducts quarterly tabletop exercises and annual full-scale simulations.",
      baseConfidence: 88,
      sources: ["Incident Response Plan", "IR Procedure Manual"]
    },
    "backup": {
      answer: "Our backup strategy includes daily incremental backups, weekly full backups, and monthly archival backups. All backups are encrypted and stored across multiple geographic regions with 99.99% durability.",
      baseConfidence: 94,
      sources: ["Backup & Recovery Procedure", "DR Plan Section 3"]
    },
    "vendor": {
      answer: "Third-party vendors undergo comprehensive security assessments including SOC 2 report reviews, security questionnaires, and periodic on-site audits. High-risk vendors are reviewed annually.",
      baseConfidence: 78,
      sources: ["Vendor Management Policy"]
    },
    "audit": {
      answer: "Security audits are conducted annually by external auditors. Additionally, we perform quarterly internal security assessments and continuous automated vulnerability scanning.",
      baseConfidence: 91,
      sources: ["Audit Schedule", "Compliance Calendar"]
    },
    "network": {
      answer: "Our network is segmented using a zero-trust architecture with microsegmentation. Each segment is protected by next-generation firewalls with IDS/IPS capabilities.",
      baseConfidence: 85,
      sources: ["Network Security Architecture Doc"]
    },
    "training": {
      answer: "All employees complete mandatory security awareness training upon hire and annually thereafter. This includes phishing simulations, data handling procedures, and incident reporting protocols.",
      baseConfidence: 96,
      sources: ["Training Policy", "HR Onboarding Checklist"]
    },
    "physical": {
      answer: "Physical access to data centers is controlled through multi-factor authentication including badge access, biometrics, and PIN codes. All access is logged and monitored 24/7.",
      baseConfidence: 89,
      sources: ["Physical Security Policy", "Data Center Access Procedure"]
    },
    "continuity": {
      answer: "We maintain a comprehensive business continuity plan with defined RPO (4 hours) and RTO (8 hours). The plan is tested bi-annually through simulation exercises.",
      baseConfidence: 72,
      sources: ["BCP Document v2.1"]
    },
    "sdlc": {
      answer: "Our secure SDLC includes threat modeling, code reviews, SAST/DAST scanning, and penetration testing before each release. All developers complete secure coding training.",
      baseConfidence: 87,
      sources: ["SDLC Security Guidelines", "Dev Security Training Materials"]
    },
    "logging": {
      answer: "We log all authentication events, system changes, data access, and administrative actions. Logs are retained for 1 year and analyzed by our SIEM for anomaly detection.",
      baseConfidence: 93,
      sources: ["Logging Standards", "SIEM Configuration Doc"]
    },
    "classification": {
      answer: "Data is classified into four tiers: Public, Internal, Confidential, and Restricted. Each tier has specific handling, storage, and transmission requirements defined in our data classification policy.",
      baseConfidence: 82,
      sources: ["Data Classification Policy"]
    },
    "certification": {
      answer: "We currently hold SOC 2 Type II, ISO 27001, and are compliant with GDPR, HIPAA, and CCPA requirements. Annual recertification audits are conducted.",
      baseConfidence: 97,
      sources: ["Compliance Certifications", "Audit Reports"]
    }
  };

  return questions.map((q) => {
    // Match question to answer based on keywords
    const questionLower = q.question.toLowerCase();
    let matchedAnswer = {
      answer: "Based on our security policies and procedures, we implement industry-standard controls to address this requirement. Our security team regularly reviews and updates these measures to ensure continued compliance with best practices and regulatory requirements.",
      baseConfidence: 65 + Math.random() * 15,
      sources: ["General Security Policy"]
    };

    for (const [keyword, answerData] of Object.entries(answers)) {
      if (questionLower.includes(keyword)) {
        matchedAnswer = answerData;
        break;
      }
    }

    // Add some variation to confidence
    const confidence = Math.min(99, Math.max(55, matchedAnswer.baseConfidence + (Math.random() - 0.5) * 10));
    const roundedConfidence = Math.round(confidence);

    return {
      ...q,
      answer: matchedAnswer.answer,
      confidence: roundedConfidence,
      status: roundedConfidence >= 90 ? "auto" : roundedConfidence >= 75 ? "review" : "manual",
      sources: matchedAnswer.sources
    };
  });
};

type FilterType = "all" | "auto" | "review" | "manual";

export default function ResultsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<AnsweredQuestion[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("secureOS_questions");
    if (!stored) {
      router.push("/upload");
      return;
    }

    const parsedQuestions = JSON.parse(stored) as Question[];
    const answeredQuestions = generateDemoAnswers(parsedQuestions);
    setQuestions(answeredQuestions);
  }, [router]);

  const filteredQuestions = questions.filter((q) => {
    const matchesFilter = filter === "all" || q.status === filter;
    const matchesSearch = 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: questions.length,
    auto: questions.filter(q => q.status === "auto").length,
    review: questions.filter(q => q.status === "review").length,
    manual: questions.filter(q => q.status === "manual").length,
    avgConfidence: questions.length > 0 
      ? Math.round(questions.reduce((acc, q) => acc + q.confidence, 0) / questions.length)
      : 0
  };

  const handleApprove = (id: number) => {
    setQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, approved: true, status: "auto" as const } : q)
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-700";
    if (confidence >= 75) return "text-amber-700";
    return "text-red-700";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 90) return "bg-emerald-100 border-emerald-300";
    if (confidence >= 75) return "bg-amber-100 border-amber-300";
    return "bg-red-100 border-red-300";
  };

  const getStatusIcon = (status: string, confidence: number) => {
    if (status === "auto" || confidence >= 90) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (status === "review" || confidence >= 75) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const handleExport = () => {
    const exportData = questions.map(q => ({
      Category: q.category,
      Question: q.question,
      Answer: q.answer,
      Confidence: `${q.confidence}%`,
      Status: q.status,
      Sources: q.sources.join(", ")
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security_questionnaire_answers.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] grid-pattern">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">SecureOS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/upload" className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              New Upload
            </Link>
            <button onClick={handleExport} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 text-slate-800">Analysis Results</h1>
          <p className="text-slate-500">
            AI analyzed {stats.total} questions • Average confidence: {stats.avgConfidence}%
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <span className="text-sm text-slate-500">Total Questions</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-500">Auto-Answered</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{stats.auto}</div>
            <div className="text-xs text-slate-500 mt-1">High confidence (&gt;90%)</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">Needs Review</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">{stats.review}</div>
            <div className="text-xs text-slate-500 mt-1">Medium confidence (75-90%)</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-slate-500">Manual Required</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.manual}</div>
            <div className="text-xs text-slate-500 mt-1">Low confidence (&lt;75%)</div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions, answers, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--accent)] transition-colors text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary py-3 px-6 flex items-center gap-2 md:hidden"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className={`flex gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
            {[
              { key: "all", label: "All", count: stats.total },
              { key: "auto", label: "Auto", count: stats.auto },
              { key: "review", label: "Review", count: stats.review },
              { key: "manual", label: "Manual", count: stats.manual }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === key
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <AnimatePresence>
            {filteredQuestions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
                layout
                className="glass-card overflow-hidden"
              >
                {/* Question Header */}
                <div
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(q.status, q.confidence)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-[var(--accent)] uppercase tracking-wide font-medium">
                          {q.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getConfidenceBg(q.confidence)} ${getConfidenceColor(q.confidence)}`}>
                          {q.confidence}% confidence
                        </span>
                        {q.approved && (
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Approved
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 font-medium">{q.question}</p>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                        {q.answer}
                      </p>
                    </div>

                    <button className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      {expandedId === q.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedId === q.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200"
                    >
                      <div className="p-6 bg-slate-50">
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                            <span className="text-sm font-medium text-[var(--accent)]">AI Generated Answer</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{q.answer}</p>
                        </div>

                        <div className="mb-6">
                          <span className="text-sm text-slate-500">Sources referenced:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {q.sources.map((source, i) => (
                              <span key={i} className="text-xs px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                          {!q.approved && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(q.id);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors text-sm"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                Approve Answer
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-600 hover:text-slate-800 transition-colors text-sm border border-slate-200">
                                <Edit3 className="w-4 h-4" />
                                Edit Answer
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:text-red-600 transition-colors text-sm">
                                <ThumbsDown className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-sm ml-auto">
                            <Eye className="w-4 h-4" />
                            View Full Context
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredQuestions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">No questions match your search criteria</p>
          </motion.div>
        )}

        {/* Summary Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass-card p-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-[var(--accent)]" />
            <h3 className="text-xl font-semibold text-slate-800">Time Saved Summary</h3>
          </div>
          <p className="text-slate-500 mb-6">
            SecureOS automatically answered <span className="text-[var(--accent)] font-semibold">{stats.auto} out of {stats.total}</span> questions with high confidence.
            <br />
            You only need to review <span className="text-amber-600 font-semibold">{stats.review + stats.manual}</span> questions.
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{Math.round((stats.auto / stats.total) * 100) || 0}%</div>
              <div className="text-sm text-slate-500">Automation Rate</div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{Math.round(stats.total * 3.5)} min</div>
              <div className="text-sm text-slate-500">Estimated Time Saved</div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
