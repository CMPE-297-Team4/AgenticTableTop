# AgenticTableTop Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AgenticTableTop System                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   Frontend (React)   │  HTTP   │   Backend (FastAPI)   │
│   src/ui/            │◄───────►│   api.py              │
│   localhost:5173     │  REST  │   localhost:8000      │
│                      │  API   │                      │
│  - Campaign UI       │        │  - API Routes         │
│  - Campaign Viewer   │        │  - Authentication     │
│  - Campaign Library  │        │  - Business Logic     │
└──────────────────────┘         └──────────────────────┘
                                         │
                                         │ Uses (via sys.path)
                                         ▼
                         ┌───────────────────────────────┐
                         │   src/                         │
                         │   (Core Business Logic)        │
                         └───────────────────────────────┘
                                         │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
         ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
         │  External APIs   │  │  Vector DB      │  │  Database       │
         │  - OpenAI        │  │  - Pinecone     │  │  - SQLite       │
         │  - Google Gemini │  │                 │  │                 │
         └─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Package Structure & Dependencies

```
src/
│
├── api/                          # API Layer
│   ├── server.py                 # FastAPI app setup
│   ├── dependencies.py          # Auth dependencies
│   ├── models.py                 # Pydantic request/response models
│   ├── auth.py                   # Authentication utilities
│   └── routes/                   # Route handlers
│       ├── auth.py               # Authentication endpoints
│       ├── cache.py              # Cache management
│       ├── campaigns.py          # Campaign generation & management
│       ├── monsters.py           # Monster generation & combat
│       ├── npcs.py               # NPC image generation
│       └── search.py             # Search functionality
│
├── core/                         # Core Business Logic
│   ├── agents.py                 # AI agents (story, acts, quests)
│   ├── model.py                  # LLM initialization
│   ├── prompt.py                 # Prompt templates
│   ├── rag_prompts.py            # RAG-augmented prompts
│   └── state.py                  # Game state management
│
├── services/                     # External Services
│   ├── cache.py                  # LLM response caching
│   ├── character.py              # NPC portrait generation
│   ├── pinecone.py               # Vector database service
│   ├── rag.py                    # RAG service
│   └── trajectory.py            # Generation logging
│
├── database/                     # Data Persistence
│   └── models.py                # SQLAlchemy models
│
├── combat/                       # Combat System
│   └── system.py                # Combat mechanics
│
├── tools/                        # Utilities
│   └── utils.py                 # Helper functions
│
└── schemas/                       # Data Schemas
    └── models.py                # Pydantic validation models
│
└── ui/                           # React Frontend
    ├── src/
    │   ├── pages/                # React pages
    │   ├── services/             # API client
    │   └── components/           # UI components
    └── package.json
```

## Detailed Component Connections

### 1. Frontend to Backend

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  src/ui/src/pages/                                    │  │
│  │  ├── Index.tsx          → Campaign generation UI     │  │
│  │  ├── Game.tsx           → Campaign viewer            │  │
│  │  ├── CampaignLibrary.tsx → Campaign search/browse    │  │
│  │  └── Login.tsx          → Authentication            │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ HTTP/REST                         │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  src/ui/src/services/campaignApi.ts                    │  │
│  │  - generateCampaign()                                  │  │
│  │  - generateStory()                                     │  │
│  │  - generateNPCImage()                                 │  │
│  │  - searchCampaigns()                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ POST /api/generate-campaign
                          │ POST /api/generate-npc-image
                          │ POST /api/search-campaigns
                          │ etc.
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  api.py (Entry Point)                                 │  │
│  │  └── adds src/ to path, imports modules                │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  src/api/server.py                                     │  │
│  │  - FastAPI app setup                                  │  │
│  │  - CORS middleware                                    │  │
│  │  - Route registration                                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2. Backend Route Flow

```
Request → api.py → src/api/server.py
                    │
                    ├── api/routes/auth.py
                    │   └── Uses: api.dependencies, api.auth, database.models
                    │
                    ├── api/routes/campaigns.py
                    │   ├── Uses: core.agents, core.model, core.state
                    │   ├── Uses: services.cache, services.pinecone
                    │   └── Uses: database.models
                    │
                    ├── api/routes/monsters.py
                    │   ├── Uses: core.agents, core.model
                    │   ├── Uses: combat.system
                    │   └── Uses: tools.utils
                    │
                    ├── api/routes/npcs.py
                    │   ├── Uses: services.character
                    │   └── Uses: database.models, services.cache
                    │
                    └── api/routes/search.py
                        └── Uses: services.pinecone
```

