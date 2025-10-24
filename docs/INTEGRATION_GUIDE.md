# Integration Guide: Frontend + Backend

This guide explains how the AgenticTableTop frontend (UI) and backend (API) are integrated.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AgenticTableTop                          │
└─────────────────────────────────────────────────────────────┘

Frontend (React + TypeScript)          Backend (Python + FastAPI)
┌──────────────────────────┐          ┌──────────────────────────┐
│  ui/                     │          │  api.py                  │
│  ├── src/                │  HTTP    │  ├── /api/generate-     │
│  │   ├── pages/          │◄────────►│  │      campaign        │
│  │   │   ├── Index.tsx  │  REST    │  │   /api/generate-     │
│  │   │   └── Game.tsx   │   API    │  │      story           │
│  │   ├── services/       │          │  └── /health            │
│  │   │   └── campaign-   │          │                         │
│  │   │       Api.ts      │          │  utils/                 │
│  │   └── components/ui   │          │  ├── agents.py          │
│  └── package.json        │          │  ├── model.py           │
└──────────────────────────┘          │  └── state.py           │
                                       └──────────────────────────┘
        localhost:5173                      localhost:8000
```

## How It Works

### 1. Campaign Generation Flow

```
User Input (Index.tsx)
    ↓
campaignApi.generateCampaign()
    ↓
POST /api/generate-campaign
    ↓
Backend: initialize_llm()
    ↓
Backend: background_story()
    ↓
Backend: generate_game_plan()
    ↓
Backend: generate_quests_for_act() (for each act)
    ↓
Return Campaign JSON
    ↓
Store in sessionStorage
    ↓
Navigate to Game Page
    ↓
Display Campaign (Game.tsx)
```

### 2. Frontend Components

#### **Index.tsx** (Landing Page)
- User inputs campaign outline
- Calls `generateCampaign()` API
- Shows loading state during generation
- Redirects to Game page on success

#### **Game.tsx** (Campaign Viewer)
- Loads campaign from sessionStorage
- Displays campaign title, theme, background
- Shows acts with navigation
- Displays quests per act in accordion
- Interactive UI to explore campaign

#### **campaignApi.ts** (Service Layer)
- Handles all API communication
- Type-safe interfaces (TypeScript)
- Error handling and validation
- Three main functions:
  - `generateCampaign()` - Full campaign
  - `generateStory()` - Story only (faster)
  - `generateGamePlan()` - Story + acts (no quests)

### 3. Backend API Endpoints

#### `POST /api/generate-campaign`
**Purpose:** Generate complete campaign (story + acts + quests)

**Request:**
```json
{
  "outline": "I want a dark fantasy campaign...",
  "model_type": "openai"
}
```

**Response:**
```json
{
  "title": "The Shadow of Valoria",
  "background": "Long ago...",
  "theme": "Dark Fantasy",
  "acts": [
    {
      "title": "Act I: The Awakening",
      "summary": "...",
      "goal": "...",
      "locations": [...],
      "stakes": "..."
    }
  ],
  "quests": {
    "act_0": [
      {
        "name": "Whispers in the Dark",
        "type": "Investigation",
        "description": "...",
        "objectives": [...]
      }
    ]
  },
  "total_acts": 3,
  "total_quests": 12
}
```

#### `POST /api/generate-story`
**Purpose:** Generate only background story (faster preview)

**Response:**
```json
{
  "title": "The Shadow of Valoria",
  "background": "Long ago...",
  "theme": "Dark Fantasy"
}
```

#### `GET /health`
**Purpose:** Health check for API availability

**Response:**
```json
{
  "status": "ok",
  "service": "AgenticTableTop API"
}
```

## Quick Start

### Option 1: Start Everything Together
```bash
make start-all
# or
bash start-all.sh
```

This starts both backend and frontend. Access the app at http://localhost:5173

### Option 2: Start Separately

**Terminal 1 - Backend:**
```bash
make api
# or
bash start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
make frontend
# or
bash start-frontend.sh
```

### Option 3: Using Makefile Commands
```bash
# Start backend only
make api

