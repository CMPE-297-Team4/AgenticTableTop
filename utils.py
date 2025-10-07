import re
import json

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
        tone = json_data.get("tone")
        key_themes = json_data.get("key_themes")
        return title, background_story, tone, key_themes
    except Exception as e:
        print(f"Error parsing result: {e}")
        print(f"Response content: {response}")
        return None

