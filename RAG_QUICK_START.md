# RAG Integration - Quick Start

## ✅ Setup Complete

Your CMPE297 HW6 RAG system is integrated and running in a virtual environment!

## 🚀 Get Started in 2 Steps

### Step 1: Activate Virtual Environment

```powershell
Set-Location z:\Users\yakuz\VSC\AgenticTableTop
.\venv\Scripts\Activate.ps1
```

You'll see `(venv)` in your prompt when active.

### Step 2: Run Campaign Generator

```powershell
python main.py
```

This generates a complete D&D campaign (story, acts, quests).

## 💡 Common Commands

| What | Command |
|------|---------|
| Run tests | `python test_rag_setup.py` |
| Try examples | `python examples/rag_examples.py` |
| Deactivate venv | `deactivate` |
| Install a package | `pip install package-name` |

## 🎮 Enable RAG Features

RAG is currently disabled (standard generation only).

**To enable RAG:**

1. Edit `config.yaml`
2. Change `RAG.enabled: false` → `RAG.enabled: true`
3. Run `python main.py`

Generated campaigns will now include knowledge-grounded storytelling!

## 📁 Key Files

- `utils/rag_service.py` - Core RAG system
- `utils/rag_prompts.py` - RAG-augmented prompts
- `utils/agents.py` - Modified agent functions
- `config.yaml` - RAG configuration
- `.env` - API keys (OPENAI_API_KEY, PINECONE_API_KEY)
- `examples/rag_examples.py` - 6 working examples

## 🐛 Troubleshooting

**"Activate.ps1 not found"**
- Make sure you're in the correct directory
- Run: `Set-Location z:\Users\yakuz\VSC\AgenticTableTop` first

**"OPENAI_API_KEY not found"**
- The .env file already has your API keys configured
- If empty, you can get them from:
  - OpenAI: https://platform.openai.com/api-keys
  - Pinecone: https://www.pinecone.io/

**"Module not found"**
- Make sure venv is activated (check for `(venv)` in prompt)
- Run: `python -m pip install -r requirements.txt`

## 📖 Full Documentation

- `docs/RAG_SETUP.md` - Complete setup guide (30 min)
- `docs/RAG_QUICK_REFERENCE.md` - API reference
- `examples/rag_examples.py` - Copy-paste ready code

## ✨ What's Working

✅ Campaign generation with LLMs  
✅ Vector database (Pinecone) configured  
✅ RAG system ready to use  
✅ Backward compatible (original code still works)  
✅ Isolated venv (no system pollution)
