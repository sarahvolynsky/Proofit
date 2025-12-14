import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
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
app.get("/make-server-4fd6c9f5/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test echo endpoint
app.post("/make-server-4fd6c9f5/test/echo", async (c) => {
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
app.post("/make-server-4fd6c9f5/figma/fetch", async (c) => {
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

// Anthropic API endpoint - generate critique
app.post("/make-server-4fd6c9f5/anthropic/chat", async (c) => {
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
        ...(system && { system }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`Anthropic API error: ${error}`);
      return c.json({ error: "Failed to generate response from Anthropic API" }, response.status);
    }

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.log(`Error calling Anthropic API: ${error}`);
    return c.json({ error: "Internal server error while calling Anthropic API" }, 500);
  }
});

// Anthropic API endpoint - streaming chat
app.post("/make-server-4fd6c9f5/anthropic/chat/stream", async (c) => {
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
      console.log(`Anthropic API streaming error: ${error}`);
      return c.json({ error: "Failed to generate streaming response from Anthropic API" }, response.status);
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
    console.log(`Error calling Anthropic streaming API: ${error}`);
    return c.json({ error: "Internal server error while calling Anthropic streaming API" }, 500);
  }
});

Deno.serve(app.fetch);