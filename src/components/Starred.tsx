import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Search, ChevronDown, Grid3x3, List, MoreHorizontal, Star } from "lucide-react";

interface StarredProps {
  onBack: () => void;
}

export function Starred({ onBack }: StarredProps) {
  return (
    <div className="w-full h-full flex flex-col bg-[#F6F6F6] overflow-y-auto">
      {/* Header */}
      <div className="w-full bg-[#F6F6F6]">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <h1 className="text-xl font-medium text-[#32404F]">
            Starred
          </h1>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Star size={56} className="text-slate-300 mx-auto" strokeWidth={1.5} />
          </div>
          <h2 className="text-[#32404F] mb-3">
            Star chats to access them quickly from any workspace
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Keep your most important conversations organized and easy to find
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-[#32404F] hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            Browse chats
          </button>
        </div>
      </div>
    </div>
  );
}