storyteller_prompt = """
# CRITICAL: MATCH THE CAMPAIGN THEME IN YOUR WRITING STYLE

**MOST IMPORTANT**: The outline will specify a theme. Your ENTIRE writing style, tone, and language MUST match that theme.

## Theme Writing Examples:

**COMEDY Theme:**
- Write with HUMOR, wit, jokes, absurd situations
- Make things funny, ridiculous, entertaining
- Example tone: "The Kingdom of Bumbleshire is in crisis. Not the 'ancient evil awakens' kind of crisis, but the 'someone stole the king's favorite rubber duck and now he won't get out of the bathtub' kind. The kingdom's greatest heroes (read: whoever was dumb enough to answer the job posting) must retrieve the duck before the kingdom's economy collapses from the king's refusal to sign anything."

**HORROR Theme:**
- Write with DARK, unsettling, creepy atmosphere
- Focus on dread, terror, disturbing details
- Example tone: "The village has been silent for three days. No birds sing. No wind stirs the trees. The houses stand with doors ajar, meals half-eaten on tables, as if everyone simply... stopped. In the center of the village square, a symbol has been carved into the earth - one that hurts to look at directly."

**PIRATE Theme:**
- Write with NAUTICAL language, sea adventures
- Focus on treasure, ships, ocean settings
- Example tone: "The Crimson Tide has sailed the seven seas for a decade, her sails patched with the flags of defeated enemies. Captain Blackwater's crew is legendary - not for their mercy, but for their greed. Word spreads of a treasure buried on Devil's Reef, guarded by creatures that drag ships to the depths."

**STEAMPUNK Theme:**
- Write with INDUSTRIAL, Victorian, mechanical language
- Focus on inventions, gears, steam-powered tech
- Example tone: "The Brass City hums with the rhythm of a thousand gears. Steam vents hiss from every corner, and clockwork automatons patrol the gaslit streets. The Inventor's Guild controls the city through their monopoly on coal, but rumors speak of a revolutionary new power source hidden in the abandoned district."

You are a world-building Dungeon Master for a new D&D campaign.

# Instructions
1. Read the <outline> carefully - IDENTIFY THE THEME (Comedy, Horror, Pirate, Fantasy, Steampunk, etc.)
2. **CRITICAL**: Write your ENTIRE background story in the style of that theme
   - If Comedy: Be FUNNY throughout
   - If Horror: Be SCARY throughout
   - If Pirate: Use NAUTICAL language throughout
   - If Steampunk: Use MECHANICAL language throughout
3. Create a title that reflects the theme
4. Write a background story (3-5 paragraphs) that:
   - MATCHES THE THEME in tone, language, and style
   - Introduces setting, conflict, and narrative hooks
   - Uses appropriate vocabulary for the theme
5. Do NOT use generic fantasy language unless the theme is fantasy
6. Do NOT write dialogue or game stats

# Output Format
CRITICAL: Return ONLY valid JSON. Do NOT wrap it in markdown code blocks (no ```json). Return ONLY the raw JSON object, nothing else.

The JSON must be complete, parseable, and have ALL of the following required fields:
{
  "title": "<short, thematic title that reflects the campaign type - e.g., for Dark Fantasy: 'Shadows of the Forgotten Realm', for Pirate: 'Tide of the Crimson Sails'>",
  "background_story": "<the full story text>",
  "key_themes": ["theme1", "theme2", "theme3"]
}

IMPORTANT:
- Start your response with { and end with }
- Do NOT use markdown code blocks (no ```json or ```)
- Ensure all strings are properly quoted and escaped
- Ensure all brackets and braces are properly closed
- The JSON must be complete - do not truncate it

# Example
<outline>
A forgotten desert kingdom swallowed by sandstorms, ruled by a sleeping god beneath the dunes.
</outline>

<output>
{
  "title": "The Sands Beneath the Sleeping God",
  "background_story": "Centuries ago, the kingdom of Arasha stood as a beacon of gold and glass... [etc]",
  "tone": "mystical tragedy",
  "key_themes": ["ancient ruin", "hubris of kings", "divine silence"]
}

# Your Turn
<outline>
{{user_outline}}
</outline>

Return ONLY the JSON object, starting with { and ending with }. No markdown, no code blocks, no explanations - just the raw JSON.
"""

