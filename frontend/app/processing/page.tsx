"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Brain, Sparkles, Database, FileCheck, Lock, Zap, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const processingSteps = [
  { icon: Database, label: "Loading questionnaire data", duration: 1000 },
  { icon: Brain, label: "Connecting to Knowledge Agent", duration: 1500 },
  { icon: Lock, label: "Searching security policies (Vector Search)", duration: 2000 },
  { icon: Sparkles, label: "Extracting citations", duration: 2000 },
  { icon: FileCheck, label: "Drafting answers with AI", duration: 3000 },
  { icon: Zap, label: "Calculating confidence scores", duration: 1500 },
];

interface Question {
  id: number;
  category: string;
  question: string;
}

export default function ProcessingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    // Check if we have questions
    const stored = localStorage.getItem("secureOS_questions");
    if (!stored) {
      router.push("/upload");
      return;
    }

    const questions: Question[] = JSON.parse(stored);
    processQuestionnaire(questions);
  }, [router]);

  const processQuestionnaire = async (questions: Question[]) => {
    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90; // Cap at 90% until complete
          return prev + 2;
        });
      }, 200);

      // Animate through steps
      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        if (stepIndex < processingSteps.length - 1) {
          stepIndex++;
          setCurrentStep(stepIndex);
        }
      }, 1800);

      setStatusMessage(`Processing ${questions.length} questions...`);

      // Call the API
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions }),
      });

      clearInterval(stepInterval);
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process questionnaire");
      }

      const result = await response.json();

      // Store results
      localStorage.setItem("secureOS_results", JSON.stringify(result.results));
      localStorage.setItem("secureOS_metadata", JSON.stringify({
        request_id: result.request_id,
        total_questions: result.total_questions,
        escalations_required: result.escalations_required,
      }));

      // Complete animation
      setProgress(100);
      setCurrentStep(processingSteps.length - 1);
      setIsComplete(true);

      // Navigate to results
      setTimeout(() => {
        router.push("/results");
      }, 800);

    } catch (err) {
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] grid-pattern flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Processing Failed</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <p className="text-sm text-slate-400 mb-6">
            Make sure the API server is running at localhost:8000
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/upload" className="btn-secondary py-3 px-6">
              Try Again
            </Link>
            <button 
              onClick={() => {
                // Use demo mode
                localStorage.setItem("secureOS_demo_mode", "true");
                router.push("/results");
              }}
              className="btn-primary py-3 px-6"
            >
              Use Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] grid-pattern relative flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(3, 105, 161, 0.06) 0%, transparent 60%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800">SecureOS</span>
        </Link>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-2xl w-full text-center">
          {/* Central animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-12"
          >
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 m-auto w-48 h-48 rounded-full border-2 border-[var(--accent)]/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent)]" />
            </motion.div>

            {/* Middle ring */}
            <motion.div
              className="absolute inset-0 m-auto w-36 h-36 rounded-full border-2 border-[var(--accent-secondary)]/30"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
            </motion.div>

            {/* Center icon */}
            <motion.div
              className="relative w-48 h-48 mx-auto flex items-center justify-center"
              animate={isComplete ? { scale: [1, 1.2, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center pulse-glow"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {(() => {
                      const IconComponent = processingSteps[currentStep]?.icon || Brain;
                      return <IconComponent className="w-12 h-12 text-white" />;
                    })()}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[var(--accent)]"
                style={{
                  top: "50%",
                  left: "50%",
                }}
                animate={{
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 100, 0],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 100, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>

          {/* Status text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold mb-4 text-slate-800">
              {isComplete ? (
                <span className="gradient-text">Analysis Complete!</span>
              ) : (
                "Analyzing Your Questionnaire"
              )}
            </h1>
            
            <AnimatePresence mode="wait">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-slate-500 mb-8"
              >
                {isComplete 
                  ? "Redirecting to results..."
                  : processingSteps[currentStep]?.label
                }
              </motion.p>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="mt-4 flex justify-between text-sm text-slate-500">
                <span>{statusMessage || "Processing"}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Steps indicator */}
            <div className="mt-12 flex justify-center gap-2">
              {processingSteps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index <= currentStep
                      ? "bg-[var(--accent)]"
                      : "bg-slate-300"
                  }`}
                  animate={index === currentStep ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
