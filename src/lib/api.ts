import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/server`;

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

export async function callAnthropicAPI(
  messages: AnthropicMessage[],
  system?: string,
  model: string = 'claude-3-5-sonnet-20241022',
  maxTokens: number = 4096
): Promise<AnthropicResponse> {
  const response = await fetch(`${BASE_URL}/make-server-4fd6c9f5/anthropic/chat`, {
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
    console.error('Anthropic API error:', error);
    throw new Error(`Failed to call Anthropic API: ${response.status} ${error}`);
  }

  return response.json();
}

export async function* streamAnthropicAPI(
  messages: AnthropicMessage[],
  system?: string,
  model: string = 'claude-3-5-sonnet-20241022',
  maxTokens: number = 4096
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${BASE_URL}/make-server-4fd6c9f5/anthropic/chat/stream`, {
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
    console.error('Anthropic streaming API error:', error);
    throw new Error(`Failed to call Anthropic streaming API: ${response.status} ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            // Handle different event types
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              yield parsed.delta.text;
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}