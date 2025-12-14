// Mock API - No backend calls

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

// Mock non-streaming API call
export async function callAnthropicAPI(
  messages: AnthropicMessage[],
  system?: string,
  model: string = 'claude-opus-4-20250514',
  maxTokens: number = 4096
): Promise<AnthropicResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    id: 'mock-' + Date.now(),
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: 'Mock response - backend disabled'
    }],
    model,
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 50
    }
  };
}

// Mock streaming API - returns empty generator
export async function* streamAnthropicAPI(
  messages: AnthropicMessage[],
  system?: string,
  model: string = 'claude-opus-4-20250514',
  maxTokens: number = 4096
): AsyncGenerator<string, void, unknown> {
  // This function is now disabled
  return;
}
