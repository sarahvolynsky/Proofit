# Proofit Backend Server

> **Note:** This backend is currently **not active**. The Proofit MVP is running as a 100% frontend-only application with mock data. This server is scaffolded for future backend integration.

## Overview

This is a Supabase Edge Function running a Hono web server that provides API endpoints for the Proofit design critique agent. The server acts as a middleware layer between the frontend and external services (Figma API, Anthropic AI).

## Architecture

```
Frontend → Edge Function Server → External APIs
                ↓
         Key-Value Store (PostgreSQL)
```

## Tech Stack

- **Runtime:** Deno (Supabase Edge Functions)
- **Framework:** Hono (lightweight web framework)
- **Database:** PostgreSQL with KV Store utilities
- **External APIs:** 
  - Figma API (design file fetching)
  - Anthropic Claude API (AI critique generation)

## File Structure

```
/supabase/functions/server/
├── index.tsx       # Main server with API routes
├── kv_store.tsx    # Key-Value store utilities (protected)
└── README.md       # This file
```

## API Routes

All routes are prefixed with `/make-server-4fd6c9f5`

### Health & Testing

#### `GET /`
Root endpoint - Server status check
```json
{
  "status": "ok",
  "message": "Proofit server is running",
  "timestamp": "2025-12-14T..."
}
```

#### `GET /make-server-4fd6c9f5/health`
Health check endpoint
```json
{
  "status": "ok",
  "timestamp": "2025-12-14T..."
}
```

#### `POST /make-server-4fd6c9f5/test/echo`
Echo test endpoint for debugging
```json
// Request
{
  "message": "Hello"
}

// Response
{
  "status": "success",
  "received": { "message": "Hello" },
  "timestamp": "2025-12-14T..."
}
```

### Figma Integration

#### `POST /make-server-4fd6c9f5/figma/fetch`
Fetch Figma file data and export images

**Request:**
```json
{
  "url": "https://www.figma.com/file/{file_key}/{file_name}?node-id={node_id}"
}
```

**Response:**
```json
{
  "success": true,
  "fileKey": "abc123...",
  "nodeId": "123:456",
  "fileName": "My Design",
  "imageUrl": "https://...",
  "fileData": {
    "name": "My Design",
    "lastModified": "2025-12-14T...",
    "thumbnailUrl": "https://..."
  }
}
```

**Supported URL Formats:**
- `https://www.figma.com/file/{file_key}/...`
- `https://www.figma.com/design/{file_key}/...`
- Optional: `?node-id={node_id}` for specific frame export

**Features:**
- Extracts file key and node ID from URL
- Fetches file metadata via Figma API
- Exports specific frames as PNG images (2x scale)
- Returns both file data and image URLs

### Anthropic AI Integration

#### `POST /make-server-4fd6c9f5/anthropic/chat`
Generate AI critique (non-streaming)

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Critique this design..."
    }
  ],
  "system": "You are a design critic...",
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096
}
```

**Response:**
Returns standard Anthropic API response format

#### `POST /make-server-4fd6c9f5/anthropic/chat/stream`
Generate AI critique (streaming)

**Request:** Same as non-streaming endpoint

**Response:** Server-Sent Events (SSE) stream
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

## Environment Variables

Required secrets (already configured):

- `FIGMA_ACCESS_TOKEN` - Figma Personal Access Token
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_DB_URL` - PostgreSQL database URL

## Key-Value Store

The server includes a pre-configured KV store backed by PostgreSQL:

```typescript
import * as kv from './kv_store.tsx';

// Available functions:
await kv.get(key)              // Get single value
await kv.set(key, value)       // Set single value
await kv.del(key)              // Delete single value
await kv.mget([key1, key2])    // Get multiple values
await kv.mset({k1: v1, k2: v2}) // Set multiple values
await kv.mdel([key1, key2])    // Delete multiple values
await kv.getByPrefix(prefix)   // Get all keys with prefix
```

**Table:** `kv_store_4fd6c9f5`

## CORS Configuration

- **Origin:** `*` (all origins allowed)
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Headers:** Content-Type, Authorization
- **Credentials:** Enabled

## Security Notes

1. **Protected Files:**
   - `/supabase/functions/server/kv_store.tsx` is protected - do not modify
   
2. **API Keys:**
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
   - All API keys are stored as environment variables
   - Use `publicAnonKey` for frontend requests

3. **Authorization:**
   - Use `Authorization: Bearer ${publicAnonKey}` header for requests
   - Service role key only used server-side

## Frontend Integration

### Making Requests

```typescript
import { projectId, publicAnonKey } from './utils/supabase/info';

const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-4fd6c9f5/health`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    }
  }
);
```

### Error Handling

All endpoints return errors in consistent format:
```json
{
  "error": "Description of error"
}
```

Status codes:
- `400` - Bad request (missing/invalid parameters)
- `500` - Server error (API failures, configuration issues)

## Development

### Local Testing

The server can be tested locally using the Supabase CLI:

```bash
# Test health endpoint
curl https://${projectId}.supabase.co/functions/v1/make-server-4fd6c9f5/health \
  -H "Authorization: Bearer ${publicAnonKey}"

# Test echo endpoint
curl -X POST https://${projectId}.supabase.co/functions/v1/make-server-4fd6c9f5/test/echo \
  -H "Authorization: Bearer ${publicAnonKey}" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### Adding New Routes

1. Define route in `/supabase/functions/server/index.tsx`
2. Add route prefix: `/make-server-4fd6c9f5/your-route`
3. Include error handling and logging
4. Return JSON responses with proper status codes

```typescript
app.post("/make-server-4fd6c9f5/your-route", async (c) => {
  try {
    const body = await c.req.json();
    // Your logic here
    return c.json({ success: true, data: result });
  } catch (error) {
    console.log(`Error in your-route: ${error}`);
    return c.json({ error: "Error message" }, 500);
  }
});
```

### Logging

All routes are logged via Hono's logger middleware:
```typescript
app.use('*', logger(console.log));
```

Console logs visible in Supabase Edge Functions dashboard.

## Future Enhancements

When activating the backend:

1. **Replace mock data** in frontend with real API calls
2. **Add authentication** using Supabase Auth
3. **Store critique history** in KV store or dedicated tables
4. **Implement caching** for Figma file data
5. **Add rate limiting** to prevent API abuse
6. **Create storage buckets** for uploaded design files
7. **Add webhook endpoints** for real-time updates

## Current Status

🔴 **Backend Status:** Inactive (Frontend-only MVP)

The frontend currently uses mock data from `/lib/agent.ts`. To activate the backend:
1. Update frontend to call server endpoints
2. Configure API keys in Supabase dashboard
3. Test each endpoint individually
4. Monitor logs for errors

---

**Last Updated:** December 14, 2025  
**Server Version:** 1.0.0 (Scaffolded)  
**Framework:** Hono v4.x on Deno Runtime
