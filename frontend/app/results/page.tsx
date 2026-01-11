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
  FileSpreadsheet,
  FileJson,
  Zap,
  Mail,
  User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EscalationEmployee {
  name: string;
  email: string;
  department: string;
  title?: string;
}

interface AnsweredQuestion {
  id: number;
  category: string;
  question: string;
  answer: string;
  confidence: number;
  status: "auto" | "review" | "manual";
  sources: string[];
  approved?: boolean;
  needs_escalation?: boolean;
  escalation_reason?: string;
  reasoning?: string;
  routed_to?: EscalationEmployee;
  informed?: boolean;
}

// Demo answers fallback
const generateDemoAnswers = (questions: any[]): AnsweredQuestion[] => {
  const answers: Record<string, { answer: string; baseConfidence: number; sources: string[] }> = {
    "access control": {
      answer: "Yes, our organization maintains a comprehensive access control policy aligned with ISO 27001 and SOC 2 requirements. The policy is reviewed annually.",
      baseConfidence: 95,
      sources: ["Information Security Policy v3.2", "Access Control Procedure Doc"]
    },
    "mfa": {
      answer: "Yes, multi-factor authentication (MFA) is mandatory for all users across all systems.",
      baseConfidence: 98,
      sources: ["Authentication Standards", "Security Policy Section 4.2"]
    },
    "encryption": {
      answer: "We employ AES-256 encryption for data at rest and TLS 1.3 for data in transit.",
      baseConfidence: 92,
      sources: ["Encryption Standards Doc", "Data Protection Policy"]
    },
    "incident": {
      answer: "Yes, we maintain a documented incident response plan that follows the NIST Cybersecurity Framework.",
      baseConfidence: 88,
      sources: ["Incident Response Plan", "IR Procedure Manual"]
    },
  };

  return questions.map((q: any) => {
    const questionLower = q.question?.toLowerCase() || "";
    let matchedAnswer = {
      answer: "Based on our security policies, we implement industry-standard controls to address this requirement.",
      baseConfidence: 65 + Math.random() * 15,
      sources: ["General Security Policy"]
    };

    for (const [keyword, answerData] of Object.entries(answers)) {
      if (questionLower.includes(keyword)) {
        matchedAnswer = answerData;
        break;
      }
    }

    const confidence = Math.min(99, Math.max(55, matchedAnswer.baseConfidence + (Math.random() - 0.5) * 10));
    const roundedConfidence = Math.round(confidence);

    return {
      id: q.id,
      category: q.category || "General",
      question: q.question,
      answer: matchedAnswer.answer,
      confidence: roundedConfidence,
      status: roundedConfidence >= 90 ? "auto" : roundedConfidence >= 70 ? "review" : "manual",
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
  const [metadata, setMetadata] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedAnswer, setEditedAnswer] = useState<string>("");
  const [contextModalId, setContextModalId] = useState<number | null>(null);

  useEffect(() => {
    // First check for API results
    const apiResults = localStorage.getItem("secureOS_results");
    const apiMetadata = localStorage.getItem("secureOS_metadata");
    const demoMode = localStorage.getItem("secureOS_demo_mode");

    if (apiResults && !demoMode) {
      // Use actual API results
      const results = JSON.parse(apiResults);
      setQuestions(results);
      if (apiMetadata) {
        setMetadata(JSON.parse(apiMetadata));
      }
    } else {
      // Fallback to demo mode
      const stored = localStorage.getItem("secureOS_questions");
      if (!stored) {
        router.push("/upload");
        return;
      }
      const parsedQuestions = JSON.parse(stored);
      const answeredQuestions = generateDemoAnswers(parsedQuestions);
      setQuestions(answeredQuestions);
    }

    // Clear demo mode flag
    localStorage.removeItem("secureOS_demo_mode");
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
    setQuestions(prev => {
      const updated = prev.map(q => q.id === id ? { ...q, approved: true, status: "auto" as const } : q);
      // Update localStorage
      localStorage.setItem("secureOS_results", JSON.stringify(updated));
      return updated;
    });
  };

  const handleStartEdit = (q: AnsweredQuestion) => {
    setEditingId(q.id);
    setEditedAnswer(q.answer);
  };

  const handleSaveEdit = (id: number) => {
    setQuestions(prev => {
      const updated = prev.map(q => 
        q.id === id ? { ...q, answer: editedAnswer, approved: false } : q
      );
      // Update localStorage so CSV export gets the edited answer
      localStorage.setItem("secureOS_results", JSON.stringify(updated));
      return updated;
    });
    setEditingId(null);
    setEditedAnswer("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedAnswer("");
  };

  const handleViewContext = (id: number) => {
    setContextModalId(id);
  };

  const handleInformEmployee = async (id: number) => {
    const question = questions.find(q => q.id === id);
    if (!question?.routed_to) return;

    // In a real app, this would send an email/notification
    // For now, we'll just mark it as informed
    setQuestions(prev => {
      const updated = prev.map(q => 
        q.id === id ? { ...q, informed: true } : q
      );
      localStorage.setItem("secureOS_results", JSON.stringify(updated));
      return updated;
    });

    // Show a notification (you could use a toast library)
    alert(`Notification sent to ${question.routed_to.name} (${question.routed_to.email})`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-700";
    if (confidence >= 70) return "text-amber-700";
    return "text-red-700";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 90) return "bg-emerald-100 border-emerald-300";
    if (confidence >= 70) return "bg-amber-100 border-amber-300";
    return "bg-red-100 border-red-300";
  };

  const getStatusIcon = (status: string, confidence: number) => {
    if (status === "auto" || confidence >= 90) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (status === "review" || confidence >= 70) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const handleExportJSON = () => {
    const exportData = questions.map(q => ({
      Category: q.category,
      Question: q.question,
      Answer: q.answer,
      Confidence: `${q.confidence}%`,
      Status: q.status,
      Sources: q.sources.join(", "),
      NeedsEscalation: q.needs_escalation || false,
      Reasoning: q.reasoning || ""
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security_questionnaire_answers.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // CSV header
    const headers = ["Category", "Question", "Answer", "Confidence", "Status", "Sources", "Needs Escalation", "Reasoning"];
    
    // CSV rows
    const rows = questions.map(q => [
      `"${q.category.replace(/"/g, '""')}"`,
      `"${q.question.replace(/"/g, '""')}"`,
      `"${q.answer.replace(/"/g, '""')}"`,
      `${q.confidence}%`,
      q.status,
      `"${q.sources.join("; ").replace(/"/g, '""')}"`,
      q.needs_escalation ? "Yes" : "No",
      `"${(q.reasoning || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "security_questionnaire_answers.csv";
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
          <div className="flex items-center gap-3">
            <Link href="/upload" className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              New Upload
            </Link>
            <button onClick={handleExportCSV} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={handleExportJSON} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              <FileJson className="w-4 h-4" />
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
            {metadata?.escalations_required > 0 && (
              <span className="text-red-600 ml-2">
                • {metadata.escalations_required} need escalation
              </span>
            )}
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
              <span className="text-sm text-slate-500">High Confidence</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{stats.auto}</div>
            <div className="text-xs text-slate-500 mt-1">≥90% confidence</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-slate-500">Needs Review</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">{stats.review}</div>
            <div className="text-xs text-slate-500 mt-1">70-90% confidence</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-slate-500">Low Confidence</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.manual}</div>
            <div className="text-xs text-slate-500 mt-1">&lt;70% - needs escalation</div>
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
              { key: "auto", label: "High", count: stats.auto },
              { key: "review", label: "Medium", count: stats.review },
              { key: "manual", label: "Low", count: stats.manual }
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
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                        {q.needs_escalation && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Needs Escalation
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
                          
                          {editingId === q.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editedAnswer}
                                onChange={(e) => setEditedAnswer(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full p-4 border border-slate-300 rounded-lg focus:outline-none focus:border-[var(--accent)] text-slate-700 min-h-[150px] resize-y"
                                placeholder="Edit your answer..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(q.id);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm"
                                >
                                  <Check className="w-4 h-4" />
                                  Save Changes
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-700 leading-relaxed">{q.answer}</p>
                          )}
                        </div>

                        {q.reasoning && (
                          <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-sm font-medium text-slate-600">Reasoning:</span>
                            <p className="text-sm text-slate-500 mt-1">{q.reasoning}</p>
                          </div>
                        )}

                        {q.needs_escalation && (
                          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Needs Human Review
                              </span>
                              {q.routed_to && !q.informed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInformEmployee(q.id);
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
                                >
                                  <Zap className="w-3 h-3" />
                                  Inform Employee
                                </button>
                              )}
                              {q.informed && (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                  <Check className="w-3 h-3" /> Notified
                                </span>
                              )}
                            </div>
                            {q.escalation_reason && (
                              <p className="text-sm text-red-500 mb-3">{q.escalation_reason}</p>
                            )}
                            {q.routed_to ? (
                              <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                                <span className="text-xs text-slate-500 uppercase tracking-wide">Assigned To:</span>
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold">
                                    {q.routed_to.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800">{q.routed_to.name}</p>
                                    <p className="text-sm text-slate-500">{q.routed_to.title || q.routed_to.department}</p>
                                    <p className="text-xs text-slate-400">{q.routed_to.email}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-amber-600" />
                                  <span className="text-sm text-amber-700">
                                    No employee assigned - run <code className="bg-amber-100 px-1 rounded">python seed_employees.py</code> to add employees
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mb-6">
                          <span className="text-sm text-slate-500">Sources referenced:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {q.sources.length > 0 ? q.sources.map((source, i) => (
                              <span key={i} className="text-xs px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                                {source}
                              </span>
                            )) : (
                              <span className="text-xs text-slate-400">No sources available</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                          {!q.approved && editingId !== q.id && (
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
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(q);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-slate-600 hover:text-slate-800 transition-colors text-sm border border-slate-200"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit Answer
                              </button>
                              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:text-red-600 transition-colors text-sm">
                                <ThumbsDown className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewContext(q.id);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-colors text-sm ml-auto"
                          >
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
            <h3 className="text-xl font-semibold text-slate-800">Analysis Summary</h3>
          </div>
          <p className="text-slate-500 mb-6">
            SecureOS answered <span className="text-emerald-600 font-semibold">{stats.auto}</span> questions with high confidence.
            <br />
            <span className="text-amber-600 font-semibold">{stats.review}</span> need review, 
            <span className="text-red-600 font-semibold"> {stats.manual}</span> need manual attention.
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{stats.avgConfidence}%</div>
              <div className="text-sm text-slate-500">Avg Confidence</div>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{Math.round(stats.total * 3.5)} min</div>
              <div className="text-sm text-slate-500">Time Saved</div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Context Modal */}
      <AnimatePresence>
        {contextModalId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setContextModalId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              {(() => {
                const q = questions.find(q => q.id === contextModalId);
                if (!q) return null;
                return (
                  <>
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800">Full Context</h2>
                        <button 
                          onClick={() => setContextModalId(null)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                      <div>
                        <span className="text-xs text-[var(--accent)] uppercase tracking-wide font-medium">{q.category}</span>
                        <h3 className="text-lg font-medium text-slate-800 mt-1">{q.question}</h3>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                          <span className="text-sm font-medium text-slate-600">AI Generated Answer</span>
                          <span className={`ml-auto text-xs px-2 py-1 rounded-full ${getConfidenceBg(q.confidence)} ${getConfidenceColor(q.confidence)}`}>
                            {q.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-slate-700">{q.answer}</p>
                      </div>

                      {q.reasoning && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm font-medium text-blue-700">AI Reasoning:</span>
                          <p className="text-sm text-blue-600 mt-1">{q.reasoning}</p>
                        </div>
                      )}

                      {q.needs_escalation && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Escalation Required</span>
                          </div>
                          <p className="text-sm text-red-600 mb-3">{q.escalation_reason || "Low confidence - needs human review"}</p>
                          
                          {q.routed_to ? (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {q.routed_to.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800">{q.routed_to.name}</p>
                                    <p className="text-sm text-slate-500">{q.routed_to.title || q.routed_to.department}</p>
                                    <p className="text-xs text-slate-400">{q.routed_to.email}</p>
                                  </div>
                                </div>
                                {!q.informed ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInformEmployee(q.id);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
                                  >
                                    <Mail className="w-4 h-4" />
                                    Notify
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">
                                    <Check className="w-4 h-4" /> Notified
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-amber-600" />
                                <span className="text-sm text-amber-700">
                                  No employee assigned yet
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <span className="text-sm font-medium text-slate-600">Sources Referenced:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {q.sources.length > 0 ? q.sources.map((source, i) => (
                            <span key={i} className="text-sm px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                              📄 {source}
                            </span>
                          )) : (
                            <span className="text-sm text-slate-400">No specific sources referenced</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
