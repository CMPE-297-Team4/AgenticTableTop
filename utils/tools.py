import re
import json
import random

def parse_storyteller_result(response):
    try:
        # First try to parse if it's wrapped in ```json code blocks
        if "```json" in response:
            rsp = response.split("```json")[1].split("```")[0]
        else:
            # If not wrapped, try to find JSON in the response
            rsp = response.strip()
        
        # Clean up the response and try to parse as JSON
        rsp = re.sub(r':\s*<([^>]+)>', r': "\1"', rsp) 
        json_data = json.loads(rsp)
        title = json_data.get("title")
        background_story = json_data.get("background_story")
        key_themes = json_data.get("key_themes")
        return title, background_story, key_themes
    except Exception as e:
        print(f"Error parsing result: {e}")
        print(f"Response content: {response}")
        return None

def parse_acts_result(response):
    """
    Parse the acts from the LLM response.
    """
    try:
        # First try to parse if it's wrapped in ```json code blocks
        if "```json" in response:
            rsp = response.split("```json")[1].split("```")[0]
        else:
            # If not wrapped, try to find JSON in the response
            rsp = response.strip()
        
        # Clean up the response and try to parse as JSON
        rsp = re.sub(r':\s*<([^>]+)>', r': "\1"', rsp) 
        json_data = json.loads(rsp)
        acts = json_data.get("acts", [])
        return acts
    except Exception as e:
        print(f"Error parsing acts result: {e}")
        print(f"Response content: {response}")
        return []

def get_total_tokens(resp):
    # dict-style
    if isinstance(resp, dict):
        return resp.get("usage_metadata", {}).get("total_tokens") \
               or resp.get("usage", {}).get("total_tokens")
    # object-style
    um = getattr(resp, "usage_metadata", None) or getattr(resp, "usage", None) \
         or getattr(resp, "llm_output", None)
    if isinstance(um, dict):
        return um.get("total_tokens") or um.get("total")
    # attribute-style access
    return getattr(um, "total_tokens", None) or getattr(um, "total", None)

def dice_roll(dice_type):
    """
    Roll a dice and return the result.
    """
    return random.randint(1, dice_type)

