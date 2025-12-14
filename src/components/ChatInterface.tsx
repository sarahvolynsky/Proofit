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
  onSendMessage: (msg: string) => void;
  goal: Goal;
  onReset: () => void;
}

export function ChatInterface({ messages, onSendMessage, goal, onReset }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
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

  return (
    <div className="flex flex-col h-full bg-[#F6F6F6] relative overflow-hidden">
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
            <div className="flex items-center gap-2 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-full px-2 py-2 border border-slate-100 transition-all focus-within:shadow-[0_8px_25px_rgb(0,0,0,0.05)]">
               
               {/* Left Actions */}
               <button 
                 className="flex-none size-10 flex items-center justify-center rounded-full text-slate-400 hover:text-[#32404F] hover:bg-slate-50 transition-all focus:outline-none"
                 title="Attach file"
               >
                 <Paperclip size={18} strokeWidth={2} />
               </button>

               {/* Text Area */}
               <textarea 
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
                    disabled={!input.trim()}
                    className={cn(
                      "size-8 rounded-full text-white flex items-center justify-center transition-all shadow-sm hover:shadow focus:outline-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                      input.trim() 
                        ? "bg-[#E6602E] hover:bg-[#cc5529]" 
                        : "bg-[#32404F] hover:bg-[#25303b]"
                    )}
                  >
                    <ArrowUp size={16} strokeWidth={2.5} />
                  </button>
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
                className="max-w-full h-auto max-h-[400px] object-contain"
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