game_plan_prompt = """
You are a veteran Game Designer and Narrative Architect for a Dungeons & Dragons campaign.

Your job: Transform the background story into a **concise macro game plan** — 3–5 Acts that describe player progression at a high level.
Do NOT generate quests, NPCs, dialogue, or stat blocks. Keep this focused and implementation-ready.

# Instructions
1. Read title and background carefully to understand setting, tone, core conflict, and themes.
2. Propose 3–5 **Acts (Chapters)** that take players from the opening situation to the endgame.
3. For each Act, provide ONLY:
   - act_title: short and evocative.
   - act_summary: 2–4 sentences summarizing the act’s narrative focus and player experience.
   - narrative_goal: what players are trying to achieve in this act (one sentence).
   - primary_conflict: the main obstacle/tension opposing that goal.
   - stakes: what is at risk if the act fails or stalls.
   - key_locations: 2–4 place names (short labels only).
   - mechanics_or_features_introduced: systems/ideas unlocked here (e.g., investigation, stealth rituals, reputation, relic crafting).
   - entry_requirements: brief prerequisites to start this act (keep generic, no quest lists).
   - exit_conditions: what must be true to move to the next act (keep generic).
   - handoff_notes_for_next_stage: bullet notes indicating what info the **next stage** will need to generate detailed quests/NPCs for this act (e.g., “needs 1 main dungeon, 2 side investigation beats,” “needs 1 ally faction and 1 rival faction,” “requires a moral dilemma about X”).

4. After listing all Acts, include:
   - progression_overview: 3–5 sentences explaining how the Acts escalate and resolve the core conflict.
   - core_themes: 2–4 theme keywords distilled from the background.
   - open_threads_to_resolve_later: 2–4 seeds intentionally left for future quest/NPC generation.

===Title===
The title of the story is: <title>
===Background===
The background of the story is: <background>

# Output Format
CRITICAL: Return ONLY valid JSON. Do NOT wrap it in markdown code blocks (no ```json). Return ONLY the raw JSON object, nothing else.

The JSON must be complete, parseable, and have ALL of the following required fields:
{
  "title": "<same as input title>",
  "acts": [
    {
      "act_title": "",
      "act_summary": "",
      "narrative_goal": "",
      "primary_conflict": "",
      "stakes": "",
      "key_locations": ["", ""],
      "mechanics_or_features_introduced": ["", ""],
      "entry_requirements": "",
      "exit_conditions": "",
      "handoff_notes_for_next_stage": ["", ""]
    }
  ],
  "progression_overview": "",
  "core_themes": ["", ""],
  "open_threads_to_resolve_later": ["", ""]
}

IMPORTANT:
- Start your response with { and end with }
- Do NOT use markdown code blocks (no ```json or ```)
- Ensure all strings are properly quoted and escaped
- Ensure all brackets and braces are properly closed
- The JSON must be complete - do not truncate it

# Example Output
{
  "title": "The Laughter of Shadows",
  "acts": [
    {
      "act_title": "Act I — The Cracked Smile",
      "act_summary": "Afflictions ripple across border villages as laughter turns to panic. The party learns the curse has patterns tied to shrines of joy and forest winds.",
      "narrative_goal": "Identify the origin pattern and establish safe operating rituals.",
      "primary_conflict": "Communities resist investigation while hysteria and false cures spread.",
      "stakes": "If untreated, panic destabilizes trade and neighboring villages fall.",
      "key_locations": ["Meadow Village", "Shrine of Joy", "Forest Edge"],
      "mechanics_or_features_introduced": ["investigation clues", "ritual cleansing", "reputation with councils"],
      "entry_requirements": "Background brief from the Council of Matriarchs.",
      "exit_conditions": "Provisional map of echo points and a stable warding rite.",
      "handoff_notes_for_next_stage": ["Needs 1 civic investigation site", "Needs 1 contested ritual scene", "Introduce 1 skeptical official and 1 folk healer"]
    }
  ],
  "progression_overview": "Acts escalate from localized outbreaks to deep-wood incursions, then to confronting lieutenants amplifying cursed mirth, culminating in a moral resolution about sealing or redeeming the source.",
  "core_themes": ["joy vs control", "trust and community", "power of stories"],
  "open_threads_to_resolve_later": ["True nature of the Goddess's laughter", "Origin of the echo points network"]
}

Return ONLY the JSON object, starting with { and ending with }. No markdown, no code blocks, no explanations - just the raw JSON.
"""

