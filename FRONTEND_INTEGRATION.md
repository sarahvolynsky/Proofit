# Frontend Integration with ChatKit Server

## Overview

The frontend has been updated to integrate with the ChatKit server running on `http://localhost:8000`.

## Configuration

### Environment Variables

Create a `.env` file in the project root (or set in your deployment):

```env
# ChatKit Server URL
VITE_CHATKIT_SERVER_URL=http://localhost:8000

# Optional: User context
VITE_USER_ID=user_123
VITE_USER_ROLES=user,admin
VITE_USER_PERMISSIONS=read,write
```

### Default Behavior

- If `VITE_CHATKIT_SERVER_URL` is not set, defaults to `http://localhost:8000`
- The frontend will automatically use the ChatKit server for workflow requests

## API Integration

### Workflow Endpoint

The frontend calls `/workflow` endpoint on the ChatKit server:

```typescript
// From src/lib/api.ts
callWorkflow(inputText, mode, imageDataUrl)
```

**Request:**
```json
{
  "input_as_text": "Analyze this code...",
  "mode": "critique" | "chat",
  "image": "base64encoded...",  // Optional
  "image_media_type": "image/png"  // Optional
}
```

**Response:**
```json
{
  "output_text": "Critique or response text..."
}
```

### ChatKit Protocol (Optional)

For full ChatKit protocol support, use the `chatkit.ts` client:

```typescript
import { sendChatKitMessage, createChatKitThread } from './lib/chatkit';

// Create a thread
const threadId = await createChatKitThread({
  session_type: 'critique',
  goal: 'conversion'
});

// Send a message
const result = await sendChatKitMessage(threadId, "Analyze this design", {
  user_id: 'user_123',
  user_roles: ['user']
});
```

## Current Implementation

### Files Updated

1. **`src/lib/api.ts`**
   - Updated `BASE_URL` to use ChatKit server
   - Removed Supabase auth requirement for workflow endpoint
   - Added support for user context headers

2. **`src/lib/chatkit.ts`** (New)
   - ChatKit protocol client
   - Thread management
   - Streaming response handling

### Integration Points

- **`src/lib/agent.ts`**
  - `analyzeCode()` - Calls `/workflow` endpoint
  - `sendChatMessage()` - Calls `/workflow` endpoint in chat mode

- **`src/App.tsx`**
  - Uses `analyzeCode()` and `sendChatMessage()` from `agent.ts`
  - No changes needed - works with updated API

## Testing

### 1. Start ChatKit Server

```bash
python3.14 run_chatkit.py
```

Server should be running on `http://localhost:8000`

### 2. Start Frontend

```bash
npm run dev
```

### 3. Test Workflow

The frontend will automatically use the ChatKit server when:
- Submitting a critique (calls `/workflow` with `mode: 'critique'`)
- Sending a chat message (calls `/workflow` with `mode: 'chat'`)

## CORS Configuration

The ChatKit server has CORS enabled for all origins in development. For production:

1. Update `chatkit_server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Connection Errors

- **Error: "Failed to fetch"**
  - Check if ChatKit server is running: `curl http://localhost:8000/health`
  - Verify `VITE_CHATKIT_SERVER_URL` is correct

- **CORS Errors**
  - Ensure ChatKit server CORS middleware is configured
  - Check browser console for specific CORS error

### Workflow Errors

- **Error: "Failed to call workflow"**
  - Check ChatKit server logs
  - Verify workflow.py is accessible
  - Check that OpenAI API key is configured in the server

## Next Steps

1. **Full ChatKit Protocol Integration**
   - Use `/chatkit` endpoint for thread management
   - Implement streaming responses
   - Add thread persistence

2. **Image Support**
   - Update workflow.py to handle images
   - Pass images through ChatKit protocol

3. **Authentication**
   - Add user authentication
   - Pass user context in headers

