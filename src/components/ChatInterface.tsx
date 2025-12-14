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
            <div className="mb-2 rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-full">
              <img 
                src={message.attachment} 
                alt="Attachment" 
                className="max-w-full h-auto max-h-[200px] object-contain"
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
              "inline-block text-sm leading-relaxed text-left whitespace-pre-wrap",
              isUser 
                ? "bg-[#E6602E] text-white rounded-3xl px-4 py-1 shadow-sm" 
                : "text-[#32404F] py-2"
            )}>
               {message.content as string}
            </div>
          )}
       </div>
    </motion.div>
  );
}