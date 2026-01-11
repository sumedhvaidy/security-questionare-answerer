"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Brain, Sparkles, Database, FileCheck, Lock, Zap, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the Tesseract to avoid SSR issues with Three.js
const Tesseract = dynamic(() => import("../components/Tesseract"), { 
  ssr: false,
  loading: () => (
    <div className="w-48 h-48 flex items-center justify-center">
      <div className="w-16 h-16 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
});

const processingSteps = [
  { icon: Database, label: "Loading questionnaire data", duration: 1200 },
  { icon: Brain, label: "Analyzing question context", duration: 1800 },
  { icon: Lock, label: "Matching security policies", duration: 2200 },
  { icon: Sparkles, label: "Generating AI responses", duration: 2800 },
  { icon: FileCheck, label: "Calculating confidence scores", duration: 1200 },
  { icon: Zap, label: "Finalizing results", duration: 800 },
];

export default function ProcessingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("secureOS_questions");
    if (!stored) {
      router.push("/upload");
      return;
    }

    const questions = JSON.parse(stored);
    setQuestionCount(questions.length);

    let totalDuration = 0;
    const totalTime = processingSteps.reduce((acc, step) => acc + step.duration, 0);

    const stepTimeouts: NodeJS.Timeout[] = [];
    
    processingSteps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index);
      }, totalDuration);
      stepTimeouts.push(timeout);
      totalDuration += step.duration;
    });

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (totalTime / 50));
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    const completeTimeout = setTimeout(() => {
      setIsComplete(true);
      setTimeout(() => {
        router.push("/results");
      }, 800);
    }, totalTime);

    return () => {
      stepTimeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 relative flex flex-col">
      {/* Subtle pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.3) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-200/50">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-800">SecureOS</span>
        </Link>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-8 relative z-10">
        <div className="max-w-md w-full text-center">
          {/* Tesseract Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative mb-8 flex justify-center"
          >
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-48 h-48 flex items-center justify-center"
                >
                  <motion.div 
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="tesseract"
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Tesseract />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-semibold mb-2 text-slate-800">
              {isComplete ? (
                <span className="text-emerald-600">Analysis Complete!</span>
              ) : (
                "Analyzing Questionnaire"
              )}
            </h1>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-center gap-2 text-slate-500 mb-6 text-sm"
              >
                {!isComplete && (() => {
                  const IconComponent = processingSteps[currentStep]?.icon || Brain;
                  return <IconComponent className="w-4 h-4 text-sky-500" />;
                })()}
                <span>
                  {isComplete 
                    ? "Redirecting to results..."
                    : processingSteps[currentStep]?.label
                  }
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Info badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span className="text-sm text-slate-600">Processing <span className="font-semibold text-sky-600">{questionCount}</span> questions</span>
            </div>

            {/* Progress bar */}
            <div className="max-w-sm mx-auto">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Processing</span>
                <span className="font-medium text-sky-600">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Steps indicator */}
            <div className="mt-8 flex justify-center gap-2">
              {processingSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index < currentStep
                      ? "bg-sky-500"
                      : index === currentStep
                      ? "bg-sky-500 scale-125"
                      : "bg-slate-300"
                  }`}
                  animate={index === currentStep ? { 
                    boxShadow: ["0 0 0 0 rgba(14, 165, 233, 0.4)", "0 0 0 8px rgba(14, 165, 233, 0)", "0 0 0 0 rgba(14, 165, 233, 0)"]
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