quest_generation_prompt = """
# CRITICAL: MATCH THE CAMPAIGN THEME IN QUEST DESIGN

**MOST IMPORTANT**: Check if a campaign THEME is provided. ALL quest names, descriptions, and objectives MUST match that theme.

## Theme-Based Quest Examples:

**COMEDY Theme:**
- Quest names should be FUNNY: "The Great Cheese Heist", "Battle of the Bards (Who Can't Sing)"
- Descriptions should be HUMOROUS: "The tavern's famous cheese wheel has been stolen by a gang of overly dramatic raccoons"
- Objectives should be ABSURD: "Negotiate with the Raccoon King", "Recover the cheese without it getting moldy"

**HORROR Theme:**
- Quest names should be OMINOUS: "The Whispering Dark", "Silence in the Walls"
- Descriptions should be CREEPY: "Children have stopped speaking. They only point at the shadows and smile"
- Objectives should be UNSETTLING: "Investigate the silent children", "Discover what lives in the walls"

**PIRATE Theme:**
- Quest names should be NAUTICAL: "Dead Man's Cove", "The Kraken's Treasure"
- Descriptions should use SEA TERMS: "A merchant ship was attacked. Survivors speak of tentacles dragging sailors below"
- Objectives should be MARITIME: "Board the derelict ship", "Recover the treasure from the reef"

You are an expert D&D Quest Designer creating engaging quests for a campaign act.

# Instructions
1. **CHECK FOR CAMPAIGN THEME** - If provided, ALL quest content must match it
2. Read the act details carefully
3. Design 3-5 quests that:
   - **MATCH THE CAMPAIGN THEME** in names, descriptions, and objectives
   - Align with the act's narrative goal
   - Provide variety (combat, investigation, social, exploration)
   - Build toward the act's exit conditions
   - Use the specified key locations
4. If theme is Comedy: Make quests FUNNY
5. If theme is Horror: Make quests SCARY
6. If theme is Pirate: Use NAUTICAL language
7. If theme is Steampunk: Use MECHANICAL language

# Quest Types
- **Main Quest**: Critical to act progression
- **Side Quest**: Optional, provides character development or resources
- **Investigation**: Gather information, solve mysteries
- **Combat**: Fight enemies, clear dungeons
- **Social**: Negotiate, persuade, build relationships
- **Exploration**: Discover new locations, find secrets

# Act Details
===Title===
<act_title>

===Summary===
<act_summary>

===Narrative Goal===
<narrative_goal>

===Primary Conflict===
<primary_conflict>

===Key Locations===
<key_locations>

===Mechanics/Features===
<mechanics>

# Output Format
CRITICAL: Return ONLY valid JSON. Do NOT wrap it in markdown code blocks (no ```json). Return ONLY the raw JSON object, nothing else.

The JSON must be complete, parseable, and have ALL of the following required fields:
{
  "act_title": "<same as input>",
  "quests": [
    {
      "quest_name": "",
      "quest_type": "",
      "description": "",
      "objectives": ["", ""],
      "key_npcs": ["", ""],
      "locations": ["", ""],
      "rewards": "",
      "difficulty": "",
      "estimated_sessions": 1,
      "prerequisites": "",
      "outcomes": ""
    }
  ]
}

IMPORTANT:
- Start your response with { and end with }
- Do NOT use markdown code blocks (no ```json or ```)
- Ensure all strings are properly quoted and escaped
- Ensure all brackets and braces are properly closed
- The JSON must be complete - do not truncate it

# Example Output
{
  "act_title": "Act I - The Cracked Smile",
  "quests": [
    {
      "quest_name": "Whispers in the Market",
      "quest_type": "Investigation (Main)",
      "description": "Strange laughter echoes through the market at night. Investigate the source and interview witnesses to understand the pattern of afflictions.",
      "objectives": [
        "Interview three witnesses about the laughter incidents",
        "Investigate the market square at midnight",
        "Discover the connection to the Shrine of Joy"
      ],
      "key_npcs": ["Elder Mira (skeptical official)", "Tam the Healer (folk healer)", "Afflicted merchant"],
      "locations": ["Meadow Village Market", "Village Square"],
      "rewards": "Information about echo points, Trust of village elders, 100 gold",
      "difficulty": "Easy",
      "estimated_sessions": 1,
      "prerequisites": "Arrival in Meadow Village",
      "outcomes": "Learn about the curse pattern and receive invitation to investigate the shrine"
    },
    {
      "quest_name": "Cleansing the Shrine",
      "quest_type": "Combat/Ritual (Main)",
      "description": "The Shrine of Joy has become corrupted. Perform a cleansing ritual while defending against cursed spirits that emerge from the echo points.",
      "objectives": [
        "Gather ritual components from the forest",
        "Defend Elder Mira during the hour-long ritual",
        "Defeat the Laughing Shade at the ritual's climax"
      ],
      "key_npcs": ["Elder Mira", "Tam the Healer", "Guardian spirits"],
      "locations": ["Shrine of Joy", "Forest Edge"],
      "rewards": "Warding rite knowledge, Sacred amulet, 250 gold, Village alliance",
      "difficulty": "Medium",
      "estimated_sessions": 2,
      "prerequisites": "Complete 'Whispers in the Market'",
      "outcomes": "Stabilize the first echo point, gain map of other locations, progress to Act II"
    },
    {
      "quest_name": "The Healer's Secret",
      "quest_type": "Social (Side)",
      "description": "Tam the Healer knows more than she's sharing. Gain her trust to learn about ancient remedies and the true history of the curse.",
      "objectives": [
        "Help Tam gather rare medicinal herbs",
        "Protect her from suspicious villagers",
        "Earn her confidence through dialogue"
      ],
      "key_npcs": ["Tam the Healer", "Suspicious villagers"],
      "locations": ["Tam's Hut", "Deep Forest"],
      "rewards": "Healing potion recipe, Background lore, Tam as ally",
      "difficulty": "Easy",
      "estimated_sessions": 1,
      "prerequisites": "Meet Tam during main quest",
      "outcomes": "Optional ally for future quests, additional lore about the Goddess"
    }
  ]
}

Return ONLY the JSON object, starting with { and ending with }. No markdown, no code blocks, no explanations - just the raw JSON.
"""

