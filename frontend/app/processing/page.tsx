"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Brain, Sparkles, Database, FileCheck, Lock, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const processingSteps = [
  { icon: Database, label: "Loading questionnaire data", duration: 1500 },
  { icon: Brain, label: "Analyzing question context", duration: 2000 },
  { icon: Lock, label: "Matching security policies", duration: 2500 },
  { icon: Sparkles, label: "Generating AI responses", duration: 3000 },
  { icon: FileCheck, label: "Calculating confidence scores", duration: 1500 },
  { icon: Zap, label: "Finalizing results", duration: 1000 },
];

export default function ProcessingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Check if we have questions
    const stored = localStorage.getItem("secureOS_questions");
    if (!stored) {
      router.push("/upload");
      return;
    }

    let totalDuration = 0;
    const totalTime = processingSteps.reduce((acc, step) => acc + step.duration, 0);

    // Progress through steps
    const stepTimeouts: NodeJS.Timeout[] = [];
    
    processingSteps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index);
      }, totalDuration);
      stepTimeouts.push(timeout);
      totalDuration += step.duration;
    });

    // Smooth progress bar
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

    // Complete and navigate
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
                <span>Processing</span>
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
