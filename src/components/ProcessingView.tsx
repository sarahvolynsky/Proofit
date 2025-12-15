import React, { useEffect, useState } from "react";
import { Loader2, Search, CheckCircle2, Wand2 } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { AnimatedProofitLogo } from "./AnimatedProofitLogo";

interface ProcessingViewProps {
  attachments?: string[];
  code?: string;
}

export function ProcessingView({ attachments, code }: ProcessingViewProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 600),   // Analyzing
      setTimeout(() => setStep(2), 1500),  // Reasoning
      setTimeout(() => setStep(3), 2200),  // Patching
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full w-full pb-20 bg-[#FAFCFD] px-4"
    >
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
        {/* Preview Section - Only show if there's content */}
        {((attachments && attachments.length > 0) || code) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-80 relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-b from-white/0 via-white/50 to-white/80 z-20 pointer-events-none rounded-xl" />
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
              {attachments && attachments.length > 0 ? (
                <div className="aspect-[4/3] bg-slate-50 relative">
                  <img src={attachments[0]} alt="Processing Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#E6602E]/5 mix-blend-overlay" />
                  
                  {/* Scanning Effect */}
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-[#E6602E] shadow-[0_0_10px_#E6602E] z-10 opacity-70"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-slate-50 p-4 relative overflow-hidden">
                  <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap break-all opacity-70 leading-relaxed">
                    {code?.slice(0, 500)}
                    {code && code.length > 500 && "..."}
                  </pre>
                  {/* Scanning Effect */}
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-px bg-[#E6602E] shadow-[0_0_8px_#E6602E] z-10 opacity-50"
                  />
                </div>
              )}
              
              <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source</span>
                 <div className="flex items-center gap-1.5">
                   <div className="size-1.5 rounded-full bg-[#E6602E] animate-pulse" />
                   <span className="text-[10px] font-medium text-[#E6602E]">Scanning</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Steps Section */}
        <div className="flex flex-col items-center">
          {/* Animated Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-16 mb-10 relative"
          >
            <AnimatedProofitLogo />
          </motion.div>

          {/* Analyzing Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 text-center"
          >
            <h2 className="text-sm font-semibold text-[#32404F] mb-1">Analyzing Design</h2>
            <p className="text-xs text-slate-400">Running critique agent...</p>
          </motion.div>

          <div className="flex flex-col gap-1 w-64">
            <StepItem label="Extracting tokens" status={step > 0 ? "done" : step === 0 ? "active" : "waiting"} index={0} />
            <StepItem label="Checking 8pt scale" status={step > 1 ? "done" : step === 1 ? "active" : "waiting"} index={1} />
            <StepItem label="Prioritizing" status={step > 2 ? "done" : step === 2 ? "active" : "waiting"} index={2} />
            <StepItem label="Patching code" status={step === 3 ? "active" : "waiting"} index={3} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepItem({ label, status, index }: { label: string, status: "waiting" | "active" | "done", index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -5 }}
      animate={{ 
        opacity: status === "waiting" ? 0.3 : 1,
        x: 0,
      }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "flex items-end justify-between py-1 text-xs font-mono font-medium tracking-wide w-full",
        status === "active" ? "text-[#E6602E]" : status === "done" ? "text-slate-400" : "text-slate-300"
      )}
    >
      <span className={cn(status === "done" && "line-through")}>{label}</span>
      <div className="flex-1 mx-2 border-b border-dashed border-slate-200 mb-1 opacity-50" />
      <span className="text-[10px] font-semibold">
        {status === "active" ? "PROCW" : status === "done" ? "DONE" : "WAIT"}
      </span>
    </motion.div>
  );
}