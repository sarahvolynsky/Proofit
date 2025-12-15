# Proofit 🎨

**A Design Critique Agent for Modern Web Interfaces**

Proofit is an AI-powered design critique tool that provides expert-level feedback on UI/UX designs, focusing exclusively on visual design and user experience issues—not code quality or security issues that IDEs already handle.

---

## 🎯 **Core Philosophy**

> "Stronger than ChatGPT's UI/UX roasts."

Proofit delivers **brutal but constructive** design critiques with:
- ✅ Specific, actionable feedback (exact Tailwind classes, not vague suggestions)
- ✅ Design theory-backed recommendations (8pt grid, Don Norman's principles, WCAG standards)
- ✅ Honest scoring (calls out real issues with 6/10 instead of inflated 9/10)
- ✅ Sharp but fair tone—professional expertise, not meanness

---

## 🚀 **Key Features**

### **1. Design-Focused Critique**
- **Visual Design Score** (typography, spacing, color)
- **UX Clarity Score** (affordance, hierarchy, interaction design)
- Excludes Code Quality & Security (leave that to Cursor/IDEs)

### **2. Comprehensive Analysis**
- **P0/P1/P2 Issue Prioritization** - Ranked by impact
- **One-Liner Roast** - Memorable, accurate summary of design problems
- **Evidence-Based Findings** - Metrics on spacing inconsistency, type scale, color usage
- **Design Principles** - References to 8pt grid, WCAG AA, affordance theory

### **3. Actionable Fix Steps**
- **Exact Tailwind class replacements** (e.g., `p-[13px]` → `p-4`)
- **Step-by-step instructions** for each issue
- **"Get Fix Prompt" Feature** - One-click copy of LLM-ready fix instructions
- **Quick Wins** - 5-minute fixes that make immediate impact

### **4. Intelligent Context Awareness**
- **Audience/Context Selector** (e.g., "Gen Z, Marketing Site")
- **Platform/Breakpoint Selector** (Desktop 1440px, Mobile 375px, etc.)
- **Goal-Oriented Analysis** (Conversion, Premium Feel, Utility, Consistency)

### **5. Clean Conversational UI**
- **Linear chat interface** (no chat bubbles, critiques embedded in stream)
- **Glassmorphic input component** with subtle backdrop blur
- **Collapsible sidebar** with chat history
- **Image attachment support** (drag-and-drop or paste)

---

## 🏗️ **Architecture**

### **Frontend-Only MVP**
Proofit is currently a **100% frontend application** with:
- ❌ No API calls
- ❌ No Supabase/database integration
- ❌ No edge functions
- ✅ Mock critique data demonstrating the full user flow
- ✅ Focus on UX/UI demonstration

### **Technology Stack**

| Layer | Technology |
|-------|-----------|
| **Framework** | React + TypeScript |
| **Styling** | Tailwind CSS v4.0 |
| **Animations** | Motion (formerly Framer Motion) |
| **UI Components** | shadcn/ui primitives |
| **Icons** | Lucide React |
| **Build Tool** | Vite |

---

## 📁 **Project Structure**

```
/
├── App.tsx                          # Main application with routing logic
├── main.tsx                         # Entry point
├── styles/globals.css               # Global Tailwind config + custom scrollbar
│
├── components/
│   ├── Layout.tsx                   # Sidebar + main content wrapper
│   ├── CritiqueInput.tsx            # Home page with dropdowns + glassmorphic input
│   ├── ProcessingView.tsx           # Animated loading state
│   ├── ChatInterface.tsx            # Critique conversation view
│   ├── CritiqueResults.tsx          # Formatted critique display (scores, issues, roast)
│   ├── Projects.tsx                 # Projects placeholder view
│   ├── Starred.tsx                  # Starred chats placeholder view
│   ├── ProofitLogo.tsx              # Brand logo SVG component
│   ├── AnimatedProofitLogo.tsx      # Loading animation with logo
│   │
│   └── ui/                          # shadcn/ui primitives (40+ components)
│
├── lib/
│   ├── agent.ts                     # Mock critique generation & chat session logic
│   ├── schema.ts                    # TypeScript types for critique output
│   ├── api.ts                       # Placeholder API interface (unused in MVP)
│   ├── patterns.ts                  # Design pattern definitions
│   └── utils.ts                     # Utility functions (cn, etc.)
│
├── imports/                         # Figma-imported assets & frames
├── guidelines/                      # Internal design guidelines
└── supabase/                        # Backend boilerplate (not currently used)
```

---

## 🎨 **Design System**

### **Color Palette**
- **Primary/Accent:** `#E6602E` (Orange) - Used for CTAs, selection highlights
- **Background:** `#FAFCFD` (Off-white) - Reduces eye strain
- **Text Primary:** `#32404F` (Dark slate)
- **Text Secondary:** `text-slate-500` / `text-slate-400`
- **Borders:** `border-slate-100` / `border-slate-200`

### **Typography**
- **Font Family:** System sans-serif stack
- **Hierarchy:** Pre-configured in `globals.css` (do not override with arbitrary font-size classes)
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### **Spacing**
- **Grid System:** 4pt/8pt grid (Tailwind default scale)
- **Component Padding:** `p-3`, `p-4`, `p-6` (no arbitrary values like `p-[13px]`)
- **Gaps:** `gap-2`, `gap-3`, `gap-4` (multiples of 4px)

### **Glassmorphism Effect**
The input component uses:
```css
backdrop-blur-sm bg-white/70 border border-slate-200/60
shadow-[0_8px_32px_rgba(0,0,0,0.06)]
```

### **Custom Scrollbar**
Defined in `globals.css`:
- 4px width
- `#616161` gray thumb
- Darker on hover (`#4b4b4b`)
- Transparent track

---

## 📊 **Critique Schema**

Proofit uses a comprehensive structured output format:

### **Scores Object**
```typescript
{
  overall: number;              // 0-100 aggregate score
  visual_design: number;        // 0-10 (spacing, typography, color)
  ux_clarity: number;           // 0-10 (hierarchy, affordance, feedback)
  accessibility: number;        // 0-10 (WCAG compliance)
  performance: number;          // 0-10 (not deeply analyzed in MVP)
  code_quality: number;         // 0-10 (not displayed in UI)
  design_system_consistency: number; // 0-10 (token drift, style variance)
}
```

### **Issue Object**
```typescript
{
  id: string;                   // "ISSUE-001"
  category: "visual" | "ux" | "accessibility" | ...;
  severity: "P0" | "P1" | "P2";
  confidence: "high" | "medium" | "low";
  title: string;                // "Arbitrary Spacing Breaks Grid Integrity"
  problem: string;              // Detailed explanation
  evidence: {
    selectors: string[];        // CSS selectors
    metrics: { ... };           // Quantitative data
  };
  principle: {
    name: string;               // "8pt Grid System"
    explanation: string;        // Why this matters
  };
  fix_steps: string[];          // Actionable instructions
  patch: {
    tailwind: [...];            // Class swap suggestions
    react: [...];               // Code snippets
  };
}
```

### **Roast Object**
```typescript
{
  one_liner: string;            // "You're using p-[13px] like it means something..."
  tone_note: "sharp_but_fair";
  vibe_tags: string[];          // ["arbitrary-values", "no-hierarchy"]
}
```

---

## 🔄 **User Flow**

### **1. Home Page (Idle State)**
- Two dropdowns:
  - **Audience/Context** (Gen Z, Small Business, SaaS, etc.)
  - **Platform/Breakpoint** (Desktop 1440px, Mobile 375px, etc.)
- Glassmorphic textarea with image attachment support
- "Get Critique" button triggers processing

### **2. Processing State**
- Animated Proofit logo with pulsing effect
- Loading text: *"Analyzing your design..."*
- 2-second simulated delay (demonstrates async flow)

### **3. Critique Results (Chat Interface)**
- **User message** at top (code + optional image)
- **Agent critique** with:
  - Overall score card (Visual + UX scores)
  - One-liner roast
  - Prioritized issues (expandable accordions)
  - Evidence, principles, fix steps
  - "Get Fix Prompt" button per issue
- Follow-up message input at bottom

### **4. Sidebar Navigation**
- **Home** - Return to input screen
- **Search** - Placeholder
- **All Projects** - Placeholder view
- **Starred** - Placeholder view
- **Your Chats** - Collapsible list of chat sessions
  - Hover to reveal "..." menu
  - Delete chat option

---

## 🧠 **Mock Critique Logic**

In `lib/agent.ts`, the `createMockCritique()` function generates a hardcoded critique with:

### **6 Issues:**
1. **ISSUE-001:** Arbitrary Spacing (P0) - `p-[13px]` breaking grid
2. **ISSUE-002:** Low Contrast Text (P2) - Accessibility violation
3. **ISSUE-003:** Non-Existent Typography Hierarchy (P0)
4. **ISSUE-004:** Zero Interactive Feedback (P0) - Missing hover states
5. **ISSUE-005:** Inconsistent Button Styles (P2)
6. **ISSUE-006:** Poor Touch Target Sizes (P2)

### **Scores:**
- Overall: **68/100** (honest scoring, not inflated)
- Visual Design: **6/10**
- UX Clarity: **7/10**
- Design System Consistency: **5/10**

### **Roast:**
> *"You're using p-[13px] like it means something, your headings look like body text, and buttons have zero hover states. This isn't a design—it's a placeholder that forgot to get replaced."*

---

## 🎛️ **Key Features Deep Dive**

### **"Get Fix Prompt" Feature**
Located in `CritiqueResults.tsx`, this generates a formatted prompt for AI coding assistants:

```
Fix ISSUE-001: Arbitrary Spacing Breaks Grid Integrity

Problem:
Using random pixel values like 'p-[13px]' and 'gap-[7px]' completely undermines...

Fix Steps:
1. Replace all arbitrary padding values with Tailwind defaults...
2. Replace gap values: 'gap-[7px]' → 'gap-2' (8px)
3. Audit entire codebase...

---
Copy this prompt to Claude, Cursor, Figma Make, or any AI coding assistant.
```

### **Image Attachment Handling**
- Drag-and-drop support in `CritiqueInput.tsx`
- Paste image from clipboard
- Preview with remove button
- Stores as base64 data URL in message attachment

### **Chat Session Management**
- Sessions stored in React state (no persistence)
- Each session includes:
  - Unique ID (timestamp)
  - Title (auto-generated from first 4 words)
  - Messages array
  - Original code & goal
  - Timestamp
- Delete chat functionality with confirmation menu

### **Collapsible Sidebar**
- Animated width transition (240px ↔ 64px)
- Hover tooltip when collapsed
- Synced with chat list visibility
- Smooth Motion animations

---

## 🎨 **UI/UX Design Decisions**

### **Why No Chat Bubbles?**
- Traditional chat bubbles create visual clutter
- Critiques are long-form content, not quick messages
- Linear stream with transparent sections feels more like a document
- Inspired by Claude's artifacts interface

### **Why Glassmorphism?**
- Modern, premium aesthetic
- Adds depth without heavy shadows
- Aligns with "Proofit as a pro tool" positioning
- Subtle enough to not distract from content

### **Why Orange Accent?**
- High energy, attention-grabbing (appropriate for critique tool)
- Good contrast against slate/white background
- Unique brand color (not the typical blue)

### **Why "Roast" Language?**
- Makes feedback memorable
- Signals honesty (not corporate "please consider...")
- Engaging, shareable format
- Balanced with actionable fixes (not just mean for sake of it)

---

## 🚧 **Current Limitations (MVP)**

### **Not Implemented:**
- ❌ Real AI critique generation (uses mock data)
- ❌ Backend API integration
- ❌ Database persistence
- ❌ User authentication
- ❌ Actual Figma API integration
- ❌ Screenshot analysis
- ❌ Real-time streaming responses
- ❌ Export/share functionality
- ❌ Search functionality
- ❌ Projects/Starred filtering

### **Frontend-Only Scope:**
This MVP is intentionally frontend-focused to:
1. Demonstrate the full user experience flow
2. Validate UI/UX design decisions
3. Test critique format and presentation
4. Iterate on interaction patterns before backend investment

---

## 🔮 **Future Roadmap**

### **Phase 1: AI Integration**
- [ ] Connect to Claude API (Anthropic)
- [ ] Real critique generation with streaming responses
- [ ] Custom prompt engineering for design critique
- [ ] Screenshot analysis via vision models

### **Phase 2: Backend & Persistence**
- [ ] Supabase integration
- [ ] User authentication (email + social login)
- [ ] Chat history persistence
- [ ] Starred chats functionality

### **Phase 3: Advanced Features**
- [ ] Figma plugin integration
- [ ] Before/after comparisons
- [ ] Team collaboration
- [ ] Critique templates
- [ ] Export to Notion/Linear/Jira

### **Phase 4: Pro Features**
- [ ] Design system analysis
- [ ] Brand consistency checks
- [ ] Competitive analysis
- [ ] A/B test suggestions
- [ ] Automated regression testing

---

## 🛠️ **Development**

### **Getting Started**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### **Key Commands**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### **Environment**
No environment variables required for MVP (frontend-only).

---

## 📝 **Design Patterns**

### **Component Organization**
- **Layout.tsx** - Container (sidebar + main content)
- **Page Components** - CritiqueInput, ChatInterface, Projects, Starred
- **Feature Components** - CritiqueResults, ProcessingView
- **UI Primitives** - `/components/ui` (shadcn/ui)

### **State Management**
- React `useState` for all state (no Redux/Zustand needed)
- Chat sessions stored in array
- Current session tracked by ID
- No global state (prop drilling is minimal)

### **Styling Approach**
- Tailwind utility classes only
- No CSS modules or styled-components
- Custom classes in `globals.css` for:
  - Typography base styles (h1, h2, p, etc.)
  - Custom scrollbar
  - Utility classes (`scrollbar-hide`, `custom-scrollbar`)

### **Animation Strategy**
- Motion (framer-motion) for all animations
- `AnimatePresence` for enter/exit transitions
- Consistent duration: 200-300ms
- Easing: `ease-in-out` for organic feel

---

## 🎓 **Design Critique Methodology**

### **Inspired By:**
- **Don Norman's Principles** (affordance, feedback, visibility)
- **WCAG 2.1 Guidelines** (AA contrast, touch targets)
- **Material Design 3** (motion, elevation)
- **Apple HIG** (clarity, deference, depth)
- **Refactoring UI** (visual hierarchy, whitespace)

### **Critique Categories:**
1. **Visual Design** - Typography, color, spacing, consistency
2. **UX Clarity** - Hierarchy, scannability, affordance
3. **Accessibility** - Contrast, keyboard nav, screen reader support
4. **Performance** - LCP, CLS (not deeply analyzed in MVP)
5. **Design System Consistency** - Token drift, arbitrary values

### **Scoring Philosophy:**
- **0-4:** Fundamental issues, unusable
- **5-6:** Multiple critical problems, needs work
- **7-8:** Good foundation, polish needed
- **9-10:** Exceptional, minor tweaks only

---

## 🤝 **Contributing**

This is currently a private MVP project. For questions or collaboration:
- Review the `guidelines/Guidelines.md` for design standards
- Check `Attributions.md` for asset credits
- Follow existing component patterns

---

## 📄 **License**

Proprietary - All Rights Reserved

---

## 🙏 **Acknowledgments**

- **shadcn/ui** - Component primitives
- **Tailwind CSS** - Utility-first styling
- **Lucide** - Icon system
- **Motion** - Animation library
- **Figma** - Design tool integration (future)

---

## 📬 **Contact**

For inquiries about Proofit:
- **Product:** Design Critique Agent
- **Status:** Frontend MVP (v1.0)
- **Last Updated:** December 2024

---

**Built with ❤️ and brutal honesty.**
