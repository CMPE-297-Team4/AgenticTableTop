import re
import time

import yaml

from utils.prompt import game_plan_prompt, quest_generation_prompt, storyteller_prompt
from utils.tools import (
    get_total_tokens,
    parse_acts_result,
    parse_quests_result,
    parse_storyteller_result,
)

with open("config.yaml", "r") as f:
    config = yaml.safe_load(f)

background_story_outline = config["BackgroundStoryOutline"]


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
