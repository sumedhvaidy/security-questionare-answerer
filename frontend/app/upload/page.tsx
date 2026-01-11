"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Upload, FileSpreadsheet, X, ArrowRight, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface ParsedQuestion {
  id: number;
  category: string;
  question: string;
}

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

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        if (char === '\r') i++;
      } else {
        currentCell += char;
      }
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  const processFile = async (selectedFile: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const fileName = selectedFile.name.toLowerCase();
      let data: string[][] = [];

      if (fileName.endsWith('.csv')) {
        // Parse CSV file
        const text = await selectedFile.text();
        data = parseCSV(text);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel file
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      } else {
        setError("Please upload a CSV or XLSX file");
        setIsProcessing(false);
        return;
      }

      // Detect column format from headers
      const headers = data[0]?.map(h => h?.toString().toLowerCase().trim()) || [];
      const parsedQuestions: ParsedQuestion[] = [];
      
      // Find column indices based on headers
      let idCol = headers.findIndex(h => h === 'id' || h === 'question_id' || h === '#');
      let categoryCol = headers.findIndex(h => h === 'category' || h === 'type' || h === 'section');
      let questionCol = headers.findIndex(h => h === 'question' || h === 'question_text' || h === 'questions');
      
      // Fallback: if no "question" header found, try to detect format
      if (questionCol === -1) {
        if (headers.length >= 3 && idCol !== -1) {
          // Format: id, category, question
          categoryCol = categoryCol !== -1 ? categoryCol : 1;
          questionCol = 2;
        } else if (headers.length >= 2) {
          // Format: category, question
          categoryCol = 0;
          questionCol = 1;
        } else {
          // Format: just questions
          questionCol = 0;
        }
      }
      
      console.log(`Detected columns - ID: ${idCol}, Category: ${categoryCol}, Question: ${questionCol}`);
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && row.length > 0) {
          const questionText = questionCol >= 0 ? row[questionCol]?.toString().trim() : "";
          const categoryText = categoryCol >= 0 ? row[categoryCol]?.toString().trim() : "General";
          const rowId = idCol >= 0 ? parseInt(row[idCol]?.toString()) || i : i;
          
          if (questionText) {
            parsedQuestions.push({
              id: rowId,
              category: categoryText || "General",
              question: questionText
            });
          }
        }
      }

      if (parsedQuestions.length === 0) {
        setError("No questions found in the file. Please check the format (Category, Question columns or just Question column).");
      } else {
        setQuestions(parsedQuestions);
        // Store in localStorage for the next page
        localStorage.setItem("secureOS_questions", JSON.stringify(parsedQuestions));
        // Clear any previous results
        localStorage.removeItem("secureOS_results");
        localStorage.removeItem("secureOS_metadata");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse the file. Please ensure it's a valid CSV or XLSX file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    const fileName = droppedFile?.name.toLowerCase() || "";
    if (droppedFile && (fileName.endsWith(".xlsx") || fileName.endsWith(".csv") || fileName.endsWith(".xls"))) {
      setFile(droppedFile);
      processFile(droppedFile);
    } else {
      setError("Please upload a CSV or XLSX file");
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
    // Create demo questions
    const demoQuestions: ParsedQuestion[] = [
      { id: 1, category: "Access Control", question: "Does your organization have a formal access control policy?" },
      { id: 2, category: "Access Control", question: "How are user access rights reviewed and updated?" },
      { id: 3, category: "Access Control", question: "Is multi-factor authentication (MFA) required for all users?" },
      { id: 4, category: "Data Protection", question: "What encryption standards are used for data at rest?" },
      { id: 5, category: "Data Protection", question: "How is data classified and labeled within your organization?" },
      { id: 6, category: "Data Protection", question: "Describe your data backup and recovery procedures." },
      { id: 7, category: "Incident Response", question: "Do you have a documented incident response plan?" },
      { id: 8, category: "Incident Response", question: "How quickly are security incidents detected and reported?" },
      { id: 9, category: "Incident Response", question: "Describe your post-incident review process." },
      { id: 10, category: "Vendor Management", question: "How do you assess third-party vendor security?" },
      { id: 11, category: "Vendor Management", question: "Are vendors required to comply with your security policies?" },
      { id: 12, category: "Compliance", question: "List all security certifications your organization holds." },
      { id: 13, category: "Compliance", question: "How often are security audits conducted?" },
      { id: 14, category: "Network Security", question: "Describe your network segmentation strategy." },
      { id: 15, category: "Network Security", question: "How is network traffic monitored for threats?" },
      { id: 16, category: "Network Security", question: "What intrusion detection/prevention systems are in place?" },
      { id: 17, category: "Employee Training", question: "Is security awareness training mandatory for all employees?" },
      { id: 18, category: "Employee Training", question: "How often is security training conducted?" },
      { id: 19, category: "Physical Security", question: "Describe physical access controls to data centers." },
      { id: 20, category: "Physical Security", question: "How are visitors managed in secure areas?" },
      { id: 21, category: "Business Continuity", question: "Do you have a business continuity plan?" },
      { id: 22, category: "Business Continuity", question: "How often is the disaster recovery plan tested?" },
      { id: 23, category: "Application Security", question: "Describe your secure software development lifecycle." },
      { id: 24, category: "Application Security", question: "How are application vulnerabilities identified and remediated?" },
      { id: 25, category: "Logging & Monitoring", question: "What events are logged across your systems?" },
    ];

    setFile(new File([], "demo_security_questionnaire.xlsx"));
    setQuestions(demoQuestions);
    localStorage.setItem("secureOS_questions", JSON.stringify(demoQuestions));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] grid-pattern relative">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">SecureOS</span>
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 text-slate-800">Upload Your Questionnaire</h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Upload a CSV or XLSX file containing your security questions. 
            Our AI agents will analyze and generate responses with confidence scores.
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
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragging
                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                : file
                ? "border-green-500/50 bg-green-500/5"
                : "border-[var(--card-border)] hover:border-[var(--accent)]/50"
            }`}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
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
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-lg font-medium mb-1 text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {questions.length} questions found
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setQuestions([]);
                    }}
                    className="mt-4 text-sm text-slate-400 hover:text-red-500 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Remove file
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
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                    isDragging ? "bg-sky-100" : "bg-slate-100"
                  }`}>
                    <Upload className={`w-8 h-8 ${isDragging ? "text-[var(--accent)]" : "text-slate-400"}`} />
                  </div>
                  <p className="text-lg font-medium mb-1 text-slate-700">
                    {isDragging ? "Drop your file here" : "Drag & drop your CSV or XLSX file"}
                  </p>
                  <p className="text-sm text-slate-500">or click to browse • Supports CSV, XLS, XLSX</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isProcessing && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full spinner" />
                  <span className="text-slate-700">Processing file...</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600">{error}</span>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={useDemoFile}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Don&apos;t have a file? Try our demo questionnaire →
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
              className="mt-12"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Questions Preview</h2>
                <span className="text-sm text-slate-500">{questions.length} questions</span>
              </div>

              <div className="glass-card p-6 max-h-80 overflow-y-auto space-y-3">
                {questions.slice(0, 10).map((q, index) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm text-[var(--accent)] font-medium">{q.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[var(--accent)] uppercase tracking-wide font-medium">{q.category}</span>
                      <p className="text-sm text-slate-600 mt-1">{q.question}</p>
                    </div>
                  </motion.div>
                ))}
                {questions.length > 10 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    + {questions.length - 10} more questions
                  </div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex justify-center"
              >
                <button
                  onClick={handleContinue}
                  className="btn-primary text-lg py-4 px-10 flex items-center gap-3"
                >
                  <Check className="w-5 h-5" />
                  Analyze Questions
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
