import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Search, ChevronDown, Grid3x3, List, MoreHorizontal } from "lucide-react";

interface ProjectsProps {
  onBack: () => void;
}

export function Projects({ onBack }: ProjectsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full h-full flex flex-col bg-[#F6F6F6] overflow-y-auto">
      {/* Header */}
      <div className="w-full bg-[#F6F6F6]">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#32404F]">
                Projects
              </h1>
              <button className="text-slate-400 hover:text-[#32404F] transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="w-full bg-[#F6F6F6]">
        <div className="max-w-[1400px] mx-auto px-8 pb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-shrink-0 w-[240px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200/50 rounded-md text-xs text-[#32404F] placeholder:text-slate-400 focus:outline-none focus:border-[#E6602E]/50 transition-colors"
              />
            </div>

            {/* Filters and View Toggle */}
            <div className="flex items-center gap-2">
              {/* Last edited */}
              <button className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#32404F] bg-white border border-slate-200/50 rounded-md hover:border-slate-300 transition-colors">
                <span>Last edited</span>
                <ChevronDown size={12} />
              </button>

              {/* Any visibility */}
              <button className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#32404F] bg-white border border-slate-200/50 rounded-md hover:border-slate-300 transition-colors">
                <span>Any visibility</span>
                <ChevronDown size={12} />
              </button>

              {/* Any status */}
              <button className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#32404F] bg-white border border-slate-200/50 rounded-md hover:border-slate-300 transition-colors">
                <span>Any status</span>
                <ChevronDown size={12} />
              </button>

              {/* All creators */}
              <button className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[#32404F] bg-white border border-slate-200/50 rounded-md hover:border-slate-300 transition-colors">
                <span>All creators</span>
                <ChevronDown size={12} />
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-0.5 ml-2 bg-white border border-slate-200/50 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#F6F6F6] text-[#32404F]'
                      : 'text-slate-400 hover:text-[#32404F]'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#F6F6F6] text-[#32404F]'
                      : 'text-slate-400 hover:text-[#32404F]'
                  }`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-[1400px] mx-auto px-8 py-2 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create New Project Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="group cursor-pointer"
            onClick={onBack}
          >
            <div className="relative aspect-[4/3] bg-white border-2 border-dashed border-slate-200 rounded-xl overflow-hidden hover:border-[#E6602E]/50 transition-colors">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-[#E6602E]/10 transition-colors">
                  <Plus size={24} className="text-slate-400 group-hover:text-[#E6602E] transition-colors" strokeWidth={2} />
                </div>
              </div>
            </div>
            <div className="mt-3 px-1">
              <div className="text-sm font-medium text-slate-500 group-hover:text-[#32404F] transition-colors">
                Create new project
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}