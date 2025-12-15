# Proofit 🎨

**AI-Powered Design Critique Agent for Modern Web Interfaces**

Proofit is an intelligent design critique tool that provides expert-level, actionable feedback on UI/UX designs. Powered by OpenAI's GPT models, it delivers specific, design-theory-backed recommendations with surgical precision.

---

## 🎯 **Core Philosophy**

> "Stronger than ChatGPT's UI/UX roasts."

Proofit delivers **brutal but constructive** design critiques with:
- ✅ Specific, actionable feedback (exact values, not vague suggestions)
- ✅ Design theory-backed recommendations (8pt grid, Don Norman's principles, WCAG standards)
- ✅ Honest scoring (calls out real issues with precision)
- ✅ Sharp but fair tone—professional expertise, not meanness
- ✅ Multiple specialized agents (Design Critique, SEO, AI Readiness, Translation)

---

## 🚀 **Key Features**

### **1. Multi-Agent Architecture**
- **Classify Agent** - Intelligently routes user requests to the appropriate specialist
- **Proofit (Design Evaluation)** - Core design critique agent with detailed analysis
- **SEO/Conversion Agent** - Search optimization and conversion-focused feedback
- **AI Readiness & Risk Ledger** - Product manager-focused readiness assessment
- **Translator Agent** - Role-specific translations (designer, engineer, PM)

### **2. Comprehensive Design Critique**
- **P0/P1/P2 Issue Prioritization** - Ranked by user impact
- **Detailed Problem Analysis** - 4-6 sentences with specific element references
- **Exact Fix Steps** - 5-7 numbered steps per issue with exact values
- **Design Principle Violations** - References to WCAG, Material Design, etc.
- **Measurable Consequences** - Quantified impact (e.g., "increases cognitive load by 40%")

### **3. Advanced Input Support**
- **Multiple Image Attachments** - Up to 3 images via drag-and-drop or file input
- **Context Providers** - Audience (Consumer SaaS, Enterprise, Developer Tool, etc.) and Platform (Desktop, Mobile, Responsive, App-like) dropdowns
- **Conversation Memory** - Maintains context across follow-up questions
- **Text + Image Combinations** - Analyze code snippets alongside screenshots

### **4. Specialized Output Formats**
- **A/B Comparisons** - "Make B match A" with specific transformation steps
- **Production Readiness Verdicts** - Clear ship/no-ship decisions with P0 blockers
- **Role Translations** - Engineer-ready, designer-ready, PM-ready outputs
- **Trend Awareness** - On-demand only, time-bounded snapshot analysis

### **5. Clean Conversational UI**
- **Linear chat interface** - Critiques embedded in conversation stream
- **Glassmorphic input component** - Subtle backdrop blur with image previews
- **Collapsible sidebar** - Chat history with session management
- **Real-time processing** - Streaming responses from AI agents

---

## 🏗️ **Architecture**

### **Frontend**
- **Framework:** React + TypeScript
- **Styling:** Tailwind CSS v4.0
- **Animations:** Motion (formerly Framer Motion)
- **UI Components:** shadcn/ui primitives
- **Build Tool:** Vite

### **Backend**
- **ChatKit Server:** Python FastAPI server with `openai-chatkit`
- **Agents:** OpenAI GPT models (gpt-4o, gpt-5.2-pro)
- **Data Store:** SQLite for conversation persistence
- **File Store:** Disk-based file storage for attachments
- **API:** RESTful endpoints (`/workflow`, `/chatkit`)

### **Technology Stack**

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React + TypeScript |
| **Styling** | Tailwind CSS v4.0 |
| **Animations** | Motion |
| **UI Components** | shadcn/ui |
| **Icons** | Lucide React |
| **Build Tool** | Vite |
| **Backend Framework** | FastAPI (Python) |
| **AI Framework** | openai-chatkit |
| **AI Models** | OpenAI GPT-4o, GPT-5.2-pro |
| **Data Store** | SQLite |
| **File Store** | DiskFileStore |

---

## 📁 **Project Structure**

```
/
├── src/
│   ├── App.tsx                          # Main application with routing
│   ├── main.tsx                         # Entry point
│   │
│   ├── components/
│   │   ├── Layout.tsx                   # Sidebar + main content wrapper
│   │   ├── CritiqueInput.tsx            # Home page with dropdowns + input
│   │   ├── ProcessingView.tsx           # Animated loading state
│   │   ├── ChatInterface.tsx            # Critique conversation view
│   │   ├── CritiqueResults.tsx          # Formatted critique display
│   │   ├── Projects.tsx                  # Projects view
│   │   ├── Starred.tsx                  # Starred chats view
│   │   └── ui/                          # shadcn/ui primitives
│   │
│   ├── lib/
│   │   ├── agent.ts                     # Agent orchestration logic
│   │   ├── api.ts                       # API client for ChatKit server
│   │   ├── schema.ts                    # TypeScript types
│   │   └── utils.ts                     # Utility functions
│   │
│   ├── assets/
│   │   ├── proofitbackground.svg        # Home page background
│   │   └── sarahprofile.png             # Profile image
│   │
│   └── supabase/                        # Supabase edge functions (legacy)
│
├── chatkit_server.py                    # FastAPI ChatKit server
├── workflow.py                          # Python agent definitions
├── chatkit_store.py                     # SQLite data store implementation
├── requirements.txt                     # Python dependencies
├── package.json                         # Node.js dependencies
└── vite.config.ts                       # Vite configuration
```

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.10+ (for ChatKit server)
- OpenAI API key

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd Proofit
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
SEMRUSH_API_KEY=your_semrush_api_key_here  # Optional, for SEO agent
VITE_CHATKIT_SERVER_URL=http://localhost:8000  # ChatKit server URL
```

5. **Start the ChatKit server**
```bash
python chatkit_server.py
```

The server will start on `http://localhost:8000` by default.

6. **Start the frontend development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🎨 **Usage**

### **Basic Critique Flow**

1. **Home Page** - Enter your design question, code snippet, or URL
2. **Attach Images** - Drag and drop up to 3 images (optional)
3. **Select Context** - Choose audience and platform from dropdowns (optional)
4. **Submit** - Get instant AI-powered critique
5. **Follow-up** - Ask questions, request clarifications, or get role-specific translations

### **Example Queries**

- `"Roast this UI"` (with screenshot attached)
- `"Is this production ready?"`
- `"Compare these two designs"` (with 2 images)
- `"Make this engineer-ready"` (after a critique)
- `"What about SEO?"` (follow-up question)

### **Specialized Agents**

- **Design Critique** - Default for UI/UX questions
- **SEO Agent** - Triggered by SEO-related questions, uses Semrush data when available
- **AI Readiness Agent** - Triggered by "production ready", "ship blockers", etc.
- **Translator Agent** - Triggered by "engineer-ready", "designer translation", etc.

---

## 🎨 **Design System**

### **Color Palette**
- **Primary/Accent:** `#E6602E` (Orange) - CTAs, selection highlights
- **Background:** `#FAFCFD` (Off-white) - Reduces eye strain
- **Text Primary:** `#32404F` (Dark slate)
- **Text Secondary:** `text-slate-500` / `text-slate-400`
- **Borders:** `border-slate-100` / `border-slate-200`

### **Typography**
- **Font Family:** System sans-serif stack
- **Hierarchy:** Pre-configured in `globals.css`
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### **Spacing**
- **Grid System:** 4pt/8pt grid (Tailwind default scale)
- **Component Padding:** `p-3`, `p-4`, `p-6` (no arbitrary values)
- **Gaps:** `gap-2`, `gap-3`, `gap-4` (multiples of 4px)

---

## 🔧 **Development**

### **Key Commands**

```bash
# Frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
python chatkit_server.py  # Start ChatKit server
```

### **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for agent models | Yes |
| `SEMRUSH_API_KEY` | Semrush API key for SEO agent | No |
| `VITE_CHATKIT_SERVER_URL` | ChatKit server URL | Yes (default: http://localhost:8000) |

---

## 📊 **Agent Output Format**

### **Design Critique Format**

```
High-level vibe: [One memorable sentence]

[Opening observation - 3-4 sentences]

What's failing (based on this screenshot):

P0 — [Brief problem title]
Problem: [4-6 sentences with specific element references]
User Impact: [2-3 sentences]
Design Principle Violation: [1-2 sentences]
Measurable Consequences: [1-2 sentences]
Root Cause: [1-2 sentences]
Fix:
1. [Specific action] — [exact value] — [2-3 sentence explanation]
2. [Continue with 5-7 fix steps]

[Additional P0/P1/P2 issues...]

Quick improvements:
- [Specific suggestion with exact values]
- [Continue with 7-10 suggestions]
```

### **Production Readiness Format**

```
PRODUCTION-READINESS VERDICT: [Clear ship/no-ship statement]

P0 BLOCKERS
P0 — [Title]
Problem: [4-6 sentences]
User Impact: [2-3 sentences]
Design Principle Violation: [1-2 sentences]
Measurable Consequences: [1-2 sentences]
Root Cause: [1-2 sentences]
Fix:
1. [Specific action] — [exact value] — [2-3 sentence explanation]
2. [Continue with 5-7 fix steps]

[Additional blockers...]

P1 ITEMS (should fix before public launch)
[Same format with 3-5 fix steps]

P2 ITEMS (can ship without, but should address soon)
[Same format with 2-3 fix steps]

CLOSING VERDICT: [Decisive statement with timeline]
```

---

## 🧠 **Agent Capabilities**

### **Classification**
The Classify agent routes requests to:
- `url_only` - Live URL analysis
- `html_or_code` - Code snippet critique
- `image_only` - Screenshot analysis
- `mixed_input` - Combined inputs
- `design_question` - General design questions
- `comparison_request` - A/B comparisons
- `validation_check` - Production readiness
- `accessibility_check` - WCAG compliance
- And more...

### **Evidence-Based Scaling**
Output detail scales with available evidence:
- **Level 0** (No artifact) - High-level structural guidance
- **Level 1** (Screenshot/Copy) - Concrete, referential feedback
- **Level 2** (URL/HTML) - Verification of headings, metadata
- **Level 3** (URL + Semrush) - Strategic, competitive analysis

---

## 🚧 **Known Limitations**

- ChatKit server must be running for AI functionality
- Image attachments limited to 3 per message
- Conversation history stored locally (SQLite)
- No user authentication (single-user mode)
- SEO agent requires Semrush API key for full functionality

---

## 🔮 **Future Roadmap**

### **Phase 1: Enhanced Agents**
- [ ] Figma plugin integration
- [ ] Real-time collaboration
- [ ] Multi-user support

### **Phase 2: Advanced Features**
- [ ] Design system analysis
- [ ] Brand consistency checks
- [ ] Competitive analysis
- [ ] A/B test suggestions

### **Phase 3: Enterprise**
- [ ] Team workspaces
- [ ] API access
- [ ] Custom agent training
- [ ] Analytics dashboard

---

## 📝 **License**

Proprietary - All Rights Reserved

---

## 🙏 **Acknowledgments**

- **OpenAI** - GPT models and ChatKit framework
- **shadcn/ui** - Component primitives
- **Tailwind CSS** - Utility-first styling
- **Lucide** - Icon system
- **Motion** - Animation library

---

**Built with ❤️ and brutal honesty.**
