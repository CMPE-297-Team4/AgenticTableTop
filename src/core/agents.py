# Load config.yaml from project root (one level up from src/)
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import yaml

from core.prompt import (
    game_plan_prompt,
    monster_generation_prompt,
    quest_generation_prompt,
    storyteller_prompt,
)
from core.rag_prompts import (
    rag_game_plan_prompt,
    rag_quest_generation_prompt,
    rag_storyteller_prompt,
)
from services.trajectory import TrajectoryLogger
from tools.utils import (
    get_total_tokens,
    parse_acts_result,
    parse_monster_result,
    parse_quests_result,
    parse_storyteller_result,
)

config_path = Path(__file__).parent.parent.parent.parent / "config.yaml"
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

background_story_outline = config["BackgroundStoryOutline"]
rag_config = config.get("RAG", {})
rag_enabled = rag_config.get("enabled", False)


def background_story(model, state):
    print("==================Generating background story==================")
    start_time = time.time()
    # Get outline from input
    user_outline = background_story_outline

    # Update prompt
    prompt = re.sub(r"<outline>", user_outline, storyteller_prompt)

    # Make LLM request
    response = model.invoke(prompt)
    content = response.content

    # Parse response
    result = parse_storyteller_result(content)
    if result is None:
        print("ERROR: Failed to parse storyteller result. Please check the LLM response format.")
        return False

    title, background_story, key_themes = result
    # Print response
    state["title"] = title
    state["background_story"] = background_story
    state["key_themes"] = key_themes
    print(state["title"])
    print(state["background_story"])
    end_time = time.time()
    print(
        f"Time taken for this request: {end_time - start_time} seconds, and tokens used: {get_total_tokens(response)}"
    )
    return True


def generate_game_plan(model, state):
    print("==================Generating game plan==================")
    start_time = time.time()

    # Get data from state
    story_title = state["title"]
    story_background = state["background_story"]
    # Update prompt
    prompt = re.sub(r"<title>", story_title, game_plan_prompt)
    prompt = re.sub(r"<background>", story_background, prompt)

    response = model.invoke(prompt)
    content = response.content

    # Parse the acts from the response
    acts = parse_acts_result(content)
    state["acts"] = acts
    for i in range(len(state["acts"])):
        print(state["acts"][i]["act_title"])
        print(state["acts"][i]["act_summary"])
    end_time = time.time()
    print(
        f"Time taken for this request: {end_time - start_time} seconds, and tokens used: {get_total_tokens(response)}"
    )
    return True


def generate_quests_for_act(model, state, act_index):
    """
    Generate quests for a specific act.

    Args:
        model: The LLM model instance
        state: The game state containing acts
        act_index: Index of the act to generate quests for

    Returns:
        bool: True if successful, False otherwise
    """
    print(
        f"==================Generating quests for {state['acts'][act_index]['act_title']}=================="
    )
    start_time = time.time()

    # Get act data
    act = state["acts"][act_index]
    act_title = act["act_title"]
    act_summary = act["act_summary"]
    narrative_goal = act.get("narrative_goal", "")
    primary_conflict = act.get("primary_conflict", "")
    key_locations = ", ".join(act.get("key_locations", []))
    mechanics = ", ".join(act.get("mechanics_or_features_introduced", []))

    # Build prompt
    prompt = quest_generation_prompt
    prompt = re.sub(r"<act_title>", act_title, prompt)
    prompt = re.sub(r"<act_summary>", act_summary, prompt)
    prompt = re.sub(r"<narrative_goal>", narrative_goal, prompt)
    prompt = re.sub(r"<primary_conflict>", primary_conflict, prompt)
    prompt = re.sub(r"<key_locations>", key_locations, prompt)
    prompt = re.sub(r"<mechanics>", mechanics, prompt)

    # Make LLM request
    response = model.invoke(prompt)
    content = response.content

    # Parse the quests from the response
    quests = parse_quests_result(content)

    # Initialize quests dict if it doesn't exist
    if "quests" not in state:
        state["quests"] = {}

    # Store quests for this act
    state["quests"][act_title] = quests

    # Print quest summaries
    print(f"\nGenerated {len(quests)} quests:")
    for i, quest in enumerate(quests, 1):
        print(f"\n  Quest {i}: {quest.get('quest_name', 'Unnamed Quest')}")
        print(f"    Type: {quest.get('quest_type', 'Unknown')}")
        description = quest.get("description", "No description available")
        print(f"    Description: {description}")
        objectives = quest.get("objectives", [])
        if objectives:
            print("    Objectives:")
            for j, obj in enumerate(objectives, 1):
                print(f"      {j}. {obj}")
        else:
            print("    Objectives: None specified")

    end_time = time.time()
    print(
        f"Time taken for this request: {end_time - start_time} seconds, and tokens used: {get_total_tokens(response)}"
    )
    return True


