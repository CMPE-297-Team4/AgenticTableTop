import re
import time
from utils.tools import parse_storyteller_result
from utils.prompt import storyteller_prompt
from utils.state import BackgroundStoryState
def background_story(model):
    #TODO: preferably load from a file or ask user for input real time
    user_outline = "I want a background story for a new Dungeons & Dragons campaign."

    #Update prompt
    start_time = time.time()
    prompt = re.sub(r"<outline>", user_outline, storyteller_prompt)

    #Make LLM request
    print("Starting making request...")
    response = model.invoke(prompt)
    content = response.content
    end_time = time.time()
    print(f"Time taken for this request: {end_time - start_time} seconds")

    #Parse response
    title, background_story, tone, key_themes = parse_storyteller_result(content)
    #Print response
    state = BackgroundStoryState(title=title, background_story=background_story, tone=tone, key_themes=key_themes)
    return state