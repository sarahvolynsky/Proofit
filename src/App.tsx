import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { CritiqueInput } from "./components/CritiqueInput";
import { ProcessingView } from "./components/ProcessingView";
import { ChatInterface } from "./components/ChatInterface";
import { Projects } from "./components/Projects";
import { Starred } from "./components/Starred";
import { analyzeCode, sendChatMessage, CritiqueResult, Goal, ChatSession, Message } from "./lib/agent";
import { getRelevantPatterns } from "./lib/patterns";
import { projectId, publicAnonKey } from "./utils/supabase/info";

export default function App() {
  const [status, setStatus] = useState<"idle" | "processing" | "complete" | "projects" | "starred">("idle");
  const [goal, setGoal] = useState<Goal>("conversion");
  const [code, setCode] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  
  // Chat State
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentSession = chatSessions.find(s => s.id === currentSessionId);

  const handleCritique = async () => {
    if (!code.trim() && !attachment) return;
    setStatus("processing");
    try {
      const data = await analyzeCode(code, goal, attachment || undefined);
      
      // Create new session
      let title = code.split(/[\n\s]+/).filter(w => w.length > 0).slice(0, 4).join(" ");
      if (!title && attachment) {
        title = "Design Critique";
      }
      if (!title) {
        title = `Critique ${chatSessions.length + 1}`;
      }
      
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: title,
        date: new Date(),
        code: code,
        goal: goal,
        messages: [
          {
            id: '1',
            role: 'user',
            content: code || "Please critique this design",
            type: 'text',
            attachment: attachment || undefined
          },
          {
            id: '2',
            role: 'agent',
            content: data,
            type: 'critique'
          }
        ]
      };

      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setStatus("complete");
    } catch (error) {
      console.error(error);
      setStatus("idle");
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentSessionId || !currentSession) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      type: 'text'
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

    // Test endpoints sequentially
    try {
      console.log('=== Testing server connectivity ===');
      
      // Test 0: Root endpoint
      console.log('0. Testing root endpoint (no auth)...');
      const rootUrl = `https://${projectId}.supabase.co/functions/v1/server`;
      try {
        const rootResponse = await fetch(rootUrl);
        console.log('✓ Root response:', rootResponse.ok, rootResponse.status);
        if (rootResponse.ok) {
          const rootData = await rootResponse.json();
          console.log('✓ Root data:', rootData);
        } else {
          const errorText = await rootResponse.text();
          console.error('✗ Root error:', errorText);
        }
      } catch (error) {
        console.error('✗ Root test failed:', error);
      }
      
      // Test 1: Health check
      console.log('1. Testing health endpoint...');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/server/make-server-4fd6c9f5/health`;
      try {
        const healthResponse = await fetch(healthUrl);
        console.log('✓ Health check response:', healthResponse.ok, healthResponse.status);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('✓ Health check data:', healthData);
        }
      } catch (error) {
        console.error('✗ Health check failed:', error);
      }

      // Test 2: Echo endpoint
      console.log('2. Testing echo endpoint...');
      const echoUrl = `https://${projectId}.supabase.co/functions/v1/server/make-server-4fd6c9f5/test/echo`;
      try {
        const echoResponse = await fetch(echoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ test: 'hello', message: text }),
        });
        console.log('✓ Echo response:', echoResponse.ok, echoResponse.status);
        if (echoResponse.ok) {
          const echoData = await echoResponse.json();
          console.log('✓ Echo data:', echoData);
        } else {
          const errorText = await echoResponse.text();
          console.error('✗ Echo error:', errorText);
        }
      } catch (error) {
        console.error('✗ Echo test failed:', error);
      }

      console.log('3. Testing Anthropic chat endpoint...');
    } catch (error) {
      console.error('Server tests failed:', error);
    }

    // Call the real API for response
    try {
      const updatedSession = chatSessions.find(s => s.id === currentSessionId);
      if (!updatedSession) return;

      // Get all messages including the new user message for context
      const allMessages = [...updatedSession.messages, userMsg];
      
      const responseText = await sendChatMessage(allMessages, text, currentSession.goal);

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: responseText,
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
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback error message
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: "I apologize, but I encountered an error processing your message. Please try again.",
        type: 'text'
      };

      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, errorMsg]
          };
        }
        return session;
      }));
    }
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

  return (
    <Layout 
      chatSessions={chatSessions}
      currentSessionId={currentSessionId}
      onSelectSession={handleSelectSession}
      onNewChat={handleNewChat}
      onProjects={handleProjects}
      onStarred={handleStarred}
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