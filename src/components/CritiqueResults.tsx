import React, { useState } from "react";
import { CritiqueResult } from "../lib/agent";
import { ArrowLeft, Copy, AlertTriangle, Zap, Flame, Shield, Activity, Layers, Wand2 } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

interface CritiqueResultsProps {
  result: CritiqueResult;
  originalCode: string;
  onReset: () => void;
}

export function CritiqueResults({ result, originalCode, onReset }: CritiqueResultsProps) {
  const [view, setView] = useState<"analysis" | "patches">("analysis");
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // Helper to extract snippets for copy
  const getPatchesContent = () => {
    return result.patches.react_snippets.map(s => `// ${s.title}\n${s.snippet}`).join("\n\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPatchesContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePrompt = () => {
     const issuesList = result.issues.map((issue, i) => 
        `${i+1}. [${issue.severity}] ${issue.title} (${issue.category.toUpperCase()})
   Problem: ${issue.problem}
   Fix Steps:
${issue.fix_steps.map((step, idx) => `      ${idx + 1}. ${step}`).join('\n')}`
     ).join("\n\n");
  
     return `You are an expert frontend developer and designer. I need you to apply design critique feedback to improve my React/Tailwind codebase.

CRITIQUE SUMMARY:
${result.roast.one_liner}

OVERALL SCORES:
• Visual Design: ${result.scores.visual_design}/10
• UX Clarity: ${result.scores.ux_clarity}/10
• Code Quality: ${result.scores.code_quality}/10
• Accessibility: ${result.scores.accessibility}/10

ISSUES TO ADDRESS (${result.issues.length} total):

${issuesList}

REQUIREMENTS:
1. Apply all the fix steps listed above to the code
2. Maintain the existing design language and component structure
3. Use Tailwind CSS utility classes following best practices
4. Ensure all changes improve accessibility and code quality
5. Provide the complete updated code with clear comments explaining changes

Please generate the improved React and Tailwind code now.`;
  };

  const handleCopyPrompt = () => {
     navigator.clipboard.writeText(generatePrompt());
     setPromptCopied(true);
     setTimeout(() => setPromptCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-[#FAFCFD]"
    >
      {/* Results Header */}
      <div className="flex-none px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-[#FAFCFD]">
        <div className="flex items-center gap-6">
          <button 
            onClick={onReset}
            className="text-slate-400 hover:text-[#32404F] transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-[#32404F] tracking-tight">Analysis Report</h2>
            <div className="flex items-center gap-2 text-[10px] uppercase font-semibold tracking-wider text-slate-500 mt-1">
              <span>Score: {result.scores.overall}/100</span>
              <span>•</span>
              <span>{result.issues.length} Issues</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
           <button 
             onClick={() => setView("analysis")}
             className={cn(
               "px-4 py-1.5 text-[10px] uppercase tracking-wider font-semibold transition-all rounded-md",
               view === "analysis" ? "bg-[#E6602E]/10 text-[#E6602E]" : "text-slate-500 hover:text-slate-700"
             )}
           >
             Analysis
           </button>
           <button 
             onClick={() => setView("patches")}
             className={cn(
               "px-4 py-1.5 text-[10px] uppercase tracking-wider font-semibold transition-all rounded-md",
               view === "patches" ? "bg-[#E6602E]/10 text-[#E6602E]" : "text-slate-500 hover:text-slate-700"
             )}
           >
             Patches
           </button>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setPromptOpen(true)}
             className="text-xs font-semibold text-[#32404F] border border-slate-200 px-4 py-2 hover:bg-white hover:border-[#E6602E] transition-all flex items-center gap-2 rounded-lg bg-white shadow-sm"
           >
             <Wand2 size={14} />
             Get Fix Prompt
           </button>
           <button 
             onClick={handleCopy}
             className="text-xs font-semibold text-[#32404F] border border-slate-200 px-4 py-2 hover:bg-white hover:border-[#E6602E] transition-all flex items-center gap-2 rounded-lg bg-white shadow-sm"
           >
             {copied ? "Copied" : "Copy Patches"}
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex relative bg-[#FAFCFD]">
        <AnimatePresence mode="wait">
          {view === "analysis" ? (
             <motion.div 
               key="analysis"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.2 }}
               className="w-full h-full overflow-y-auto"
             >
                <div className="p-8 max-w-4xl mx-auto">
                   <AnalysisView result={result} />
                </div>
             </motion.div>
          ) : (
             <motion.div 
               key="patches"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.2 }}
               className="w-full h-full"
             >
                <PatchesView patches={result.patches} />
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
         <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
               <DialogTitle>AI Fix Prompt</DialogTitle>
               <DialogDescription>
                  Copy this prompt and paste it into your favorite coding assistant (Claude, ChatGPT, etc.) to apply the fixes.
               </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden bg-slate-50 rounded-lg border border-slate-200 p-4 relative group">
               <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap overflow-y-auto h-full custom-scrollbar">
                  {generatePrompt()}
               </pre>
               <button 
                  onClick={handleCopyPrompt}
                  className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
               >
                  {promptCopied ? <span className="text-[10px] font-bold text-green-600">Copied!</span> : <Copy size={14} />}
               </button>
            </div>
         </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export function AnalysisView({ result }: { result: CritiqueResult }) {
  return (
    <div className="w-full space-y-6">
      
      {/* Roast & Tags */}
      <div className="relative space-y-2">
         <p className="text-[#32404F] text-lg font-medium leading-relaxed">
            {result.roast.one_liner}
         </p>
         <div className="flex flex-wrap gap-1.5">
            {result.roast.vibe_tags.map(tag => (
               <span key={tag} className="text-[9px] uppercase font-bold tracking-wider text-slate-500 bg-transparent">
                  #{tag}
               </span>
            ))}
         </div>
      </div>

      {/* Scores - Compact Inline */}
      <div className="flex items-center gap-6 text-xs">
         {[
            { label: "Visual", score: result.scores.visual_design },
            { label: "UX", score: result.scores.ux_clarity },
            { label: "Code", score: result.scores.code_quality },
            { label: "Security", score: result.scores.accessibility }
         ].map(({ label, score }) => (
            <div key={label} className="flex items-baseline gap-1.5">
               <span className="text-slate-500 font-medium">{label}</span>
               <span className="text-lg font-bold text-[#32404F]">{score}<span className="text-xs text-slate-400 font-normal">/10</span></span>
            </div>
         ))}
      </div>

      {/* Issues List - Compact */}
      <div className="space-y-4 pt-2">
         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detected Issues</h3>
         <div className="space-y-5">
           {result.issues.map((issue) => (
              <div key={issue.id} className="space-y-2">
                 <div className="flex items-start gap-2">
                    <span className={cn(
                      "flex-none size-1.5 rounded-full mt-1.5",
                      issue.severity === "P0" ? "bg-red-500" : (issue.severity === "P1" ? "bg-orange-500" : "bg-yellow-500")
                    )} />
                    <div className="flex-1 min-w-0">
                       <div className="flex items-baseline gap-2 mb-0.5">
                          <h4 className="text-[#32404F] font-bold">{issue.title}</h4>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                            {issue.category}
                          </span>
                       </div>
                       <p className="text-slate-600 leading-relaxed">{issue.problem}</p>
                    </div>
                 </div>
                 
                 {/* Fix Steps - Compact */}
                 {issue.fix_steps.length > 0 && (
                    <div className="ml-3.5 pl-3 border-l border-slate-200 space-y-1">
                       <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Fix Steps</span>
                       {issue.fix_steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-slate-600">
                             <span className="text-[#E6602E] font-bold select-none flex-none">{idx + 1}.</span>
                             <span className="flex-1">{step}</span>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           ))}
         </div>
      </div>
    </div>
  );
}

export function PatchesView({ patches }: { patches: CritiqueResult['patches'] }) {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFCFD] p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {patches.react_snippets.map((snippet, i) => (
           <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <span className="text-xs font-bold text-[#32404F]">{snippet.title}</span>
                 <span className="text-[10px] uppercase font-semibold text-slate-400">{snippet.language}</span>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap break-all custom-scrollbar bg-white">
                 {snippet.snippet}
              </pre>
           </div>
        ))}

        {patches.tailwind_class_swaps.length > 0 && (
           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#32404F] mb-4">Class Updates</h3>
              <div className="space-y-2">
                 {patches.tailwind_class_swaps.map((swap, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center text-xs border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                       <code className="text-red-500 bg-red-50 px-2 py-1 rounded">{swap.from}</code>
                       <span className="text-slate-300">→</span>
                       <code className="text-green-600 bg-green-50 px-2 py-1 rounded">{swap.to}</code>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