### 3. Core Generation Flow

```
User Request
    │
    ▼
src/api/routes/campaigns.py::generate_campaign()
    │
    ├──► api/dependencies.py::get_current_user()  [Authentication]
    │
    ├──► services/cache.py::get_cached_response()  [Check cache]
    │
    ├──► core/model.py::initialize_llm()  [Initialize LLM]
    │       │
    │       └──► External: OpenAI API or Google Gemini API
    │
    ├──► core/agents.py::background_story()  [Generate story]
    │       │
    │       ├──► core/prompt.py::storyteller_prompt
    │       ├──► core/model.py::initialize_llm()
    │       └──► tools/utils.py::parse_storyteller_result()
    │
    ├──► core/agents.py::generate_game_plan()  [Generate acts]
    │       │
    │       ├──► core/prompt.py::game_plan_prompt
    │       └──► tools/utils.py::parse_acts_result()
    │
    ├──► core/agents.py::generate_quests_for_act()  [Generate quests]
    │       │
    │       ├──► core/prompt.py::quest_generation_prompt
    │       └──► tools/utils.py::parse_quests_result()
    │
    ├──► services/cache.py::cache_response()  [Cache result]
    │
    ├──► database/models.py::Campaign  [Save to DB]
    │
    └──► services/pinecone.py::store_campaign()  [Optional: Save to Pinecone]
            │
            └──► External: Pinecone Vector Database
```

### 4. RAG-Enhanced Generation Flow

```
User Request (with RAG enabled)
    │
    ▼
src/api/routes/campaigns.py::generate_campaign()
    │
    ├──► core/agents.py::background_story_with_rag()
    │       │
    │       ├──► services/rag.py::RAGService::retrieve_context()
    │       │       │
    │       │       ├──► services/pinecone.py::PineconeService
    │       │       │       └──► External: Pinecone Vector DB
    │       │       │
    │       │       └──► External: OpenAI Embeddings API
    │       │
    │       ├──► core/rag_prompts.py::rag_storyteller_prompt
    │       └──► core/model.py::initialize_llm()
    │
    ├──► core/agents.py::generate_game_plan_with_rag()
    │       └──► Similar RAG flow
    │
    └──► core/agents.py::generate_quests_for_act_with_rag()
            └──► Similar RAG flow
```

### 5. NPC Image Generation Flow

```
User Request
    │
    ▼
src/api/routes/npcs.py::generate_npc_image()
    │
    ├──► database/models.py::NPCImage  [Check existing image]
    │
    ├──► services/cache.py::get_cached_response()  [Check cache]
    │
    ├──► services/character.py::generate_npc_portrait()
    │       │
    │       ├──► External: OpenAI API (GPT-4o for prompt generation)
    │       └──► External: OpenAI API (DALL-E 3 for image generation)
    │
    ├──► database/models.py::NPCImage  [Save to DB]
    │
    └──► services/cache.py::cache_response()  [Cache result]
```

### 6. Monster Generation & Combat Flow

```
User Request
    │
    ▼
src/api/routes/monsters.py::generate_monsters()
    │
    ├──► services/cache.py::get_cached_response()
    │
    ├──► core/model.py::initialize_llm()
    │
    ├──► core/agents.py::generate_monsters_for_quest()
    │       │
    │       ├──► core/prompt.py::monster_generation_prompt
    │       └──► tools/utils.py::parse_monster_result()
    │
    └──► services/cache.py::cache_response()
            │
            ▼
src/api/routes/monsters.py::simulate_combat()
    │
    ├──► combat/system.py::create_player_combatant()
    ├──► combat/system.py::create_combatant_from_monster()
    ├──► combat/system.py::CombatEncounter
    └──► combat/system.py::simulate_attack()
```

## Data Flow Diagrams

### Campaign Generation Request Flow

