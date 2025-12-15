import { Hono } from "npm:hono@4.6.11";
import { cors } from "npm:hono@4.6.11/cors";

const app = new Hono();

// Enable CORS
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Root endpoint - handle both / and /make-server-4fd6c9f5/
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Proofit server is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/make-server-4fd6c9f5/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Proofit server is running",
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/make-server-4fd6c9f5/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Redis health check endpoint
app.get("/make-server-4fd6c9f5/redis/health", async (c) => {
  try {
    const redis = await import("./redis_store.ts");
    await redis.set("health_check", { timestamp: Date.now() });
    const value = await redis.get("health_check");
    await redis.del("health_check");
    return c.json({ 
      status: "ok", 
      redis: "connected",
      test: value ? "passed" : "failed",
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return c.json({ 
      status: "error", 
      redis: "disconnected",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString() 
    }, 500);
  }
});

// Workflow endpoint
app.post("/workflow", async (c) => {
  try {
    const { input_as_text, mode = 'critique', image, image_media_type } = await c.req.json();
    
    if (!input_as_text || typeof input_as_text !== 'string') {
      return c.json({ error: "input_as_text is required" }, 400);
    }
    
    const isChatMode = mode === 'chat';
    const hasImage = !!image && !!image_media_type;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiApiKey) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    // Import Redis for caching
    const redis = await import("./redis_store.ts");
    
    // Create cache key based on input (hash for images)
    // Use a simple hash function for Deno (no Buffer)
    const hashString = (str: string): string => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36);
    };
    
    const cacheKey = hasImage 
      ? `workflow:${mode}:${hashString(input_as_text + image.substring(0, 100))}`
      : `workflow:${mode}:${hashString(input_as_text)}`;
    
    // Try to get from cache first (only for critique mode, not chat)
    if (!isChatMode) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached && typeof cached === 'string') {
          console.log("✅ Returning cached workflow result");
          return c.json({ output_text: cached, cached: true });
        }
      } catch (cacheError) {
        console.warn("⚠️ Cache read failed, continuing with API call:", cacheError);
        // Continue with API call if cache fails
      }
    }

    // Step 1: Classify the input
    const classifySystemPrompt = `You are a classification assistant. You must respond with valid JSON only.`;
    const classifyUserPrompt = `Classify this input into exactly one category: url_only, html_or_code, image_only, mixed_input, design_question, unknown, comparison_request, score_only, fix_request, validation_check, design_system_question, accessibility_check.

Return ONLY a JSON object with this exact format: {"category":"<category>"}

Input: ${input_as_text.substring(0, 500)}`;

    console.log("🔍 Calling OpenAI for classification...", { hasImage });

    // Build classification messages - include image if present
    const classifyMessages: any[] = [
      { role: "system", content: classifySystemPrompt }
    ];

    if (hasImage) {
      // Use vision API format for classification
      classifyMessages.push({
        role: "user",
        content: [
          { type: "text", text: classifyUserPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${image_media_type};base64,${image}`
            }
          }
        ]
      });
    } else {
      classifyMessages.push({ role: "user", content: classifyUserPrompt });
    }
    
    const classifyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 100,
        messages: classifyMessages,
        response_format: { type: "json_object" },
      }),
    });

    if (!classifyResponse.ok) {
      const errorText = await classifyResponse.text();
      console.log(`❌ OpenAI classification error (${classifyResponse.status}):`, errorText);
      return c.json({ 
        error: "Failed to classify input",
        details: errorText.substring(0, 500),
        status: classifyResponse.status
      }, classifyResponse.status);
    }

    const classifyData = await classifyResponse.json();
    const classifyText = classifyData.choices[0]?.message?.content || "";
    
    let category = "unknown";
    try {
      const parsed = JSON.parse(classifyText);
      if (parsed.category && typeof parsed.category === 'string') {
        category = parsed.category;
      }
    } catch (e) {
      const categoryMatch = classifyText.match(/"category"\s*:\s*"([^"]+)"/);
      if (categoryMatch) {
        category = categoryMatch[1];
      }
    }

    console.log("🏷️ Category:", category);

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

OUTPUT FORMAT FOR CRITIQUE CATEGORIES (url_only, html_or_code, image_only, mixed_input, comparison_request, score_only, fix_request, validation_check, design_system_question, accessibility_check):
For critique categories, you MUST provide a full critique. Do NOT ask for more information. Analyze what is provided and give actionable feedback.

Output structured plain text (NOT JSON) in this exact format:

1. Opening: One sharp, roast-style observation (1-2 sentences max)
2. Evaluation areas: "I'm evaluating:" followed by a bulleted list of:
   - Primary action clarity (what do I do first, and how do I succeed?)
   - Information hierarchy (what draws attention, and is it correct?)
   - Affordances + labeling (are actions obvious without guessing?)
   - Empty states + onboarding (does first-run teach me what to do?)
   - Layout integrity (anything that looks clipped/broken/accidental)
   - AI UX transparency (what input is expected, what output I'll get, how to recover)
3. Issues section: "What's failing (based on this [screenshot/URL/code])" followed by prioritized issues:
   - P0 issues (critical, blocking) - MUST include at least one if issues exist
   - P1 issues (important, high impact)
   - P2 issues (nice to have, lower priority)
   Each issue must include:
   - Priority label (P0, P1, or P2) followed by "—" (em dash)
   - Title: Brief, specific problem statement
   - Description: Detailed explanation of the problem
   - Fix: Specific, actionable fix instruction starting with "Fix:"

CRITICAL: If an image, URL, or code is provided, you MUST analyze it and provide the full critique format above. Do NOT ask for more information. Even if the artifact is partial or unclear, provide your best analysis based on what you can see.

Example format:
"[Sharp roast observation]

I'm evaluating:
• Primary action clarity (what do I do first, and how do I succeed?)
• Information hierarchy (what draws attention, and is it correct?)
• Affordances + labeling (are actions obvious without guessing?)
• Empty states + onboarding (does first-run teach me what to do?)
• Layout integrity (anything that looks clipped/broken/accidental)
• AI UX transparency (what input is expected, what output I'll get, how to recover)

What's failing (based on this screenshot)
P0 — [Title]
[Description]
Fix: [Specific actionable fix]

P1 — [Title]
[Description]
Fix: [Specific actionable fix]

P2 — [Title]
[Description]
Fix: [Specific actionable fix]"

If category is design_question or unknown, output plain text only. It opens with one sharp, generic roast-style observation, lists what it will evaluate, and asks for exactly one artifact (URL, screenshot, or code). It must not output JSON.

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

    // Build Proofit evaluation messages - include image if present
    const proofitMessages: any[] = [
      { role: "system", content: proofitInstructions }
    ];

    if (hasImage) {
      // Use vision API format for evaluation
      proofitMessages.push({
        role: "user",
        content: [
          { type: "text", text: `Category: ${category}\n\nInput: ${input_as_text}` },
          {
            type: "image_url",
            image_url: {
              url: `data:${image_media_type};base64,${image}`
            }
          }
        ]
      });
    } else {
      proofitMessages.push({
        role: "user",
        content: `Category: ${category}\n\nInput: ${input_as_text}`
      });
    }

    console.log("🔍 Calling OpenAI for Proofit evaluation...", { hasImage, category });

    const proofitResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: proofitMessages,
      }),
    });

    if (!proofitResponse.ok) {
      const errorText = await proofitResponse.text();
      console.log(`❌ OpenAI Proofit evaluation error (${proofitResponse.status}):`, errorText);
      return c.json({ 
        error: "Failed to generate evaluation",
        details: errorText.substring(0, 500),
        status: proofitResponse.status
      }, proofitResponse.status);
    }

    const proofitData = await proofitResponse.json();
    const outputText = proofitData.choices[0]?.message?.content || "";
    
    console.log("✅ Proofit evaluation successful");

    // Cache the result in Redis (only for critique mode, cache for 1 hour)
    if (!isChatMode) {
      try {
        await redis.setex(cacheKey, outputText, 3600); // 1 hour TTL
        console.log("✅ Cached workflow result in Redis");
      } catch (cacheError) {
        console.warn("⚠️ Failed to cache result:", cacheError);
        // Don't fail the request if caching fails
      }
    }

    return c.json({ output_text: outputText });
  } catch (error) {
    console.log(`Error in workflow endpoint: ${error}`);
    return c.json({ error: "Internal server error in workflow", details: String(error) }, 500);
  }
});

// Also handle workflow with function name prefix
app.post("/make-server-4fd6c9f5/workflow", async (c) => {
  // Delegate to the main workflow handler
  return app.fetch(new Request(c.req.url.replace("/make-server-4fd6c9f5/workflow", "/workflow"), {
    method: c.req.method,
    headers: c.req.header(),
    body: c.req.raw.body,
  }));
});

Deno.serve(app.fetch);
