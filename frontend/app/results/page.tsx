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
  X,
  Save,
  FileText,
  ExternalLink
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

interface Reference {
  title: string;
  section: string;
  page: string;
  relevance: number;
}

interface AnsweredQuestion extends Question {
  answer: string;
  confidence: number;
  status: "auto" | "review" | "manual";
  sources: string[];
  references: Reference[];
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

// Generate references based on category
const generateReferences = (category: string): Reference[] => {
  const refMap: Record<string, Reference[]> = {
    "Access Control": [
      { title: "Information Security Policy", section: "Section 4.2 - Access Management", page: "p. 23-28", relevance: 95 },
      { title: "IAM Procedure Manual", section: "Chapter 3 - User Provisioning", page: "p. 12-15", relevance: 88 },
    ],
    "Data Protection": [
      { title: "Data Protection Policy", section: "Section 2.1 - Data Classification", page: "p. 8-14", relevance: 92 },
      { title: "Encryption Standards Guide", section: "Appendix A - Key Management", page: "p. 45-52", relevance: 85 },
    ],
    "Incident Response": [
      { title: "Incident Response Plan", section: "Section 5 - Response Procedures", page: "p. 18-32", relevance: 96 },
      { title: "Security Operations Manual", section: "Chapter 7 - Escalation Matrix", page: "p. 28-30", relevance: 82 },
    ],
    "Vendor Management": [
      { title: "Third-Party Risk Policy", section: "Section 3 - Vendor Assessment", page: "p. 15-22", relevance: 90 },
      { title: "Procurement Guidelines", section: "Appendix C - Security Checklist", page: "p. 67-70", relevance: 78 },
    ],
    "Compliance": [
      { title: "Compliance Framework Doc", section: "Section 1 - Regulatory Overview", page: "p. 5-18", relevance: 94 },
      { title: "Audit Procedures Manual", section: "Chapter 4 - Evidence Collection", page: "p. 34-42", relevance: 88 },
    ],
    "Network Security": [
      { title: "Network Security Architecture", section: "Section 2 - Segmentation Design", page: "p. 12-25", relevance: 93 },
      { title: "Firewall Configuration Guide", section: "Chapter 5 - Rule Management", page: "p. 38-45", relevance: 86 },
    ],
    "Employee Training": [
      { title: "Security Awareness Program", section: "Section 2 - Training Curriculum", page: "p. 8-15", relevance: 91 },
      { title: "HR Policy Handbook", section: "Chapter 12 - Security Obligations", page: "p. 78-82", relevance: 84 },
    ],
    "Physical Security": [
      { title: "Physical Security Policy", section: "Section 3 - Access Controls", page: "p. 14-22", relevance: 95 },
      { title: "Data Center Operations", section: "Chapter 2 - Entry Procedures", page: "p. 8-12", relevance: 89 },
    ],
    "Business Continuity": [
      { title: "BCP Master Document", section: "Section 4 - Recovery Procedures", page: "p. 28-45", relevance: 92 },
      { title: "Disaster Recovery Plan", section: "Appendix B - RTO/RPO Matrix", page: "p. 56-58", relevance: 88 },
    ],
    "Application Security": [
      { title: "Secure SDLC Guidelines", section: "Section 3 - Security Testing", page: "p. 18-28", relevance: 94 },
      { title: "Code Review Standards", section: "Chapter 6 - Security Checklist", page: "p. 42-48", relevance: 87 },
    ],
    "Logging & Monitoring": [
      { title: "Logging Standards Doc", section: "Section 2 - Event Categories", page: "p. 10-18", relevance: 93 },
      { title: "SIEM Operations Manual", section: "Chapter 4 - Alert Triage", page: "p. 24-32", relevance: 86 },
    ],
    "Cloud Security": [
      { title: "Cloud Security Policy", section: "Section 3 - Configuration Standards", page: "p. 15-28", relevance: 91 },
      { title: "CSPM Implementation Guide", section: "Chapter 2 - Baseline Controls", page: "p. 12-20", relevance: 85 },
    ],
    "Identity Management": [
      { title: "Identity Governance Policy", section: "Section 2 - Lifecycle Management", page: "p. 8-16", relevance: 94 },
      { title: "SSO Implementation Guide", section: "Chapter 3 - Federation Setup", page: "p. 18-25", relevance: 82 },
    ],
  };
  
  return refMap[category] || [
    { title: "General Security Policy", section: "Section 1 - Overview", page: "p. 1-10", relevance: 75 },
  ];
};

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

// Demo answers - distribution: ~95 green, ~23 yellow, 2 red
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
  };

  const totalQuestions = questions.length;
  // Force exactly 2 red, ~23 yellow, rest green
  const redCount = 2;
  const yellowCount = Math.min(23, Math.floor(totalQuestions * 0.19));
  const greenCount = totalQuestions - redCount - yellowCount;

  return questions.map((q, index) => {
    const questionLower = q.question.toLowerCase();
    let matchedAnswer = {
      answer: "Based on our security policies and procedures, we implement industry-standard controls to address this requirement. Our security team regularly reviews and updates these measures to ensure continued compliance with best practices and regulatory requirements.",
      baseConfidence: 92,
      sources: ["General Security Policy"]
    };

    // Match keywords for better answers
    for (const [keyword, answerData] of Object.entries(highConfidenceAnswers)) {
      if (questionLower.includes(keyword)) {
        matchedAnswer = answerData;
        break;
      }
    }

    // Determine confidence based on position to ensure proper distribution
    let confidence: number;
    let status: "auto" | "review" | "manual";
    
    // Last 2 questions are RED (manual)
    if (index >= totalQuestions - redCount) {
      confidence = 58 + Math.random() * 12; // 58-70%
      status = "manual";
      matchedAnswer = {
        answer: "This specific requirement needs verification from our technical teams. The current documentation does not fully address this capability and may require additional policy development or system configuration review.",
        baseConfidence: 65,
        sources: ["Pending Documentation Review"]
      };
    }
    // Next ~23 before that are YELLOW (review)
    else if (index >= totalQuestions - redCount - yellowCount) {
      confidence = 76 + Math.random() * 12; // 76-88%
      status = "review";
    }
    // Rest are GREEN (auto)
    else {
      confidence = 90 + Math.random() * 9; // 90-99%
      status = "auto";
    }

    const roundedConfidence = Math.round(confidence);

    return {
      ...q,
      answer: matchedAnswer.answer,
      confidence: roundedConfidence,
      status,
      sources: matchedAnswer.sources,
      references: generateReferences(q.category)
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
  const [editingQuestion, setEditingQuestion] = useState<AnsweredQuestion | null>(null);
  const [editedAnswer, setEditedAnswer] = useState("");

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

  const openEditor = (question: AnsweredQuestion) => {
    setEditingQuestion(question);
    setEditedAnswer(question.answer);
  };

  const saveEdit = () => {
    if (editingQuestion) {
      setQuestions(prev =>
        prev.map(q => q.id === editingQuestion.id ? { ...q, answer: editedAnswer } : q)
      );
      setEditingQuestion(null);
      setEditedAnswer("");
    }
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
      References: q.references.map(r => `${r.title} - ${r.section}`).join("; "),
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
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-md shadow-sky-200/50">
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
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditor(q);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit answer"
                      >
                        <Edit3 className="w-4 h-4 text-slate-400" />
                      </button>
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

                        {/* References Section */}
                        <div className="mb-5 p-4 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">Policy References</span>
                          </div>
                          <div className="space-y-2">
                            {q.references.map((ref, i) => (
                              <div key={i} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-800">{ref.title}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">{ref.section} • {ref.page}</div>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                  {ref.relevance}% match
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mb-5">
                          <span className="text-xs text-slate-500 font-medium">Sources:</span>
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
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditor(q);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium border border-slate-200 hover:border-slate-300"
                              >
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

      {/* Editor Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingQuestion(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Edit Answer</h3>
                      <p className="text-sm text-slate-500">Modify the AI-generated response</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <span className="text-xs text-sky-600 font-medium uppercase tracking-wide">{editingQuestion.category}</span>
                <p className="text-sm text-slate-800 font-medium mt-1">{editingQuestion.question}</p>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Answer</label>
                <textarea
                  value={editedAnswer}
                  onChange={(e) => setEditedAnswer(e.target.value)}
                  className="w-full h-48 p-4 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 resize-none"
                  placeholder="Enter your answer..."
                />
                
                {/* Reference hint */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Reference: {editingQuestion.references[0]?.title} - {editingQuestion.references[0]?.section}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
