import re
import time

import yaml

from utils.prompt import game_plan_prompt, storyteller_prompt
from utils.tools import get_total_tokens, parse_acts_result, parse_storyteller_result

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


# def quest_generator(model):