```
┌─────────────┐
│   Frontend  │
│  src/ui/src/│
│  pages/     │
│  Index.tsx  │
└──────┬──────┘
       │
       │ POST /api/generate-campaign
       │ { outline: "...", model_type: "openai" }
       ▼
┌─────────────────────────────────────┐
│  src/api/routes/                    │
│  campaigns.py::generate_campaign()  │
└──────┬──────────────────────────────┘
       │
       ├─► api/dependencies::get_current_user() [Auth]
       │
       ├─► services/cache::get_cached_response() [Cache Check]
       │
       ├─► core/model::initialize_llm() [LLM Setup]
       │   └─► OpenAI API / Gemini API
       │
       ├─► core/agents::background_story() [Story Gen]
       │   └─► LLM API Call
       │
       ├─► core/agents::generate_game_plan() [Acts Gen]
       │   └─► LLM API Call
       │
       ├─► core/agents::generate_quests_for_act() [Quests Gen]
       │   └─► LLM API Call (per act)
       │
       ├─► database/models::Campaign.save() [Database]
       │   └─► SQLite Database
       │
       ├─► services/pinecone::store_campaign() [Optional: Pinecone]
       │   └─► Pinecone Vector DB
       │
       └─► services/cache::cache_response() [Cache Result]
           └─► File System Cache
```

### Authentication Flow

```
┌─────────────┐
│   Frontend  │
│  src/ui/src/│
│  pages/     │
│  Login.tsx  │
└──────┬──────┘
       │
       │ POST /api/auth/login
       │ { username, password }
       ▼
┌─────────────────────────────────────┐
│  src/api/routes/                    │
│  auth.py::login()                   │
└──────┬──────────────────────────────┘
       │
       ├─► database/models::User.query()
       │   └─► SQLite Database
       │
       ├─► api/auth::verify_password()
       │
       ├─► api/auth::create_access_token()
       │   └─► JWT Token Generation
       │
       └─► Return Token
           │
           ▼
┌─────────────┐
│   Frontend  │
│  Stores in │
│  localStorage│
└─────────────┘
```

## Package Dependency Graph

```
api.py (Entry Point)
    │
    │ Adds src/ to sys.path
    │
    └──► src/api/server.py
            │
            ├──► src/api/routes/*
            │       │
            │       ├──► src/api/models.py
            │       ├──► src/api/dependencies.py
            │       │       └──► src/api/auth.py
            │       │
            │       ├──► src/core/*
            │       │       ├──► agents.py
            │       │       │       ├──► model.py
            │       │       │       ├──► prompt.py
            │       │       │       ├──► rag_prompts.py
            │       │       │       └──► state.py
            │       │       │
            │       │       └──► model.py
            │       │           └──► External: OpenAI/Gemini APIs
            │       │
            │       ├──► src/services/*
            │       │       ├──► cache.py
            │       │       ├──► character.py
            │       │       │       └──► External: OpenAI API
            │       │       ├──► pinecone.py
            │       │       │       └──► External: Pinecone API
            │       │       ├──► rag.py
            │       │       │       ├──► External: Pinecone API
            │       │       │       └──► External: OpenAI Embeddings
            │       │       └──► trajectory.py
            │       │
            │       ├──► src/database/*
            │       │       └──► models.py
            │       │           └──► SQLAlchemy → SQLite
            │       │
            │       ├──► src/combat/*
            │       │       └──► system.py
            │       │           └──► tools/utils.py
            │       │
            │       └──► src/tools/*
            │               └──► utils.py
```

## External Service Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   OpenAI API     │  │  Google Gemini  │  │   Pinecone API   │
│                  │  │      API        │  │                  │
│  - GPT-4o        │  │  - gemini-2.5   │  │  - Vector Store   │
│  - DALL-E 3      │  │    -flash       │  │  - Semantic       │
│  - Embeddings    │  │                 │  │    Search         │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                     │                      │
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  src/                 │
                    │  core/model.py        │
                    │  (LLM Initialization) │
                    └──────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  services/rag.py  │  │ services/        │
         │  (RAG Service)    │  │ character.py     │
         │                   │  │ (Image Gen)      │
         │  Uses:            │  │                  │
         │  - Pinecone       │  │  Uses:           │
         │  - OpenAI         │  │  - OpenAI       │
         │    Embeddings     │  │    DALL-E 3     │
         └──────────────────┘  └──────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                            │
│                  (agentictabletop.db)                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  users           │
│  ├── id          │
│  ├── username    │
│  ├── email       │
│  └── password    │
└──────────────────┘

┌──────────────────┐
│  campaigns        │
│  ├── id           │
│  ├── user_id      │──► users.id
│  ├── title        │
│  ├── background   │
│  ├── theme        │
│  └── campaign_data│ (JSON)
└──────────────────┘