# ============================================================================
# RAG-AUGMENTED FUNCTIONS
# ============================================================================


def background_story_with_rag(model, state, rag_service=None, knowledge_namespace=None):
    """
    Generate background story augmented with knowledge from vector database.

    Args:
        model: The LLM model instance
        state: The game state to update
        rag_service: Optional RAGService instance
        knowledge_namespace: Optional namespace to retrieve knowledge from
    """
    if not rag_enabled or rag_service is None:
        print("RAG not enabled. Falling back to standard generation.")
        return background_story(model, state)

    print("==================Generating background story (RAG-Augmented)==================")
    start_time = time.time()

    # Get outline from input
    user_outline = background_story_outline
    namespace = knowledge_namespace or rag_config.get("knowledge_base", {}).get(
        "setting_namespace", "campaign-setting"
    )

    # Retrieve relevant knowledge
    print(f"Retrieving context from namespace '{namespace}'...")
    try:
        knowledge_context = rag_service.retrieve_context(
            query=user_outline,
            namespace=namespace,
            top_k=rag_config.get("retrieval", {}).get("top_k", 3),
            limit=rag_config.get("retrieval", {}).get("max_context_chars", 8000),
        )
    except Exception as e:
        print(f"Warning: Could not retrieve context: {e}")
        knowledge_context = ""

    # Update prompt with knowledge
    prompt = rag_storyteller_prompt
    prompt = re.sub(r"{{user_outline}}", user_outline, prompt)
    prompt = re.sub(r"{{knowledge_context}}", knowledge_context, prompt)

    # Make LLM request
    response = model.invoke(prompt)
    content = response.content

    # Parse response
    title, background_story_text, key_themes = parse_storyteller_result(content)

    # Update state
    state["title"] = title
    state["background_story"] = background_story_text
    state["key_themes"] = key_themes
    state["rag_augmented"] = True

    print(state["title"])
    print(state["background_story"])

    end_time = time.time()
    print(
        f"Time taken for this request: {end_time - start_time} seconds, and tokens used: {get_total_tokens(response)}"
    )
    return True


def generate_game_plan_with_rag(model, state, rag_service=None, knowledge_namespace=None):
    """
    Generate game plan augmented with knowledge from vector database.

    Args:
        model: The LLM model instance
        state: The game state containing title and background
        rag_service: Optional RAGService instance
        knowledge_namespace: Optional namespace to retrieve knowledge from
    """
    if not rag_enabled or rag_service is None:
        print("RAG not enabled. Falling back to standard generation.")
        return generate_game_plan(model, state)

    print("==================Generating game plan (RAG-Augmented)==================")
    start_time = time.time()

    # Get data from state
    story_title = state["title"]
    story_background = state["background_story"]
    namespace = knowledge_namespace or rag_config.get("knowledge_base", {}).get(
        "rules_namespace", "campaign-rules"
    )

    # Retrieve relevant knowledge
    print(f"Retrieving context from namespace '{namespace}'...")
    try:
        knowledge_context = rag_service.retrieve_context(
            query=f"Campaign structure and acts for {story_title}: {story_background[:500]}",
            namespace=namespace,
            top_k=rag_config.get("retrieval", {}).get("top_k", 3),
            limit=rag_config.get("retrieval", {}).get("max_context_chars", 8000),
        )
    except Exception as e:
        print(f"Warning: Could not retrieve context: {e}")
        knowledge_context = ""

    # Update prompt with knowledge
    prompt = rag_game_plan_prompt
    prompt = re.sub(r"{{title}}", story_title, prompt)
    prompt = re.sub(r"{{background}}", story_background, prompt)
    prompt = re.sub(r"{{knowledge_context}}", knowledge_context, prompt)

    response = model.invoke(prompt)
    content = response.content

    # Parse the acts from the response
    acts = parse_acts_result(content)
    state["acts"] = acts
    state["rag_augmented"] = True

    for i in range(len(state["acts"])):
        print(state["acts"][i]["act_title"])
        print(state["acts"][i]["act_summary"])

    end_time = time.time()
    print(
        f"Time taken for this request: {end_time - start_time} seconds, and tokens used: {get_total_tokens(response)}"
    )
    return True


