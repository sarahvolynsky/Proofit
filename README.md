# Proofit 🎨

**The AI Design Critic That Actually Ships Better Products**

Stop shipping interfaces that confuse users. Proofit is an AI-powered design critique agent that delivers expert-level, actionable feedback—not generic suggestions. Built on OpenAI's ChatKit API, it combines multiple specialized agents to give you the brutal honesty you need to build interfaces that work.

---

## 🎯 **Why Proofit Exists**

> "ChatGPT gives you polite feedback. Proofit gives you the truth."

Most design critique tools are either too generic ("improve the UX") or too technical (code quality, not design quality). Proofit fills the gap: **surgical design critique with exact fixes, backed by design theory, delivered with authority.**

**The result?** You ship interfaces that users actually understand, trust, and want to use.

---

## 🚀 **What Makes Proofit Different**

### **1. Multi-Agent Intelligence**
Built on OpenAI's ChatKit API, Proofit uses a sophisticated agent architecture:
- **Classify Agent** - Routes your request to the right specialist instantly
- **Proofit (Design Evaluation)** - Core critique agent with deep design analysis
- **SEO/Conversion Agent** - Search optimization with Semrush integration
- **AI Readiness & Risk Ledger** - Product manager-focused readiness assessment
- **Translator Agent** - Role-specific outputs (designer, engineer, PM)

**Why it matters:** You get specialized expertise, not a one-size-fits-all response.

### **2. Evidence-Based, Not Generic**
Output detail scales with what you provide:
- **No artifact?** High-level structural guidance
- **Screenshot?** Concrete, referential feedback with exact element references
- **URL + Semrush data?** Strategic, competitive analysis with quantified impact

**Why it matters:** You get the right level of detail for your context, not boilerplate advice.

### **3. Exact Fixes, Not Vague Suggestions**
Every issue includes:
- **5-7 numbered fix steps** with exact values (colors, spacing, text replacements)
- **Specific element references** (location, name, current state)
- **2-3 sentence explanations** of why each fix works
- **Measurable consequences** (e.g., "increases cognitive load by 40%")

**Why it matters:** You can implement fixes immediately, not spend time interpreting vague advice.

### **4. Production-Ready Verdicts**
Get clear ship/no-ship decisions with:
- **P0 Blockers** - Must fix to ship (with exact steps)
- **P1 Items** - Should fix before launch
- **P2 Items** - Can ship without, but address soon
- **Timeline recommendations** - "Fix these 3 blockers in 2-3 days, then ship"

**Why it matters:** You know exactly what's blocking launch and how to fix it.

### **5. Context-Aware Analysis**
- **Audience Selector** - Consumer SaaS, Enterprise, Developer Tool, etc.
- **Platform Selector** - Desktop, Mobile, Responsive, App-like
- **Conversation Memory** - Maintains context across follow-up questions
- **Multiple Image Support** - Up to 3 images per message

**Why it matters:** Feedback is tailored to your specific use case, not generic best practices.

---

## 🏗️ **Built on Modern Architecture**

### **Frontend → API → ChatKit → Agents**

**Frontend (React + TypeScript)**
- Makes API calls to ChatKit server
- Handles image uploads, context selection, conversation UI
- Built with Vite, Tailwind CSS, Motion animations

**ChatKit Server (Python FastAPI)**
- Implements OpenAI's ChatKit API protocol
- Manages threads, messages, attachments, streaming
- Uses SQLite for conversation persistence
- Integrates with specialized agents

**Agents (Python + OpenAI)**
- Built with `openai-chatkit` and `agents` packages
- Uses GPT-4o and GPT-5.2-pro models
- Specialized instructions for each agent type
- Evidence-based output scaling

### **Technology Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Modern, fast UI |
| **Styling** | Tailwind CSS v4.0 | Utility-first design system |
| **API Framework** | FastAPI (Python) | High-performance async server |
| **AI Framework** | OpenAI ChatKit API | Official conversation framework |
| **AI Models** | GPT-4o, GPT-5.2-pro | State-of-the-art language models |
| **Data Store** | SQLite | Lightweight conversation persistence |
| **File Store** | DiskFileStore | Attachment management |

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.10+ (for ChatKit server)
- OpenAI API key

### **Installation**

1. **Clone and install**
```bash
git clone <repository-url>
cd Proofit
npm install
pip install -r requirements.txt
```

2. **Set up environment variables**

Create a `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
SEMRUSH_API_KEY=your_semrush_api_key_here  # Optional
VITE_CHATKIT_SERVER_URL=http://localhost:8000
```

3. **Start the ChatKit server**
```bash
python chatkit_server.py
```

4. **Start the frontend**
```bash
npm run dev
```

Visit `http://localhost:3000` and start critiquing.

---

## 💡 **How It Works**

### **The Flow**

