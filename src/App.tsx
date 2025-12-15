import React, { useState } from "react";
import { Layout } from "./components/Layout";
import { CritiqueInput } from "./components/CritiqueInput";
import { ProcessingView } from "./components/ProcessingView";
import { ChatInterface } from "./components/ChatInterface";
import { Projects } from "./components/Projects";
import { Starred } from "./components/Starred";
import { analyzeCode, sendChatMessage, CritiqueResult, Goal, ChatSession, Message } from "./lib/agent";

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

      // Generate critique using real API
      try {
        const critiqueResult = await analyzeCode(code, goal, attachment || undefined);
        
        // Add the critique message to the session
        // Preserve attachment from user message so image is visible with critique
        const critiqueMessage: Message = {
          id: '2',
          role: 'agent',
          content: critiqueResult,
          type: 'critique',
          attachment: attachment || undefined // Preserve image attachment
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
        // If analyzeCode throws with plain text (for design_question/unknown), treat it as a text message
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if this is a plain text response (not a real error)
        // Plain text responses from the agent are typically longer and don't look like error messages
        const isPlainTextResponse = errorMessage.length > 50 && !errorMessage.includes('Failed to') && !errorMessage.includes('Error');
        
        if (isPlainTextResponse) {
          // This is a plain text response from the agent (asking for more info)
          const textMessage: Message = {
            id: '2',
            role: 'agent',
            content: errorMessage,
            type: 'text'
          };

          setChatSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                messages: [userMessage, textMessage]
              };
            }
            return session;
          }));
        } else {
          // This is a real error - show it to the user
          const errorMsg: Message = {
            id: '2',
            role: 'agent',
            content: `I encountered an error: ${errorMessage}. Please try again.`,
            type: 'text'
          };

          setChatSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                messages: [userMessage, errorMsg]
              };
            }
            return session;
          }));
        }
      }
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

    // Get messages and goal BEFORE adding the new user message
    let messagesForContext: Message[] = [];
    let sessionGoal: Goal = "conversion";
    
    setChatSessions(prev => {
      const session = prev.find(s => s.id === currentSessionId);
      if (session) {
        messagesForContext = session.messages; // Messages without the new user message
        sessionGoal = session.goal;
      }
      return prev;
    });

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

    // Use agentic workflow to get response
    (async () => {
      try {
        // Call sendChatMessage with messages (without the new user message) and the text
        const responseText = await sendChatMessage(messagesForContext, text, sessionGoal, attachment);
        
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
        console.error('Error in handleSendMessage:', error);
        
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: "I encountered an error processing your message. Please try again.",
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
    })();
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