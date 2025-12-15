# Installing Python 3.10+ for ChatKit

## Current Status
- Current Python version: 3.9.6
- Required Python version: 3.10+
- ChatKit package: Available from GitHub

## Installation Options

### Option 1: Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install Python 3.10+:
```bash
brew install python@3.10
```

### Option 2: Install Python 3.10+ directly
Download from: https://www.python.org/downloads/

### Option 3: Use pyenv (Python version manager)
```bash
# Install pyenv
curl https://pyenv.run | bash

# Install Python 3.10
pyenv install 3.10.13

# Use it in this project
pyenv local 3.10.13
```

## After Installing Python 3.10+

Once Python 3.10+ is available, run:

```bash
# Install ChatKit package
python3.10 -m pip install git+https://github.com/openai/chatkit-python.git

# Install all dependencies
python3.10 -m pip install -r requirements.txt

# Run the server
python3.10 run_chatkit.py
```

## Verify Installation

```bash
python3.10 --version  # Should show 3.10.x or higher
python3.10 -c "import chatkit; print('ChatKit installed successfully')"
```

