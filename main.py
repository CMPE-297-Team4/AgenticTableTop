import os
from langchain_openai import ChatOpenAI
from utils.config import OPENAI_API_BASE, OPENAI_API_MODEL, TEMPERATURE, MAX_TOKENS, LLM_REQUEST_TIMEOUT
from utils.agents import background_story
#LLM Model Initialization
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

model = ChatOpenAI(
    openai_api_base=OPENAI_API_BASE,
    openai_api_key=OPENAI_API_KEY,
    model_name=OPENAI_API_MODEL,
    request_timeout=LLM_REQUEST_TIMEOUT,
    max_tokens=MAX_TOKENS,
    temperature=TEMPERATURE,
)

def main():
    """
    Some thoughts:
    Step 1: Generate a background story for a new Dungeons & Dragons campaign.
    Step 2: Generate a list of regions for the campaign based on the background story.
    Step 3: Generate a list of characters for the campaign based on the background story and regions.
    etc..
    """
    background_story_state = background_story(model)
    print(background_story_state["title"])
    print(background_story_state["background_story"])
    print(background_story_state["tone"])
    print(background_story_state["key_themes"])

if __name__ == "__main__":
    main()