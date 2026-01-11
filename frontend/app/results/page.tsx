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
  RefreshCw,
  Users,
  UserPlus,
  Mail,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  category: string;
  question: string;
}

interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  avatar: string;
  expertise: string[];
}

interface AnsweredQuestion extends Question {
  answer: string;
  confidence: number;
  status: "auto" | "review" | "manual";
  sources: string[];
  approved?: boolean;
  assignedTo?: Employee;
}

// Mock employees for triage
const mockEmployees: Employee[] = [
  { id: "1", name: "Sarah Chen", title: "Chief Information Security Officer", department: "Security", email: "sarah.chen@company.com", avatar: "SC", expertise: ["Compliance", "Risk Management", "Vendor Management"] },
  { id: "2", name: "Michael Rodriguez", title: "Security Architect", department: "Security", email: "m.rodriguez@company.com", avatar: "MR", expertise: ["Network Security", "Cloud Security", "Application Security"] },
  { id: "3", name: "Emily Watson", title: "Compliance Manager", department: "Legal & Compliance", email: "e.watson@company.com", avatar: "EW", expertise: ["Compliance", "Audit", "Data Protection"] },
  { id: "4", name: "James Park", title: "IT Director", department: "IT Operations", email: "j.park@company.com", avatar: "JP", expertise: ["Business Continuity", "Physical Security", "Access Control"] },
  { id: "5", name: "Aisha Patel", title: "Security Engineer", department: "Security", email: "a.patel@company.com", avatar: "AP", expertise: ["Incident Response", "Logging & Monitoring", "Network Security"] },
  { id: "6", name: "David Kim", title: "DevSecOps Lead", department: "Engineering", email: "d.kim@company.com", avatar: "DK", expertise: ["Application Security", "Cloud Security", "Identity Management"] },
  { id: "7", name: "Rachel Foster", title: "HR Director", department: "Human Resources", email: "r.foster@company.com", avatar: "RF", expertise: ["Employee Training", "Access Control", "Physical Security"] },
  { id: "8", name: "Tom Bradley", title: "Risk Manager", department: "Risk & Compliance", email: "t.bradley@company.com", avatar: "TB", expertise: ["Vendor Management", "Compliance", "Business Continuity"] },
];

// Find suggested reviewer based on category
const getSuggestedReviewer = (category: string): Employee => {
  const categoryMap: Record<string, string[]> = {
    "Access Control": ["James Park", "Sarah Chen"],
    "Data Protection": ["Emily Watson", "Sarah Chen"],
    "Incident Response": ["Aisha Patel", "Michael Rodriguez"],
    "Vendor Management": ["Tom Bradley", "Emily Watson"],
    "Compliance": ["Emily Watson", "Tom Bradley"],
    "Network Security": ["Michael Rodriguez", "Aisha Patel"],
    "Employee Training": ["Rachel Foster", "James Park"],
    "Physical Security": ["James Park", "Rachel Foster"],
    "Business Continuity": ["Tom Bradley", "James Park"],
    "Application Security": ["David Kim", "Michael Rodriguez"],
    "Logging & Monitoring": ["Aisha Patel", "David Kim"],
    "Cloud Security": ["Michael Rodriguez", "David Kim"],
    "Identity Management": ["David Kim", "Sarah Chen"],
  };

  const names = categoryMap[category] || ["Sarah Chen"];
  const name = names[0];
  return mockEmployees.find(e => e.name === name) || mockEmployees[0];
};