1. **You submit** a design question, code snippet, URL, or screenshot
2. **Classify Agent** routes your request to the right specialist
3. **Specialized Agent** analyzes with context (audience, platform, conversation history)
4. **You get** specific, actionable feedback with exact fix steps
5. **You follow up** with questions, and the agent remembers context

### **Example Queries**

- `"Roast this UI"` (with screenshot) → Detailed critique with P0/P1/P2 issues
- `"Is this production ready?"` → Ship/no-ship verdict with blockers
- `"Compare these two designs"` (2 images) → A/B analysis with "Make B match A" steps
- `"Make this engineer-ready"` → Role-specific translation with code-level details
- `"What about SEO?"` → SEO analysis with Semrush data integration

---

## 📊 **Output Quality**

### **Design Critique Format**

```
High-level vibe: [One memorable sentence that captures the essence]

[Opening observation - 3-4 sentences with context]

What's failing (based on this screenshot):

P0 — [Brief problem title]
Problem: [4-6 sentences with specific element references]
User Impact: [2-3 sentences with quantified consequences]
Design Principle Violation: [1-2 sentences with guideline references]
Measurable Consequences: [1-2 sentences with numbers]
Root Cause: [1-2 sentences explaining underlying cause]
Fix:
1. [Specific action] — [exact value] — [2-3 sentence explanation]
2. [Continue with 5-7 fix steps, each with exact values]

[Additional P0/P1/P2 issues...]

Quick improvements:
- [Specific suggestion with exact values]
- [7-10 actionable suggestions]
```

### **Production Readiness Format**

```
PRODUCTION-READINESS VERDICT: [Clear ship/no-ship statement]

P0 BLOCKERS (must fix to ship)
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

## 🎨 **Design System**

### **Visual Identity**
- **Primary Color:** `#E6602E` (Orange) - High energy, attention-grabbing
- **Background:** `#FAFCFD` (Off-white) - Reduces eye strain
- **Typography:** System sans-serif with clear hierarchy
- **Spacing:** 4pt/8pt grid system (no arbitrary values)

### **UI Components**
- Glassmorphic input with backdrop blur
- Collapsible sidebar with chat history
- Linear chat interface (no bubbles, critiques embedded)
- Image preview with drag-and-drop support

---

## 🧠 **Agent Capabilities**

### **Classification Categories**
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
- **Level 0** (No artifact) → High-level structural guidance
- **Level 1** (Screenshot/Copy) → Concrete, referential feedback
- **Level 2** (URL/HTML) → Verification of headings, metadata
- **Level 3** (URL + Semrush) → Strategic, competitive analysis

---

## 🔧 **Development**

### **Key Commands**

```bash
# Frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production

# Backend
python chatkit_server.py  # Start ChatKit server
```

### **Environment Variables**

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for agent models | Yes |
| `SEMRUSH_API_KEY` | Semrush API key for SEO agent | No |
| `VITE_CHATKIT_SERVER_URL` | ChatKit server URL | Yes |

---

## 📁 **Project Structure**

```
/
├── src/                              # Frontend React app
│   ├── components/                   # UI components
│   ├── lib/                         # API client, utilities
│   └── assets/                      # Images, SVGs
│
├── chatkit_server.py                # FastAPI ChatKit server
├── workflow.py                       # Agent definitions
├── chatkit_store.py                 # SQLite data store
├── requirements.txt                  # Python dependencies
└── package.json                      # Node.js dependencies
```

---

## 🎯 **Use Cases**

### **For Designers**
- Get expert second opinion before handoff
- Validate design decisions with theory-backed feedback
- Identify accessibility issues early
- Translate critiques into designer-friendly language

### **For Engineers**
- Understand design issues in code-level terms
- Get exact Tailwind class replacements
- Receive engineer-ready fix instructions
- Validate implementation against design principles

### **For Product Managers**
- Get production readiness verdicts
- Identify launch blockers with timelines
- Understand user impact of design issues
- Make data-driven shipping decisions

### **For Teams**
- Standardize design critique process
- Maintain conversation history across sessions
- Share critiques with role-specific translations
- Track issues with P0/P1/P2 prioritization

---

## 🚧 **Current Status**

✅ **Implemented:**
- Multi-agent architecture with ChatKit API
- Frontend API integration
- Image attachment support (up to 3 images)
- Conversation memory and context
- Specialized agents (Design, SEO, AI Readiness, Translation)
- Production readiness verdicts
- A/B comparison analysis

🚧 **In Progress:**
- Enhanced agent instructions for better output quality
- Improved error handling and debugging

🔮 **Future:**
- Figma plugin integration
- Team collaboration features
- Custom agent training
- Analytics dashboard

---

## 📝 **License**

Proprietary - All Rights Reserved

---

## 🙏 **Built With**

- **OpenAI** - GPT models and ChatKit API framework
- **FastAPI** - High-performance Python web framework
- **React** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component primitives
- **Motion** - Animation library

---

**Stop shipping confusing interfaces. Start shipping better products.**

**Built with ❤️ and brutal honesty.**
