import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { CritiqueInput } from "./components/CritiqueInput";
import { ProcessingView } from "./components/ProcessingView";
import { ChatInterface } from "./components/ChatInterface";
import { Projects } from "./components/Projects";
import { Starred } from "./components/Starred";
import { analyzeCode, CritiqueResult, Goal, ChatSession, Message } from "./lib/agent";

export default function App() {
  const [status, setStatus] = useState<"idle" | "processing" | "complete" | "projects" | "starred">("idle");
  const [goal, setGoal] = useState<Goal>("conversion");
  const [code, setCode] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isProcessingFollowUp, setIsProcessingFollowUp] = useState(false);
  
  // Chat State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentSession = chatSessions.find(s => s.id === currentSessionId);

  const handleCritique = async () => {
    if (!code.trim() && !attachment) return;
    setStatus("processing");
    
    try {
      // Create the session immediately with user message
      let title = code.split(/[\n\s]+/).filter(w => w.length > 0).slice(0, 4).join(" ");
      if (!title && attachment) {
        title = "Design Critique";
      }
      if (!title) {
        title = `Critique ${chatSessions.length + 1}`;
      }
      
      const sessionId = Date.now().toString();
      const userMessage: Message = {
        id: '1',
        role: 'user',
        content: code || "Please critique this design",
        type: 'text',
        attachment: attachment || undefined
      };

      // Create session with just the user message initially
      const newSession: ChatSession = {
        id: sessionId,
        title: title,
        date: new Date(),
        code: code,
        goal: goal,
        messages: [userMessage]
      };

      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
      setStatus("complete"); // Show chat interface immediately

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock critique (no backend call)
      const critiqueResult = await analyzeCode(code, goal, attachment || undefined);
      
      // Add the critique message to the session
      const critiqueMessage: Message = {
        id: '2',
        role: 'agent',
        content: critiqueResult,
        type: 'critique'
      };

      setChatSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: [userMessage, critiqueMessage]
          };
        }
        return session;
      }));
    } catch (error) {
      console.error('Error during critique:', error);
      setStatus("idle");
    }
  };

  const handleSendMessage = (text: string, attachment?: string) => {
    if (!currentSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      type: 'text',
      attachment: attachment
    };

    // Update session with user message
    setChatSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: [...session.messages, userMsg]
        };
      }
      return session;
    }));

    // Check if user is asking for a prompt
    const isPromptRequest = /generate.*prompt|create.*prompt|get.*prompt|prompt.*this|fix.*prompt/i.test(text);

    // Simulate Agent response
    setTimeout(() => {
      let responseContent = "I've received your feedback. As this is a prototype, I can't refine the critique further yet, but I've noted your request!";
      
      if (isPromptRequest && currentSession) {
        // Find the critique result in the session messages
        const critiqueMsg = currentSession.messages.find(m => m.type === 'critique');
        if (critiqueMsg && typeof critiqueMsg.content !== 'string') {
          const result = critiqueMsg.content as CritiqueResult;
          
          // Generate the fix prompt
          const issuesList = result.issues.map((issue, i) => 
            `${i+1}. [${issue.severity}] ${issue.title} (${issue.category.toUpperCase()})
   Problem: ${issue.problem}
   Fix Steps:
${issue.fix_steps.map((step, idx) => `      ${idx + 1}. ${step}`).join('\n')}`
          ).join("\n\n");
          
          responseContent = `You are an expert frontend developer and designer. I need you to apply design critique feedback to improve my React/Tailwind codebase.

CRITIQUE SUMMARY:
${result.roast.one_liner}

OVERALL SCORES:
• Visual Design: ${result.scores.visual_design}/10
• UX Clarity: ${result.scores.ux_clarity}/10
• Code Quality: ${result.scores.code_quality}/10
• Accessibility: ${result.scores.accessibility}/10

ISSUES TO ADDRESS (${result.issues.length} total):

${issuesList}

REQUIREMENTS:
1. Apply all the fix steps listed above to the code
2. Maintain the existing design language and component structure
3. Use Tailwind CSS utility classes following best practices
4. Ensure all changes improve accessibility and code quality
5. Provide the complete updated code with clear comments explaining changes

Please generate the improved React and Tailwind code now.`;
        }
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: responseContent,
        type: 'text'
      };

      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, agentMsg]
          };
        }
        return session;
      }));
    }, 1000);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setStatus("complete");
    // Optionally restore code/goal from session if needed
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setCode(session.code);
      setGoal(session.goal);
    }
  };

  const handleNewChat = () => {
    setStatus("idle");
    setCurrentSessionId(null);
    setCode("");
    setAttachment(null);
    setGoal("conversion");
  };

  const handleReset = () => {
    // This was used by ChatInterface to go back, equivalent to New Chat
    handleNewChat();
  };

  const handleProjects = () => {
    setStatus("projects");
  };

  const handleStarred = () => {
    setStatus("starred");
  };

  const handleDeleteChat = (id: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== id));
    
    // If we're deleting the current session, go back to idle
    if (id === currentSessionId) {
      handleNewChat();
    }
  };

  return (
    <Layout 
      chatSessions={chatSessions}
      currentSessionId={currentSessionId}
      onSelectSession={handleSelectSession}
      onNewChat={handleNewChat}
      onProjects={handleProjects}
      onStarred={handleStarred}
      onDeleteChat={handleDeleteChat}
      isProjectsView={status === "projects"}
      isStarredView={status === "starred"}
    >
      {status === "idle" && (
        <CritiqueInput 
          code={code} 
          setCode={setCode} 
          goal={goal} 
          setGoal={setGoal}
          attachment={attachment}
          setAttachment={setAttachment} 
          onSubmit={handleCritique} 
        />
      )}
      {status === "processing" && (
        <ProcessingView attachment={attachment} code={code} />
      )}
      {status === "complete" && currentSession && (
        <ChatInterface 
          messages={currentSession.messages}
          onSendMessage={handleSendMessage}
          goal={currentSession.goal}
          onReset={handleReset}
          isProcessing={isProcessingFollowUp}
        />
      )}
      {status === "projects" && (
        <Projects onBack={handleNewChat} />
      )}
      {status === "starred" && (
        <Starred onBack={handleNewChat} />
      )}
    </Layout>
  );
}