monster_generation_prompt = """
You are an expert D&D Monster Designer creating balanced encounters for a campaign.

Your job: Generate EXACTLY the requested number of monsters for a specific combat quest that are thematically appropriate and balanced for the party level.

# CRITICAL: Match Campaign Theme
**IMPORTANT**: The monsters MUST match the campaign's theme:
- **Comedy**: Create funny, absurd, or silly monsters (e.g., "Clumsy Goblin Comedian", "The Mime Mimic", "Grumpy Talking Sheep")
- **Horror/Gothic**: Create terrifying, undead, or eldritch monsters (e.g., vampires, wraiths, aberrations)
- **Pirate**: Create sea creatures, pirates, or nautical threats (e.g., "Sahuagin Raider", "Spectral Pirate", "Giant Kraken")
- **Steampunk**: Create mechanical constructs or steam-powered enemies (e.g., "Clockwork Guardian", "Steam Elemental")
- **Dark Fantasy**: Create dark, corrupted, or shadow-based creatures
- **High Fantasy**: Create classic fantasy monsters like dragons, griffons, noble creatures
- **Cyberpunk**: Create robots, cyborgs, or AI-controlled enemies
- **Zombie**: Create undead, infected, or necromantic creatures
- etc. - ALWAYS match the specific theme provided.

# Instructions
1. Read the quest details AND campaign theme carefully
2. Generate EXACTLY the number of monsters specified (do not generate more or fewer)
3. Design monsters that:
   - **MATCH THE CAMPAIGN THEME** (this is the most important rule!)
   - Fit the quest's theme and setting
   - Are appropriate for the quest's difficulty level
   - Provide interesting tactical challenges
   - Have unique abilities and characteristics that match the theme
4. Ensure monsters are balanced according to D&D 5e rules
5. Include both combat stats and roleplay elements that reflect the theme

# Quest Details
===Quest Name===
<quest_name>

===Quest Description===
<quest_description>

===Quest Type===
<quest_type>

===Difficulty===
<difficulty>

===Key Locations===
<locations>

===Objectives===
<objectives>

# Monster Design Guidelines
- **Challenge Rating (CR)**: Use appropriate CR for the difficulty level
  - Easy: CR 1/4 to CR 1
  - Medium: CR 1 to CR 3
  - Hard: CR 3 to CR 6
  - Deadly: CR 6+
- **Hit Points**: Use average HP for the creature type
- **Armor Class**: Appropriate for the creature's natural defenses
- **Speed**: Include walking speed and any special movement
- **Abilities**: Include 1-3 special abilities or attacks
- **Resistances/Immunities**: Include if thematically appropriate
- **Senses**: Include passive Perception and any special senses

# Output Format
CRITICAL: Return ONLY valid JSON. Do NOT wrap it in markdown code blocks (no ```json). Return ONLY the raw JSON object, nothing else.

The JSON must be complete, parseable, and have ALL of the following required fields with correct data types:
{
  "quest_name": "<same as input>",
  "monsters": [
    {
      "name": "<string>",
      "size": "<string: Tiny, Small, Medium, Large, Huge, or Gargantuan>",
      "type": "<string: e.g., 'undead', 'construct', 'dragon'>",
      "alignment": "<string: e.g., 'chaotic evil', 'neutral'>",
      "armor_class": <number: integer>,
      "hit_points": <number: integer>,
      "speed": "<string: e.g., '30 ft., fly 60 ft.'>",
      "strength": <number: integer 1-30>,
      "dexterity": <number: integer 1-30>,
      "constitution": <number: integer 1-30>,
      "intelligence": <number: integer 1-30>,
      "wisdom": <number: integer 1-30>,
      "charisma": <number: integer 1-30>,
      "challenge_rating": "<string: e.g., '3', '1/2', '1/4'>",
      "proficiency_bonus": <number: integer>,
      "saving_throws": ["<string>", ...] or [],
      "skills": ["<string>", ...] or [],
      "damage_resistances": ["<string>", ...] or [],
      "damage_immunities": ["<string>", ...] or [],
      "condition_immunities": ["<string>", ...] or [],
      "senses": "<string: e.g., 'darkvision 60 ft., passive Perception 10'>",
      "languages": "<string: e.g., 'Common, Draconic'>",
      "special_abilities": [
        {
          "name": "<string>",
          "description": "<string>"
        }
      ] or [],
      "actions": [
        {
          "name": "<string>",
          "description": "<string>",
          "attack_bonus": <number: integer>,
          "damage": "<string: e.g., '2d6 + 3'>",
          "damage_type": "<string: e.g., 'necrotic', 'slashing'>"
        }
      ] or [],
      "legendary_actions": [] or [<array of legendary action objects>],
      "description": "<string: lore/visual description>",
      "tactics": "<string: combat tactics>",
      "treasure": "<string: e.g., '1d4 gold pieces'>",
      "environment": "<string: where this monster is found>"
    }
  ]
}

DATA TYPE REQUIREMENTS:
- Numbers (armor_class, hit_points, ability scores, etc.): Use integers, NOT strings
- Strings (name, size, type, etc.): Use quoted strings
- Arrays (saving_throws, skills, etc.): Use [] for empty arrays, NOT null
- challenge_rating: Must be a STRING (e.g., "3", "1/2", "1/4"), NOT a number
- All string fields must be non-empty strings, even if brief
- The "monsters" array must contain at least 1 monster object (generate 1-3 monsters)

IMPORTANT JSON FORMAT RULES:
- Start your response with { and end with }
- Do NOT use markdown code blocks (no ```json or ```)
- Escape special characters in strings: use \\n for newlines, \\" for quotes
- Ensure all strings are properly quoted and escaped
- Ensure all brackets and braces are properly closed
- Arrays must be complete - do not truncate arrays mid-element
- The JSON must be complete - do not truncate the response
- Use [] for empty arrays, never null or undefined

# Example Output
{
  "quest_name": "Cleansing the Shrine",
  "monsters": [
    {
      "name": "Laughing Shade",
      "size": "Medium",
      "type": "undead",
      "alignment": "chaotic evil",
      "armor_class": 13,
      "hit_points": 45,
      "speed": "30 ft., fly 60 ft. (hover)",
      "strength": 8,
      "dexterity": 17,
      "constitution": 12,
      "intelligence": 6,
      "wisdom": 10,
      "charisma": 8,
      "challenge_rating": "3",
      "proficiency_bonus": 2,
      "saving_throws": ["Dex +5"],
      "skills": ["Stealth +5"],
      "damage_resistances": ["necrotic", "psychic"],
      "damage_immunities": ["poison"],
      "condition_immunities": ["charmed", "exhaustion", "frightened", "poisoned"],
      "senses": "darkvision 60 ft., passive Perception 10",
      "languages": "understands Common but can't speak",
      "special_abilities": [
        {
          "name": "Incorporeal Movement",
          "description": "The shade can move through other creatures and objects as if they were difficult terrain. It takes 5 (1d10) force damage if it ends its turn inside an object."
        },
        {
          "name": "Maddening Laughter",
          "description": "As a bonus action, the shade can emit a burst of maddening laughter. Each creature within 10 feet must make a DC 13 Wisdom saving throw or be frightened until the end of the shade's next turn."
        }
      ],
      "actions": [
        {
          "name": "Life Drain",
          "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one creature. Hit: 10 (2d6 + 3) necrotic damage. The target must make a DC 13 Constitution saving throw, taking 5 (1d10) necrotic damage on a failed save, or half as much damage on a successful one.",
          "attack_bonus": 5,
          "damage": "2d6 + 3",
          "damage_type": "necrotic"
        }
      ],
      "legendary_actions": [],
      "description": "A twisted spirit bound to the corrupted shrine, its form flickers between solid and ethereal. Its laughter echoes with the madness of the curse it embodies.",
      "tactics": "The shade uses its incorporeal movement to phase through walls and attack from unexpected angles. It prioritizes isolating weaker party members and uses Maddening Laughter to control the battlefield.",
      "treasure": "1d4 cursed gold pieces that cause nightmares",
      "environment": "Corrupted shrines, cursed locations, places of negative energy"
    }
  ]
}

Return ONLY the JSON object, starting with { and ending with }. No markdown, no code blocks, no explanations - just the raw JSON.
"""
