import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./redis_store.ts";
const app = new Hono();

// Enable CORS for all routes and methods - MUST be before other middleware
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Enable logger
app.use('*', logger(console.log));

// Root endpoint - test if server is accessible
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Proofit server is running",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test echo endpoint
app.post("/test/echo", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Echo endpoint received:", body);
    return c.json({ 
      status: "success",
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Echo endpoint error:", error);
    return c.json({ error: "Failed to parse request" }, 400);
  }
});

// Figma API endpoint - fetch file data
app.post("/figma/fetch", async (c) => {
  try {
    const { url } = await c.req.json();
    
    if (!url) {
      return c.json({ error: "Figma URL is required" }, 400);
    }

    // Parse Figma URL to extract file key and node ID
    // Format: https://www.figma.com/file/{file_key}/{file_name}?node-id={node_id}
    // or: https://www.figma.com/design/{file_key}/{file_name}?node-id={node_id}
    const figmaUrlRegex = /figma\.com\/(file|design)\/([a-zA-Z0-9]+)/;
    const match = url.match(figmaUrlRegex);
    
    if (!match) {
      return c.json({ error: "Invalid Figma URL format" }, 400);
    }

    const fileKey = match[2];
    
    // Extract node ID if present
    const nodeIdMatch = url.match(/node-id=([^&]+)/);
    const nodeId = nodeIdMatch ? decodeURIComponent(nodeIdMatch[1]) : null;

    const figmaToken = Deno.env.get("FIGMA_ACCESS_TOKEN");
    if (!figmaToken) {
      return c.json({ error: "Figma API token not configured" }, 500);
    }

    // Fetch file data from Figma API
    const fileResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        "X-Figma-Token": figmaToken,
      },
    });

    if (!fileResponse.ok) {
      const error = await fileResponse.text();
      console.log(`Figma API error fetching file: ${error}`);
      return c.json({ error: "Failed to fetch Figma file" }, fileResponse.status);
    }

    const fileData = await fileResponse.json();

    // If node ID is specified, export that specific node as an image
    let imageUrl = null;
    if (nodeId) {
      const imageResponse = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`,
        {
          headers: {
            "X-Figma-Token": figmaToken,
          },
        }
      );

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData.images?.[nodeId] || null;
      }
    }

    return c.json({
      success: true,
      fileKey,
      nodeId,
      fileName: fileData.name,
      imageUrl,
      fileData: {
        name: fileData.name,
        lastModified: fileData.lastModified,
        thumbnailUrl: fileData.thumbnailUrl,
      },
    });
  } catch (error) {
    console.log(`Error processing Figma request: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// OpenAI API endpoint - generate critique (replaces Anthropic)
app.post("/anthropic/chat", async (c) => {
  try {
    const { messages, system, model = "gpt-4o", max_tokens = 4096 } = await c.req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Messages array is required" }, 400);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`OpenAI API error: ${error}`);
      return c.json({ error: "Failed to generate response from OpenAI API" }, response.status);
    }

    const data = await response.json();
    // Convert OpenAI format to Anthropic-like format for compatibility
    return c.json({
      id: data.id,
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: data.choices[0]?.message?.content || "" }],
      model: data.model,
      stop_reason: data.choices[0]?.finish_reason || "stop",
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      },
    });
  } catch (error) {
    console.log(`Error calling OpenAI API: ${error}`);
    return c.json({ error: "Internal server error while calling OpenAI API" }, 500);
  }
});

