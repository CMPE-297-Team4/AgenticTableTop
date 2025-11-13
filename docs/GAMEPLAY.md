# D&D Gameplay System

## Overview

The AgenticTableTop gameplay system transforms generated campaigns into fully playable D&D sessions with AI-powered Dungeon Master and monster agents.

## Key Components

### 1. Player Character System

**Full D&D 5e Character Sheets**
- Complete character generation using OpenAI function calling
- All standard D&D 5e fields (abilities, skills, saving throws, combat stats, etc.)
- Automatic portrait generation
- Character persistence in database

**API Endpoints:**
- `POST /api/characters/create` - Generate new character
- `GET /api/characters` - List user's characters
- `GET /api/characters/{id}` - Get character details
- `PUT /api/characters/{id}` - Update character (HP, stats, etc.)
- `DELETE /api/characters/{id}` - Delete character
- `POST /api/characters/{id}/portrait` - Regenerate portrait

### 2. Game Session Management

**Session State**
- Current act and quest progress
- Active quest and objectives
- Player character states
- Combat state (if in combat)
- Narrative history
- Save/load functionality

**API Endpoints:**
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions` - List user's sessions
- `GET /api/sessions/{id}` - Get session details
- `POST /api/sessions/{id}/start` - Start/continue session
- `POST /api/sessions/{id}/save` - Save session state
- `POST /api/sessions/{id}/action` - Process player action
- `DELETE /api/sessions/{id}` - Delete session

### 3. AI Dungeon Master Agent

**Capabilities:**
- Scene narration based on campaign context
- Response to player actions
- Quest progression management
- Combat narration
- RAG-enhanced knowledge retrieval

**API Endpoints:**
- `POST /api/dm/narrate-scene` - Get scene narration
- `POST /api/dm/respond-action` - DM responds to action
- `POST /api/dm/advance-quest` - Check quest progression
- `POST /api/dm/narrate-combat` - Combat narration
- `POST /api/dm/narrate-scene/audio` - Get narration as audio (TTS)

### 4. AI Monster Agents

**Combat Decisions:**
- Tactical action selection (attack, spell, move, etc.)
- Target selection based on threat assessment
- Intelligence and alignment-based behavior
- Context-aware decision making

**Non-Combat Behavior:**
- Dialogue and reactions
- Alignment-based responses
- Intelligence-appropriate behavior

**Integration:**
- Integrated into `CombatEncounter` class
- `get_monster_action()` method for AI decisions

### 5. Gameplay Flow

**State Machine:**
- `EXPLORATION` - Free exploration
- `COMBAT` - Active combat encounter
- `DIALOGUE` - Dialogue/negotiation
- `QUEST_COMPLETE` - Quest completion state

**Player Actions:**
- `MOVE` - Movement
- `ATTACK` - Combat attack
- `CAST_SPELL` - Spell casting
- `USE_ITEM` - Item usage
- `TALK` - Dialogue
- `INVESTIGATE` - Investigation
- And more...

## Usage Flow

### 1. Create a Character

```python
POST /api/characters/create
{
    "character_name": "Aragorn",
    "class_and_level": "Ranger 5",
    "race": "Human",
    "background": "Folk Hero",
    "alignment": "Lawful Good"
}
```

### 2. Create a Game Session

```python
POST /api/sessions/create
{
    "campaign_id": 1,
    "session_name": "Session 1: The Journey Begins",
    "character_ids": [1, 2, 3]
}
```

### 3. Start Playing

```python
POST /api/sessions/{id}/start
# Returns campaign data and current state
```

### 4. Take Actions

```python
POST /api/sessions/{id}/action
{
    "action_type": "INVESTIGATE",
    "character_name": "Aragorn",
    "description": "I examine the door for traps",
    "target": "door"
}
# Returns DM response and updated state
```

### 5. Get Scene Narration

```python
POST /api/dm/narrate-scene
{
    "session_id": 1,
    "location": "Ancient Ruins"
}
# Returns scene description
```

## Integration with Campaign System

The gameplay system integrates seamlessly with the campaign generation:

1. **Campaign → Session**: Create sessions from generated campaigns
2. **Quests → Encounters**: Quests become playable encounters
3. **Monsters → Combat**: Generated monsters are controlled by AI agents
4. **RAG → DM Knowledge**: Campaign knowledge enhances DM responses

## Testing

Comprehensive test suite includes:
- `tests/test_characters.py` - Character generation tests
- `tests/test_sessions.py` - Session state management tests
- `tests/test_dm_agent.py` - DM agent tests
- `tests/test_monster_agent.py` - Monster agent tests
- `tests/test_integration.py` - Integration tests

Run tests:
```bash
pytest tests/ -v
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system architecture and component connections.

