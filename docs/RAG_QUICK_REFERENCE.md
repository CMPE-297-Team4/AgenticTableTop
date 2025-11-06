# RAG Quick Reference Card

## One-Liner Examples

### Enable & Generate Campaign with RAG
```python
from utils.agents import background_story_with_rag, generate_game_plan_with_rag
from utils.rag_service import get_rag_service
rag = get_rag_service()
background_story_with_rag(model, state, rag, "campaign-setting")
generate_game_plan_with_rag(model, state, rag, "campaign-rules")
```

### Upload PDF to Knowledge Base
```python
rag = RAGService()
rag.ensure_index()
rag.upsert_pdf_to_knowledge_base("rules.pdf", "campaign-rules", doc_id_prefix="rules")
```

### Query Knowledge Base
```python
context = rag.retrieve_context("How do combat actions work?", "campaign-rules")
print(context)
```

## Configuration Checklist

- [ ] Create `.env` with `OPENAI_API_KEY` and `PINECONE_API_KEY`
- [ ] Run `pip install -r requirements.txt`
- [ ] Set `RAG.enabled: true` in `config.yaml`
- [ ] Have at least one PDF to upload
- [ ] Test with `python examples/rag_examples.py`

## API Cheat Sheet

### RAGService Methods
```python
rag = RAGService()                              # Init
rag.ensure_index(name)                          # Create/verify index
rag.upsert_pdf_to_knowledge_base(path, ns)     # Upload PDF
rag.retrieve_context(query, ns, top_k)         # Query
rag.get_index_stats()                          # Check stats
rag.delete_namespace(ns)                        # Clear namespace
rag.delete_index()                              # Delete everything
```

### Agent Functions
```python
background_story_with_rag(model, state, rag, ns)
generate_game_plan_with_rag(model, state, rag, ns)
generate_quests_for_act_with_rag(model, state, act_idx, rag, ns)
```

## Namespaces

```
"campaign-rules"       → D&D rules, mechanics
"campaign-setting"     → World lore, locations
"campaign-characters"  → NPCs, character info
```

## Common Tasks

### Task: Upload D&D Rules
```python
rag.upsert_pdf_to_knowledge_base(
    "dnd5e_rules.pdf",
    namespace="campaign-rules",
    doc_id_prefix="dnd5e"
)
```

### Task: Generate Story Grounded in Setting
```python
background_story_with_rag(model, state, rag, "campaign-setting")
```

### Task: Generate Quests Following Rules
```python
generate_quests_for_act_with_rag(model, state, 0, rag, "campaign-rules")
```

### Task: Clear All Campaign Data
```python
rag.delete_namespace("campaign-rules")
rag.delete_namespace("campaign-setting")
rag.delete_namespace("campaign-characters")
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| `ImportError: pinecone` | `pip install -r requirements.txt` |
| `PINECONE_API_KEY not found` | Add to `.env` file |
| `Index not ready` | Wait, system retries automatically |
| `No matches found` | Check: (1) PDF uploaded? (2) namespace correct? (3) relevant query? |
| `PDF file not found` | Verify path with `os.path.exists(path)` |

## File References

- **Setup Guide**: `docs/RAG_SETUP.md`
- **Integration Details**: `docs/RAG_INTEGRATION_SUMMARY.md`
- **Code Examples**: `examples/rag_examples.py`
- **Core Service**: `utils/rag_service.py`
- **RAG Prompts**: `utils/rag_prompts.py`
- **Agent Functions**: `utils/agents.py`
- **Configuration**: `config.yaml` (RAG section)

## Environment Variables

```env
OPENAI_API_KEY=sk-...           # Required for embeddings
PINECONE_API_KEY=...            # Required for vector DB
```

## Config Options

```yaml
RAG:
  enabled: true|false                    # Toggle RAG
  retrieval:
    top_k: 3                              # Number of matches
    max_context_chars: 8000               # Context limit
  pdf_processing:
    chunk_size: 5                         # Lines per chunk
    stride: 2                             # Overlap
```

## Key Differences: HW6 → AgenticTableTop

| Feature | HW6 | AgenticTableTop |
|---------|-----|-----------------|
| Organization | Notebook cells | Modular classes |
| Configuration | Hardcoded | YAML + env vars |
| API | Interactive cells | Function calls |
| Error Handling | Basic | Comprehensive |
| Integration | Standalone | Built-in pipeline |

## Performance

- **Embedding API**: ~$0.02 per 1M tokens
- **Pinecone**: Free tier sufficient
- **Query Speed**: 1-2s per retrieval
- **Total Generation**: LLM time dominates

## Getting Help

1. Check troubleshooting: `docs/RAG_SETUP.md#Troubleshooting`
2. Run examples: `python examples/rag_examples.py`
3. Read docstrings: `utils/rag_service.py`
4. Reference HW6: `studiorum/My_Code/masters/CMPE297/week6/hw6.ipynb`

---

**For detailed information, see `docs/RAG_SETUP.md`**
