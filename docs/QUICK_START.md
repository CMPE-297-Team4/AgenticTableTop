# Quick Start Guide

## 🚀 Get Started in 2 Steps

### Step 1: Activate Virtual Environment (if using venv)

```bash
# macOS/Linux
source venv/bin/activate

# Windows PowerShell
.\venv\Scripts\Activate.ps1
```

You'll see `(venv)` in your prompt when active.

### Step 2: Run Campaign Generator

**Option 1: Web UI (Recommended)**
```bash
make start-all
# Opens: http://localhost:5173
```

**Option 2: API Only**
```bash
make api
# Access: http://localhost:8000/docs
```

## 💡 Common Commands

| What | Command |
|------|---------|
| Run tests | `make test` or `pytest tests/` |
| Try RAG examples | `python examples/rag_examples.py` |
| Deactivate venv | `deactivate` |
| Install dependencies | `pip install -r requirements.txt` |
| Format code | `make format` |

## 🎮 Enable RAG Features

RAG is currently disabled by default (standard generation only).

**To enable RAG:**

1. Edit `config.yaml`
2. Change `RAG.enabled: false` → `RAG.enabled: true`
3. Use the API or Web UI to generate campaigns

Generated campaigns will now include knowledge-grounded storytelling!

## 📁 Key Files

- `src/core/agents.py` - Core generation functions
- `src/core/model.py` - LLM initialization
- `src/services/rag.py` - RAG system
- `config.yaml` - RAG configuration
- `.env` - API keys (OPENAI_API_KEY, PINECONE_API_KEY)
- `examples/rag_examples.py` - 6 working examples

## 🐛 Troubleshooting

**"Module not found"**
- Make sure venv is activated (check for `(venv)` in prompt)
- Run: `pip install -r requirements.txt`

**"OPENAI_API_KEY not found"**
- Create `.env` file from `env.example`
- Add your API keys from:
  - OpenAI: https://platform.openai.com/api-keys
  - Pinecone: https://www.pinecone.io/

**"Cannot connect to backend"**
- Make sure backend is running: `make api`
- Check if port 8000 is available

## 📖 Full Documentation

- **[docs/RAG_SETUP.md](RAG_SETUP.md)** - Complete RAG setup guide
- **[docs/ENV_SETUP.md](ENV_SETUP.md)** - Environment setup
- **[docs/INTRO.md](INTRO.md)** - D&D introduction for beginners
- **[examples/rag_examples.py](../../examples/rag_examples.py)** - Copy-paste ready code

## ✨ What's Working

✅ Campaign generation with LLMs  
✅ Vector database (Pinecone) configured  
✅ RAG system ready to use  
✅ Backward compatible (original code still works)  
✅ Isolated venv (no system pollution)

