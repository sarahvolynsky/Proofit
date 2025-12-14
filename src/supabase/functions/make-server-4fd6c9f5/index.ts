import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

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

// Root endpoint - test if server is accessible at all
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Proofit server is running",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
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
    console.log("Echo endpoint error:", error);
    return c.json({ error: "Failed to parse request" }, 400);
  }
});

// Anthropic API endpoint - generate critique
app.post("/anthropic/chat", async (c) => {
  try {
    console.log("Chat endpoint hit!");
    const { messages, system, model = "claude-3-5-sonnet-20241022", max_tokens = 4096 } = await c.req.json();
    console.log("Received", messages?.length, "messages");
    
    if (!messages || !Array.isArray(messages)) {
      console.log("Invalid messages array");
      return c.json({ error: "Messages array is required" }, 400);
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      console.log("Missing Anthropic API key");
      return c.json({ error: "Anthropic API key not configured" }, 500);
    }

    console.log("Calling Anthropic API...");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages,
        ...(system && { system }),
      }),
    });

    console.log("Anthropic API response status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log(`Anthropic API error: ${error}`);
      return c.json({ error: "Failed to generate response from Anthropic API", details: error }, response.status);
    }

    const data = await response.json();
    console.log("Successfully received Anthropic response");
    return c.json(data);
  } catch (error) {
    console.log(`Error calling Anthropic API: ${error}`);
    return c.json({ error: "Internal server error while calling Anthropic API", details: String(error) }, 500);
  }
});

// Anthropic API endpoint - streaming chat
app.post("/anthropic/chat/stream", async (c) => {
  try {
    const { messages, system, model = "claude-3-5-sonnet-20241022", max_tokens = 4096 } = await c.req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: "Messages array is required" }, 400);
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return c.json({ error: "Anthropic API key not configured" }, 500);
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages,
        stream: true,
        ...(system && { system }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`Anthropic streaming API error: ${error}`);
      return c.json({ error: "Failed to generate streaming response from Anthropic API" }, response.status);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.log(`Error calling Anthropic streaming API: ${error}`);
    return c.json({ error: "Internal server error while calling Anthropic streaming API" }, 500);
  }
});

// Figma API endpoint - fetch design
app.post("/figma/fetch", async (c) => {
  try {
    const { url } = await c.req.json();
    
    if (!url || typeof url !== 'string') {
      return c.json({ error: "Figma URL is required" }, 400);
    }

    // Extract file key from URL
    const fileKeyMatch = url.match(/\/file\/([a-zA-Z0-9]+)/);
    if (!fileKeyMatch) {
      return c.json({ error: "Invalid Figma URL format" }, 400);
    }

    const fileKey = fileKeyMatch[1];
    const figmaAccessToken = Deno.env.get("FIGMA_ACCESS_TOKEN");
    
    if (!figmaAccessToken) {
      return c.json({ error: "Figma access token not configured" }, 500);
    }

    // Fetch file data from Figma API
    const figmaResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': figmaAccessToken,
      },
    });

    if (!figmaResponse.ok) {
      const error = await figmaResponse.text();
      console.log(`Figma API error: ${error}`);
      return c.json({ error: "Failed to fetch from Figma API" }, figmaResponse.status);
    }

    const fileData = await figmaResponse.json();

    // Get image URL for the first page
    const firstPage = fileData.document?.children?.[0];
    if (!firstPage) {
      return c.json({ error: "No pages found in Figma file" }, 400);
    }

    // Request image render
    const imageResponse = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${firstPage.id}&format=png&scale=2`,
      {
        headers: {
          'X-Figma-Token': figmaAccessToken,
        },
      }
    );

    if (!imageResponse.ok) {
      const error = await imageResponse.text();
      console.log(`Figma image API error: ${error}`);
      return c.json({ error: "Failed to fetch image from Figma API" }, imageResponse.status);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.images?.[firstPage.id];

    if (!imageUrl) {
      return c.json({ error: "Failed to generate image URL" }, 500);
    }

    return c.json({
      imageUrl,
      fileName: fileData.name || 'Figma Design',
      fileKey,
    });
  } catch (error) {
    console.log(`Error fetching Figma design: ${error}`);
    return c.json({ error: "Internal server error while fetching Figma design" }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);
