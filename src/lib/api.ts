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
  const url = `${BASE_URL}/make-server-4fd6c9f5/anthropic/chat`;
  console.log('Calling Anthropic API at:', url);
  console.log('With system prompt:', system?.substring(0, 100));
  console.log('With', messages.length, 'messages');
  
  try {
    const response = await fetch(url, {
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

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error response:', error);
      throw new Error(`Failed to call Anthropic API: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('Successfully received response from Anthropic API');
    return data;
  } catch (error) {
    console.error('Fetch error details:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - possible causes:');
      console.error('1. CORS issue');
      console.error('2. Edge function not deployed');
      console.error('3. Network connectivity');
      console.error('URL being called:', url);
    }
    throw error;
  }
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