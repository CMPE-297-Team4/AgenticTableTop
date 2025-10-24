# Environment Setup Guide

## Required Environment Variables

AgenticTableTop requires API keys to access LLM providers. You need **at least one** of the following:

### 1. OpenAI API Key (for GPT models)

```bash
export OPENAI_API_KEY="sk-proj-..."
```

**How to get it:**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-` or `sk-`)

**Models supported:**
- `gpt-4o-mini` (default, recommended)
- `gpt-4o`
- `gpt-3.5-turbo`

### 2. Google Gemini API Key (alternative to OpenAI)

```bash
export GEMINI_API_KEY="AIza..."
```

**How to get it:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Get API key" or "Create API key"
4. Copy the key (starts with `AIza`)

**Models supported:**
- `gemini-2.5-flash`
- `gemini-1.5-pro`

## Setup Methods

### Method 1: Terminal Export (Temporary)

Set for current terminal session only:

```bash
# For OpenAI
export OPENAI_API_KEY="your-key-here"

# For Gemini
export GEMINI_API_KEY="your-key-here"

# Run the application
python main.py
```

**Pros:** Quick and easy
**Cons:** Need to set every time you open a new terminal

### Method 2: .env File (Recommended)

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your keys
# For macOS/Linux:
nano .env

# For Windows:
notepad .env
```

Then install python-dotenv and load it:

```bash
pip install python-dotenv
```

Add to the top of `main.py`:
```python
from dotenv import load_dotenv
load_dotenv()  # Load .env file
```

**Pros:** Keys persist, not in shell history
**Cons:** Requires python-dotenv package

### Method 3: Shell Configuration (Permanent)

Add to your shell config file:

**For bash (~/.bashrc or ~/.bash_profile):**
```bash
echo 'export OPENAI_API_KEY="your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

**For zsh (~/.zshrc):**
```bash
echo 'export OPENAI_API_KEY="your-key-here"' >> ~/.zshrc
source ~/.zshrc
```

**Pros:** Available in all terminal sessions
**Cons:** Keys in config file, less flexible

## Verification

Check if environment variables are set:

```bash
# Check OpenAI key
echo $OPENAI_API_KEY

# Check Gemini key
echo $GEMINI_API_KEY
```

If you see your key (or part of it), it's set correctly!

## Configuration

After setting up API keys, configure which model to use in `utils/model.py`:

```python
MODEL_TYPE = "OPENAI"  # or "GEMINI"
MODEL = "gpt-4o-mini"  # or "gemini-2.5-flash"
```

## Security Best Practices

### DO:
- Use `.env` files for local development
- Add `.env` to `.gitignore` (already done)
- Use different keys for development and production
- Rotate keys regularly
- Set spending limits in your API provider dashboard

### DON'T:
- Commit API keys to git
- Share keys in public places (Slack, Discord, etc.)
- Use production keys for testing
- Hard-code keys in source files
- Include keys in screenshots

## Troubleshooting

### Error: "Please set up your API keys in environment variables"

**Cause:** No API keys found

**Fix:**
```bash
# Set at least one key
export OPENAI_API_KEY="your-key-here"
# or
export GEMINI_API_KEY="your-key-here"
```

### Error: "AuthenticationError" or "Invalid API key"

**Cause:** Key is incorrect or expired

**Fix:**
1. Check if you copied the full key
2. Generate a new key from provider dashboard
3. Make sure there are no extra spaces or quotes

### Error: Keys set but still not working

**Cause:** Keys set in different terminal session

**Fix:**
```bash
# Check if keys are actually set in current session
echo $OPENAI_API_KEY

# If empty, set them again in this terminal
export OPENAI_API_KEY="your-key-here"
```

## Testing

To test with API keys in tests:

```bash
# Run tests (they use mocked keys)
pytest tests/

# Run with real API calls (integration tests)
OPENAI_API_KEY="real-key" pytest tests/ -m integration
```

## Cost Management

### OpenAI Pricing (as of Oct 2024)
- `gpt-4o-mini`: $0.15 / 1M input tokens, $0.60 / 1M output tokens
- `gpt-4o`: $5.00 / 1M input tokens, $15.00 / 1M output tokens

### Gemini Pricing
- `gemini-2.5-flash`: Free tier available, then paid
- Check current pricing: https://ai.google.dev/pricing

### Tips to Save Money
1. Use `gpt-4o-mini` for development (cheaper)
2. Set spending limits in provider dashboard
3. Use mocked LLM for testing (no API calls)
4. Cache common responses when possible

## Quick Reference

```bash
# Setup (one-time)
export OPENAI_API_KEY="sk-proj-your-key"

# Run application
python main.py

# Run tests (uses mocks, no keys needed)
pytest tests/

# Check if keys are set
env | grep API_KEY
```

## Next Steps

After setting up environment variables:
1. Verify keys are set: `echo $OPENAI_API_KEY`
2. Run the application: `python main.py`
3. Check the output for your generated campaign!
4. Run tests: `pytest tests/`

For more help, see the main [README.md](README.md).