┌──────────────────┐
│  npc_images      │
│  ├── id           │
│  ├── user_id      │──► users.id
│  ├── campaign_id  │
│  ├── npc_name     │
│  ├── image_base64 │
│  └── prompt_used  │
└──────────────────┘
```

## Request/Response Flow Example

### Example: Generate Campaign

```
1. Frontend (src/ui/src/pages/Index.tsx)
   │
   │ User enters: "dark fantasy campaign with dragons"
   │
   ▼
2. src/ui/src/services/campaignApi.ts::generateCampaign()
   │
   │ POST http://localhost:8000/api/generate-campaign
   │ Headers: { Authorization: "Bearer <token>" }
   │ Body: { outline: "...", model_type: "openai" }
   │
   ▼
3. src/api/routes/campaigns.py::generate_campaign()
   │
   │ ├─► api/dependencies.get_current_user()
   │ │   └─► Validates JWT token
   │ │
   │ ├─► services/cache.get_cached_response()
   │ │   └─► Checks file system cache
   │ │
   │ ├─► core/model.initialize_llm()
   │ │   └─► Creates ChatOpenAI instance
   │ │
   │ ├─► core/agents.background_story()
   │ │   ├─► Builds prompt from prompt.py
   │ │   ├─► Calls LLM API (OpenAI)
   │ │   └─► Parses JSON response
   │ │
   │ ├─► core/agents.generate_game_plan()
   │ │   └─► Similar LLM call
   │ │
   │ ├─► core/agents.generate_quests_for_act()
   │ │   └─► LLM call per act
   │ │
   │ ├─► database/models.Campaign.save()
   │ │   └─► SQLite INSERT
   │ │
   │ └─► services/cache.cache_response()
   │     └─► Saves to cache/llm_responses/
   │
   ▼
4. Response to Frontend
   │
   │ { title, background, theme, acts, quests, ... }
   │
   ▼
5. Frontend (src/ui/src/pages/Game.tsx)
   │
   │ Displays campaign in UI
   │ Stores in sessionStorage
```

## Module Import Hierarchy

```
Top Level (api.py)
    │
    │ Adds src/ to sys.path
    │
    └──► src/api/server.py
            │
            ├──► src/api/routes/auth.py
            │       ├──► api/auth.py
            │       ├──► api/dependencies.py
            │       ├──► api/models.py
            │       └──► database/models.py
            │
            ├──► src/api/routes/campaigns.py
            │       ├──► api/dependencies.py
            │       ├──► api/models.py
            │       ├──► core/agents.py
            │       ├──► core/model.py
            │       ├──► core/state.py
            │       ├──► database/models.py
            │       ├──► services/cache.py
            │       └──► services/pinecone.py
            │
            ├──► src/api/routes/monsters.py
            │       ├──► api/models.py
            │       ├──► core/agents.py
            │       ├──► core/model.py
            │       ├──► combat/system.py
            │       ├──► services/cache.py
            │       └──► tools/utils.py
            │
            ├──► src/api/routes/npcs.py
            │       ├──► api/dependencies.py
            │       ├──► api/models.py
            │       ├──► database/models.py
            │       ├──► services/cache.py
            │       └──► services/character.py
            │
            └──► src/api/routes/search.py
                    ├──► api/models.py
                    └──► services/pinecone.py

Note: Python imports use module names directly (e.g., 'api', 'core', 'services')
      because src/ is added to PYTHONPATH/sys.path
```

## Technology Stack Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    Technology Stack                         │
└─────────────────────────────────────────────────────────────┘

Frontend Layer:
├── React 18 + TypeScript
├── Vite (Build Tool)
├── Tailwind CSS + Shadcn UI
└── React Router

Backend Layer:
├── FastAPI (Web Framework)
├── Uvicorn (ASGI Server)
├── SQLAlchemy (ORM)
└── Pydantic (Validation)

AI/ML Layer:
├── LangChain (LLM Orchestration)
├── OpenAI API (GPT-4o, DALL-E 3, Embeddings)
├── Google Gemini API (Alternative LLM)
└── Pinecone (Vector Database)

Data Layer:
├── SQLite (Local Database)
└── Pinecone (Vector Storage)
```

## Key Design Patterns

### 1. **Modular Package Structure**
- Clear separation of concerns
- Each package has a single responsibility
- Clean contracts via `__init__.py` exports

### 2. **Dependency Injection**
- FastAPI's `Depends()` for database sessions
- Authentication dependencies reusable across routes