// Demo answers with varying confidence levels - designed for 95 green, ~18 yellow, ~7 red
const generateDemoAnswers = (questions: Question[]): AnsweredQuestion[] => {
  const highConfidenceAnswers: Record<string, { answer: string; baseConfidence: number; sources: string[] }> = {
    "access control": {
      answer: "Yes, our organization maintains a comprehensive access control policy aligned with ISO 27001 and SOC 2 requirements. The policy is reviewed annually and includes provisions for role-based access control (RBAC), least privilege principles, and regular access reviews.",
      baseConfidence: 94,
      sources: ["Information Security Policy v3.2", "Access Control Procedure Doc"]
    },
    "mfa": {
      answer: "Yes, multi-factor authentication (MFA) is mandatory for all users across all systems. We utilize a combination of hardware tokens, authenticator apps, and biometric verification where applicable.",
      baseConfidence: 97,
      sources: ["Authentication Standards", "Security Policy Section 4.2"]
    },
    "encryption": {
      answer: "We employ AES-256 encryption for data at rest and TLS 1.3 for data in transit. Our key management system follows NIST guidelines with regular key rotation every 90 days.",
      baseConfidence: 95,
      sources: ["Encryption Standards Doc", "Data Protection Policy"]
    },
    "incident": {
      answer: "Yes, we maintain a documented incident response plan that follows the NIST Cybersecurity Framework. Our IR team conducts quarterly tabletop exercises and annual full-scale simulations.",
      baseConfidence: 93,
      sources: ["Incident Response Plan", "IR Procedure Manual"]
    },
    "backup": {
      answer: "Our backup strategy includes daily incremental backups, weekly full backups, and monthly archival backups. All backups are encrypted and stored across multiple geographic regions with 99.99% durability.",
      baseConfidence: 96,
      sources: ["Backup & Recovery Procedure", "DR Plan Section 3"]
    },
    "audit": {
      answer: "Security audits are conducted annually by external auditors. Additionally, we perform quarterly internal security assessments and continuous automated vulnerability scanning.",
      baseConfidence: 94,
      sources: ["Audit Schedule", "Compliance Calendar"]
    },
    "training": {
      answer: "All employees complete mandatory security awareness training upon hire and annually thereafter. This includes phishing simulations, data handling procedures, and incident reporting protocols.",
      baseConfidence: 97,
      sources: ["Training Policy", "HR Onboarding Checklist"]
    },
    "physical": {
      answer: "Physical access to data centers is controlled through multi-factor authentication including badge access, biometrics, and PIN codes. All access is logged and monitored 24/7.",
      baseConfidence: 92,
      sources: ["Physical Security Policy", "Data Center Access Procedure"]
    },
    "logging": {
      answer: "We log all authentication events, system changes, data access, and administrative actions. Logs are retained for 1 year and analyzed by our SIEM for anomaly detection.",
      baseConfidence: 95,
      sources: ["Logging Standards", "SIEM Configuration Doc"]
    },
    "certification": {
      answer: "We currently hold SOC 2 Type II, ISO 27001, and are compliant with GDPR, HIPAA, and CCPA requirements. Annual recertification audits are conducted.",
      baseConfidence: 98,
      sources: ["Compliance Certifications", "Audit Reports"]
    },
    "password": {
      answer: "Password policy requires minimum 14 characters with complexity requirements. Passwords expire every 90 days and cannot be reused for 12 generations.",
      baseConfidence: 96,
      sources: ["Password Policy", "Authentication Standards"]
    },
    "firewall": {
      answer: "Next-generation firewalls are deployed at all network perimeters with default-deny policies. Rules are reviewed quarterly and changes require CAB approval.",
      baseConfidence: 94,
      sources: ["Network Security Architecture", "Firewall Management Procedure"]
    },
    "vpn": {
      answer: "All remote access requires VPN connection using IPSec or SSL VPN with MFA. Split tunneling is disabled and connections are monitored for anomalies.",
      baseConfidence: 95,
      sources: ["Remote Access Policy", "VPN Configuration Standards"]
    },
    "sso": {
      answer: "Single sign-on is implemented using SAML 2.0 and OAuth 2.0 protocols across all enterprise applications. Integration with our identity provider ensures centralized access management.",
      baseConfidence: 93,
      sources: ["Identity Management Policy", "SSO Implementation Guide"]
    },
    "dlp": {
      answer: "Data Loss Prevention tools monitor email, web uploads, USB devices, and cloud storage. Policies prevent transmission of PII, financial data, and intellectual property outside approved channels.",
      baseConfidence: 91,
      sources: ["DLP Policy", "Data Classification Guidelines"]
    },
  };

  const mediumConfidenceAnswers: Record<string, { answer: string; baseConfidence: number; sources: string[] }> = {
    "vendor": {
      answer: "Third-party vendors undergo comprehensive security assessments including SOC 2 report reviews, security questionnaires, and periodic on-site audits. High-risk vendors are reviewed annually.",
      baseConfidence: 78,
      sources: ["Vendor Management Policy"]
    },
    "network": {
      answer: "Our network is segmented using a zero-trust architecture with microsegmentation. Each segment is protected by next-generation firewalls with IDS/IPS capabilities.",
      baseConfidence: 82,
      sources: ["Network Security Architecture Doc"]
    },
    "continuity": {
      answer: "We maintain a comprehensive business continuity plan with defined RPO (4 hours) and RTO (8 hours). The plan is tested bi-annually through simulation exercises.",
      baseConfidence: 76,
      sources: ["BCP Document v2.1"]
    },
    "sdlc": {
      answer: "Our secure SDLC includes threat modeling, code reviews, SAST/DAST scanning, and penetration testing before each release. All developers complete secure coding training.",
      baseConfidence: 84,
      sources: ["SDLC Security Guidelines", "Dev Security Training Materials"]
    },
    "classification": {
      answer: "Data is classified into four tiers: Public, Internal, Confidential, and Restricted. Each tier has specific handling, storage, and transmission requirements defined in our data classification policy.",
      baseConfidence: 79,
      sources: ["Data Classification Policy"]
    },
  };

  const lowConfidenceTopics = ["geographically distributed", "bug bounty", "mean time to detect", "multi-cloud", "anomaly detection capabilities"];

  return questions.map((q, index) => {
    const questionLower = q.question.toLowerCase();
    let matchedAnswer = {
      answer: "Based on our security policies and procedures, we implement industry-standard controls to address this requirement. Our security team regularly reviews and updates these measures to ensure continued compliance with best practices and regulatory requirements.",
      baseConfidence: 92,
      sources: ["General Security Policy"]
    };

    // Check for low confidence topics first (for red items)
    const isLowConfidence = lowConfidenceTopics.some(topic => questionLower.includes(topic));
    if (isLowConfidence) {
      matchedAnswer = {
        answer: "This capability requires further documentation and verification from our technical teams. We recommend consulting with the relevant department heads for accurate information.",
        baseConfidence: 62,
        sources: ["Pending Documentation"]
      };
    } else {
      // Check for medium confidence
      for (const [keyword, answerData] of Object.entries(mediumConfidenceAnswers)) {
        if (questionLower.includes(keyword)) {
          matchedAnswer = answerData;
          break;
        }
      }
      // Check for high confidence
      for (const [keyword, answerData] of Object.entries(highConfidenceAnswers)) {
        if (questionLower.includes(keyword)) {
          matchedAnswer = answerData;
          break;
        }
      }
    }

    // Add slight variation
    let confidence = matchedAnswer.baseConfidence + (Math.random() - 0.5) * 4;
    
    // Force distribution: 95 green, ~18 yellow, ~7 red out of 120
    // Green: indices 0-94, Yellow: 95-112, Red: 113-119
    if (index < 95) {
      confidence = Math.max(90, Math.min(99, 92 + Math.random() * 7));
    } else if (index < 113) {
      confidence = Math.max(75, Math.min(89, 78 + Math.random() * 10));
    } else {
      confidence = Math.max(55, Math.min(74, 60 + Math.random() * 12));
    }

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
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [selectedForTriage, setSelectedForTriage] = useState<AnsweredQuestion | null>(null);

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

  const handleAssignReviewer = (questionId: number, employee: Employee) => {
    setQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, assignedTo: employee } : q)
    );
    setShowTriageModal(false);
    setSelectedForTriage(null);
  };

  const openTriageModal = (question: AnsweredQuestion) => {
    setSelectedForTriage(question);
    setShowTriageModal(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-600";
    if (confidence >= 75) return "text-amber-600";
    return "text-red-600";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 90) return "bg-emerald-50 border-emerald-200";
    if (confidence >= 75) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getStatusIcon = (status: string, confidence: number) => {
    if (status === "auto" || confidence >= 90) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === "review" || confidence >= 75) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const handleExport = () => {
    const exportData = questions.map(q => ({
      Category: q.category,
      Question: q.question,
      Answer: q.answer,
      Confidence: `${q.confidence}%`,
      Status: q.status,
      Sources: q.sources.join(", "),
      AssignedTo: q.assignedTo?.name || ""
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security_questionnaire_answers.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const needsReviewQuestions = questions.filter(q => q.status === "review" || q.status === "manual");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.3) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/80">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center shadow-md shadow-sky-200/50">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-800">SecureOS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/upload" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              New Analysis
            </Link>
            <button onClick={handleExport} className="btn-primary py-2 px-4 text-sm flex items-center gap-2 rounded-lg">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-8">
        {/* Header with stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 mb-1">Analysis Complete</h1>
              <p className="text-slate-500">
                {stats.total} questions analyzed • {stats.avgConfidence}% average confidence
              </p>
            </div>
            {needsReviewQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">{needsReviewQuestions.length} items need review</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-sm text-slate-500">Total</span>
            </div>
            <div className="text-2xl font-semibold text-slate-800">{stats.total}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-500">Confident</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-600">{stats.auto}</div>
            <div className="text-xs text-slate-400 mt-1">≥90% confidence</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">Review</span>
            </div>
            <div className="text-2xl font-semibold text-amber-600">{stats.review}</div>
            <div className="text-xs text-slate-400 mt-1">75-89% confidence</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-slate-500">Manual</span>
            </div>
            <div className="text-2xl font-semibold text-red-600">{stats.manual}</div>
            <div className="text-xs text-slate-400 mt-1">&lt;75% confidence</div>
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions, answers, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all text-slate-700 placeholder:text-slate-400 text-sm"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 flex items-center gap-2 md:hidden bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className={`flex gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
            {[
              { key: "all", label: "All", count: stats.total },
              { key: "auto", label: "Confident", count: stats.auto },
              { key: "review", label: "Review", count: stats.review },
              { key: "manual", label: "Manual", count: stats.manual }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === key
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300"
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
          className="space-y-3"
        >
          <AnimatePresence>
            {filteredQuestions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02 }}
                layout
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Question Header */}
                <div
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(q.status, q.confidence)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs text-sky-600 font-medium uppercase tracking-wide">
                          {q.category}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getConfidenceBg(q.confidence)} ${getConfidenceColor(q.confidence)}`}>
                          {q.confidence}%
                        </span>
                        {q.approved && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {q.assignedTo && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 flex items-center gap-1 font-medium">
                            <Users className="w-3 h-3" /> {q.assignedTo.name}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 font-medium text-sm">{q.question}</p>
                      <p className="text-sm text-slate-500 mt-1.5 line-clamp-1">
                        {q.answer}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(q.status === "review" || q.status === "manual") && !q.assignedTo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTriageModal(q);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Triage
                        </button>
                      )}
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        {expandedId === q.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
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
                      className="border-t border-slate-100"
                    >
                      <div className="p-5 bg-slate-50/50">
                        <div className="mb-5">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-sky-600" />
                            <span className="text-sm font-medium text-sky-700">AI Generated Answer</span>
                          </div>
                          <p className="text-slate-700 text-sm leading-relaxed">{q.answer}</p>
                        </div>

                        <div className="mb-5">
                          <span className="text-xs text-slate-500 font-medium">Sources referenced:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {q.sources.map((source, i) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Suggested Reviewer */}
                        {(q.status === "review" || q.status === "manual") && (
                          <div className="mb-5 p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-xs text-slate-500 font-medium block mb-3">Suggested Reviewer:</span>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                                  {getSuggestedReviewer(q.category).avatar}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800 text-sm">{getSuggestedReviewer(q.category).name}</div>
                                  <div className="text-xs text-slate-500">{getSuggestedReviewer(q.category).title}</div>
                                </div>
                              </div>
                              {!q.assignedTo && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignReviewer(q.id, getSuggestedReviewer(q.category));
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-1.5"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Assign
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                          {!q.approved && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(q.id);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                Approve
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium border border-slate-200 hover:border-slate-300">
                                <Edit3 className="w-4 h-4" />
                                Edit
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-red-600 transition-colors text-sm">
                                <ThumbsDown className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-sm ml-auto">
                            <Eye className="w-4 h-4" />
                            View Context
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
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No questions match your search</p>
          </motion.div>
        )}

        {/* Summary Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-slate-800">Analysis Summary</h3>
          </div>
          <p className="text-slate-500 mb-6 text-sm">
            SecureOS auto-answered <span className="text-sky-600 font-semibold">{stats.auto}</span> of <span className="font-semibold">{stats.total}</span> questions with high confidence.
            <br />
            <span className="text-amber-600 font-semibold">{stats.review + stats.manual}</span> items flagged for expert review.
          </p>
          <div className="flex items-center justify-center gap-10">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">{Math.round((stats.auto / stats.total) * 100) || 0}%</div>
              <div className="text-xs text-slate-500 mt-1">Automation Rate</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">{Math.round(stats.total * 2.5)} min</div>
              <div className="text-xs text-slate-500 mt-1">Time Saved</div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Triage Modal */}
      <AnimatePresence>
        {showTriageModal && selectedForTriage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTriageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Assign Reviewer</h3>
                    <p className="text-sm text-slate-500 mt-1">Select a team member to review this question</p>
                  </div>
                  <button
                    onClick={() => setShowTriageModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-600 line-clamp-2">{selectedForTriage.question}</p>
                <span className="text-xs text-sky-600 font-medium mt-2 inline-block">{selectedForTriage.category}</span>
              </div>

              <div className="p-4 max-h-80 overflow-y-auto space-y-2">
                {mockEmployees.map((employee) => {
                  const isSuggested = getSuggestedReviewer(selectedForTriage.category).id === employee.id;
                  return (
                    <button
                      key={employee.id}
                      onClick={() => handleAssignReviewer(selectedForTriage.id, employee)}
                      className={`w-full p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                        isSuggested ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-sky-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-medium">
                          {employee.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{employee.name}</span>
                            {isSuggested && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-200 text-sky-700 font-medium">Suggested</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{employee.title}</div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {employee.expertise.slice(0, 3).map((exp, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{exp}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
