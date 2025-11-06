# Documentation Guide

## 📚 Where to Start

### New to this project? 
→ **RAG_QUICK_START.md** (5 minutes)
- Activation command
- Run your first campaign
- Common commands

### Want the complete guide?
→ **docs/RAG_SETUP.md** (30 minutes)
- Full setup instructions
- Configuration details
- Usage examples

### Need API reference?
→ **docs/RAG_QUICK_REFERENCE.md** (5 minutes)
- Method cheat sheet
- One-liner examples
- Configuration checklist

### Want technical details?
→ **docs/RAG_INTEGRATION_SUMMARY.md** (15 minutes)
- What was integrated
- Architecture overview
- File structure

### Ready to code?
→ **examples/rag_examples.py**
- 6 working examples
- Copy & paste ready
- All workflows covered

### Need intro to D&D?
→ **docs/INTRO.md**
- Mechanics basics
- Campaign structure
- Terminology

## 🎯 Common Tasks

| I want to... | Read this |
|---|---|
| Run a campaign | RAG_QUICK_START.md |
| Enable RAG features | RAG_QUICK_START.md (step 3) |
| Upload a PDF | docs/RAG_SETUP.md or examples/rag_examples.py |
| Query knowledge base | docs/RAG_QUICK_REFERENCE.md |
| Understand the code | docs/RAG_INTEGRATION_SUMMARY.md |
| See working code | examples/rag_examples.py |

## 📁 File Structure

```
AgenticTableTop/
├── README.md                      ← Main project overview
├── RAG_QUICK_START.md            ← Start here! (5 min)
├── .env                           ← Your API keys
├── config.yaml                    ← RAG settings
├── requirements.txt               ← Python packages
├── main.py                        ← Run this!
├── utils/
│   ├── rag_service.py            ← Core RAG system
│   ├── rag_prompts.py            ← RAG prompts
│   ├── agents.py                 ← RAG agent functions
│   └── model.py                  ← LLM initialization
├── examples/
│   └── rag_examples.py           ← 6 working examples
├── docs/
│   ├── RAG_SETUP.md              ← Complete guide (30 min)
│   ├── RAG_QUICK_REFERENCE.md    ← API reference (5 min)
│   ├── RAG_INTEGRATION_SUMMARY.md ← Technical details (15 min)
│   └── INTRO.md                  ← D&D introduction
└── venv/                         ← Virtual environment
```

## ✅ What's Working

- ✅ Campaign generation with LLMs
- ✅ RAG system (Pinecone + OpenAI embeddings)
- ✅ Virtual environment (Python 3.13.9)
- ✅ All dependencies installed
- ✅ API keys configured
- ✅ 6 working examples

## 🚀 Next Steps

1. **Activate venv**: `.\venv\Scripts\Activate.ps1`
2. **Run campaign**: `python main.py`
3. **Optional: Enable RAG**: Edit `config.yaml` and set `RAG.enabled: true`
4. **Try examples**: `python examples/rag_examples.py`

## 💬 Questions?

Check the relevant documentation above, or review the examples in `examples/rag_examples.py` for working code.