# Start frontend only (in another terminal)
make frontend

# Or start both
make start-all
```

## Environment Setup

### Backend Requirements
1. **Python 3.8+** with virtual environment
2. **API Keys** - Set at least one:
   ```bash
   export OPENAI_API_KEY="sk-proj-your-key"
   # or
   export GEMINI_API_KEY="AIza-your-key"
   ```

3. **Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Requirements
1. **Node.js 16+** and npm
2. **Dependencies:**
   ```bash
   cd ui
   npm install
   ```

## Configuration

### Backend Configuration
- **LLM Model:** Edit `utils/model.py`
- **Prompts:** Edit `utils/prompt.py`
- **Port:** Default 8000, change in `api.py`

### Frontend Configuration
Create `ui/.env` file:
```env
VITE_API_URL=http://localhost:8000
```

## Data Flow

### SessionStorage
The frontend uses `sessionStorage` to persist campaign data:
- **Key:** `currentCampaign`
- **Data:** Complete campaign JSON
- **Lifetime:** Current browser tab session

### Why sessionStorage?
- Simple local storage
- No database needed
- Fast access
- Automatic cleanup on tab close
- Good for demo/development

**For Production:** Consider adding:
- Database persistence (PostgreSQL/MongoDB)
- User accounts
- Campaign library
- Share/export features

## API Testing

### Using curl
```bash
# Health check
curl http://localhost:8000/health

# Generate story only
curl -X POST http://localhost:8000/api/generate-story \
  -H "Content-Type: application/json" \
  -d '{"outline": "dark fantasy campaign"}'

# Generate full campaign
curl -X POST http://localhost:8000/api/generate-campaign \
  -H "Content-Type: application/json" \
  -d '{"outline": "epic quest to save the realm"}'
```

### Using API Docs
Visit http://localhost:8000/docs for interactive API documentation (Swagger UI)

## Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
pip install -r requirements.txt
```

**Problem:** API key not found
```bash
# Check if set
echo $OPENAI_API_KEY

# Set it
export OPENAI_API_KEY="your-key"

# Or use .env file
cp env.example .env
# Edit .env with your keys
```

**Problem:** Port 8000 already in use
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9

# Or change port in api.py
```

### Frontend Issues

**Problem:** `Cannot connect to backend`
- Make sure backend is running on http://localhost:8000
- Check browser console for CORS errors
- Verify VITE_API_URL in ui/.env

**Problem:** `npm: command not found`
```bash
# Install Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Problem:** Campaign not loading
- Check browser console for errors
- Verify sessionStorage: Open DevTools → Application → Session Storage
- Generate a new campaign from Index page

## Development Workflow

### Making Changes to Backend
1. Edit Python files in `utils/` or `api.py`
2. API will auto-reload (uvicorn `--reload` flag)
3. Test changes at http://localhost:8000/docs

### Making Changes to Frontend
1. Edit TypeScript files in `ui/src/`
2. Vite will auto-reload in browser
3. Changes appear immediately

### Adding New API Endpoints

**Backend (api.py):**
```python
@app.post("/api/new-endpoint")
async def new_endpoint(request: RequestModel):
    # Implementation
    return {"result": "data"}
```

**Frontend (campaignApi.ts):**
```typescript
export async function newEndpoint(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/new-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

## Next Steps

### Planned Features
1. **Authentication** - User accounts and saved campaigns
2. **Database** - PostgreSQL for persistence
3. **Real-time Updates** - WebSocket for live generation progress
4. **Export/Import** - Save campaigns as JSON/PDF
5. **Interactive Gameplay** - Turn-based game with AI DM

### Contributing
1. Create feature branch
2. Make changes
3. Test with `make test`
4. Format with `make format`
5. Submit PR

## Resources

- **Backend Docs:** http://localhost:8000/docs
- **Frontend Dev:** http://localhost:5173
- **Main README:** [README.md](README.md)
- **Setup Guide:** [ENV_SETUP.md](ENV_SETUP.md)
- **Testing:** [TESTING_SETUP.md](TESTING_SETUP.md)