def generate_quests_for_act_with_rag(
    model, state, act_index, rag_service=None, knowledge_namespace=None
):
    """
    Generate quests for a specific act, augmented with knowledge from vector database.

    Args:
        model: The LLM model instance
        state: The game state containing acts
        act_index: Index of the act to generate quests for
        rag_service: Optional RAGService instance
        knowledge_namespace: Optional namespace to retrieve knowledge from
    """
    if not rag_enabled or rag_service is None:
        print("RAG not enabled. Falling back to standard generation.")
        return generate_quests_for_act(model, state, act_index)

    print(
        f"==================Generating quests (RAG-Augmented) for {state['acts'][act_index]['act_title']}=================="
    )
    start_time = time.time()

    # Get act data
    act = state["acts"][act_index]
    act_title = act["act_title"]
    act_summary = act["act_summary"]
    namespace = knowledge_namespace or rag_config.get("knowledge_base", {}).get(
        "rules_namespace", "campaign-rules"
    )

    # Retrieve relevant knowledge for quest generation
    print(f"Retrieving context from namespace '{namespace}'...")
    try:
        knowledge_context = rag_service.retrieve_context(
            query=f"Quest design for act: {act_title}. {act_summary}",
            namespace=namespace,
            top_k=rag_config.get("retrieval", {}).get("top_k", 3),
            limit=rag_config.get("retrieval", {}).get("max_context_chars", 8000),
        )
    except Exception as e:
        print(f"Warning: Could not retrieve context: {e}")
        knowledge_context = ""

    # Build prompt
    prompt = rag_quest_generation_prompt
    prompt = re.sub(r"{{act_title}}", act_title, prompt)
    prompt = re.sub(r"{{act_summary}}", act_summary, prompt)
    prompt = re.sub(r"{{knowledge_context}}", knowledge_context, prompt)

    # Make LLM request
    response = model.invoke(prompt)
    content = response.content

    # Parse the quests from the response
    quests = parse_quests_result(content)

    # Initialize quests dict if it doesn't exist
    if "quests" not in state:
        state["quests"] = {}

    # Store quests for this act
    state["quests"][act_title] = quests
    state["rag_augmented"] = True

    # Print quest summaries
    print(f"\nGenerated {len(quests)} quests:")
    for i, quest in enumerate(quests, 1):
        print(f"\n  Quest {i}: {quest.get('quest_title', 'Unnamed Quest')}")
        if "objectives" in quest:
            print("    Objectives:")
            for j, obj in enumerate(quest["objectives"], 1):
                print(f"      {j}. {obj}")

    end_time = time.time()
    print(
        f"Time taken for this request: {end_time - start_time} seconds, and tokens used: {get_total_tokens(response)}"
    )
    return True


