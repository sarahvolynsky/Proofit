#!/usr/bin/env python3
"""
Run the ChatKit FastAPI server
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("chatkit_server:app", host="0.0.0.0", port=8000, reload=True)

