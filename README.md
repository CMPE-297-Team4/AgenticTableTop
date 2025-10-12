# AgenticTableTop
CMPE297- Team 4 Project

An AI-powered Dungeons & Dragons game simulator where AI agents take on multiple roles - Dungeon Master, NPCs, monsters, and more - to create dynamic, interactive tabletop RPG experiences.

## Vision

Build a complete D&D game simulator where:
- **AI Dungeon Master** orchestrates the game, narrates events, and manages the world
- **AI NPCs** with unique personalities interact with players
- **AI Combat System** manages encounters with intelligent monster behavior
- **Dynamic Storytelling** adapts to player choices in real-time
- **Multi-Agent System** with specialized agents working together

## Current Features (Phase 1)

- **Background Story Generation**: Creates immersive D&D campaign backgrounds from simple outlines
- **Game Plan Generation**: Breaks down stories into structured acts with narrative goals and conflicts
- **Multi-LLM Support**: Works with OpenAI GPT models and Google Gemini
- **Dice Rolling**: Built-in dice rolling utilities for D&D mechanics
- **Testing Infrastructure**: Comprehensive test suite with 29+ unit tests

## Roadmap

### Phase 1: Content Generation (Current)
- [x] Background story generation
- [x] Multi-act game plan generation
- [ ] Quest generation for each act
- [ ] NPC generation with personalities
- [ ] Monster generation with stat blocks
- [ ] Player character loading

### Phase 2: Interactive Game Master
- [ ] AI Dungeon Master agent for real-time narration
- [ ] Turn-based player action handling
- [ ] Dynamic dialogue system with NPCs
- [ ] Combat encounter management
- [ ] Session state persistence

### Phase 3: Advanced AI Agents
- [ ] Multi-agent collaboration (DM, NPCs, players)
- [ ] RAG system for D&D rules knowledge
- [ ] Campaign memory for consistency
- [ ] Adaptive storytelling based on player choices
- [ ] Voice interface for immersive gameplay

## Setup

### Installation

1. Clone the repository
2. Install core dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) Install heavy ML dependencies if needed:
```bash
pip install -r requirements-optional.txt
```

4. **Set up your API keys** (see [ENV_SETUP.md](ENV_SETUP.md) for detailed guide):

   You need at least ONE of these:
   ```bash
   export OPENAI_API_KEY="sk-proj-your-key-here"
   # or
   export GEMINI_API_KEY="AIza-your-key-here"
   ```

   **Quick setup:**
   ```bash
   # Copy example file
   cp env.example .env
   
   # Edit .env with your actual keys
   nano .env  # or use any text editor
   ```

5. Configure the game in `config.yaml`
6. Run the content generator (Phase 1):
```bash
python main.py
```

This will generate a campaign background and multi-act game plan. Interactive gameplay features are in development.

## Development

### Setup Development Environment

```bash
# One-command setup (installs dependencies and sets up pre-commit hooks)
bash scripts/setup_dev.sh
```

Or manually:
```bash
pip install -r requirements-dev.txt
pre-commit install
```

### Running Tests

```bash
# Run all tests
bash scripts/test.sh

# Or with pytest directly
pytest tests/ -v
```

### Code Formatting

```bash
# Format and lint code
bash scripts/format.sh

# Or manually
black utils/ main.py tests/
isort utils/ main.py tests/
flake8 utils/ main.py tests/
```

### Testing Infrastructure

The project includes comprehensive testing infrastructure:
- **Unit tests** for all utility functions and agents
- **Mock LLM fixtures** for testing without API calls
- **Code coverage reporting** (when pytest-cov is installed)
- **Pre-commit hooks** for automatic code formatting and linting

## Project Structure

```
AgenticTableTop/
├── main.py                 # Entry point
├── config.yaml            # Game configuration
├── utils/
│   ├── agents.py          # Agent implementations (storyteller, game planner)
│   ├── model.py           # LLM initialization and configuration
│   ├── prompt.py          # Prompt templates
│   ├── state.py           # Game state management
│   └── tools.py           # Utility functions (parsers, dice rolling)
├── tests/                 # Test suite
│   ├── conftest.py        # Test fixtures
│   ├── test_agents.py     # Agent tests
│   ├── test_tools.py      # Utility function tests
│   └── test_model.py      # LLM initialization tests
└── scripts/               # Helper scripts
    ├── setup_dev.sh       # Development environment setup
    ├── test.sh            # Run tests
    └── format.sh          # Format code
```

## Configuration

### Current Phase (Content Generation)
- **Game Settings**: Edit `config.yaml` to customize background story generation
- **LLM Settings**: Edit `utils/model.py` to change model type, temperature, and token limits
- **Prompts**: Customize prompts in `utils/prompt.py` for different campaign styles

### Future Configuration (Interactive Gameplay)
- Game Master personality and behavior
- NPC dialogue styles
- Combat difficulty and AI behavior
- House rules and custom D&D mechanics

## Documentation

- **[ENV_SETUP.md](ENV_SETUP.md)** - Comprehensive environment variable setup guide
- **[TESTING_SETUP.md](TESTING_SETUP.md)** - Complete testing infrastructure documentation
- **[DEPENDENCIES.md](DEPENDENCIES.md)** - Dependency management and cleanup information

## Changelog

### 10/12/2025:
- Added comprehensive testing infrastructure (29 unit tests)
- Set up code formatting (black, isort, flake8)
- Added pre-commit hooks for code quality
- Created helper scripts for development workflow
- Added .gitignore and project configuration files
- Cleaned up requirements.txt to only include used dependencies
- Created requirements-optional.txt for heavy ML packages

### 10/11/2025:
- Added sample Dice rolling function
- Added Game planning agent that transforms the generic background story into different acts with more details breakdown
- Added GEMINI API support for trying different models

## Contributing

1. Set up the development environment: `bash scripts/setup_dev.sh`
2. Make your changes
3. Run tests: `bash scripts/test.sh`
4. Format code: `bash scripts/format.sh`
5. Commit your changes (pre-commit hooks will run automatically)

For more details, see [TESTING_SETUP.md](TESTING_SETUP.md).