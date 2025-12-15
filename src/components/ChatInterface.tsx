import React, { useState, useRef, useEffect } from "react";
import { CritiqueResult, Goal, Message } from "../lib/agent";
import { AnalysisView } from "./CritiqueResults";
import { ArrowUp, User, Bot, RotateCcw, Code, Paperclip, Target, CornerDownLeft, X, Mic } from "lucide-react";
import Frame from "../imports/Frame4-6-59";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import Header from "../imports/Header";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (msg: string, attachment?: string) => void;
  goal: Goal;
  onReset: () => void;
  isProcessing?: boolean;
}

export function ChatInterface({ messages, onSendMessage, goal, onReset, isProcessing }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [isThinking]);

  // Turn off thinking when messages change (new agent message arrives)
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'agent') {
      setIsThinking(false);
    }
  }, [messages]);

  // Auto-show "Critiquing" indicator when first entering chat with only user message
  useEffect(() => {
    // If we have exactly 1 message and it's from the user, we're waiting for the first critique
    if (messages.length === 1 && messages[0].role === 'user') {
      setIsThinking(true);
    }
  }, [messages.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAttachment(result);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = () => {
    if (!input.trim() && !attachment) return;
    setIsThinking(true);
    onSendMessage(input, attachment || undefined);
    setInput("");
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl + A and other shortcuts
    if (e.metaKey || e.ctrlKey) {
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if we're actually leaving the drop zone
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const { clientX, clientY } = e;
    if (
      clientX <= rect.left ||
      clientX >= rect.right ||
      clientY <= rect.top ||
      clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      console.warn('Only image files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAttachment(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col h-full bg-[#F6F6F6] relative overflow-hidden"
    >
       {/* Drag and Drop Overlay */}
       {isDragging && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.2 }}
           className="absolute inset-0 z-50 bg-black/5 flex items-center justify-center"
         >
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.2 }}
             className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 flex flex-col items-center gap-3 w-[200px]"
           >
             <motion.div 
               animate={{ 
                 scale: [1, 1.05, 1],
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
               className="size-14 rounded-full bg-[#E6602E]/10 flex items-center justify-center"
             >
               <Paperclip size={24} className="text-[#E6602E]" strokeWidth={2.5} />
             </motion.div>
             <div className="text-center">
               <p className="font-semibold text-[#32404F] text-sm">Drop to attach</p>
               <p className="text-xs text-slate-500 mt-1">Image file</p>
             </div>
           </motion.div>
         </motion.div>
       )}

       {/* Header */}
       <div className="flex-none h-12 z-30">
          <Header />
       </div>

       {/* Messages */}
       <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative z-10">
          <motion.div 
             initial="hidden"
             animate="visible"
             variants={{
               hidden: { opacity: 0 },
               visible: {
                 opacity: 1,
                 transition: {
                   staggerChildren: 0.05,
                   delayChildren: 0.05
                 }
               }
             }}
             className="w-full max-w-3xl mx-auto px-6 pt-11 pb-[100px] md:px-0 space-y-8"
          >
             {messages.map((msg) => (
               <MessageItem key={msg.id} message={msg} />
             ))}
             
             {/* Thinking Indicator */}
             {isThinking && (() => {
               // Show "Critiquing" for the first message from home page, "Thinking" for subsequent messages
               const isCritiquing = messages.length === 1 || (messages.length === 2 && messages[0].role === 'user');
               const statusText = isCritiquing ? 'Critiquing' : 'Thinking';
               
               return (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   className="flex justify-start"
                 >
                   <div className="relative inline-flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-lg overflow-hidden">
                     {/* Shimmer effect */}
                     <motion.div
                       className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                       animate={{
                         x: ['-100%', '200%'],
                       }}
                       transition={{
                         duration: 1.5,
                         repeat: Infinity,
                         ease: "easeInOut",
                       }}
                     />
                     
                     {/* Text content */}
                     <span className="relative text-sm font-medium text-slate-500">
                       {statusText}
                     </span>
                     
                     {/* Chevron */}
                     <motion.svg
                       className="relative w-4 h-4 text-slate-400"
                       fill="none"
                       viewBox="0 0 24 24"
                       stroke="currentColor"
                       strokeWidth={2.5}
                       animate={{
                         x: [0, 3, 0],
                       }}
                       transition={{
                         duration: 1.5,
                         repeat: Infinity,
                         ease: "easeInOut",
                       }}
                     >
                       <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                     </motion.svg>
                   </div>
                 </motion.div>
               );
             })()}
             
             <div ref={messagesEndRef} />
          </motion.div>
       </div>
       
       {/* Fade mask to hide content below input bar */}
       <div className="absolute bottom-0 left-0 right-0 h-[112px] bg-gradient-to-t from-[#F6F6F6] via-[#F6F6F6] to-transparent pointer-events-none z-20" />
       
       {/* Input Area */}
       <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
         className="flex-none px-6 pt-0 pb-0 md:pb-0 md:px-0 absolute bottom-[30px] left-0 right-0 z-30 pointer-events-none flex justify-center"
       >
          <div className="w-full max-w-3xl relative pointer-events-auto">
            <div className={cn(
              "relative bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 transition-all focus-within:shadow-[0_8px_25px_rgb(0,0,0,0.05)]",
              attachment ? "rounded-[24px]" : "rounded-full"
            )}>
               
               {/* Attachment Preview Above Input */}
               {attachment && (
                 <div className="px-[14px] pt-[14px] pb-1">
                   <div className="relative group/attachment w-[72px] h-[72px] rounded-xl overflow-hidden border border-slate-100 shadow-sm select-none">
                     <img src={attachment} alt="Attachment" className="w-full h-full object-cover" />
                     <button 
                       onClick={() => setAttachment(null)}
                       className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all duration-200 cursor-pointer z-10 opacity-0 group-hover/attachment:opacity-100"
                     >
                       <X size={12} className="text-slate-600" strokeWidth={2.5} />
                     </button>
                   </div>
                 </div>
               )}

              <div className="flex items-center gap-2 px-2 py-2">
               {/* Hidden file input */}
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleFileSelect}
                 className="hidden"
               />

               {/* Left Actions */}
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex-none size-10 flex items-center justify-center rounded-full text-slate-400 hover:text-[#32404F] hover:bg-slate-50 transition-all focus:outline-none"
                 title="Attach file"
               >
                 <Paperclip size={18} strokeWidth={2} />
               </button>

               {/* Text Area */}
               <textarea 
                 ref={textareaRef}
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="Reply to Proofit..."
                 className="flex-1 bg-transparent border-none text-sm font-['Geist',_sans-serif] font-medium text-[#32404F] placeholder:text-slate-300 focus:outline-none focus:ring-0 resize-none h-10 py-2.5 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                 rows={1}
                 spellCheck={false}
               />

               {/* Right Submit */}
               <div className="flex items-center gap-2 pr-2">
                  <button 
                    className="size-8 rounded-full text-slate-400 hover:text-[#32404F] flex items-center justify-center transition-all hover:bg-slate-50 focus:outline-none active:scale-95"
                    title="Voice input"
                  >
                    <Mic size={18} strokeWidth={2} />
                  </button>
                  <button 
                    onClick={sendMessage}
                    disabled={!input.trim() && !attachment || isProcessing}
                    className={cn(
                      "size-8 rounded-full text-white flex items-center justify-center transition-all shadow-sm hover:shadow focus:outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                      input.trim() || attachment
                        ? "bg-[#E6602E] hover:bg-[#cc5529]" 
                        : "bg-[#32404F] hover:bg-[#25303b]"
                    )}
                  >
                    <ArrowUp size={16} strokeWidth={2.5} />
                  </button>
               </div>
              </div>
            </div>
          </div>
       </motion.div>
    </div>
  );
}

// Format plain text output - remove markdown and improve readability
function formatPlainText(text: string): string {
  // Remove markdown bold syntax (**text**)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  // Remove markdown italic syntax (*text*)
  text = text.replace(/\*([^*]+)\*/g, '$1');
  // Remove markdown headers (# ## ###)
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Remove markdown code blocks (```code```)
  text = text.replace(/```[\s\S]*?```/g, '');
  // Remove markdown inline code (`code`)
  text = text.replace(/`([^`]+)`/g, '$1');
  // Clean up multiple spaces
  text = text.replace(/  +/g, ' ');
  // Ensure proper line breaks
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

// Parse and format structured text with proper typography and hierarchy
function formatStructuredText(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let inIssue = false;
  let inFix = false;
  let inRecommendations = false;
  let currentIssueKey = '';

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ').trim();
      if (content) {
        elements.push(
          <div key={key} className="text-sm text-[#32404F] leading-relaxed mb-2">
            {content}
          </div>
        );
      }
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect section headers (numbered)
    if (trimmed.match(/^[0-9]\.\s/)) {
      flushParagraph(`para-${i}`);
      const sectionText = trimmed.replace(/^[0-9]\.\s/, '');
      
      if (sectionText.includes('Opening:')) {
        const openingText = sectionText.replace('Opening:', '').trim();
        elements.push(
          <div key={`opening-${i}`} className="text-xl font-semibold text-[#32404F] mb-6 leading-relaxed pb-4 border-b border-slate-200">
            {openingText}
          </div>
        );
      } else if (sectionText.includes("I'm evaluating:")) {
        elements.push(
          <div key={`evaluating-${i}`} className="text-base font-semibold text-[#32404F] mb-4 mt-6 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#E6602E] rounded-full"></div>
            <span>{sectionText}</span>
          </div>
        );
      } else if (sectionText.includes("What's failing")) {
        elements.push(
          <div key={`failing-${i}`} className="text-base font-semibold text-[#32404F] mb-5 mt-8 pt-6 border-t border-slate-200 flex items-center gap-2">
            <div className="w-1 h-5 bg-red-500 rounded-full"></div>
            <span>{sectionText}</span>
          </div>
        );
        inIssue = true;
        inRecommendations = false;
      } else if (sectionText.includes("How to improve")) {
        flushParagraph(`para-before-rec-${i}`);
        elements.push(
          <div key={`improve-${i}`} className="text-base font-semibold text-[#32404F] mb-4 mt-8 pt-6 border-t border-slate-200 flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            <span>{sectionText}</span>
          </div>
        );
        inRecommendations = true;
        inIssue = false;
        inFix = false;
      }
    } 
    // Priority issue header (P0 —, P1 —, P2 —)
    else if (trimmed.match(/^P[0-2]\s*[—–-]/)) {
      flushParagraph(`para-before-issue-${i}`);
      const priorityMatch = trimmed.match(/^(P[0-2])\s*[—–-]\s*(.+)/);
      if (priorityMatch) {
        const [, priority, title] = priorityMatch;
        const priorityConfig = priority === 'P0' 
          ? { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' }
          : priority === 'P1' 
          ? { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' }
          : { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' };
        currentIssueKey = `issue-${i}`;
        elements.push(
          <div key={currentIssueKey} className={`mb-6 pb-5 border-b border-slate-200 last:border-b-0 ${priorityConfig.bg} rounded-xl p-4 border ${priorityConfig.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${priorityConfig.badge}`}>
                {priority}
              </span>
              <div className={`text-base font-semibold ${priorityConfig.color} flex-1`}>
                {title}
              </div>
            </div>
          </div>
        );
        inIssue = true;
        inFix = false;
      }
    } 
    // Issue metadata labels
    else if (trimmed.match(/^(Description|User Impact|Design Principle Violation|Measurable consequences|Real-world examples):/)) {
      flushParagraph(`para-before-meta-${i}`);
      const match = trimmed.match(/^([^:]+):\s*(.+)/);
      if (match) {
        const [, label, content] = match;
        elements.push(
          <div key={`meta-${i}`} className="mb-3 pl-3 border-l-2 border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-sm text-[#32404F] leading-relaxed">{content}</div>
          </div>
        );
      }
    } 
    // Fix section header
    else if (trimmed.startsWith('Fix:')) {
      flushParagraph(`para-before-fix-${i}`);
      inFix = true;
      const fixContent = trimmed.replace(/^Fix:\s*/, '');
      elements.push(
        <div key={`fix-header-${i}`} className="mt-5 mb-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            Fix
          </div>
        </div>
      );
      if (fixContent) {
        currentParagraph.push(fixContent);
      }
    } 
    // Numbered list items
    else if (trimmed.match(/^\d+\.\s/)) {
      flushParagraph(`para-before-list-${i}`);
      const match = trimmed.match(/^(\d+)\.\s*(.+)/);
      if (match) {
        const [, num, content] = match;
        elements.push(
          <div key={`list-${i}`} className="text-sm text-[#32404F] leading-relaxed mb-3 flex items-start group">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center mr-3 mt-0.5 group-hover:bg-slate-200 transition-colors">
              {num}
            </span>
            <span className="flex-1 pt-0.5">{content}</span>
          </div>
        );
      }
    } 
    // Bullet points
    else if (trimmed.startsWith('- ')) {
      flushParagraph(`para-before-bullet-${i}`);
      const content = trimmed.replace(/^-\s/, '');
      
      if (inRecommendations) {
        // Recommendation items with label: description format
        const colonIndex = content.indexOf(':');
        if (colonIndex > 0) {
          const label = content.substring(0, colonIndex);
          const description = content.substring(colonIndex + 1).trim();
          elements.push(
            <div key={`rec-${i}`} className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-sm font-semibold text-[#32404F] mb-1">{label}</div>
              <div className="text-sm text-slate-600 leading-relaxed">{description}</div>
            </div>
          );
        } else {
          elements.push(
            <div key={`rec-${i}`} className="text-sm text-[#32404F] leading-relaxed ml-6 mb-2.5 flex items-start">
              <span className="text-blue-500 mr-3 mt-1.5 text-lg leading-none">•</span>
              <span className="flex-1 pt-0.5">{content}</span>
            </div>
          );
        }
      } else {
        elements.push(
          <div key={`bullet-${i}`} className="text-sm text-[#32404F] leading-relaxed ml-6 mb-2.5 flex items-start">
            <span className="text-slate-400 mr-3 mt-1.5 text-lg leading-none">•</span>
            <span className="flex-1 pt-0.5">{content}</span>
          </div>
        );
      }
    } 
    // Empty line
    else if (trimmed === '') {
      flushParagraph(`para-${i}`);
      if (!inIssue && !inFix && !inRecommendations) {
        elements.push(<div key={`spacer-${i}`} className="h-3" />);
      }
    } 
    // Regular text content
    else {
      // Skip if it's a continuation of fix content that should be in a list
      if (inFix && trimmed.match(/^\d+\./)) {
        // This will be caught by the numbered list handler
        continue;
      }
      currentParagraph.push(trimmed);
    }
  }

  // Flush any remaining paragraph
  flushParagraph('final-para');

  return <div className="space-y-1">{elements}</div>;
}

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  }
};

function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  if (message.type === 'critique') {
     const result = message.content as CritiqueResult;
     
     return (
       <motion.div variants={messageVariants} className="flex justify-start w-full">
          <div className="flex flex-col w-full items-start">
             {/* Show attachment image if present with critique */}
             {message.attachment && (
               <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-full cursor-pointer hover:shadow-md transition-shadow">
                 <img 
                   src={message.attachment} 
                   alt="Design being critiqued" 
                   className="max-w-full h-auto max-h-[400px] md:max-h-[500px] object-contain bg-slate-50"
                   onClick={(e) => {
                     // Open image in new tab/window for full view
                     const newWindow = window.open();
                     if (newWindow) {
                       newWindow.document.write(`
                         <html>
                           <head><title>Image Preview</title></head>
                           <body style="margin:0;padding:20px;background:#f6f6f6;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                             <img src="${message.attachment}" style="max-width:100%;max-height:95vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.1);" alt="Full size image" />
                           </body>
                         </html>
                       `);
                     }
                   }}
                 />
               </div>
             )}
             <div className="text-[#32404F] text-left w-full">
                <AnalysisView result={result} />
             </div>
          </div>
       </motion.div>
     );
  }

  return (
    <motion.div 
      variants={messageVariants}
      className={cn(
        "flex", 
        isUser ? "justify-end" : "justify-start"
    )}>
       <div className={cn("flex flex-col max-w-[70%]", isUser ? "items-end" : "items-start")}>
          {/* Show attachment image if present */}
          {message.attachment && (
            <div className="mb-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-full cursor-pointer hover:shadow-md transition-shadow group/image">
              <img 
                src={message.attachment} 
                alt="Attachment" 
                className="max-w-full h-auto max-h-[400px] md:max-h-[500px] object-contain bg-slate-50"
                onClick={(e) => {
                  // Open image in new tab/window for full view
                  const newWindow = window.open();
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head><title>Image Preview</title></head>
                        <body style="margin:0;padding:20px;background:#f6f6f6;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                          <img src="${message.attachment}" style="max-width:100%;max-height:95vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.1);" alt="Full size image" />
                        </body>
                      </html>
                    `);
                  }
                }}
              />
            </div>
          )}
          
          {message.type === 'code' ? (
            <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-4 text-left inline-block max-w-full">
               <pre className="text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap break-all max-h-60 custom-scrollbar">
                 {message.content as string}
               </pre>
            </div>
          ) : (
            <div className={cn(
              "text-left max-w-full",
              isUser 
                ? "inline-block bg-[#E6602E] text-white rounded-3xl px-4 py-2 shadow-sm whitespace-pre-wrap text-sm leading-relaxed" 
                : "w-full"
            )}>
               {isUser ? (
                 <div className="font-sans whitespace-pre-wrap">
                   {formatPlainText(message.content as string)}
                 </div>
               ) : (
                 <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 font-sans">
                   {formatStructuredText(formatPlainText(message.content as string))}
                 </div>
               )}
            </div>
          )}
       </div>
    </motion.div>
  );
}