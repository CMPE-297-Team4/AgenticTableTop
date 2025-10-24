# Introduction to AgenticTableTop

**New to D&D or tabletop RPGs?** This guide explains what this project does and why it's useful.

## What is Dungeons & Dragons (D&D)?

Dungeons & Dragons is a tabletop role-playing game where:

- **Players** create characters (heroes) and make decisions about what they do
- **Dungeon Master (DM)** is like a game director who describes the world, plays all other characters, and manages the story
- **Gameplay** is collaborative storytelling with dice rolls to determine outcomes
- **Campaigns** are long story arcs spanning multiple game sessions (like a TV series)
- **Sessions** are individual game meetings (usually 3-4 hours each)

### Example D&D Session

```
DM: "You enter a dark tavern. A hooded figure watches you from the corner."
Player: "I want to approach them and ask about the missing villagers."
DM: "Roll a persuasion check." [Player rolls dice]
Player: "I got a 17!"
DM: "The figure leans forward and whispers, 'Meet me at midnight by the old shrine...'"
```

## What Does AgenticTableTop Do?

**The Problem:**
Creating D&D content takes HOURS of preparation:
- Writing background stories
- Planning story arcs
- Designing quests
- Creating NPCs (non-player characters)
- Balancing encounters
- Drawing maps

A typical campaign can take 20-40 hours to prepare!

**Our Solution:**
Use AI to generate complete D&D campaign content automatically. Instead of spending weeks preparing, generate everything in minutes.

## What the System Currently Does

### Phase 1: Content Generation (COMPLETED)

Running `python main.py` generates:

#### 1. Background Story
A rich campaign setting with:
- Title and theme
- World history and lore
- Central conflict
- Key themes

**Example Output:**
```
Title: "The Echoing Curse"
Background: Long ago, the kingdom of Arvendale was struck by a mysterious 
curse that causes laughter to echo through the night, driving people mad...
```

#### 2. Multi-Act Game Plan
Breaks the story into 3-5 acts:
- Act titles and summaries
- Narrative goals for each act
- Key locations
- Story progression
- Entry/exit conditions

**Example Output:**
```
Act I - The First Echoes
  Goal: Investigate the source of mysterious laughter
  Locations: Village of Thornwick, Dark Forest
  Stakes: Village survival
  
Act II - Into the Depths
  Goal: Explore ancient catacombs beneath the village
  Locations: Underground tunnels, Forgotten temple
  Stakes: Prevent curse from spreading
```

#### 3. Detailed Quests (NEW!)
Generates 3-5 quests per act with:
- Quest names and types (Combat, Investigation, Social, Exploration)
- Full descriptions
- Step-by-step objectives
- NPCs involved
- Locations used
- Rewards (gold, items, story progression)
- Difficulty levels
- Estimated play time

**Example Quest Output:**
```
Quest 1: Whispers in the Tavern
  Type: Investigation (Main)
  Description: Strange laughter echoes through the tavern at night. 
  Interview witnesses to understand the pattern of these occurrences.
  Objectives:
    1. Interview the tavern keeper about the incidents
    2. Speak with three patrons who witnessed the laughter
    3. Investigate the tavern basement at midnight
    4. Connect the events to a map of echo points
```

**Note:** Full quest data (NPCs, locations, rewards, difficulty) is generated and stored but not displayed in console. This keeps output focused on what DMs need to run the quest.

### What You Get

After 1-2 minutes of generation:
- A complete campaign framework
- 3-5 acts of story progression
- 10-20 detailed quests
- Ready to play immediately

**Before AgenticTableTop:** 20-40 hours of prep work
**With AgenticTableTop:** 2 minutes of AI generation

## What's Coming Next

### Phase 1: Remaining Content (Next 2-3 Weeks)

#### NPC Generator (Next Up!)
Automatically create characters with:
- Names, races, classes
- Personalities and motivations
- Backstories
- Character stats
- Relationship to quests
- Dialogue suggestions

#### Monster Generator
Create balanced encounters:
- Monster types and abilities
- Challenge ratings (difficulty)
- Stats and hit points
- Special abilities
- Treasure drops
- Linked to combat quests

#### Player Character System
- Load existing character sheets
- Track character progression
- Integrate with campaign difficulty

#### Campaign Export/Import
- Save campaigns to files
- Share with other DMs
- Version control
- Multiple campaign management

### Phase 2: Interactive Game Master (Future)

Transform from content generator to active game assistant:

#### AI Dungeon Master
- Real-time narration during gameplay
- Respond to player actions
- Improvise when players go "off-script"
- Maintain story consistency
- Track campaign state

#### Dynamic NPC Interactions
- NPCs respond to player questions in real-time
- Remember previous conversations
- React to player reputation
- Provide hints or mislead based on personality

#### Combat Manager
- Run combat encounters
- Control enemy tactics
- Apply D&D rules correctly
- Track initiative and HP
- Generate combat descriptions

#### Session Management
- Save game state between sessions
- Track quest completion
- Update world based on player actions
- Generate session recaps

### Phase 3: Advanced AI Features (Long Term)

#### RAG System (Retrieval-Augmented Generation)
Why we need it:
- Current system might generate rule-breaking content
- Monsters might have incorrect stats
- Spells might work wrong

What it does:
- Index official D&D rulebooks
- Retrieve accurate monster stats
- Validate generated content against rules
- Suggest appropriate challenge ratings
- Reference real D&D items/spells

#### Campaign Memory
- Remember everything that happened
- Track NPC relationships
- Recall player decisions
- Maintain world consistency across 50+ sessions
- Reference past events naturally

#### Adaptive Storytelling
- Adjust difficulty based on party success
- Generate side quests from player actions
- Create consequences for player choices
- Weave player backstories into main plot
- Dynamic world that reacts to players

#### Multi-Agent System
Different AI agents for different roles:
- **DM Agent**: Story and world management
- **NPC Agents**: Each major NPC has own personality model
- **Rules Agent**: Ensures D&D rules compliance
- **Balance Agent**: Monitors encounter difficulty

## Current Architecture

```
Input: Simple campaign idea ("I want a dark fantasy campaign")
  ↓
Background Story Generator (AI)
  ↓
Game Plan Generator (AI) → 3-5 Acts
  ↓
Quest Generator (AI) → 3-5 Quests per Act
  ↓
Output: Complete campaign ready to play
```

---

**Ready to get started?** Head to the main [README.md](README.md) for setup instructions, usage guide, and contribution information.

