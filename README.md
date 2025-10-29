# AgenticTableTop
CMPE297 - Team 4 Project

An AI-powered Dungeons & Dragons campaign generator with a beautiful web interface. Generate complete campaigns with story, acts, and quests in minutes!

**New to D&D?** Read the [Introduction Guide](docs/INTRO.md) first.

## Features

- **Beautiful Web UI** - React-based interface for campaign generation and viewing
- **AI-Powered Generation** - Complete campaigns with OpenAI GPT or Google Gemini
- **Story & Acts** - Multi-act narrative structure with goals and conflicts
- **Detailed Quests** - 3-5 quests per act with objectives and descriptions
- **REST API** - FastAPI backend for easy integration
- **D&D Mechanics** - Built-in dice rolling and game utilities
- **🆕 Vector Storage** - Pinecone integration for campaign persistence and semantic search
- **🆕 Campaign Library** - Search and retrieve previously generated campaigns
- **🆕 RAG System** - Retrieve relevant content for enhanced AI generation

## Quick Start (5 Minutes)

### Prerequisites
- Python 3.8+ ([Download](https://www.python.org/downloads/))
- Node.js 16+ ([Download](https://nodejs.org/))
- OpenAI API Key or Google Gemini API Key
- Pinecone API Key (optional, for vector storage)

### Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd AgenticTableTop
pip install -r requirements.txt
cd ui && npm install && cd ..

# 2. Configure API keys
cp env.example .env
# Edit .env and add your API keys (OPENAI_API_KEY or GEMINI_API_KEY)
# Optional: Add Pinecone keys for vector storage (PINECONE_API_KEY, PINECONE_ENVIRONMENT)

# 2b. Optional: Set up Pinecone integration
bash scripts/setup_pinecone.sh

# 3. Start the application
make start-all
```

### Generate Your First Campaign

1. Open http://localhost:5173
2. Enter a campaign idea:
   ```
   I want a dark fantasy campaign with ancient dragons,
   political intrigue, and mysterious magical artifacts
   ```
3. Click "Generate Campaign" and wait 1-2 minutes
4. Explore your complete campaign!

**That's it!** You now have 3-5 acts and 10-20 detailed quests ready to play.

## What You Get

Each generated campaign includes:
- **Background Story** - Rich lore and world-building
- **Campaign Theme** - Overarching narrative tone
- **3-5 Acts** - Structured story progression with:
  - Act titles and summaries
  - Narrative goals and stakes
  - Key locations
  - Entry/exit conditions
- **10-20 Quests** - Detailed quest information:
  - Quest names and types (Combat, Investigation, Social, Exploration)
  - Full descriptions
  - Step-by-step objectives
  - Difficulty ratings
  - Estimated play time

## Usage Modes

### Option 1: Web UI (Recommended)
```bash
make start-all
# Opens: http://localhost:5173
```
Beautiful interface with campaign generator and interactive viewer.

### Option 2: CLI
```bash
make run
# or: python main.py
```
Generates campaigns directly in the terminal.

### Option 3: API
```bash
make api
# Access: http://localhost:8000/docs
```
Use the REST API for custom integrations.

## Architecture

### Full-Stack Application
```
┌─────────────────┐         ┌──────────────────┐
│   Frontend UI   │ ◄─────► │  Backend API     │
│   (React + TS)  │  REST   │  (FastAPI)       │
│   localhost:5173│  API    │  localhost:8000  │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  AI Agents       │
                            │  (LangChain)     │
                            │  - Story Gen     │
                            │  - Act Planning  │
                            │  - Quest Gen     │
                            └──────────────────┘
```

### Data Flow
```
User Input → campaignApi.ts → POST /api/generate-campaign
  → initialize_llm() → background_story() → generate_game_plan()
  → generate_quests_for_act() → Campaign JSON
  → sessionStorage → Game.tsx → Display
```

### API Endpoints

**`POST /api/generate-campaign`** - Full campaign (story + acts + quests)
```bash
curl -X POST http://localhost:8000/api/generate-campaign \
  -H "Content-Type: application/json" \
  -d '{"outline": "epic fantasy quest"}'
```

**`POST /api/generate-story`** - Story only (faster preview)

**`POST /api/generate-game-plan`** - Story + acts (no quests)

**`GET /health`** - Health check

See interactive docs at http://localhost:8000/docs

## Project Structure

```
AgenticTableTop/
├── README.md               # This file - main documentation
├── api.py                  # FastAPI backend server
├── main.py                 # CLI entry point
├── config.yaml             # Game configuration
├── Makefile                # Build and run commands
├── requirements.txt        # Python dependencies
│
├── docs/                   # Documentation
│   ├── INTRO.md            # Beginner's guide to D&D
│   ├── INTEGRATION_GUIDE.md    # Technical integration details
│   ├── ENV_SETUP.md        # Environment setup
│   ├── TESTING_SETUP.md    # Testing guide
│   └── DEPENDENCIES.md     # Dependency management
│
├── scripts/                # Utility scripts
│   ├── start-backend.sh    # Start backend API
│   ├── start-frontend.sh   # Start frontend UI
│   ├── start-all.sh        # Start both
│   ├── setup_dev.sh        # Development setup
│   ├── test.sh             # Run tests
│   └── format.sh           # Code formatting
│
├── utils/                  # Core Python modules
│   ├── agents.py           # AI agents (story, planner, quests)
│   ├── model.py            # LLM initialization
│   ├── prompt.py           # Prompt templates
│   ├── state.py            # Game state management
│   └── tools.py            # Utilities (dice, parsers)
│
├── ui/                     # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Index.tsx   # Campaign generator
│   │   │   └── Game.tsx    # Campaign viewer
│   │   ├── services/
│   │   │   └── campaignApi.ts  # Backend API client
│   │   └── components/ui/  # Shadcn UI components
│   └── package.json
│
└── tests/                  # Test suite
    ├── test_agents.py
    ├── test_model.py
    └── test_tools.py
```

## Configuration

### API Keys
Required: At least one of these in `.env`:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
# OR
GEMINI_API_KEY=AIza-your-key-here
```

Get API keys:
- OpenAI: https://platform.openai.com/api-keys
- Google Gemini: https://makersuite.google.com/app/apikey

### Customization
- **Game Settings**: Edit `config.yaml`
- **LLM Model**: Edit `utils/model.py`
- **Prompts**: Edit `utils/prompt.py`
- **Frontend API URL**: Create `ui/.env` with `VITE_API_URL=http://localhost:8000`

## Development

### Setup Development Environment
```bash
make setup
# or: bash scripts/setup_dev.sh
```

### Running Tests
```bash
make test              # Run all tests
make coverage          # Run with coverage report
```

### Code Formatting
```bash
make format            # Format and lint code
make check             # Check without modifying
make lint              # Run linter only
```

### Available Commands
```bash
make help              # Show all commands
make install           # Install dependencies
make run               # Run CLI generator
make api               # Start backend API
make frontend          # Start frontend UI
make start-all         # Start both
make test              # Run tests
make format            # Format code
make clean             # Clean generated files
```

### LLM Response Caching

For local development, LLM responses are cached to reduce API calls and improve iteration speed.

**Cache Configuration:**
```bash
# In your .env file
LLM_CACHE_ENABLED=true          # Enable/disable caching
LLM_CACHE_EXPIRY_HOURS=24       # Cache expiry time (hours)
```

**Cache Management:**
- **Cache Directory**: `cache/llm_responses/` (auto-created)
- **Cache Stats**: `GET /api/cache/stats` - View cache statistics
- **Clear Cache**: `POST /api/cache/clear` - Remove all cached responses
- **Cleanup Expired**: `POST /api/cache/cleanup` - Remove expired entries

**Testing Cache:**
```bash
python test_cache.py  # Test caching functionality
```

**Cache Behavior:**
- Campaign generation responses are cached by outline + model type
- Story generation responses are cached separately
- NPC image generation responses are cached by NPC details
- Cache files expire after 24 hours (configurable)
- Cache is automatically excluded from git commits

## Troubleshooting

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "API key not found"
1. Create `.env` file: `cp env.example .env`
2. Add your actual API key (not the example text)
3. Restart the backend server

### "Cannot connect to backend"
Make sure backend is running:
```bash
make api  # In a separate terminal
```

### "npm: command not found"
Install Node.js from https://nodejs.org/

### Campaign not loading in UI
1. Generate a new campaign from the Index page
2. Check browser console (F12) for errors
3. Verify backend is running and accessible

### Port already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or change port in api.py
```

## Roadmap

### Phase 1: Content Generation (Current)
- [x] Background story generation
- [x] Multi-act game plan generation
- [x] Quest generation for each act
- [x] Web UI with campaign viewer
- [x] REST API backend
- [ ] NPC generation with personalities
- [ ] Monster generation with stat blocks

### Phase 2: Interactive Game Master
- [ ] AI Dungeon Master for real-time narration
- [ ] Turn-based player action handling
- [ ] Dynamic dialogue system with NPCs
- [ ] Combat encounter management
- [ ] Session state persistence

### Phase 3: Advanced Features
- [ ] Multi-agent collaboration (DM, NPCs, players)
- [ ] RAG system for D&D rules knowledge
- [ ] Campaign memory for consistency
- [ ] Adaptive storytelling based on player choices
- [ ] Voice interface for immersive gameplay

## Documentation

- **[docs/INTRO.md](docs/INTRO.md)** - Beginner's guide to D&D and this project *(Start here!)*
- **[docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)** - Detailed architecture and integration
- **[docs/ENV_SETUP.md](docs/ENV_SETUP.md)** - Environment variable setup guide
- **[docs/TESTING_SETUP.md](docs/TESTING_SETUP.md)** - Testing infrastructure
- **[docs/DEPENDENCIES.md](docs/DEPENDENCIES.md)** - Dependency management

## Technology Stack

### Backend
- Python 3.8+
- FastAPI - Modern web framework
- Uvicorn - ASGI server
- LangChain - LLM orchestration
- Pydantic - Data validation
- OpenAI GPT / Google Gemini - AI models

### Frontend
- React 18 + TypeScript
- Vite - Fast build tool
- Tailwind CSS + Shadcn UI
- React Router - Navigation
- TanStack Query - State management

## Contributing

1. Set up development environment: `make setup`
2. Make your changes
3. Run tests: `make test`
4. Format code: `make format`
5. Commit changes (pre-commit hooks run automatically)

See [docs/TESTING_SETUP.md](docs/TESTING_SETUP.md) for more details.

## Changelog

### 10/23/2025 - Project Restructure
- Organized all scripts into `/scripts` folder
- Moved documentation to `/docs` folder
- Cleaned up root directory structure
- Updated README with clearer organization
- Updated Makefile and scripts to use new paths

### 10/23/2025 - Full-Stack Integration
- Added React-based Web UI with campaign generator and viewer
- Created FastAPI backend API with REST endpoints
- Integrated frontend with backend via REST API
- Added startup scripts (`make start-all`)
- Removed Supabase authentication for local-first development
- Created comprehensive integration documentation

### 10/12/2025 - Quest System
- Added quest generation system (3-5 quests per act)
- Enhanced quest output with descriptions and objectives
- Created INTRO.md for beginners
- Added Makefile commands
- Improved test infrastructure

### 10/11/2025 - Initial Release
- Background story generation
- Game planning agent with multi-act structure
- GEMINI API support
- Dice rolling utilities

## License

See [LICENSE](LICENSE) file for details.

---

**Ready to create epic D&D campaigns?** Run `make start-all` and start adventuring!
