# Retrieval-Augmented Generation (RAG) Setup Guide

This guide explains how to use the RAG (Retrieval-Augmented Generation) features integrated into the AgenticTableTop system, based on the CMPE297 HW6 implementation.

## Overview

RAG enhances the AgenticTableTop campaign generation by integrating knowledge bases (PDFs, rules, lore) with GPT models using Pinecone vector database. This allows:

- **Knowledge-Grounded Generation**: Campaign content is augmented with relevant knowledge from your knowledge base
- **Consistent Lore**: Ensures generated content respects your custom rules and settings
- **Multi-namespace Support**: Separate namespaces for campaign rules, settings, and characters
- **Flexible PDF Management**: Upload and manage multiple PDFs to organize different types of knowledge

## Prerequisites

### 1. Set Up Pinecone Account

1. Visit [https://www.pinecone.io/](https://www.pinecone.io/) and sign up for a free account
2. Navigate to your API keys section
3. Copy your **API Key** and **Environment** (e.g., `us-east-1`)
4. Save these for the next step

### 2. Set Up Environment Variables

Create or update your `.env` file in the project root with:

```env
# OpenAI API Key (required for embeddings and LLM)
OPENAI_API_KEY=sk-your-openai-key-here

# Pinecone API Key (required for vector database)
PINECONE_API_KEY=your-pinecone-api-key-here
```

### 3. Install Dependencies

Install the RAG dependencies:

```bash
pip install -r requirements.txt
```

Key RAG packages:
- `pinecone-client==3.0.0` - Vector database
- `PyMuPDF==1.24.2` - PDF text extraction
- `scikit-learn==1.5.1` - Similarity calculations
- `python-dotenv==1.0.0` - Environment variable management

## Configuration

Edit `config.yaml` to enable and configure RAG:

```yaml
RAG:
  # Enable/disable RAG globally
  enabled: true
  
  pinecone:
    index_name: "agentic-tabletop"  # Your Pinecone index name
    region: "us-east-1"              # Pinecone region
    cloud: "aws"                      # Cloud provider
  
  knowledge_base:
    rules_namespace: "campaign-rules"
    setting_namespace: "campaign-setting"
    character_namespace: "campaign-characters"
  
  retrieval:
    top_k: 3                          # Number of matches to retrieve
    max_context_chars: 8000           # Max context characters
    embed_model: "text-embedding-3-small"
  
  pdf_processing:
    chunk_size: 5                     # Lines per chunk
    stride: 2                         # Overlap between chunks
```

## Usage

### Basic Usage: Enable RAG in Campaign Generation

#### Option 1: Quick Start (Programmatic)

```python
from core.model import initialize_llm
from core.state import GameStatus
from core.agents import (
    background_story_with_rag,
    generate_game_plan_with_rag,
    generate_quests_for_act_with_rag,
)
from services.rag import get_rag_service

# Initialize
model = initialize_llm()
state = GameStatus()
rag_service = get_rag_service()

# Ensure index exists
rag_service.ensure_index("agentic-tabletop")

# Generate with RAG
background_story_with_rag(model, state, rag_service, "campaign-setting")
generate_game_plan_with_rag(model, state, rag_service, "campaign-rules")

# Generate quests for each act with RAG
for i in range(len(state["acts"])):
    generate_quests_for_act_with_rag(model, state, i, rag_service, "campaign-rules")
```

#### Option 2: Without RAG (Standard Generation)

Simply use the original functions without RAG:

```python
from core.agents import background_story, generate_game_plan, generate_quests_for_act

background_story(model, state)
generate_game_plan(model, state)
for i in range(len(state["acts"])):
    generate_quests_for_act(model, state, i)
```

### Building Your Knowledge Base

#### 1. Prepare PDF Files

- Create PDF files with your campaign rules, lore, or settings
- Recommended format: Clear text, logical sections
- Examples:
  - `d5_rules_excerpts.pdf` - D&D 5e rule excerpts
  - `campaign_setting.pdf` - Your custom world/setting description
  - `npc_database.pdf` - Pre-created NPCs and characters

#### 2. Upload PDFs to Pinecone

```python
from services.rag import RAGService

rag = RAGService()

# Ensure index exists
rag.ensure_index("agentic-tabletop")

# Upload a PDF
num_vectors = rag.upsert_pdf_to_knowledge_base(
    pdf_path="path/to/campaign_rules.pdf",
    namespace="campaign-rules",
    chunk_size=5,
    stride=2,
    index_name="agentic-tabletop",
    doc_id_prefix="rules"
)

print(f"Uploaded {num_vectors} vectors to 'campaign-rules' namespace")
```

#### 3. Verify Knowledge Base

```python
# Check index statistics
stats = rag.get_index_stats("agentic-tabletop")
print(f"Index stats: {stats}")
```

### Advanced: Custom Namespaces

Organize knowledge by type:

```python
rag = RAGService()

# Upload rules to "campaign-rules" namespace
rag.upsert_pdf_to_knowledge_base(
    pdf_path="d5_rules.pdf",
    namespace="campaign-rules",
    doc_id_prefix="rules"
)

# Upload setting to "campaign-setting" namespace
rag.upsert_pdf_to_knowledge_base(
    pdf_path="my_campaign_world.pdf",
    namespace="campaign-setting",
    doc_id_prefix="setting"
)

# Upload NPCs to "campaign-characters" namespace
rag.upsert_pdf_to_knowledge_base(
    pdf_path="npc_compendium.pdf",
    namespace="campaign-characters",
    doc_id_prefix="npcs"
)
```

Then use appropriate namespaces during generation:

```python
# Get story grounded in setting knowledge
background_story_with_rag(model, state, rag, "campaign-setting")

# Get quests that follow rules
generate_quests_for_act_with_rag(model, state, 0, rag, "campaign-rules")
```

## API Reference

### RAGService Class

#### `__init__(pinecone_api_key, openai_api_key, embed_model, default_index_name)`

Initialize the RAG service.

**Parameters:**
- `pinecone_api_key` (str): Pinecone API key (defaults to env var)
- `openai_api_key` (str): OpenAI API key (defaults to env var)
- `embed_model` (str): Embedding model (default: "text-embedding-3-small")
- `default_index_name` (str): Default index name (default: "agentic-tabletop")

#### `ensure_index(index_name=None)`

Ensure Pinecone index exists and is ready. Creates if needed.

**Parameters:**
- `index_name` (str): Name of index (defaults to default_index_name)

#### `upsert_pdf_to_knowledge_base(pdf_path, namespace, chunk_size=5, stride=2, index_name=None, doc_id_prefix=None)`

Upload PDF content to Pinecone knowledge base.

**Parameters:**
- `pdf_path` (str): Path to PDF file
- `namespace` (str): Namespace in Pinecone index
- `chunk_size` (int): Number of lines per chunk (default: 5)
- `stride` (int): Overlap between chunks (default: 2)
- `index_name` (str): Pinecone index name
- `doc_id_prefix` (str): Prefix for document IDs

**Returns:** Number of vectors upserted

#### `retrieve_context(query, namespace, top_k=3, limit=8000, index_name=None)`

Retrieve relevant context from knowledge base for a query.

**Parameters:**
- `query` (str): Query text
- `namespace` (str): Namespace to search in
- `top_k` (int): Number of top matches to retrieve (default: 3)
- `limit` (int): Maximum total characters to include (default: 8000)
- `index_name` (str): Pinecone index name

**Returns:** Formatted context string wrapped in delimiters

#### `delete_namespace(namespace, index_name=None)`

Delete all vectors in a namespace.

**Parameters:**
- `namespace` (str): Namespace to delete
- `index_name` (str): Pinecone index name

#### `delete_index(index_name=None)`

Delete entire Pinecone index. **Use with caution!**

**Parameters:**
- `index_name` (str): Pinecone index name

### Agent Functions with RAG

#### `background_story_with_rag(model, state, rag_service=None, knowledge_namespace=None)`

Generate background story augmented with knowledge.

**Parameters:**
- `model`: LLM model instance
- `state`: Game state to update
- `rag_service` (RAGService): Optional RAGService instance
- `knowledge_namespace` (str): Optional namespace to retrieve from

#### `generate_game_plan_with_rag(model, state, rag_service=None, knowledge_namespace=None)`

Generate game plan augmented with knowledge.

**Parameters:**
- `model`: LLM model instance
- `state`: Game state containing title and background
- `rag_service` (RAGService): Optional RAGService instance
- `knowledge_namespace` (str): Optional namespace to retrieve from

#### `generate_quests_for_act_with_rag(model, state, act_index, rag_service=None, knowledge_namespace=None)`

Generate quests for an act, augmented with knowledge.

**Parameters:**
- `model`: LLM model instance
- `state`: Game state containing acts
- `act_index` (int): Index of act to generate quests for
- `rag_service` (RAGService): Optional RAGService instance
- `knowledge_namespace` (str): Optional namespace to retrieve from

## Example Workflow

### 1. Set Up Knowledge Base

```python
from services.rag import RAGService

rag = RAGService()
rag.ensure_index("agentic-tabletop")

# Upload D&D 5e rules excerpt
rag.upsert_pdf_to_knowledge_base(
    "dnd5e_rules.pdf",
    namespace="campaign-rules",
    doc_id_prefix="dnd5e"
)

# Upload custom campaign setting
rag.upsert_pdf_to_knowledge_base(
    "my_world.pdf",
    namespace="campaign-setting",
    doc_id_prefix="world"
)
```

### 2. Generate Campaign with RAG

```python
from core.model import initialize_llm
from core.state import GameStatus
from core.agents import (
    background_story_with_rag,
    generate_game_plan_with_rag,
    generate_quests_for_act_with_rag,
)

model = initialize_llm()
state = GameStatus()
rag = RAGService()

# Generate background story informed by setting knowledge
background_story_with_rag(model, state, rag, "campaign-setting")

# Generate game plan informed by campaign structure knowledge
generate_game_plan_with_rag(model, state, rag, "campaign-rules")

# Generate quests for each act
for i in range(len(state["acts"])):
    generate_quests_for_act_with_rag(model, state, i, rag, "campaign-rules")

# Use the generated campaign
print(f"Campaign: {state['title']}")
print(f"Total Acts: {len(state['acts'])}")
print(f"Total Quests: {sum(len(q) for q in state.get('quests', {}).values())}")
```

## Troubleshooting

### "Import 'pinecone' could not be resolved"

Install dependencies:
```bash
pip install -r requirements.txt
```

### "PINECONE_API_KEY not found"

Ensure `.env` file contains:
```env
PINECONE_API_KEY=your-key-here
```

And `.env` is in the project root directory.

### "Index not ready"

The system will wait for the index to be ready after creation. Wait a moment and retry.

### "PDF file not found"

Verify the PDF path is correct and the file exists:
```python
import os
print(os.path.exists("path/to/file.pdf"))  # Should print True
```

### "No matches found in namespace"

Verify:
1. PDF was uploaded to the correct namespace
2. Namespace name is spelled correctly
3. PDF contains relevant content for your query

## Next Steps

- Customize RAG prompts in `src/core/rag_prompts.py`
- Adjust chunk size/stride in `config.yaml` for different PDF types
- Create multiple indexes for different campaign systems (D&D, Pathfinder, etc.)
- Integrate character image generation with RAG context
- Build an API endpoint for knowledge base management

## References

- [HW6 Notebook](../../../studiorum/My_Code/masters/CMPE297/week6/hw6.ipynb) - Original RAG implementation
- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [D&D 5e SRD](https://dnd5e.wikidot.com/)
