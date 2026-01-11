"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Brain, Sparkles, Database, FileCheck, Lock, Zap, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      }, 600);
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
      <div className="fixed inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.3) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      {/* Animated gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 60%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

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
          {/* Central animation */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-10"
          >
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 m-auto w-40 h-40 rounded-full border-2 border-sky-200"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sky-500" />
            </motion.div>

            {/* Inner ring */}
            <motion.div
              className="absolute inset-0 m-auto w-28 h-28 rounded-full border-2 border-cyan-200"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-500" />
            </motion.div>

            {/* Center icon */}
            <motion.div
              className="relative w-40 h-40 mx-auto flex items-center justify-center"
              animate={isComplete ? { scale: [1, 1.1, 0.9] } : {}}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-sky-200"
                animate={!isComplete ? { rotate: [0, 3, -3, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-white"
                    >
                      <CheckCircle className="w-10 h-10" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                      transition={{ duration: 0.25 }}
                    >
                      {(() => {
                        const IconComponent = processingSteps[currentStep]?.icon || Brain;
                        return <IconComponent className="w-10 h-10 text-white" />;
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
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
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-slate-500 mb-6 text-sm"
              >
                {isComplete 
                  ? "Redirecting to results..."
                  : processingSteps[currentStep]?.label
                }
              </motion.p>
            </AnimatePresence>

            {/* Info badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span className="text-sm text-slate-600">Processing <span className="font-semibold">{questionCount}</span> questions</span>
            </div>

            {/* Progress bar */}
            <div className="max-w-sm mx-auto">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-500"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Processing</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Steps indicator */}
            <div className="mt-8 flex justify-center gap-2">
              {processingSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index <= currentStep
                      ? "bg-sky-500"
                      : "bg-slate-300"
                  }`}
                  animate={index === currentStep ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
