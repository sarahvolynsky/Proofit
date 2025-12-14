import React, { useState } from "react";
import { 
  LayoutGrid, Plus, Layers, User, 
  Search, PanelLeft, History, Sparkles,
  Home, Folder, Star, Users, Compass, Book, Settings, ChevronDown, Command,
  FileText, ShieldCheck, Palette, MessageSquare, Gift, Zap
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { ChatSession } from "../lib/agent";
import { ProofitLogo } from "./ProofitLogo";
import profileImage from "figma:asset/b392a768eb6822970f69608f642904a39287ff75.png";

interface LayoutProps {
  children: React.ReactNode;
  chatSessions?: ChatSession[];
  currentSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
  onProjects?: () => void;
  onStarred?: () => void;
  isProjectsView?: boolean;
  isStarredView?: boolean;
}

export function Layout({ 
  children, 
  chatSessions = [], 
  currentSessionId, 
  onSelectSession,
  onNewChat,
  onProjects,
  onStarred,
  isProjectsView,
  isStarredView
}: LayoutProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [logoHovered, setLogoHovered] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#FAFCFD] text-[#32404F] font-sans overflow-hidden selection:bg-[#E6602E] selection:text-white">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isExpanded ? 240 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full border-r border-slate-100 flex flex-col z-40 bg-[#FAFCFD] relative flex-shrink-0"
      >
        {/* Header (Sticky) */}
        <div className="flex-none">
          <div className="h-12 flex items-center justify-center px-4">
             {isExpanded ? (
               <div className="flex items-center gap-3 overflow-hidden w-full">
                 {/* Logo Icon */}
                 <div className="size-6 flex items-center justify-center flex-shrink-0">
                    <ProofitLogo />
                 </div>
                 <button 
                   onClick={() => setIsExpanded(false)}
                   className="text-slate-400 hover:text-[#32404F] transition-colors ml-auto"
                 >
                   <PanelLeft size={18} strokeWidth={1.5} />
                 </button>
               </div>
             ) : (
               <div className="relative">
                 <button
                   onClick={() => {
                     setIsExpanded(true);
                     setLogoHovered(false);
                   }}
                   onMouseEnter={() => setLogoHovered(true)}
                   onMouseLeave={() => setLogoHovered(false)}
                   className="flex items-center justify-center transition-all w-6 h-6 cursor-pointer hover:cursor-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22><path d=%22M5 12h14m-7-7 7 7-7 7%22/></svg>'),_pointer]"
                 >
                   {!logoHovered ? (
                     <ProofitLogo />
                   ) : (
                     <PanelLeft size={18} strokeWidth={1.5} className="text-slate-600" />
                   )}
                 </button>
                 
                 {logoHovered && (
                   <div className="absolute left-full ml-[22px] top-1/2 -translate-y-1/2 bg-white text-slate-600 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap z-50 shadow-md border border-slate-200">
                     Open sidebar
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* Fixed Nav Items */}
          <div className="px-3 flex flex-col gap-1 mt-5">
             <NavItem 
               icon={<Home />} 
               label="Home" 
               active={!currentSessionId && !isProjectsView && !isStarredView} 
               expanded={isExpanded} 
               onClick={() => {
                 if (!isExpanded) setIsExpanded(true);
                 onNewChat?.();
               }} 
             />
             <NavItem 
               icon={<Search />} 
               label="Search" 
               expanded={isExpanded} 
               onClick={() => !isExpanded && setIsExpanded(true)}
             />

          </div>
        </div>

        {/* Scrollable Content (Your Chats) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-3 flex flex-col gap-1 custom-scrollbar min-h-0">
          
          <NavItem 
            icon={<LayoutGrid />} 
            label="All Projects" 
            active={isProjectsView}
            expanded={isExpanded} 
            onClick={() => {
              if (!isExpanded) setIsExpanded(true);
              onProjects?.();
            }}
          />
          
          <NavItem 
            icon={<Star />} 
            label="Starred" 
            active={isStarredView}
            expanded={isExpanded} 
            onClick={() => {
              if (!isExpanded) setIsExpanded(true);
              onStarred?.();
            }}
          />
          
          {isExpanded && (
            <button 
              onClick={() => setChatsOpen(!chatsOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-[#32404F] transition-colors group mt-2"
            >
              <span>Your chats</span>
              <ChevronDown size={14} className={cn("transition-transform", !chatsOpen && "-rotate-90")} />
            </button>
          )}

          <AnimatePresence initial={false}>
            {chatsOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-0.5 overflow-hidden"
              >
                {chatSessions.length === 0 && isExpanded && (
                  <div className="px-3 py-2 text-xs text-slate-400 italic">No chats yet</div>
                )}
                {chatSessions.map(session => (
                  <NavItem 
                    key={session.id}
                    icon={<MessageSquare />} 
                    label={session.title || "Untitled Chat"} 
                    active={currentSessionId === session.id}
                    expanded={isExpanded} 
                    onClick={() => {
                      if (!isExpanded) setIsExpanded(true);
                      onSelectSession?.(session.id);
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer (Fixed) */}
        <div className="flex-none p-3 mb-2 bg-[#FAFCFD] border-t border-slate-100">
           {isExpanded && (
             <div className="space-y-2 mb-3">
               {/* Share Proofit Button */}
               <button className="w-full bg-white hover:bg-slate-50 transition-colors rounded-lg p-3 flex items-center justify-between border border-slate-200 hover:border-slate-300">
                 <div className="flex flex-col items-start">
                   <span className="text-sm font-medium text-[#32404F]">Share Proofit</span>
                   <span className="text-xs text-slate-400">Get 10 credits each</span>
                 </div>
                 <Gift size={18} className="text-slate-400" strokeWidth={1.5} />
               </button>

               {/* Upgrade to Business Button */}
               <button className="w-full bg-white hover:bg-slate-50 transition-colors rounded-lg p-3 flex items-center justify-between border border-slate-200 hover:border-slate-300">
                 <div className="flex flex-col items-start">
                   <span className="text-sm font-medium text-[#32404F]">Upgrade to Business</span>
                   <span className="text-xs text-slate-400">Unlock more benefits</span>
                 </div>
                 <Zap size={18} className="text-slate-400" strokeWidth={1.5} />
               </button>
             </div>
           )}
           
           <div className={cn("flex items-center", isExpanded ? "px-3 gap-3" : "justify-center")}>
              <div className="size-8 rounded-full overflow-hidden border border-slate-200 flex-shrink-0">
                <img src={profileImage} alt="Profile" className="size-full object-cover" />
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                   <motion.div 
                     initial={{ opacity: 0, width: 0 }}
                     animate={{ opacity: 1, width: "auto" }}
                     exit={{ opacity: 0, width: 0 }}
                     className="flex-1 overflow-hidden whitespace-nowrap"
                   >
                      <div className="text-sm font-medium text-[#32404F] truncate">Sarah</div>
                      <div className="text-xs text-slate-400 truncate">Free Plan</div>
                   </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#FAFCFD]">
        <div className="flex-1 relative overflow-auto">
           {children}
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ label, expanded }: { label: string, expanded: boolean }) {
  if (!expanded) return <div className="h-4" />; // Spacer when collapsed
  
  return (
    <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-2 mb-1 animate-in fade-in duration-300">
      {label}
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active, 
  expanded, 
  onClick, 
  shortcut,
  badge 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  expanded: boolean, 
  onClick?: () => void,
  shortcut?: string,
  badge?: string
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
      "flex items-center transition-all duration-300 group relative w-full rounded-lg min-h-[36px]",
      expanded ? "px-3 py-2 gap-3" : "py-2 justify-center",
      active ? "bg-slate-100 text-[#32404F] shadow-[0_4px_20px_rgb(0,0,0,0.02)]" : "text-slate-500 hover:bg-slate-50 hover:text-[#32404F]"
    )}>
      <div className={cn("transition-colors flex-shrink-0", active ? "text-[#32404F]" : "text-slate-500 group-hover:text-[#32404F]")}>
        {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 1.5 })}
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
          >
            <span className="text-sm font-medium">{label}</span>
            
            {shortcut && (
               <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 group-hover:border-slate-300 transition-colors">{shortcut}</span>
            )}
            
            {badge && (
               <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{badge}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}