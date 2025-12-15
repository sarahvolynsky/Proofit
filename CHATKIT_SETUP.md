# ChatKit Server Setup

## Requirements

- **Python 3.10 or higher** (required by openai-chatkit)
- The ChatKit Python SDK from GitHub

## Installation

The `openai-chatkit` package is available from the GitHub repository: https://github.com/openai/chatkit-python

### Option 1: Install from GitHub (Recommended)
```bash
pip install git+https://github.com/openai/chatkit-python.git
```

### Option 2: Install from source
```bash
git clone https://github.com/openai/chatkit-python.git
cd chatkit-python
pip install .
```

### Check Python Version
```bash
python3 --version  # Must be 3.10 or higher
```

If you're using Python 3.9 or lower, you'll need to:
- Install Python 3.10+ (via Homebrew: `brew install python@3.10`)
- Or use a virtual environment with Python 3.10+

## Current Status

The server code is ready (`chatkit_server.py`), but requires:
1. Python 3.10 or higher
2. The `openai-chatkit` package installed from GitHub

## Running the Server

Once Python 3.10+ and the package are installed:
```bash
pip3 install -r requirements.txt
python3 run_chatkit.py
```

The server will start on `http://localhost:8000`

## Endpoints

- `GET /health` - Health check
- `POST /chatkit` - ChatKit protocol endpoint
- `GET /context/info` - Server context documentation
- `GET /tools/status` - Available tools information
- `POST /workflow` - Proofit workflow endpoint

