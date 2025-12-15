/**
 * ChatKit client for interacting with the ChatKit server
 * Supports both ChatKit protocol and simple workflow endpoints
 */

const CHATKIT_SERVER_URL = import.meta.env.VITE_CHATKIT_SERVER_URL || 'http://localhost:8000';

export interface ChatKitContext {
  user_id?: string;
  user_roles?: string[];
  permissions?: string[];
}

/**
 * Send a message via ChatKit protocol
 */
export async function sendChatKitMessage(
  threadId: string | null,
  message: string,
  context?: ChatKitContext
): Promise<{ threadId: string; response: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add context headers if provided
  if (context?.user_id) {
    headers['X-User-ID'] = context.user_id;
  }
  if (context?.user_roles) {
    headers['X-User-Roles'] = context.user_roles.join(',');
  }
  if (context?.permissions) {
    headers['X-User-Permissions'] = context.permissions.join(',');
  }

  // Build ChatKit request
  const request: any = {
    type: 'streaming',
    thread: threadId ? { id: threadId } : undefined,
    input: {
      type: 'user_message',
      content: message,
    },
  };

  const response = await fetch(`${CHATKIT_SERVER_URL}/chatkit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ChatKit request failed: ${response.status} ${error}`);
  }

  // Handle streaming response
  if (response.headers.get('content-type')?.includes('text/event-stream')) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let threadId: string | null = null;
    let responseText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Extract thread ID from thread_created event
              if (data.type === 'thread_created' && data.thread?.id) {
                threadId = data.thread.id;
              }
              
              // Extract text from assistant message events
              if (data.type === 'thread_item_added' && data.item?.type === 'assistant_message') {
                if (data.item.content) {
                  responseText += typeof data.item.content === 'string' 
                    ? data.item.content 
                    : data.item.content.text || '';
                }
              }
              
              // Extract text deltas
              if (data.type === 'thread_item_content_part_text_delta' && data.delta) {
                responseText += data.delta;
              }
            } catch (e) {
              // Ignore parse errors for malformed JSON
            }
          }
        }
      }
    }

    return {
      threadId: threadId || 'new',
      response: responseText,
    };
  } else {
    // Non-streaming response
    const data = await response.json();
    return {
      threadId: data.thread?.id || 'new',
      response: data.response || '',
    };
  }
}

/**
 * Create a new thread with metadata
 */
export async function createChatKitThread(metadata?: Record<string, any>): Promise<string> {
  const response = await fetch(`${CHATKIT_SERVER_URL}/chatkit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'non_streaming',
      thread: {
        metadata: metadata || {},
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.status}`);
  }

  const data = await response.json();
  return data.thread?.id || 'new';
}

/**
 * Get thread information
 */
export async function getChatKitThread(threadId: string): Promise<any> {
  const response = await fetch(`${CHATKIT_SERVER_URL}/threads/${threadId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get thread: ${response.status}`);
  }

  return response.json();
}

