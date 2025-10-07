import os
import sys
import subprocess
import re
import json
import time
from langchain_openai import ChatOpenAI
from prompt import storyteller_prompt
from config import OPENAI_API_BASE, OPENAI_API_MODEL, TEMPERATURE, MAX_TOKENS, LLM_REQUEST_TIMEOUT

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

model = ChatOpenAI(
    openai_api_base=OPENAI_API_BASE,
    openai_api_key=OPENAI_API_KEY,
    model_name=OPENAI_API_MODEL,
    request_timeout=LLM_REQUEST_TIMEOUT,
    max_tokens=MAX_TOKENS,
    temperature=TEMPERATURE,
)

def background_story():
    #Customizable user input
    user_outline = "I want a background story for a new Dungeons & Dragons campaign."

    #Update prompt
    start_time = time.time()
    prompt = re.sub(r"<outline>", user_outline, storyteller_prompt)
    print("Starting making request...")
    response = model.invoke(prompt)
    content = response.content
    end_time = time.time()
    print(f"Time taken for this request: {end_time - start_time} seconds")

    #Print response
    print(content)

if __name__ == "__main__":
    background_story()