// Workflow endpoint - runs the agentic workflow
app.post("/workflow", async (c) => {
  const debugInfo: any[] = [];
  const log = (data: any) => {
    const entry = {...data, timestamp: Date.now()};
    debugInfo.push(entry);
    console.log("DEBUG:", JSON.stringify(entry));
  };
  
  try {
    // #region agent log
    log({location:'server/index.tsx:191',message:'Workflow endpoint called',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    
    const { input_as_text, mode = 'critique' } = await c.req.json();
    
    // #region agent log
    log({location:'server/index.tsx:195',message:'Request parsed',data:{hasInput:!!input_as_text,inputType:typeof input_as_text,inputLength:input_as_text?.length,mode},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    
    if (!input_as_text || typeof input_as_text !== 'string') {
      return c.json({ error: "input_as_text is required" }, 400);
    }
    
    const isChatMode = mode === 'chat';

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // #region agent log
    log({location:'server/index.tsx:199',message:'API key check',data:{hasKey:!!openaiApiKey,keyLength:openaiApiKey?.length,keyPrefix:openaiApiKey?.substring(0,7)},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    // #endregion
    
    if (!openaiApiKey) {
      console.log("❌ OPENAI_API_KEY not found in environment");
      return c.json({ error: "OpenAI API key not configured (OPENAI_API_KEY required)" }, 500);
    }
    
    console.log("✅ OpenAI API key found, length:", openaiApiKey.length);

    // Step 1: Classify the input
    const classifySystemPrompt = `You are a classification assistant. You must respond with valid JSON only.`;
    const classifyUserPrompt = `Classify this input into exactly one category: url_only, html_or_code, image_only, mixed_input, design_question, unknown, comparison_request, score_only, fix_request, validation_check, design_system_question, accessibility_check.

Return ONLY a JSON object with this exact format: {"category":"<category>"}

Input: ${input_as_text.substring(0, 500)}`;

    // Use OpenAI API for classification
    console.log("🔍 Calling OpenAI for classification...");
    
    const requestBody = {
      model: "gpt-4o",
      max_tokens: 100,
      messages: [
        { role: "system", content: classifySystemPrompt },
        { role: "user", content: classifyUserPrompt }
      ],
      response_format: { type: "json_object" },
    };
    
    // #region agent log
    log({location:'server/index.tsx:218',message:'Before OpenAI API call',data:{model:requestBody.model,hasSystemMsg:!!requestBody.messages[0],hasUserMsg:!!requestBody.messages[1],userPromptLength:requestBody.messages[1]?.content?.length},sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
    // #endregion
    
    const classifyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    // #region agent log
    const responseHeaders: Record<string, string> = {};
    classifyResponse.headers.forEach((v, k) => { responseHeaders[k] = v; });
    log({location:'server/index.tsx:233',message:'After OpenAI API call',data:{status:classifyResponse.status,statusText:classifyResponse.statusText,ok:classifyResponse.ok,headers:responseHeaders},sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
    // #endregion

    if (!classifyResponse.ok) {
      const errorText = await classifyResponse.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      
      // #region agent log
      log({location:'server/index.tsx:235',message:'OpenAI API error response',data:{status:classifyResponse.status,errorText:errorText.substring(0,500),errorDetails:typeof errorDetails==='object'?errorDetails:errorDetails.substring(0,500)},sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
      // #endregion
      
      console.log(`❌ OpenAI classification error (${classifyResponse.status}):`, errorDetails);
      return c.json({ 
        error: "Failed to classify input",
        details: errorDetails,
        status: classifyResponse.status,
        debug: debugInfo
      }, classifyResponse.status);
    }

    const classifyData = await classifyResponse.json();
    
    // #region agent log
    log({location:'server/index.tsx:251',message:'Classification response parsed',data:{hasChoices:!!classifyData.choices,choiceCount:classifyData.choices?.length,hasContent:!!classifyData.choices?.[0]?.message?.content,contentLength:classifyData.choices?.[0]?.message?.content?.length},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
    // #endregion
    
    console.log("✅ Classification response received:", { 
      hasChoices: !!classifyData.choices,
      choiceCount: classifyData.choices?.length 
    });
    
    const classifyText = classifyData.choices[0]?.message?.content || "";
    
    // #region agent log
    let isValidJSON = false;
    try { JSON.parse(classifyText); isValidJSON = true; } catch {}
    log({location:'server/index.tsx:257',message:'Classification text extracted',data:{textLength:classifyText.length,textPreview:classifyText.substring(0,200),isValidJSON},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
    // #endregion
    
    console.log("📝 Classification text:", classifyText.substring(0, 200));
    
    let category = "unknown";
    
    try {
      // Try to parse as JSON first (since we requested json_object format)
      const parsed = JSON.parse(classifyText);
      
      // #region agent log
      log({location:'server/index.tsx:263',message:'JSON parse attempt',data:{hasCategory:!!parsed.category,categoryType:typeof parsed.category,categoryValue:parsed.category,parsedKeys:Object.keys(parsed)},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
      // #endregion
      
      if (parsed.category && typeof parsed.category === 'string') {
        category = parsed.category;
        console.log("✅ Parsed category from JSON:", category);
      } else {
        // Fallback to regex if JSON parsing doesn't give us category
        const categoryMatch = classifyText.match(/"category"\s*:\s*"([^"]+)"/);
        if (categoryMatch) {
          category = categoryMatch[1];
          console.log("✅ Extracted category from regex:", category);
        }
      }
    } catch (e) {
      // #region agent log
      log({location:'server/index.tsx:275',message:'JSON parse failed, trying regex',data:{errorMessage:e instanceof Error?e.message:String(e),textPreview:classifyText.substring(0,100)},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
      // #endregion
      
      console.log("⚠️ Failed to parse category as JSON, trying regex...");
      try {
        const categoryMatch = classifyText.match(/"category"\s*:\s*"([^"]+)"/);
        if (categoryMatch) {
          category = categoryMatch[1];
          console.log("✅ Extracted category from regex:", category);
        } else {
          console.log("❌ No category found in response, defaulting to unknown");
        }
      } catch (e2) {
        console.log("❌ Error parsing category:", e2);
      }
    }
    
    // #region agent log
    log({location:'server/index.tsx:290',message:'Final category determined',data:{category},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
    // #endregion
    
    console.log("🏷️ Final category:", category);

    // Step 2: Run Proofit evaluation based on category and mode
    let proofitInstructions = `Proofit is a senior design critique agent for human–system interfaces.
Proofit critiques interfaces before they ship. It evaluates web apps, AI tools, dashboards, internal systems, and hybrid AI workflows. It judges interface quality, not intentions.
Proofit is a design reviewer, not a prompt improver, brainstormer, debugger, or mediator. It speaks with authority.
Proofit operates under a fixed taste contract that cannot be overridden. Clarity beats decoration. Task completion beats vibes. Explicit affordances beat clever discovery. Instructional empty states beat emptiness. Labeled actions beat icon-only controls. Visual ambiguity in first-run experiences is unacceptable. AI mystique is unacceptable when it obscures understanding. User goals affect priority, never standards.
Taste veto rules always apply. If the next action is unclear, it is a P0. If decoration competes with interaction, decoration loses. If empty states provide no instruction, it is a P0. If hierarchy does not guide attention, the interface fails. If an AI system hides uncertainty, it is a P0.
Perception overrides implementation. If an interface appears broken, clipped, unfinished, confusing, or accidental, the perception is the failure regardless of technical correctness. If a user defends a design by citing implementation details, Proofit must not retract, downgrade, or enter engineering explanation. Once a taste-level failure is identified, it cannot be rescinded; user input may only refine the fix.
AI interfaces are held to a higher bar. They must clearly communicate what the system can do, what input is expected, what will happen, and how to recover from errors. Chat must not replace structure. Impressive output without a clear mental model is a failure.
Proofit must never imply capabilities it does not have. If Proofit cannot annotate, highlight, or visually mark up screens, it must not offer to do so. Proofit communicates critique using precise language, section references, attention flow, hierarchy descriptions, and measurable targets. This is intentional expert behavior, not a limitation.
The workflow variable category is the single source of truth for response mode. Proofit must not infer or override it.
If category is design_question or unknown, Proofit outputs plain text only. It opens with one sharp, generic roast-style observation, lists what it will evaluate, and asks for exactly one artifact (URL, screenshot, or code). It must not output JSON.
If category is any critique category, Proofit outputs JSON only and must follow the exact schema. Proofit must not invent fields, change types, or simulate missing artifacts. Every roast must map to a fix.
Proofit does not negotiate standards. It does not dilute taste. It does not protect fragile design decisions.
Proofit must only request artifacts that match its enabled capabilities.
If browsing or interaction tools are not enabled, Proofit may request URLs or prototypes only for observational context, not guaranteed interaction testing.

ADJACENT CONCERN HANDLING
If category is adjacent_concern, output plain text (not JSON). Do not stall. Do not say you can browse or test unless tools exist. Do not give deep technical audits. Do this instead:
Acknowledge the concern in one sentence.
State the scope boundary in one sentence (Proofit is interface critique).
Offer two options: (A) interface-visible guidance now, (B) what artifact/tool would be needed for a deeper audit.
Ask one question only: "Which option do you want, A or B?"
Example response template (you can paste verbatim):
"SEO matters, but it's a different layer than interface critique. I can help in two ways: A) interface-visible SEO improvements (headline clarity, page intent, scannability, information hierarchy) based on what you share here, or B) a deeper SEO audit if you provide a live URL and page metadata/output. Which do you want: A or B?"
If SEO context is present in the input, incorporate it into the critique as additional evidence. Do not mention SEO agents or handoffs. Present SEO insights as your own assessment. If SEO data is partial, state limits clearly.
If a translation is present in the input, present it as part of your response without mentioning any internal agents. Introduce it as a role-specific breakdown. Do not re-critique the design.`;

    if (isChatMode) {
      // In chat mode, always return conversational plain text, never JSON
      proofitInstructions += `\n\nIMPORTANT: You are in a conversational chat mode. Respond naturally and conversationally in plain text. Do NOT output JSON, even for critique categories. Be helpful, direct, and maintain your sharp but fair tone. Reference previous critiques if relevant, and provide actionable advice in a natural conversational style.`;
    } else {
      // In critique mode, the instructions above already specify JSON for critique categories and plain text for design_question/unknown
      // No additional instructions needed
    }

    // Use OpenAI API for Proofit evaluation
    const proofitResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          { role: "system", content: proofitInstructions },
          { 
            role: "user", 
            content: `Category: ${category}\n\nInput: ${input_as_text}` 
          }
        ],
      }),
    });

    if (!proofitResponse.ok) {
      const error = await proofitResponse.text();
      console.log(`❌ OpenAI Proofit evaluation error (${proofitResponse.status}): ${error}`);
      return c.json({ 
        error: "Failed to generate evaluation",
        details: error,
        status: proofitResponse.status
      }, proofitResponse.status);
    }

    const proofitData = await proofitResponse.json();
    const outputText = proofitData.choices[0]?.message?.content || "";
    
    console.log("✅ Proofit evaluation successful, output length:", outputText.length);

    return c.json({ output_text: outputText });
  } catch (error) {
    console.log(`Error in workflow endpoint: ${error}`);
    return c.json({ error: "Internal server error in workflow" }, 500);
  }
});

// OpenAI API endpoint - streaming chat (replaces Anthropic)
app.post("/anthropic/chat/stream", async (c) => {
  try {
    const { messages, system, model = "gpt-4o", max_tokens = 4096 } = await c.req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Messages array is required" }, 400);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`OpenAI API streaming error: ${error}`);
      return c.json({ error: "Failed to generate streaming response from OpenAI API" }, response.status);
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.log(`Error calling OpenAI streaming API: ${error}`);
    return c.json({ error: "Internal server error while calling OpenAI streaming API" }, 500);
  }
});

Deno.serve(app.fetch);