"""
ChatKit server implementation using the actual chatkit package API
"""
import os
from datetime import datetime
from typing import Any, AsyncIterator
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Actual ChatKit imports
from chatkit.server import ChatKitServer
from chatkit.types import (
    ThreadMetadata,
    ThreadStreamEvent,
    UserMessageItem,
    AssistantMessageItem,
    AssistantMessageContentPartTextDelta,
    ThreadItemAddedEvent,
    ThreadItemDoneEvent,
    ErrorEvent,
)
from chatkit.store import Store, AttachmentStore
from chatkit_store import SQLiteStore, SQLiteAttachmentStore

# Agents for workflow integration
from agents import Agent, Runner
from workflow import run_workflow, WorkflowInput


class MyChatKitServer(ChatKitServer[dict]):
    """ChatKit server implementation for Proofit"""
    
    def __init__(self, store: Store[dict], attachment_store: AttachmentStore[dict] | None = None):
        super().__init__(store, attachment_store)
        # ChatKitServer stores the store as self.store, but we'll keep a reference just in case
        self._data_store = store
    
    async def respond(
        self,
        thread: ThreadMetadata,
        input_user_message: UserMessageItem | None,
        context: dict,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """
        Handle incoming messages and stream responses.
        
        Args:
            thread: Thread metadata
            input_user_message: The incoming user message (if any)
            context: Server context (user_id, user_roles, permissions, etc.)
        
        Yields:
            ThreadStreamEvent instances representing the server's response
        """
        # Access server context
        user_id = context.get("user_id")
        user_roles = context.get("user_roles", [])
        permissions = context.get("permissions", [])
        
        # Access thread metadata
        thread_metadata = thread.metadata or {}
        session_type = thread_metadata.get("session_type", "general")
        goal = thread_metadata.get("goal", "general")
        
        try:
            # If we have a user message, process it
            if input_user_message:
                # Extract message content
                message_text = ""
                image_data_url = None
                if hasattr(input_user_message, 'content'):
                    content = input_user_message.content
                    if isinstance(content, str):
                        message_text = content
                    elif isinstance(content, list):
                        # Extract text and image from content parts
                        for part in content:
                            if isinstance(part, dict):
                                if part.get("type") == "text":
                                    message_text += part.get("text", "")
                                elif part.get("type") == "image" or part.get("type") == "image_url":
                                    # Handle image data
                                    image_url = part.get("image_url") or part.get("url")
                                    if image_url:
                                        image_data_url = image_url
                            elif hasattr(part, 'text'):
                                message_text += part.text
                            elif hasattr(part, 'image_url'):
                                image_data_url = part.image_url
                
                # Load conversation history from thread
                conversation_history = []
                try:
                    # Load previous thread items (messages) from the store
                    # Try to use the store from parent class, fallback to our reference
                    store_to_use = getattr(self, 'store', None) or self._data_store
                    previous_items = await store_to_use.load_thread_items(thread.id, context, limit=50)
                    
                    # Convert thread items to conversation history format
                    for item in previous_items:
                        if hasattr(item, 'type'):
                            if item.type == 'user_message':
                                # Extract text from user message
                                item_text = ""
                                if hasattr(item, 'content'):
                                    if isinstance(item.content, str):
                                        item_text = item.content
                                    elif isinstance(item.content, list):
                                        for part in item.content:
                                            if isinstance(part, dict) and part.get("type") == "text":
                                                item_text += part.get("text", "")
                                            elif hasattr(part, 'text'):
                                                item_text += part.text
                                
                                if item_text:
                                    conversation_history.append({
                                        "role": "user",
                                        "content": [{"type": "input_text", "text": item_text}]
                                    })
                            
                            elif item.type == 'assistant_message':
                                # Extract text from assistant message
                                item_text = ""
                                if hasattr(item, 'content'):
                                    if isinstance(item.content, str):
                                        item_text = item.content
                                    elif isinstance(item.content, list):
                                        for part in item.content:
                                            if isinstance(part, dict) and part.get("type") == "text":
                                                item_text += part.get("text", "")
                                            elif hasattr(part, 'text'):
                                                item_text += part.text
                                
                                if item_text:
                                    # Assistant messages must use "output_text" not "input_text"
                                    conversation_history.append({
                                        "role": "assistant",
                                        "content": [{"type": "output_text", "text": item_text}]
                                    })
                except Exception as e:
                    # If loading history fails, continue without it
                    print(f"Warning: Could not load conversation history: {e}")
                
                # Determine mode based on thread metadata or context
                mode = thread_metadata.get("mode", "critique")
                if session_type == "chat" or len(conversation_history) > 0:
                    mode = "chat"
                
                # Add current user message to conversation history
                current_user_content = [{"type": "input_text", "text": message_text}]
                if image_data_url:
                    current_user_content.append({
                        "type": "input_image",
                        "image_url": image_data_url
                    })
                
                conversation_history.append({
                    "role": "user",
                    "content": current_user_content
                })
                
                # Run the Proofit workflow with conversation history
                try:
                    workflow_input = WorkflowInput(
                        input_as_text=message_text,
                        mode=mode,
                        image_data_url=image_data_url,
                        conversation_history=conversation_history if conversation_history else None
                    )
                    result = await run_workflow(workflow_input)
                    output_text = result.get("output_text", "")
                except Exception as workflow_error:
                    # Log workflow error for debugging
                    import traceback
                    error_trace = traceback.format_exc()
                    print(f"Workflow error: {workflow_error}")
                    print(f"Traceback: {error_trace}")
                    # Return a user-friendly error message
                    output_text = f"I encountered an error processing your message: {str(workflow_error)}. Please try again or rephrase your question."
                
                # Create assistant message item
                import uuid
                item_id = f"msg_{uuid.uuid4().hex[:16]}"
                assistant_item = AssistantMessageItem(
                    id=item_id,
                    content=output_text,
                    created_at=datetime.now(),
                )
                
                # Yield item added event
                yield ThreadItemAddedEvent(
                    type="thread_item_added",
                    item=assistant_item,
                )
                
                # Yield item done event
                yield ThreadItemDoneEvent(
                    type="thread_item_done",
                    item_id=item_id,
                )
            
        except Exception as e:
            # Log the full error for debugging
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in respond method: {e}")
            print(f"Traceback: {error_trace}")
            
            # Yield error event
            yield ErrorEvent(
                type="error",
                error={
                    "code": "internal_error",
                    "message": f"Error processing message: {str(e)}",
                },
            )
    
    def get_stream_options(self, thread: ThreadMetadata, context: dict):
        """Return stream-level runtime options"""
        from chatkit.types import StreamOptions
        return StreamOptions(allow_cancel=True)


# FastAPI app setup
app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize data stores
os.makedirs("./chatkit_data", exist_ok=True)
os.makedirs("./chatkit_files", exist_ok=True)

# Create Store implementations
data_store = SQLiteStore(db_path="./chatkit_data/chatkit.db")
attachment_store = SQLiteAttachmentStore(
    db_path="./chatkit_data/chatkit.db",
    base_path="./chatkit_files"
)

# Initialize ChatKit server
server = MyChatKitServer(store=data_store, attachment_store=attachment_store)


@app.get("/")
async def root():
    """Root endpoint - server information"""
    return {
        "service": "Proofit ChatKit Server",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "chatkit": "/chatkit",
            "workflow": "/workflow",
            "context_info": "/context/info",
            "tools_status": "/tools/status"
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "data_store": "SQLiteStore",
        "attachment_store": "SQLiteAttachmentStore",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/chatkit")
async def chatkit_endpoint(request: Request):
    """
    ChatKit protocol endpoint.
    Handles all ChatKit requests including:
    - Thread creation/management
    - Message sending
    - File uploads/downloads
    - Streaming responses
    - Thread metadata and state management
    - Server context (user identity, permissions, etc.)
    """
    # Extract server context from request
    user_id = request.headers.get("X-User-ID")
    user_roles = request.headers.get("X-User-Roles", "").split(",") if request.headers.get("X-User-Roles") else []
    user_roles = [role.strip() for role in user_roles if role.strip()]
    
    permissions = request.headers.get("X-User-Permissions", "").split(",") if request.headers.get("X-User-Permissions") else []
    permissions = [perm.strip() for perm in permissions if perm.strip()]
    
    ip_address = request.client.host if request.client else None
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    
    authorization = request.headers.get("Authorization")
    
    # Build server context
    server_context = {
        "user_id": user_id,
        "user_roles": user_roles,
        "permissions": permissions,
        "ip_address": ip_address,
        "authorization": authorization,
        "request_id": request.headers.get("X-Request-ID"),
        "user_agent": request.headers.get("User-Agent"),
        "timestamp": datetime.now().isoformat(),
    }
    
    # Process request with server context
    result = await server.process(await request.body(), server_context)
    
    # Handle streaming vs non-streaming responses
    if hasattr(result, 'stream'):
        # Streaming response
        return StreamingResponse(result.stream(), media_type="text/event-stream")
    else:
        # Non-streaming response
        return Response(content=result.json if hasattr(result, 'json') else str(result), media_type="application/json")


@app.get("/context/info")
async def context_info():
    """Documentation endpoint explaining server context usage"""
    return {
        "server_context": {
            "description": "Request-specific context passed to ChatKit server",
            "extraction": "From HTTP headers in chatkit_endpoint",
            "supported_headers": {
                "X-User-ID": "User identifier",
                "X-User-Roles": "Comma-separated list of roles",
                "X-User-Permissions": "Comma-separated list of permissions",
                "X-Request-ID": "Request identifier for tracing",
                "Authorization": "Authorization token",
                "X-Forwarded-For": "Client IP address (if behind proxy)"
            }
        }
    }


class WorkflowRequest(BaseModel):
    input_as_text: str
    mode: str = "critique"  # 'critique' or 'chat'
    image: str | None = None  # Base64 encoded image (deprecated, use images)
    image_media_type: str | None = None  # e.g., 'image/png' (deprecated, use images)
    images: list[dict] | None = None  # Array of {data: str, media_type: str} (up to 3 images)
    conversation_history: list[dict] | None = None  # Previous conversation messages
    audience: str | None = None  # Audience/context: consumer, enterprise, developer, marketing, internal
    platform: str | None = None  # Platform/breakpoint: desktop, mobile, responsive, app


@app.post("/workflow")
async def workflow_endpoint(request: WorkflowRequest):
    """
    Run the Proofit workflow directly.
    Supports text input and optional image attachments.
    """
    try:
        # Convert base64 images to data URL format if provided
        image_data_urls = []
        
        # Handle new images array format (up to 3 images)
        if request.images and len(request.images) > 0:
            for img in request.images[:3]:  # Limit to 3 images
                if isinstance(img, dict) and 'data' in img:
                    media_type = img.get('media_type', 'image/png')
                    image_data_urls.append(f"data:{media_type};base64,{img['data']}")
        
        # Handle legacy single image format for backward compatibility
        elif request.image:
            if request.image_media_type:
                image_data_urls.append(f"data:{request.image_media_type};base64,{request.image}")
            else:
                image_data_urls.append(f"data:image/png;base64,{request.image}")
        
        # Use first image for single image compatibility, or None if no images
        image_data_url = image_data_urls[0] if image_data_urls else None
        
        # Log the request for debugging
        print(f"Workflow request: mode={request.mode}, image_count={len(image_data_urls)}, history_length={len(request.conversation_history) if request.conversation_history else 0}")
        
        workflow_input = WorkflowInput(
            input_as_text=request.input_as_text,
            mode=request.mode,
            image_data_url=image_data_url,  # For backward compatibility, use first image
            image_data_urls=image_data_urls if image_data_urls else None,  # New multi-image support
            conversation_history=request.conversation_history,
            audience=request.audience,
            platform=request.platform
        )
        result = await run_workflow(workflow_input)
        return {"output_text": result["output_text"]}
    except Exception as e:
        # Log the full error with traceback
        import traceback
        error_trace = traceback.format_exc()
        print(f"Workflow endpoint error: {e}")
        print(f"Traceback: {error_trace}")
        return Response(
            content=f'{{"error": "{str(e)}"}}',
            media_type="application/json",
            status_code=500
        )


@app.get("/tools/status")
async def get_tool_status():
    """Get information about available tools"""
    return {
        "available_tools": [],
        "note": "Tools are integrated via the workflow.py agents"
    }