### 3. **Service Layer Pattern**
- External services abstracted in `services/`
- Easy to swap implementations (e.g., different vector DBs)

### 4. **Repository Pattern**
- Database models in `database/models.py`
- Business logic separated from data access

### 5. **Caching Strategy**
- File-based caching for LLM responses
- Reduces API costs during development
- Configurable via environment variables

## Data Flow Summary

1. **User Request** → Frontend (React)
2. **API Call** → Backend (FastAPI)
3. **Authentication** → JWT validation
4. **Cache Check** → File system cache
5. **LLM Generation** → OpenAI/Gemini API
6. **Response Parsing** → Tools utilities
7. **Data Storage** → SQLite + Optional Pinecone
8. **Cache Update** → File system
9. **Response** → Frontend (JSON)
10. **UI Update** → React state management

## File Organization

```
AgenticTableTop/
├── api.py                          # Entry point (adds src/ to path)
│
├── src/                            # Source code directory
│   ├── api/                        # API layer
│   │   ├── server.py               # FastAPI app
│   │   ├── dependencies.py         # Auth deps
│   │   ├── models.py               # Request/response models
│   │   └── routes/                 # Route handlers
│   │
│   ├── core/                       # Core logic
│   │   ├── agents.py               # AI agents
│   │   ├── model.py                # LLM setup
│   │   ├── prompt.py               # Prompts
│   │   └── state.py                # Game state
│   │
│   ├── services/                   # External services
│   │   ├── cache.py                # Caching
│   │   ├── character.py            # NPC images
│   │   ├── pinecone.py             # Vector DB
│   │   └── rag.py                  # RAG service
│   │
│   ├── database/                   # Data layer
│   │   └── models.py               # SQLAlchemy models
│   │
│   ├── combat/                     # Combat system
│   │   └── system.py               # Combat mechanics
│   │
│   ├── tools/                      # Utilities
│   │   └── utils.py                # Helper functions
│   │
│   ├── schemas/                    # Data schemas
│   │   └── models.py               # Pydantic models
│   │
│   └── ui/                         # React frontend
│       └── src/
│           ├── pages/              # React pages
│           ├── services/          # API client
│           └── components/        # UI components
│
└── docs/                           # Documentation
    └── ARCHITECTURE.md            # This file
```

## Connection Matrix

| Component | Depends On | Used By |
|-----------|-----------|---------|
| `api.py` | `src/api/server` (via sys.path) | Entry point |
| `src/api/server.py` | All route modules | `api.py` |
| `src/api/routes/*` | `api/models`, `api/dependencies`, core, services | `api/server.py` |
| `src/core/agents.py` | `core/model`, `core/prompt`, `tools/utils` | `api/routes/campaigns.py` |
| `src/core/model.py` | External APIs | `core/agents.py` |
| `src/services/cache.py` | File system | All route modules |
| `src/services/pinecone.py` | External Pinecone API | `api/routes/campaigns.py`, `api/routes/search.py` |
| `src/services/rag.py` | `services/pinecone.py`, OpenAI | `core/agents.py` |
| `src/database/models.py` | SQLAlchemy | All route modules |
| `src/combat/system.py` | `tools/utils` | `api/routes/monsters.py` |
| `src/ui/` | React, TypeScript, Vite | Frontend application |

## Summary

The architecture follows a **layered, modular design**:

1. **Presentation Layer**: React frontend (`src/ui/`)
2. **API Layer**: FastAPI with modular routes (`src/api/`)
3. **Business Logic Layer**: Core agents and services (`src/core/`, `src/services/`)
4. **Data Layer**: SQLite + Pinecone (`src/database/`)
5. **External Services**: OpenAI, Gemini, Pinecone APIs

### Directory Structure

All source code is organized under `src/`:
- **Backend**: Direct modules in `src/` (api/, core/, services/, etc.)
- **Frontend**: `src/ui/` - React application

### Import Strategy

Python imports use module names directly (e.g., `api`, `core`, `services`) because:
- `api.py` adds `src/` to `sys.path` at startup
- Scripts add `src/` to `PYTHONPATH`
- This keeps imports clean: `from core import ...`, `from api import ...`

All components are **loosely coupled** with clear interfaces, making the system:
- **Maintainable**: Easy to modify individual components
- **Testable**: Each layer can be tested independently
- **Scalable**: Can add new routes/services without affecting others
- **Extensible**: Easy to add new features (e.g., new AI providers)

