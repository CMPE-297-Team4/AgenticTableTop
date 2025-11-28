"""
AI Dungeon Master Agent

This module implements the AI Dungeon Master agent that:
- Narrates scenes and environments
- Responds to player actions
- Manages quest progression
- Provides combat narration
- Uses RAG for campaign knowledge retrieval
- Generates voice narration using TTS
"""

import json
from typing import Any, Dict, List, Optional

from core.dm_prompts import (
    ACTION_RESPONSE_PROMPT,
    COMBAT_NARRATION_PROMPT,
    QUEST_PROGRESSION_PROMPT,
    SCENE_NARRATION_PROMPT,
)
from core.model import initialize_llm

# Optional TTS import
try:
    from services.tts import generate_speech

    _tts_available = True
except ImportError:
    generate_speech = None  # type: ignore
    _tts_available = False

# Optional RAG service import
try:
    from services.rag import get_rag_service

    _rag_available = True
except ImportError:
    get_rag_service = None  # type: ignore
    _rag_available = False


class DungeonMasterAgent:
    """AI Dungeon Master agent for managing gameplay"""

    def __init__(self, use_rag: bool = True, rag_namespace: Optional[str] = None):
        """
        Initialize the DM agent.

        Args:
            use_rag: Whether to use RAG for campaign knowledge retrieval
            rag_namespace: Namespace for RAG knowledge base (defaults to campaign-rules)
        """
        self.model = initialize_llm()
        self.use_rag = use_rag
        self.rag_namespace = rag_namespace or "campaign-rules"
        self.rag_service = None

        if use_rag and _rag_available:
            try:
                self.rag_service = get_rag_service()
            except Exception as e:
                print(f"Warning: RAG service not available: {e}")
                self.use_rag = False
        elif use_rag and not _rag_available:
            print("Warning: RAG service dependencies not installed. RAG disabled.")
            self.use_rag = False

    def _get_campaign_context(
        self, campaign_data: Dict[str, Any], quest: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build campaign context string for prompts with quest objectives and act goals"""
        theme = campaign_data.get("theme", "Unknown")

        # THEME MUST BE FIRST AND MOST PROMINENT
        context = "=" * 80 + "\n"
        context += f"CAMPAIGN THEME: {theme.upper()}\n"
        context += "=" * 80 + "\n\n"
        context += f"🎭 THIS IS A {theme.upper()} CAMPAIGN 🎭\n\n"
        context += f"CRITICAL INSTRUCTION: Your ENTIRE narration style, voice, tone, and language MUST match the '{theme}' theme.\n"
        context += f"Do NOT use generic fantasy/mystical descriptions unless '{theme}' is fantasy/mystical.\n\n"

        if "comedy" in theme.lower():
            context += "✨ COMEDY THEME DETECTED ✨\n"
            context += "- Be FUNNY! Use humor, jokes, puns, absurd situations\n"
            context += "- Use comedic timing and witty observations\n"
            context += "- Make situations ridiculous and entertaining\n"
            context += "- Think like a comedy writer, not a serious fantasy narrator\n\n"
        elif "horror" in theme.lower() or "gothic" in theme.lower():
            context += "🕷️ HORROR THEME DETECTED 🕷️\n"
            context += "- Be SCARY! Use dark, disturbing, unsettling descriptions\n"
            context += "- Create dread, tension, and fear\n"
            context += "- Use ominous atmosphere and creeping terror\n\n"
        elif "pirate" in theme.lower():
            context += "⚓ PIRATE THEME DETECTED ⚓\n"
            context += "- Be NAUTICAL! Use sea terms, maritime language\n"
            context += "- Describe ships, treasure, ocean adventures\n"
            context += "- Use swashbuckling, adventurous tone\n\n"
        elif "steampunk" in theme.lower():
            context += "⚙️ STEAMPUNK THEME DETECTED ⚙️\n"
            context += "- Be INDUSTRIAL! Describe gears, steam, brass, clockwork\n"
            context += "- Use Victorian language and mechanical imagery\n"
            context += "- Focus on technology and inventions\n\n"

        context += f"\nCampaign: {campaign_data.get('title', 'Unknown')}\n"
        context += f"Background: {campaign_data.get('background', '')}\n\n"

        # ADD ACT CONTEXT FOR STORY GUIDANCE
        acts = campaign_data.get("acts", [])
        if acts:
            context += "=" * 80 + "\n"
            context += "CAMPAIGN ACTS (Story Arcs):\n"
            context += "=" * 80 + "\n"
            for i, act in enumerate(acts, 1):
                context += f"\nAct {i}: {act.get('act_title', 'Unknown')}\n"
                context += f"  Goal: {act.get('act_goal', 'Unknown')}\n"
                context += f"  Exit Condition: {act.get('exit_condition', 'Unknown')}\n"
            context += "\n"

        # ADD DETAILED QUEST CONTEXT FOR GUIDANCE
        if quest:
            context += "=" * 80 + "\n"
            context += "🎯 CURRENT QUEST (YOUR GUIDE STAR) 🎯\n"
            context += "=" * 80 + "\n"
            context += f"Quest: {quest.get('quest_name', 'Unknown')}\n"
            context += f"Type: {quest.get('quest_type', 'Unknown')}\n"
            context += f"Description: {quest.get('quest_description', '')}\n\n"

            # OBJECTIVES - THE MOST IMPORTANT PART
            objectives = quest.get("objectives", [])
            if objectives:
                context += "📋 QUEST OBJECTIVES (Guide players toward these!):\n"
                for i, obj in enumerate(objectives, 1):
                    context += f"  {i}. {obj}\n"
                context += "\n⚠️ CRITICAL: Every player action should either:\n"
                context += "   - Progress toward one of these objectives\n"
                context += "   - Complete an objective (celebrate and mark it!)\n"
                context += "   - Be gently redirected if off-track\n\n"

            # Quest rewards
            rewards = quest.get("rewards", {})
            if rewards:
                context += f"Rewards: XP {rewards.get('xp', 0)}, Gold {rewards.get('gold', 0)}\n"

        # Add RAG context if available
        if self.use_rag and self.rag_service:
            try:
                query = f"{campaign_data.get('title', '')} {campaign_data.get('background', '')}"
                if quest:
                    query += f" {quest.get('quest_name', '')} {quest.get('quest_description', '')}"
                rag_context = self.rag_service.retrieve_context(
                    query=query, namespace=self.rag_namespace, top_k=3
                )
                context += f"\n\nAdditional Campaign Knowledge:\n{rag_context}\n"
            except Exception as e:
                print(f"Warning: RAG retrieval failed: {e}")

        return context

    def narrate_scene(
        self,
        campaign_data: Dict[str, Any],
        quest: Optional[Dict[str, Any]] = None,
        narrative_history: Optional[List[Dict[str, Any]]] = None,
        location: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate scene narration.

        Args:
            campaign_data: Full campaign data
            quest: Current quest (optional)
            narrative_history: Previous narrative events (optional)
            location: Specific location to describe (optional)

        Returns:
            Dict with narration, environmental_details, and mood
        """
        context = self._get_campaign_context(campaign_data, quest)

        # Build narrative history context
        history_context = ""
        if narrative_history:
            recent_events = narrative_history[-5:]  # Last 5 events
            history_context = "\nRecent Events:\n"
            for event in recent_events:
                history_context += f"- {event.get('type', 'unknown')}: {event.get('content', '')}\n"

        prompt = f"""{SCENE_NARRATION_PROMPT}

# Campaign Context
{context}

{history_context}

# Location
{location or "Current scene location"}

# Your Response
Generate a scene narration based on the campaign context and current quest.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            # Remove markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)

            # Ensure narration field exists
            if "narration" not in result or not result.get("narration"):
                result["narration"] = content if content else "The scene unfolds before you..."

            return result

        except json.JSONDecodeError as e:
            # Fallback: return plain text narration
            import traceback

            print(f"JSON decode error in narrate_scene: {e}")
            print(f"Content: {content[:500] if 'content' in locals() else 'No content'}")
            return {
                "narration": (
                    content
                    if "content" in locals() and content
                    else "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead."
                ),
                "environmental_details": [],
                "mood": "mysterious",
            }
        except Exception as e:
            # Log the error but still return narration
            import traceback

            print(f"Error in narrate_scene: {e}")
            traceback.print_exc()
            return {
                "narration": "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead. Your journey continues...",
                "environmental_details": [],
                "mood": "mysterious",
            }

    def narrate_scene_with_voice(
        self,
        campaign_data: Dict[str, Any],
        quest: Optional[Dict[str, Any]] = None,
        narrative_history: Optional[List[Dict[str, Any]]] = None,
        location: Optional[str] = None,
        voice: str = "fable",
    ) -> Dict[str, Any]:
        """
        Generate scene narration with voice audio.

        Args:
            campaign_data: Full campaign data
            quest: Current quest (optional)
            narrative_history: Previous narrative events (optional)
            location: Specific location to describe (optional)
            voice: TTS voice to use (fable for mystical storytelling, alloy, echo, onyx, nova, shimmer)

        Returns:
            Dict with narration, environmental_details, mood, and audio_data (base64)
        """
        # Get text narration first
        try:
            result = self.narrate_scene(
                campaign_data=campaign_data,
                quest=quest,
                narrative_history=narrative_history,
                location=location,
            )
        except Exception as e:
            # If narrate_scene fails completely, return a fallback
            import traceback

            print(f"Error in narrate_scene_with_voice (narrate_scene failed): {e}")
            traceback.print_exc()
            result = {
                "narration": "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead. Your journey continues...",
                "environmental_details": [],
                "mood": "mysterious",
            }

        # Ensure narration field exists and is not empty
        narration_text = result.get("narration", "")
        if not narration_text:
            narration_text = "The scene unfolds before you. The air is thick with anticipation as you prepare for what lies ahead."
            result["narration"] = narration_text

        # Generate audio if TTS is available
        # Theme-based voice and speed with natural modulation
        if _tts_available and generate_speech and narration_text:
            try:
                # Get theme for voice selection
                theme = (
                    campaign_data.get("key_themes", [""])[0]
                    if campaign_data.get("key_themes")
                    else campaign_data.get("theme", "")
                )

                audio_data = generate_speech(
                    text=narration_text,
                    voice=voice,  # Will be overridden by theme
                    theme=theme,
                    add_modulation=True,
                )
                import base64

                result["audio_data"] = base64.b64encode(audio_data).decode("utf-8")
                result["audio_format"] = "mp3"
            except Exception as e:
                import traceback

                print(f"Warning: Failed to generate TTS audio: {e}")
                traceback.print_exc()
                # Don't set audio_error - just continue without audio
                # Audio is optional, narration text is what matters

        return result

    def respond_to_action(
        self,
        action: Dict[str, Any],
        campaign_data: Dict[str, Any],
        quest: Optional[Dict[str, Any]] = None,
        character_data: Optional[Dict[str, Any]] = None,
        narrative_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Respond to a player action.

        Args:
            action: Player action details (action_type, description, target, etc.)
            campaign_data: Full campaign data
            quest: Current quest (optional)
            character_data: Character performing the action (optional)
            narrative_history: Previous narrative events (optional)

        Returns:
            Dict with result, narration, roll requirements, and state changes
        """
        context = self._get_campaign_context(campaign_data, quest)

        # Build character context
        character_context = ""
        if character_data:
            character_context = f"\nCharacter: {character_data.get('character_name', 'Unknown')}\n"
            character_context += (
                f"Class/Level: {character_data.get('class_and_level', 'Unknown')}\n"
            )
            if "abilities" in character_data:
                character_context += f"Abilities: {json.dumps(character_data['abilities'])}\n"

        # Build action context
        action_context = f"""
Action Type: {action.get('action_type', 'Unknown')}
Description: {action.get('description', '')}
Target: {action.get('target', 'None')}
Parameters: {json.dumps(action.get('parameters', {}))}
"""

        prompt = f"""{ACTION_RESPONSE_PROMPT}

# Campaign Context
{context}

{character_context}

# Player Action
{action_context}

# Your Response
Determine the outcome of this action and provide appropriate narration.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)

            # Automatically roll dice if required
            if result.get("requires_roll", False) and result.get("roll_type") != "none":
                from tools.utils import dice_roll

                roll_details = result.get("roll_details", {})
                dice_type = roll_details.get("dice_rolled", "d20")

                # Parse dice type (e.g., "d20" -> 20)
                if isinstance(dice_type, str) and dice_type.startswith("d"):
                    dice_size = int(dice_type[1:])
                else:
                    dice_size = int(dice_type) if isinstance(dice_type, (str, int)) else 20

                # Roll the dice
                roll_result = dice_roll(dice_size)

                # Calculate modifier based on character abilities if available
                modifier = 0
                if character_data and "abilities" in character_data:
                    abilities = character_data["abilities"]
                    ability_name = roll_details.get("ability", "").lower()

                    # Map ability names to modifiers
                    ability_map = {
                        "strength": "strength",
                        "str": "strength",
                        "dexterity": "dexterity",
                        "dex": "dexterity",
                        "constitution": "constitution",
                        "con": "constitution",
                        "intelligence": "intelligence",
                        "int": "intelligence",
                        "wisdom": "wisdom",
                        "wis": "wisdom",
                        "charisma": "charisma",
                        "cha": "charisma",
                    }

                    if ability_name in ability_map:
                        ability_value = abilities.get(ability_map[ability_name], 10)
                        # Calculate modifier: (ability - 10) / 2, rounded down
                        modifier = (ability_value - 10) // 2

                total = roll_result + modifier
                dc = roll_details.get("dc", 0)
                success = total >= dc if dc > 0 else True

                # Update roll details with actual results
                roll_details["dice_rolled"] = f"d{dice_size}"
                roll_details["roll_result"] = roll_result
                roll_details["modifier"] = modifier
                roll_details["total"] = total
                roll_details["success"] = success

                result["roll_details"] = roll_details

                # Update narration to include roll result if not already included
                narration = result.get("narration", "")
                if f"{roll_result}" not in narration and f"d{dice_size}" not in narration.lower():
                    roll_text = f" (Rolled {roll_result}"
                    if modifier != 0:
                        roll_text += f" + {modifier} = {total}"
                    else:
                        roll_text += f" = {total}"
                    if dc > 0:
                        roll_text += f" vs DC {dc})"
                    else:
                        roll_text += ")"
                    result["narration"] = narration + roll_text

            return result

        except json.JSONDecodeError:
            # Fallback: return basic response
            return {
                "result": "success",
                "narration": content if "content" in locals() else "Your action is successful.",
                "requires_roll": False,
                "roll_type": "none",
                "state_changes": {},
            }
        except Exception as e:
            return {
                "error": f"Failed to process action: {str(e)}",
                "result": "failure",
                "narration": "Something goes wrong...",
                "requires_roll": False,
                "roll_type": "none",
                "state_changes": {},
            }

    def respond_to_action_with_voice(
        self,
        action: Dict[str, Any],
        campaign_data: Dict[str, Any],
        quest: Optional[Dict[str, Any]] = None,
        character_data: Optional[Dict[str, Any]] = None,
        narrative_history: Optional[List[Dict[str, Any]]] = None,
        voice: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Respond to a player action with voice audio.

        Args:
            action: Player action details
            campaign_data: Full campaign data
            quest: Current quest (optional)
            character_data: Character performing the action (optional)
            narrative_history: Previous narrative events (optional)
            voice: TTS voice override (None = auto-select based on theme)

        Returns:
            Dict with result, narration, roll requirements, state changes, and audio_data
        """
        # Get text response first
        result = self.respond_to_action(
            action=action,
            campaign_data=campaign_data,
            quest=quest,
            character_data=character_data,
            narrative_history=narrative_history,
        )

        narration_text = result.get("narration", "")

        # Generate audio if TTS is available
        # Theme-based voice and speed with natural modulation
        print("=" * 80)
        print("TTS AUDIO GENERATION DEBUG")
        print(f"  _tts_available: {_tts_available}")
        print(f"  generate_speech: {generate_speech}")
        print(f"  narration_text length: {len(narration_text) if narration_text else 0}")
        print(
            f"  narration_text: {narration_text[:100]}..."
            if narration_text
            else "  narration_text: None"
        )

        if _tts_available and generate_speech and narration_text:
            try:
                # Get theme for voice selection
                theme = (
                    campaign_data.get("key_themes", [""])[0]
                    if campaign_data.get("key_themes")
                    else campaign_data.get("theme", "")
                )
                print(f"  Theme: {theme}")

                # Only pass voice if explicitly specified, otherwise let theme decide
                speech_kwargs = {"text": narration_text, "theme": theme, "add_modulation": True}
                if voice:
                    speech_kwargs["voice"] = voice
                    print(f"  Using explicit voice: {voice}")
                else:
                    print("  Voice will be auto-selected based on theme")

                print("  Generating speech...")
                audio_data = generate_speech(**speech_kwargs)
                print(f"  ✅ Audio generated! Size: {len(audio_data)} bytes")

                import base64

                result["audio_data"] = base64.b64encode(audio_data).decode("utf-8")
                result["audio_format"] = "mp3"
                print(f"  ✅ Audio base64 encoded! Size: {len(result['audio_data'])} chars")
            except Exception as e:
                print(f"  ❌ Failed to generate TTS audio: {e}")
                import traceback

                traceback.print_exc()
                result["audio_error"] = str(e)
        else:
            print("  ❌ TTS not available or no narration text")
            if not _tts_available:
                print("     Reason: _tts_available is False")
            if not generate_speech:
                print("     Reason: generate_speech is None")
            if not narration_text:
                print("     Reason: narration_text is empty")

        print("=" * 80)
        return result

    def check_quest_progression(
        self,
        quest: Dict[str, Any],
        completed_objectives: List[str],
        campaign_data: Dict[str, Any],
        narrative_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Check quest progression and determine if objectives are complete.

        Args:
            quest: Current quest data
            completed_objectives: List of completed objective names
            campaign_data: Full campaign data
            narrative_history: Previous narrative events (optional)

        Returns:
            Dict with objectives_completed, quest_complete, narration, and next_quest
        """
        context = self._get_campaign_context(campaign_data, quest)

        objectives_context = f"""
Quest Objectives: {', '.join(quest.get('objectives', []))}
Completed Objectives: {', '.join(completed_objectives)}
"""

        prompt = f"""{QUEST_PROGRESSION_PROMPT}

# Campaign Context
{context}

# Quest Status
{objectives_context}

# Your Response
Determine if any objectives are complete and if the quest is finished.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except json.JSONDecodeError:
            # Fallback: check objectives manually
            all_objectives = quest.get("objectives", [])
            quest_complete = len(completed_objectives) >= len(all_objectives)

            return {
                "objectives_completed": completed_objectives,
                "quest_complete": quest_complete,
                "narration": (
                    "You continue your quest..." if not quest_complete else "Quest complete!"
                ),
                "next_quest": None,
            }
        except Exception as e:
            return {
                "error": f"Failed to check progression: {str(e)}",
                "objectives_completed": [],
                "quest_complete": False,
                "narration": "You continue your quest...",
                "next_quest": None,
            }

    def narrate_combat(
        self,
        action_description: str,
        attacker: str,
        target: str,
        damage: Optional[int] = None,
        campaign_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate combat narration.

        Args:
            action_description: Description of the combat action
            attacker: Name of the attacker
            target: Name of the target
            damage: Damage dealt (optional)
            campaign_data: Campaign data for context (optional)

        Returns:
            Dict with narration, damage_dealt, and status_effects
        """
        context = ""
        if campaign_data:
            context = f"Campaign: {campaign_data.get('title', 'Unknown')}\n"
            context += f"Background: {campaign_data.get('background', '')}\n"
            context += f"Theme: {campaign_data.get('theme', '')}\n"

        # Add RAG context if available
        if self.use_rag and self.rag_service and campaign_data:
            try:
                query = (
                    f"D&D 5e combat narration {campaign_data.get('title', '')} {action_description}"
                )
                rag_context = self.rag_service.retrieve_context(
                    query=query, namespace=self.rag_namespace, top_k=3
                )
                context += f"\n\nAdditional Combat Knowledge:\n{rag_context}\n"
            except Exception as e:
                print(f"Warning: RAG retrieval failed: {e}")

        prompt = f"""{COMBAT_NARRATION_PROMPT}

# Campaign Context
{context}

# Combat Action
Attacker: {attacker}
Target: {target}
Action: {action_description}
Damage: {damage if damage is not None else 'Unknown'}

# Your Response
Narrate this combat action in an engaging, cinematic way.
"""

        try:
            response = self.model.invoke(prompt)
            content = response.content

            # Try to parse JSON from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except json.JSONDecodeError:
            # Fallback: return basic narration
            return {
                "narration": content if "content" in locals() else f"{attacker} attacks {target}!",
                "damage_dealt": damage,
                "status_effects": None,
            }
        except Exception as e:
            return {
                "error": f"Failed to generate combat narration: {str(e)}",
                "narration": f"{attacker} attacks {target}!",
                "damage_dealt": damage,
                "status_effects": None,
            }
