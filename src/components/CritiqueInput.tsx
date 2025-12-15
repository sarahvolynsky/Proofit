import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, CornerDownLeft, X, PenTool, Users, MonitorSmartphone, Check } from "lucide-react";
import { Goal } from "../lib/agent";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import proofitBackgroundUrl from "../assets/proofitbackground.svg?url";

interface CritiqueInputProps {
  code: string;
  setCode: (code: string) => void;
  goal: Goal;
  setGoal: (goal: Goal) => void;
  attachments: string[];
  setAttachments: (attachments: string[]) => void;
  onSubmit: (audience?: string | null, platform?: string | null) => void;
}

export function CritiqueInput({ code, setCode, goal, setGoal, attachments, setAttachments, onSubmit }: CritiqueInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audienceDropdownOpen, setAudienceDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isFetchingFigma, setIsFetchingFigma] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'projects'>('recent');
  const [isDragging, setIsDragging] = useState(false);

  const audiences = [
    { value: 'consumer', label: 'Consumer SaaS' },
    { value: 'enterprise', label: 'Enterprise / Admin' },
    { value: 'developer', label: 'Developer Tool' },
    { value: 'marketing', label: 'Marketing / Landing Page' },
    { value: 'internal', label: 'Internal Tool' },
  ];

  const platforms = [
    { value: 'desktop', label: 'Desktop-first' },
    { value: 'mobile', label: 'Mobile-first' },
    { value: 'responsive', label: 'Responsive' },
    { value: 'app', label: 'App-like UI' },
  ];
  
  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const remainingSlots = 3 - attachments.length;
    const filesToAdd = imageFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length === 0) {
      if (attachments.length >= 3) {
        alert('Maximum 3 images allowed');
      } else {
        alert('Please select image files only');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    // Process all files and update state once all are loaded
    const loadPromises = filesToAdd.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(loadPromises)
      .then((newAttachments) => {
        setAttachments((prev) => [...prev, ...newAttachments]);
      })
      .catch((error) => {
        console.error('Error loading images:', error);
        alert('Error loading one or more images. Please try again.');
      });
    
    // Reset input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Cmd/Ctrl + A and other shortcuts - don't prevent default
    if (e.metaKey || e.ctrlKey) {
      // Let the browser handle these shortcuts naturally
      return;
    }
    
    // Only handle Enter for submission
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (code.trim() || attachments.length > 0) {
        onSubmit(selectedAudience, selectedPlatform);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check for Figma HTML content first
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    
    console.log('Paste event - HTML:', htmlData ? 'present' : 'none');
    console.log('Paste event - Text:', textData || 'none');
    
    // Figma copies include HTML with links to figma.com
    if (htmlData && htmlData.includes('figma.com')) {
      const figmaUrlRegex = /https?:\/\/(www\.)?figma\.com\/(file|design)\/[a-zA-Z0-9]+\/[^\s"<>]*/;
      const match = htmlData.match(figmaUrlRegex);
      
      if (match) {
        console.log('Found Figma URL in HTML:', match[0]);
        e.preventDefault();
        fetchFigmaDesign(match[0]);
        return;
      }
    }
    
    // Also check plain text for Figma URLs
    if (textData) {
      const figmaUrlRegex = /https?:\/\/(www\.)?figma\.com\/(file|design|proto)\/[a-zA-Z0-9]+/;
      const match = textData.match(figmaUrlRegex);
      
      if (match && !isFetchingFigma && attachments.length === 0) {
        console.log('Found Figma URL in text:', match[0]);
        e.preventDefault();
        fetchFigmaDesign(match[0]);
        return;
      }
    }

    // Handle image paste (when copying frame directly from Figma)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        console.log('Found image in paste, type:', item.type);
        e.preventDefault();
        const file = item.getAsFile();
        if (file && file.type.startsWith('image/') && attachments.length < 3) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setAttachments([...attachments, e.target?.result as string]);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const fetchFigmaDesign = async (url: string) => {
    setIsFetchingFigma(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4fd6c9f5/figma/fetch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Figma API error:', error);
        alert(error.error || 'Failed to fetch Figma design');
        return;
      }

      const data = await response.json();
      
      // Set the image as attachment if available
      if (data.imageUrl && attachments.length < 3) {
        setAttachments([...attachments, data.imageUrl]);
      }
      
      // Optionally update the prompt with file info
      if (data.fileName) {
        setCode(`Evaluate this Figma design: ${data.fileName}\n\n${code}`.trim());
      }
    } catch (error) {
      console.error('Error fetching Figma design:', error);
      alert('Failed to fetch Figma design. Please try again.');
    } finally {
      setIsFetchingFigma(false);
    }
  };

  const handleTextChange = (value: string) => {
    setCode(value);
    
    // Auto-detect Figma URLs
    const figmaUrlRegex = /https?:\/\/(www\.)?figma\.com\/(file|design)\/[a-zA-Z0-9]+/;
    const match = value.match(figmaUrlRegex);
    
    if (match && !isFetchingFigma && attachments.length === 0) {
      fetchFigmaDesign(match[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      alert('Please drop image files only');
      return;
    }
    
    const remainingSlots = 3 - attachments.length;
    if (remainingSlots === 0) {
      alert('Maximum 3 images allowed');
      return;
    }
    
    const filesToAdd = imageFiles.slice(0, remainingSlots);
    
    // Process all files and update state once all are loaded
    const loadPromises = filesToAdd.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(loadPromises)
      .then((newAttachments) => {
        setAttachments((prev) => [...prev, ...newAttachments]);
      })
      .catch((error) => {
        console.error('Error loading images:', error);
        alert('Error loading one or more images. Please try again.');
      });
  };
  
  return (
    <div className="w-full min-h-screen flex flex-col items-center relative z-10 overflow-y-auto overflow-x-hidden">
      
      {/* Background SVG - Fixed to viewport to ensure full coverage without cutoff */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${proofitBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100vw',
          height: '100vh',
          minHeight: '100vh',
          minWidth: '100vw'
        }}
      />

      {/* Hero Section with Input */}
      <div className="w-full min-h-screen flex flex-col items-center justify-center py-20">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 relative z-10"
        >
          <h1 className="text-4xl font-semibold tracking-[1.5px] text-[#32404F] mb-3">
            Proof your design.
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-3xl px-6 relative group z-10"
        >
          <div className={cn(
            "relative bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] transition-all focus-within:shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-white/60",
            isDragging && "border-[#E6602E] border-2 bg-[#E6602E]/5"
          )}>
            
            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="px-[14px] pt-[14px] pb-1 flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-slate-100 shadow-sm group/attachment select-none">
                    <img src={attachment} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button 
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all duration-200 cursor-pointer z-10 opacity-0 group-hover/attachment:opacity-100"
                    >
                        <X size={12} className="text-slate-600" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Text Area */}
            <textarea 
              value={code}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Ask Proofit for an evaluation..."
              className={cn(
                  "w-full bg-transparent border-none text-sm font-['Geist',_sans-serif] font-medium text-[#32404F] placeholder:text-slate-300 focus:outline-none focus:ring-0 resize-none leading-relaxed scrollbar-hide",
                  attachments.length > 0 ? "h-[54px] px-[14px] pt-[13px] pb-[14px]" : "h-[54px] px-[14px] pt-[11px] pb-[6px]"
              )}
              spellCheck={false}
              onSelect={(e) => {
                // Allow text selection
                e.stopPropagation();
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            {/* Bottom Toolbar */}
            <div className="px-[14px] pb-[6px] pt-2 flex items-center justify-between">
               
               {/* Left Actions */}
               <div className="flex items-center gap-4 relative">
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept="image/*"
                      multiple 
                  />
                  <button 
                    onClick={handleAttach}
                    className="flex items-center justify-center transition-colors focus:outline-none text-slate-400 hover:text-[#32404F]"
                    title="Attach file"
                  >
                    <Paperclip size={18} strokeWidth={2} />
                  </button>
                  
                  {/* Audience Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setAudienceDropdownOpen(!audienceDropdownOpen);
                        setPlatformDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-center transition-colors focus:outline-none",
                        selectedAudience ? "text-[#E6602E]" : "text-slate-400 hover:text-[#32404F]"
                      )}
                      title="Audience / Context"
                    >
                      <Users size={18} strokeWidth={2} />
                    </button>
                    
                    {audienceDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setAudienceDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-20">
                          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Audience / Context
                          </div>
                          {audiences.map((audience) => (
                            <button
                              key={audience.value}
                              onClick={() => {
                                setSelectedAudience(selectedAudience === audience.value ? null : audience.value);
                                setAudienceDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-[#32404F] hover:bg-slate-50 flex items-center justify-between transition-colors"
                            >
                              <span>{audience.label}</span>
                              {selectedAudience === audience.value && (
                                <Check size={14} className="text-[#E6602E]" strokeWidth={2.5} />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Platform Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setPlatformDropdownOpen(!platformDropdownOpen);
                        setAudienceDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-center transition-colors focus:outline-none",
                        selectedPlatform ? "text-[#E6602E]" : "text-slate-400 hover:text-[#32404F]"
                      )}
                      title="Platform / Breakpoint"
                    >
                      <MonitorSmartphone size={18} strokeWidth={2} />
                    </button>
                    
                    {platformDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setPlatformDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 z-20">
                          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Platform / Breakpoint
                          </div>
                          {platforms.map((platform) => (
                            <button
                              key={platform.value}
                              onClick={() => {
                                setSelectedPlatform(selectedPlatform === platform.value ? null : platform.value);
                                setPlatformDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-[#32404F] hover:bg-slate-50 flex items-center justify-between transition-colors"
                            >
                              <span>{platform.label}</span>
                              {selectedPlatform === platform.value && (
                                <Check size={14} className="text-[#E6602E]" strokeWidth={2.5} />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
               </div>

               {/* Right Submit */}
               <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-slate-300 select-none">
                     <span className="text-[11px] font-semibold">Enter</span>
                     <CornerDownLeft size={10} strokeWidth={2.5} />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Submit button clicked:', { 
                        hasText: !!code.trim(), 
                        textLength: code.trim().length,
                        attachmentCount: attachments.length,
                        canSubmit: code.trim() || attachments.length > 0
                      });
                      if (code.trim() || attachments.length > 0) {
                        console.log('Calling onSubmit...');
                        onSubmit(selectedAudience, selectedPlatform);
                      } else {
                        console.warn('Submit blocked: no text and no attachments');
                      }
                    }}
                    disabled={!code.trim() && attachments.length === 0}
                    type="button"
                    className="size-8 rounded-full bg-[#32404F] text-white flex items-center justify-center hover:bg-[#25303b] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow focus:outline-none active:scale-95"
                    title={(!code.trim() && attachments.length === 0) ? 'Enter text or attach images to submit' : 'Submit'}
                  >
                    <ArrowUp size={16} strokeWidth={2.5} />
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Critiques Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl px-6 relative z-10 -mt-[65px]"
      >
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-8">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-slate-100 pb-1">
            <button 
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === 'recent' ? "text-[#E6602E] border-b-2 border-[#E6602E] -mb-[1px]" : "text-slate-400 hover:text-[#32404F] transition-colors"
              )}
              onClick={() => setActiveTab('recent')}
            >
              Recent critiques
            </button>
            <button 
              className={cn(
                "px-4 py-2 text-sm font-medium",
                activeTab === 'projects' ? "text-[#E6602E] border-b-2 border-[#E6602E] -mb-[1px]" : "text-slate-400 hover:text-[#32404F] transition-colors"
              )}
              onClick={() => setActiveTab('projects')}
            >
              My projects
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-[250px]">
            {/* Card 1 */}
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden mb-3 border border-slate-200/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-slate-300 text-sm font-medium">Landing page critique</div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-semibold text-[#32404F]">
                  Reviewed
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="size-5 rounded-full bg-slate-200" />
                <span>Analyzed 2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}