def generate_monsters_for_combat_quests(
    model, state, trajectory_logger: Optional[TrajectoryLogger] = None
):
    """
    Generate monsters for all combat quests in the campaign.

    This function:
    1. Collects all quests with "combat" in their quest_type from all acts
    2. Loops through each combat quest sequentially
    3. Makes separate LLM calls for each quest with delays to avoid rate limiting
    4. Implements retry logic (up to 3 attempts) with exponential backoff for failed requests
    5. Continues processing even if some quests fail

    Args:
        model: The LLM model instance
        state: The game state containing quests (organized by act_title)
        trajectory_logger: Optional trajectory logger for recording generation attempts

    Returns:
        bool: True if successful, False otherwise
    """
    print("==================Generating monsters for combat quests==================")
    start_time = time.time()

    # Initialize trajectory logger if not provided
    if trajectory_logger is None:
        trajectory_logger = TrajectoryLogger()
        print(f"Trajectory log: {trajectory_logger.get_log_path()}")

    # Initialize monsters dict if it doesn't exist
    if "monsters" not in state:
        state["monsters"] = {}

    total_monsters = 0
    combat_quests_found = 0
    successful_generations = 0
    failed_generations = 0

    # Check if quests exist
    quests_dict = state.get("quests", {})
    if not quests_dict:
        print("WARNING: No quests found in state. Cannot generate monsters.")
        return False

    print(f"Found {len(quests_dict)} act(s) with quests")

    # Collect all combat quests first
    combat_quests = []
    for act_title, quests in quests_dict.items():
        print(f"\nChecking quests in: {act_title}")
        for quest in quests:
            quest_type = quest.get("quest_type", "").lower()
            quest_name = quest.get("quest_name", "Unknown Quest")
            print(f"  Quest: {quest_name} | Type: {quest.get('quest_type', 'Unknown')}")

            # Check if this is a combat quest (case-insensitive, handles formats like "Combat", "Combat/Ritual", etc.)
            if "combat" in quest_type:
                combat_quests_found += 1
                combat_quests.append((quest_name, quest))

    print(f"\nFound {combat_quests_found} combat quest(s) to process")

    # Generate monsters for each combat quest with retry logic
    for quest_index, (quest_name, quest) in enumerate(combat_quests, 1):
        print(f"\n  ✓ Processing combat quest {quest_index}/{combat_quests_found}: {quest_name}")
        print(f"    Generating monsters for: {quest_name}")

        # Add delay between requests to avoid rate limiting (except for first quest)
        if quest_index > 1:
            delay_seconds = 2.0  # 2 second delay between calls
            print(f"    Waiting {delay_seconds} seconds to avoid rate limiting...")
            time.sleep(delay_seconds)

        quest_start_time = time.time()
        response_content = ""
        error_msg = None
        tokens_used = None
        monsters = []

        # Retry logic for failed requests
        max_retries = 3
        retry_delay = 5.0  # Start with 5 seconds
        retry_count = 0
        success = False

        while retry_count < max_retries and not success:
            try:
                if retry_count > 0:
                    print(f"    Retry attempt {retry_count}/{max_retries - 1} for {quest_name}")
                    print(f"    Waiting {retry_delay} seconds before retry...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff

                # Generate monsters for this combat quest
                monsters, response_content, tokens_used = generate_monsters_for_quest(
                    model, quest, return_response=True
                )

                if monsters and len(monsters) > 0:
                    state["monsters"][quest_name] = monsters
                    total_monsters += len(monsters)
                    successful_generations += 1
                    success = True

                    # Optionally: Add to monster registry for easy lookup
                    # Uncomment if you want to use the registry:
                    # from schemas.models import MonsterRegistry, Monster
                    # if "monster_registry" not in state:
                    #     state["monster_registry"] = MonsterRegistry()
                    # monster_objects = [Monster.model_validate(m) for m in monsters]
                    # state["monster_registry"].add_monsters(quest_name, monster_objects)
                    quest_end_time = time.time()

                    # Log successful generation
                    trajectory_logger.log_monster_generation(
                        quest_name=quest_name,
                        quest_data=quest,
                        response_content=response_content,
                        monsters=monsters,
                        success=True,
                        tokens_used=tokens_used,
                        time_taken=quest_end_time - quest_start_time,
                    )
                    print(
                        f"    ✓ Successfully generated {len(monsters)} monster(s) for {quest_name}"
                    )
                else:
                    # Check if we got an empty response
                    if not response_content or (
                        isinstance(response_content, str) and not response_content.strip()
                    ):
                        error_msg = f"Empty LLM response (retry {retry_count + 1}/{max_retries})"
                        print(f"    ⚠ {error_msg}")
                    else:
                        error_msg = "No monsters returned from parser (response was not empty)"
                        print(f"    ⚠ {error_msg}")
                        print(f"    Response preview: {response_content[:200]}...")

                    retry_count += 1
                    if retry_count >= max_retries:
                        # Final failure - log and continue
                        failed_generations += 1
                        quest_end_time = time.time()
                        trajectory_logger.log_monster_generation(
                            quest_name=quest_name,
                            quest_data=quest,
                            response_content=response_content or "Empty response after all retries",
                            monsters=[],
                            success=False,
                            error=error_msg,
                            tokens_used=tokens_used,
                            time_taken=quest_end_time - quest_start_time,
                        )
                        print(
                            f"    ✗ Failed to generate monsters for {quest_name} after {max_retries} attempts"
                        )

            except Exception as e:
                error_msg = f"Exception: {str(e)} (retry {retry_count + 1}/{max_retries})"
                print(f"    ⚠ {error_msg}")
                retry_count += 1

                if retry_count >= max_retries:
                    # Final failure - log and continue
                    failed_generations += 1
                    quest_end_time = time.time()
                    trajectory_logger.log_monster_generation(
                        quest_name=quest_name,
                        quest_data=quest,
                        response_content=response_content or f"Exception occurred: {str(e)}",
                        monsters=[],
                        success=False,
                        error=error_msg,
                        tokens_used=tokens_used,
                        time_taken=quest_end_time - quest_start_time,
                    )
                    print(f"    ✗ Exception generating monsters for {quest_name}: {str(e)}")
                    import traceback

                    traceback.print_exc()

    if combat_quests_found == 0:
        print("\nWARNING: No combat quests found in the campaign!")
        print(
            "Make sure quests have 'combat' in their quest_type (e.g., 'Combat (Main)', 'Combat/Ritual')"
        )
    else:
        print(f"\n{'=' * 60}")
        print("Monster Generation Summary:")
        print(f"  Total Combat Quests: {combat_quests_found}")
        print(f"  Successful: {successful_generations}")
        print(f"  Failed: {failed_generations}")
        print(f"  Total Monsters Generated: {total_monsters}")
        print(f"{'=' * 60}")

        # Log final summary
        trajectory_logger.log_campaign_summary(
            campaign_title=state.get("title", "Unknown Campaign"),
            total_acts=len(state.get("acts", [])),
            total_quests=sum(len(quests) for quests in quests_dict.values()),
            total_monsters=total_monsters,
            monsters_by_quest=state.get("monsters", {}),
        )

        print(f"\nTrajectory log saved to: {trajectory_logger.get_log_path()}")

    end_time = time.time()
    print(f"Time taken for monster generation: {end_time - start_time:.2f} seconds")
    return True


def generate_monsters_for_quest(
    model, quest: Dict[str, Any], quest_context: Optional[str] = None, return_response: bool = False
) -> Union[List[Dict[str, Any]], Tuple[List[Dict[str, Any]], str, int]]:
    """
    Generate monsters for a specific combat quest.

    Args:
        model: The LLM model instance
        quest: Quest dictionary containing quest details
        quest_context: Optional additional context about the quest
        return_response: If True, return response content and tokens used

    Returns:
        If return_response=False: List of monster dictionaries with stat blocks
        If return_response=True: Tuple of (monsters, response_content, tokens_used)
    """
    print(
        f"==================Generating monsters for {quest.get('quest_name', 'Unknown Quest')}=================="
    )
    start_time = time.time()

    # Extract quest details
    quest_name = quest.get("quest_name", "Unknown Quest")
    quest_description = quest.get("description", "")
    quest_type = quest.get("quest_type", "")
    difficulty = quest.get("difficulty", "Medium")
    locations = ", ".join(quest.get("locations", []))
    objectives = ", ".join(quest.get("objectives", []))

    # Build prompt
    prompt = monster_generation_prompt
    prompt = re.sub(r"<quest_name>", quest_name, prompt)
    prompt = re.sub(r"<quest_description>", quest_description, prompt)
    prompt = re.sub(r"<quest_type>", quest_type, prompt)
    prompt = re.sub(r"<difficulty>", difficulty, prompt)
    prompt = re.sub(r"<locations>", locations, prompt)
    prompt = re.sub(r"<objectives>", objectives, prompt)

    # Add quest context if provided
    if quest_context:
        prompt += f"\n\n# Additional Context\n{quest_context}"

    # Make LLM request with error handling
    try:
        print(f"    Making LLM request for {quest_name}...")
        print(f"    Prompt length: {len(prompt)} characters")
        response = model.invoke(prompt)
        print("    ✓ LLM request completed")
    except Exception as e:
        print(f"    ✗ LLM request failed: {str(e)}")
        print(f"    Exception type: {type(e).__name__}")
        raise

    # Handle different response formats (OpenAI vs Gemini)
    if hasattr(response, "content"):
        content = response.content
    elif hasattr(response, "text"):
        content = response.text
    elif isinstance(response, str):
        content = response
    elif hasattr(response, "message") and hasattr(response.message, "content"):
        content = response.message.content
    else:
        # Try to get content from various possible attributes
        content = (
            getattr(response, "content", None) or getattr(response, "text", None) or str(response)
        )

    # Ensure content is a string
    if content is not None and not isinstance(content, str):
        content = str(content)

    # Debug: Log response type and structure if empty
    if not content or (isinstance(content, str) and not content.strip()):
        print(f"WARNING: Empty response content for quest: {quest_name}")
        print(f"Response type: {type(response)}")
        print(
            f"Response attributes: {[attr for attr in dir(response) if not attr.startswith('_')]}"
        )
        if hasattr(response, "__dict__"):
            print(f"Response dict keys: {list(response.__dict__.keys())}")
        # Try alternative access methods for LangChain responses
        if hasattr(response, "messages") and response.messages:
            try:
                content = (
                    response.messages[0].content
                    if hasattr(response.messages[0], "content")
                    else str(response.messages[0])
                )
            except Exception:
                pass
        elif hasattr(response, "choices") and response.choices:
            try:
                content = (
                    response.choices[0].message.content
                    if hasattr(response.choices[0].message, "content")
                    else str(response.choices[0])
                )
            except Exception:
                pass
        # Last resort: try to convert entire response to string
        if not content or (isinstance(content, str) and not content.strip()):
            content = str(response)
            print(f"Using string representation of response: {content[:200]}...")

    tokens_used = get_total_tokens(response)

    # Parse the monsters from the response
    monsters = parse_monster_result(content)

    # Print monster summaries
    if monsters:
        print(f"\nGenerated {len(monsters)} monsters:")
        for i, monster in enumerate(monsters, 1):
            print(f"\n  Monster {i}: {monster.get('name', 'Unnamed Monster')}")
            print(f"    Type: {monster.get('type', 'Unknown')} {monster.get('size', 'Unknown')}")
            print(f"    CR: {monster.get('challenge_rating', 'Unknown')}")
            print(f"    HP: {monster.get('hit_points', 0)}")
            print(f"    AC: {monster.get('armor_class', 0)}")
            description = monster.get("description", "No description available")
            print(f"    Description: {description}")
    else:
        print(f"\nWARNING: No monsters generated for {quest_name}")

    end_time = time.time()
    print(
        f"Time taken for this request: {end_time - start_time:.2f} seconds, and tokens used: {tokens_used}"
    )

    if return_response:
        return monsters, content, tokens_used
    else:
        return monsters


def generate_encounter_for_act(
    model, act: Dict[str, Any], party_level: int = 3, party_size: int = 4
) -> List[Dict[str, Any]]:
    """
    Generate a balanced encounter for an entire act.

    Args:
        model: The LLM model instance
        act: Act dictionary containing act details
        party_level: Average party level for balancing
        party_size: Number of party members

    Returns:
        List of encounter dictionaries with monsters
    """
    print(
        f"==================Generating encounter for {act.get('act_title', 'Unknown Act')}=================="
    )

    # Find combat quests in this act
    # This would need to be integrated with the quest system
    # For now, we'll generate a sample encounter

    # Generate a boss monster for the act
    boss_quest = {
        "quest_name": f"{act.get('act_title', 'Act')} - Final Confrontation",
        "description": f"Face the primary threat of {act.get('act_title', 'this act')}",
        "quest_type": "Combat (Main)",
        "difficulty": "Hard" if party_level >= 5 else "Medium",
        "locations": act.get("key_locations", []),
        "objectives": [f"Defeat the {act.get('primary_conflict', 'primary threat')}"],
    }

    return generate_monsters_for_quest(model, boss_quest)
