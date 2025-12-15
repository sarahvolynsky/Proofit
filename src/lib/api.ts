import { projectId, publicAnonKey } from '../utils/supabase/info';

// ChatKit server URL - can be overridden via environment variable
// Default to localhost:8000 for development
const CHATKIT_SERVER_URL = (import.meta.env?.VITE_CHATKIT_SERVER_URL as string) || 'http://localhost:8000';

// Use ChatKit server for workflow endpoints
const BASE_URL = CHATKIT_SERVER_URL;

// Keep Supabase URL for fallback or other endpoints
const SUPABASE_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4fd6c9f5`;

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Call workflow endpoint on edge function
export async function callWorkflow(
  inputText: string, 
  mode: 'critique' | 'chat' = 'critique',
  imageDataUrls?: string[],
  conversationHistory?: Array<{role: string, content: Array<{type: string, text: string}>}>,
  audience?: string,
  platform?: string
): Promise<{ output_text: string }> {
  const body: { 
    input_as_text: string; 
    mode: string; 
    images?: Array<{data: string; media_type: string}>;
    conversation_history?: Array<{role: string, content: Array<{type: string, text: string}>}>;
    audience?: string;
    platform?: string;
  } = {
    input_as_text: inputText,
    mode,
  };
  
  if (audience) {
    body.audience = audience;
  }
  
  if (platform) {
    body.platform = platform;
  }
  
  if (conversationHistory && conversationHistory.length > 0) {
    body.conversation_history = conversationHistory;
  }

  // If images are provided, extract base64 data and media type for each (up to 3)
  if (imageDataUrls && imageDataUrls.length > 0) {
    const imagesToSend = imageDataUrls.slice(0, 3); // Limit to 3 images
    body.images = imagesToSend.map((imageDataUrl) => {
      // Data URL format: data:image/png;base64,<base64data>
      const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          data: matches[2], // base64 data
          media_type: matches[1] // e.g., image/png
        };
      } else {
        // If it's already just base64, assume PNG
        return {
          data: imageDataUrl,
          media_type: 'image/png'
        };
      }
    });
  }

  // Use ChatKit server workflow endpoint
  const response = await fetch(`${BASE_URL}/workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // ChatKit server doesn't require Supabase auth, but we can pass user context
      ...(import.meta.env?.VITE_USER_ID && { 'X-User-ID': import.meta.env.VITE_USER_ID as string }),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Workflow API error:', error);
    throw new Error(`Failed to call workflow: ${response.status} ${error}`);
  }

  return response.json();
}

// Call OpenAI API via edge function (route name kept for compatibility)
export async function callAnthropicAPI(
  messages: AnthropicMessage[],
  system?: string,
  model: string = 'gpt-4o',
  maxTokens: number = 4096
): Promise<AnthropicResponse> {
  const response = await fetch(`${BASE_URL}/anthropic/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({
      messages,
      system,
      model,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to call OpenAI API: ${response.status} ${error}`);
  }

  return response.json();
}

// Streaming API - returns empty generator (disabled for now)
export async function* streamAnthropicAPI(
  messages: AnthropicMessage[],
  system?: string,
  model: string = 'gpt-4o',
  maxTokens: number = 4096
): AsyncGenerator<string, void, unknown> {
  // This function is now disabled
  return;
}
