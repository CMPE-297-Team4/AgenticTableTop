import re
import time

import yaml

from utils.prompt import game_plan_prompt, quest_generation_prompt, storyteller_prompt
from utils.rag_prompts import (
    rag_game_plan_prompt,
    rag_quest_generation_prompt,
    rag_storyteller_prompt,
)
from utils.tools import (
    get_total_tokens,
    parse_acts_result,
    parse_quests_result,
    parse_storyteller_result,
)

with open("config.yaml", "r") as f:
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
    title, background_story, key_themes = parse_storyteller_result(content)
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
    from utils.rag_service import get_rag_service

    if not rag_enabled or rag_service is None:
        print("RAG not enabled. Falling back to standard generation.")
        return background_story(model, state)

    print("==================Generating background story (RAG-Augmented)==================")
    start_time = time.time()

    # Get outline from input
    user_outline = background_story_outline
    namespace = (
        knowledge_namespace
        or rag_config.get("knowledge_base", {}).get("setting_namespace", "campaign-setting")
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
    namespace = (
        knowledge_namespace
        or rag_config.get("knowledge_base", {}).get("rules_namespace", "campaign-rules")
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
    namespace = (
        knowledge_namespace
        or rag_config.get("knowledge_base", {}).get("rules_namespace", "campaign-rules")
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

