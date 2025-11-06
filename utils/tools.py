import json
import random
import re
from typing import Any, Dict, List, Optional
from utils.state import PlayerCharacter

def extract_json_from_response(response: str) -> Optional[str]:
    """
    Extract JSON string from LLM response, handling various formats.
    
    Args:
        response: Raw response string from LLM
        
    Returns:
        Extracted JSON string or None if not found
    """
    if not response or not response.strip():
        return None
    
    # Try to extract from ```json code blocks
    if "```json" in response:
        parts = response.split("```json")
        if len(parts) > 1:
            json_part = parts[1].split("```")[0]
            return json_part.strip()
    
    # Try to extract from ``` code blocks (without json label)
    if "```" in response:
        parts = response.split("```")
        if len(parts) > 1:
            # Find the part that looks like JSON (starts with { or [)
            for part in parts[1:]:
                stripped = part.strip()
                if stripped.startswith("{") or stripped.startswith("["):
                    return stripped
    
    # Try to find JSON object/array in the response
    response_stripped = response.strip()
    if response_stripped.startswith("{") or response_stripped.startswith("["):
        return response_stripped
    
    # Try to find JSON after potential prefix text
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    if json_match:
        return json_match.group(0)
    
    return None

def load_player_character(json_str: str):
    """
    Load the player character from the file.
    """
    
    with open('player_character.json', 'r', encoding='utf-8') as f:
        player_data = json.load(f)
    return PlayerCharacter(**player_data)

def fix_incomplete_json(json_str: str) -> str:
    """
    Attempt to fix common JSON issues like unterminated strings, missing brackets, trailing commas.
    
    Args:
        json_str: Potentially incomplete JSON string
        
    Returns:
        Fixed JSON string (may still be invalid)
    """
    if not json_str:
        return "{}"
    
    # First, escape any control characters that might be in string values
    # This needs to be done carefully to avoid breaking valid JSON
    # We'll handle this during the parsing phase
    
    # Remove trailing commas (common issue)
    fixed_json = re.sub(r',(\s*[}\]])', r'\1', json_str)
    
    # Count brackets to see if we need to close them
    open_braces = fixed_json.count('{')
    close_braces = fixed_json.count('}')
    open_brackets = fixed_json.count('[')
    close_brackets = fixed_json.count(']')
    
    # Find the last complete structure before truncation
    # Look for patterns like: "key": [" or "key": "value that's cut
    lines = fixed_json.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Skip empty lines
        if not stripped:
            fixed_lines.append(line)
            i += 1
            continue
        
        # Check for unterminated array strings like: "saving_throws": ["
        if '":' in stripped:
            # Check if line ends with an opening bracket and quote (various formats)
            if stripped.endswith('["') or stripped.endswith('["') or (stripped.endswith('[') and i + 1 < len(lines) and lines[i + 1].strip().startswith('"')):
                # This is an unterminated array string - close it
                # Extract the key part before the colon
                if '":' in line:
                    key_part = line.split('":')[0] + '":'
                    line = key_part + ' []'
                else:
                    # Fallback: remove the incomplete array element and close properly
                    line = re.sub(r':\s*\[\s*"?\s*$', ': []', line.rstrip())
                fixed_lines.append(line)
                i += 1
                continue
        
        # Check for unterminated string values (key: "value that's not closed)
        if ':' in line and '"' in line:
            # Count unescaped quotes properly
            quote_positions = []
            escaped = False
            for idx, char in enumerate(line):
                if char == '\\' and not escaped:
                    escaped = True
                    continue
                if char == '"' and not escaped:
                    quote_positions.append(idx)
                escaped = False
            
            # If odd number of quotes, string is likely unterminated
            if len(quote_positions) % 2 == 1:
                last_quote_pos = quote_positions[-1]
                after_quote = line[last_quote_pos + 1:].strip()
                
                # Check if this is an array element that's cut off: "key": ["
                if after_quote.startswith('[') and i + 1 < len(lines):
                    next_stripped = lines[i + 1].strip()
                    if not next_stripped or (next_stripped.startswith('}') or next_stripped.startswith(']')):
                        # Close the array properly
                        line = line[:last_quote_pos + 1] + ': []'
                        fixed_lines.append(line)
                        i += 1
                        continue
                
                # If nothing meaningful after the quote, close the string
                if not after_quote or after_quote in [',', '}', ']']:
                    if not line.rstrip().endswith('"'):
                        line = line[:last_quote_pos + 1] + after_quote
                elif after_quote.startswith('['):
                    # Array starting - check if it's incomplete
                    if i + 1 < len(lines):
                        next_stripped = lines[i + 1].strip()
                        if not next_stripped or next_stripped.startswith('}') or next_stripped.startswith(']'):
                            # Close the array
                            line = line[:last_quote_pos + 1] + ': []'
                            fixed_lines.append(line)
                            i += 1
                            continue
                elif not after_quote.startswith(',') and not after_quote.startswith('}'):
                    # Check if next line suggests we should close this string
                    if i + 1 < len(lines):
                        next_stripped = lines[i + 1].strip()
                        if next_stripped:
                            if next_stripped.startswith('}') or next_stripped.startswith(']'):
                                # Close the string and add comma if needed
                                if not line.rstrip().endswith(','):
                                    line = line[:last_quote_pos + 1] + '",'
                            elif next_stripped.startswith('"') or next_stripped.startswith('{'):
                                # Close the string with comma
                                line = line[:last_quote_pos + 1] + '",'
        
        # Check for lines ending with just an opening bracket and quote
        if stripped.endswith('["') or (stripped.endswith(':') and i + 1 < len(lines) and lines[i + 1].strip().startswith('"')):
            # This is likely an incomplete array - try to close it
            if '":' in stripped:
                # Extract the key part
                key_part = stripped.split('":')[0] + '":'
                line = key_part + ' []'
        
        fixed_lines.append(line)
        i += 1
    
    fixed_json = '\n'.join(fixed_lines)
    
    # Remove any new trailing commas we might have introduced
    fixed_json = re.sub(r',(\s*[}\]])', r'\1', fixed_json)
    
    # Close unclosed brackets and braces
    if open_braces > close_braces:
        fixed_json += '\n' + '}' * (open_braces - close_braces)
    if open_brackets > close_brackets:
        fixed_json += '\n' + ']' * (open_brackets - close_brackets)
    
    # Fix truncated string values - find strings that end without closing quotes
    # Pattern: "key": "value that's incomplete (no closing quote before end of JSON or next key)
    # This handles cases like: "description": "Melee Weapon Attack... Hit: 7 (1d10 + 2) bludgeon
    # We need to find the last incomplete string and close it
    
    # Find all string patterns that might be incomplete
    # Look for ": " followed by text that doesn't end with a quote
    lines_list = fixed_json.split('\n')
    fixed_lines_list = []
    for i, line in enumerate(lines_list):
        # Check if line has an incomplete string (has : " but no closing quote on same line)
        # And it's not the start of a multi-line string (which would be valid)
        if '": "' in line or ': "' in line:
            # Count quotes after the colon
            colon_pos = line.find(': "')
            if colon_pos != -1:
                after_colon = line[colon_pos + 3:]
                quote_count = after_colon.count('"')
                # If odd number of quotes (or zero and line doesn't end with comma/brace), might be incomplete
                if quote_count == 0 and not (line.rstrip().endswith(',') or line.rstrip().endswith('}')):
                    # Check if next line starts with a quote or new key (suggesting this string was cut off)
                    if i + 1 < len(lines_list):
                        next_line = lines_list[i + 1].strip()
                        if next_line.startswith('"') or next_line.startswith('}') or next_line.startswith(']'):
                            # Close the string
                            line = line.rstrip() + '",'
                    elif i == len(lines_list) - 1:
                        # Last line, definitely incomplete
                        line = line.rstrip() + '"'
        
        fixed_lines_list.append(line)
    
    fixed_json = '\n'.join(fixed_lines_list)
    
    # Final pass: Fix any remaining unclosed strings at the end of JSON
    # Find the last "key": "value pattern and ensure it's closed
    # Look backwards from the end to find the last incomplete string
    if fixed_json and not fixed_json.rstrip().endswith('}') and not fixed_json.rstrip().endswith(']'):
        # Find the last occurrence of ": " that might be incomplete
        last_colon_quote = fixed_json.rfind(': "')
        if last_colon_quote != -1:
            after_colon = fixed_json[last_colon_quote + 3:]
            # If no closing quote found, add one
            if '"' not in after_colon or (after_colon.count('"') % 2 == 1):
                # Find the end of the JSON (last } or ])
                last_brace = max(fixed_json.rfind('}'), fixed_json.rfind(']'))
                if last_brace != -1 and last_colon_quote < last_brace:
                    # Insert closing quote before the last brace
                    fixed_json = fixed_json[:last_brace] + '"' + fixed_json[last_brace:]
    
    return fixed_json


def parse_storyteller_result(response):
    """
    Parse the storyteller result from the LLM response with robust error handling.
    """
    if not response or not response.strip():
        print("Error parsing storyteller result: Empty response")
        return None
    
    try:
        json_str = extract_json_from_response(response)
        if not json_str:
            print("Error parsing storyteller result: Could not extract JSON")
            print(f"Response content (first 500 chars): {response[:500] if response else 'Empty'}")
            return None
        
        # Clean up the response and try to parse as JSON
        json_str = re.sub(r":\s*<([^>]+)>", r': "\1"', json_str)
        
        # Try to parse directly first
        try:
            json_data = json.loads(json_str)
            title = json_data.get("title")
            background_story = json_data.get("background_story")
            key_themes = json_data.get("key_themes")
            
            # Validate required fields
            if not title or not background_story or not key_themes:
                print("Error parsing storyteller result: Missing required fields")
                return None
            
            return title, background_story, key_themes
        except json.JSONDecodeError as e:
            # If parsing fails, try to fix incomplete JSON
            print(f"Initial JSON parse failed: {e}")
            print("Attempting to fix incomplete JSON...")
            
            # Try to fix common issues
            fixed_json = fix_incomplete_json(json_str)
            
            try:
                json_data = json.loads(fixed_json)
                title = json_data.get("title")
                background_story = json_data.get("background_story")
                key_themes = json_data.get("key_themes")
                
                # Validate required fields
                if not title or not background_story or not key_themes:
                    print("Error parsing storyteller result: Missing required fields after fix")
                    return None
                
                print("Successfully parsed after fixing JSON")
                return title, background_story, key_themes
            except json.JSONDecodeError as e2:
                print(f"Failed to parse even after fixing: {e2}")
                print(f"JSON string (first 1000 chars): {json_str[:1000]}")
                return None
                
    except Exception as e:
        print(f"Error parsing storyteller result: {e}")
        print(f"Response content (first 500 chars): {response[:500] if response else 'Empty'}")
        import traceback
        traceback.print_exc()
        return None


def parse_acts_result(response):
    """
    Parse the acts from the LLM response.
    """
    try:
        json_str = extract_json_from_response(response)
        if not json_str:
            print("Error parsing acts result: Could not extract JSON")
            return []
        
        # Clean up the response and try to parse as JSON
        json_str = re.sub(r":\s*<([^>]+)>", r': "\1"', json_str)
        json_data = json.loads(json_str)
        acts = json_data.get("acts", [])
        return acts
    except Exception as e:
        print(f"Error parsing acts result: {e}")
        print(f"Response content (first 500 chars): {response[:500] if response else 'Empty'}")
        return []


def parse_quests_result(response):
    """
    Parse the quests from the LLM response.
    """
    try:
        json_str = extract_json_from_response(response)
        if not json_str:
            print("Error parsing quests result: Could not extract JSON")
            return []
        
        # Clean up the response and try to parse as JSON
        json_str = re.sub(r":\s*<([^>]+)>", r': "\1"', json_str)
        json_data = json.loads(json_str)
        quests = json_data.get("quests", [])
        return quests
    except Exception as e:
        print(f"Error parsing quests result: {e}")
        print(f"Response content (first 500 chars): {response[:500] if response else 'Empty'}")
        return []


def get_total_tokens(resp):
    # dict-style
    if isinstance(resp, dict):
        return resp.get("usage_metadata", {}).get("total_tokens") or resp.get("usage", {}).get(
            "total_tokens"
        )
    # object-style
    um = (
        getattr(resp, "usage_metadata", None)
        or getattr(resp, "usage", None)
        or getattr(resp, "llm_output", None)
    )
    if isinstance(um, dict):
        return um.get("total_tokens") or um.get("total")
    # attribute-style access
    return getattr(um, "total_tokens", None) or getattr(um, "total", None)


def dice_roll(dice_type):
    """
    Roll a dice and return the result.
    """
    return random.randint(1, dice_type)


def sanitize_json_string(json_str: str) -> str:
    """
    Sanitize JSON string by escaping control characters in string values.
    This helps handle cases where the LLM includes unescaped newlines or tabs.
    """
    # Find string values and escape control characters
    # We need to be careful - only escape in actual string values, not in keys
    
    # Pattern to match string values: "key": "value with potential control chars"
    # We'll use a regex to find and fix string values
    def escape_control_chars(match):
        full_match = match.group(0)
        # Check if this is a key or value by looking at the context
        if ': "' in full_match or '": "' in full_match:
            # This is likely a value
            # Escape control characters but preserve already escaped ones
            value = match.group(1) if match.lastindex else ''
            # Replace unescaped newlines, tabs, etc.
            value = value.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
            return f'"{value}"'
        return full_match
    
    # First, try to fix common truncation patterns
    # Pattern: "key": ["  -> "key": []
    json_str = re.sub(r'("\w+")\s*:\s*\[\s*"$', r'\1: []', json_str, flags=re.MULTILINE)
    # Pattern: "key": ["\n  -> "key": []
    json_str = re.sub(r'("\w+")\s*:\s*\[\s*"\s*\n', r'\1: []\n', json_str, flags=re.MULTILINE)
    
    return json_str


def parse_monster_result(response):
    """
    Parse the monsters from the LLM response using Pydantic schema.
    This provides automatic validation and type conversion.
    """
    if not response or not response.strip():
        print("Error parsing monster result: Empty response")
        return []
    
    try:
        # Import Pydantic schema
        from utils.schemas import MonsterGenerationResponse, Monster
        
        # Extract JSON from response
        json_str = extract_json_from_response(response)
        
        if not json_str:
            print("Error parsing monster result: Could not extract JSON from response")
            print(f"Response content (first 500 chars): {response[:500]}")
            return []
        
        # Clean up common issues
        json_str = re.sub(r":\s*<([^>]+)>", r': "\1"', json_str)
        
        # Fix specific truncation patterns before parsing
        # Pattern: "saving_throws": [" or "key": [" with newline after (handle various spacing)
        json_str = re.sub(r'("[\w_]+")\s*:\s*\[\s*"\s*\n', r'\1: []\n', json_str, flags=re.MULTILINE)
        json_str = re.sub(r'("[\w_]+")\s*:\s*\[\s*"\s*$', r'\1: []', json_str, flags=re.MULTILINE)
        json_str = re.sub(r'("[\w_]+")\s*:\s*\[\s*\n\s*"', r'\1: []', json_str, flags=re.MULTILINE)
        
        # Try to parse using Pydantic schema (automatic validation and type conversion)
        try:
            response_obj = MonsterGenerationResponse.from_json(json_str)
            monsters = [monster.model_dump() for monster in response_obj.monsters]
            if monsters:
                print(f"Successfully parsed {len(monsters)} monster(s) using Pydantic schema")
                return monsters
        except Exception as schema_error:
            print(f"Pydantic schema validation failed: {schema_error}")
            print("Falling back to manual parsing...")
            
            # Fallback to manual parsing if Pydantic fails
            try:
                json_data = json.loads(json_str, strict=False)
                
                # Check if structure is {"monsters": [...]} - expected format
                monsters = json_data.get("monsters", [])
                if monsters:
                    # Try to validate each monster individually
                    validated_monsters = []
                    for monster_data in monsters:
                        try:
                            monster = Monster.model_validate(monster_data)
                            validated_monsters.append(monster.model_dump())
                        except Exception as e:
                            print(f"Warning: Could not validate monster {monster_data.get('name', 'Unknown')}: {e}")
                            # Include anyway as dict (partial data) if it has monster fields
                            has_monster_fields = (
                                monster_data.get("armor_class") is not None or 
                                monster_data.get("hit_points") is not None
                            )
                            if has_monster_fields:
                                validated_monsters.append(monster_data)
                    if validated_monsters:
                        return validated_monsters
                
                # Check if structure is {"Quest Name": [monsters], ...} - wrong format but recoverable
                # This happens when LLM returns quest names as keys
                all_monsters = []
                for key, value in json_data.items():
                    if isinstance(value, list):
                        # Check if items in list are monsters (have armor_class or hit_points)
                        for item in value:
                            if isinstance(item, dict):
                                has_monster_fields = (
                                    item.get("armor_class") is not None or 
                                    item.get("hit_points") is not None or
                                    item.get("size") is not None or
                                    item.get("type") is not None
                                )
                                is_action = (
                                    item.get("attack_bonus") is not None and 
                                    item.get("armor_class") is None and
                                    item.get("hit_points") is None
                                )
                                if has_monster_fields and not is_action:
                                    all_monsters.append(item)
                
                if all_monsters:
                    print(f"Found {len(all_monsters)} monster(s) in quest-name-keyed structure")
                    # Try to validate each
                    validated_monsters = []
                    for monster_data in all_monsters:
                        try:
                            monster = Monster.model_validate(monster_data)
                            validated_monsters.append(monster.model_dump())
                        except Exception as e:
                            # Include if it has required fields
                            if monster_data.get("armor_class") is not None or monster_data.get("hit_points") is not None:
                                validated_monsters.append(monster_data)
                    if validated_monsters:
                        return validated_monsters
                        
            except json.JSONDecodeError as json_error:
                print(f"JSON parsing also failed: {json_error}")
                # Continue to the next fallback
                
        # If Pydantic parsing failed, try the old method
        try:
            json_data = json.loads(json_str, strict=False)
            monsters = json_data.get("monsters", [])
            if monsters:
                return monsters
        except json.JSONDecodeError as e:
            # If parsing fails, try to fix incomplete JSON
            print(f"Initial JSON parse failed: {e}")
            print("Attempting to fix incomplete JSON...")
            
            # Try to fix common issues
            fixed_json = fix_incomplete_json(json_str)
            
            # Also sanitize control characters
            fixed_json = sanitize_json_string(fixed_json)
            
            try:
                json_data = json.loads(fixed_json, strict=False)
                monsters = json_data.get("monsters", [])
                if monsters:
                    print("Successfully parsed after fixing JSON")
                    return monsters
            except json.JSONDecodeError as e2:
                print(f"Failed to parse even after fixing: {e2}")
                
                # Try to extract partial monster data from incomplete JSON
                # Look for complete monster objects even if the overall JSON is broken
                # IMPORTANT: Must have monster-specific fields (armor_class, hit_points) to be a monster
                # This prevents actions/special_abilities from being parsed as monsters
                monster_pattern = r'\{[^{}]*"name"\s*:\s*"[^"]+"[^{}]*\}'
                monster_matches = re.findall(monster_pattern, json_str, re.DOTALL)
                
                if monster_matches:
                    print(f"Found {len(monster_matches)} potential monster object(s), attempting to extract...")
                    monsters = []
                    for monster_str in monster_matches:
                        try:
                            # Try to fix common issues in individual monster objects
                            fixed_monster = fix_incomplete_json(monster_str)
                            fixed_monster = sanitize_json_string(fixed_monster)
                            monster = json.loads(fixed_monster, strict=False)
                            
                            # VALIDATION: Only include if it has monster-specific fields
                            # Actions/special abilities have "name" but not armor_class or hit_points
                            has_monster_fields = (
                                monster.get("armor_class") is not None or 
                                monster.get("hit_points") is not None or
                                monster.get("size") is not None or
                                monster.get("type") is not None
                            )
                            
                            # Exclude if it looks like an action (has attack_bonus but no armor_class)
                            is_action = (
                                monster.get("attack_bonus") is not None and 
                                monster.get("armor_class") is None and
                                monster.get("hit_points") is None
                            )
                            
                            if monster.get("name") and has_monster_fields and not is_action:
                                monsters.append(monster)
                        except Exception as ex:
                            # Try to extract at least the name and basic stats
                            name_match = re.search(r'"name"\s*:\s*"([^"]+)"', monster_str)
                            if name_match:
                                # Create a minimal monster object
                                monster = {"name": name_match.group(1)}
                                # Try to extract other common fields
                                for field in ["size", "type", "alignment", "armor_class", "hit_points", 
                                            "challenge_rating", "strength", "dexterity", "constitution",
                                            "intelligence", "wisdom", "charisma"]:
                                    field_match = re.search(f'"{field}"\\s*:\\s*([^,}}]+)', monster_str)
                                    if field_match:
                                        value = field_match.group(1).strip().strip('"')
                                        try:
                                            if field in ["armor_class", "hit_points", "strength", "dexterity",
                                                       "constitution", "intelligence", "wisdom", "charisma"]:
                                                monster[field] = int(value)
                                            else:
                                                monster[field] = value
                                        except:
                                            monster[field] = value
                                
                                # VALIDATION: Only add if it has monster-specific fields
                                # Don't add actions/special abilities (they have attack_bonus but no armor_class/hit_points)
                                has_monster_fields = (
                                    monster.get("armor_class") is not None or 
                                    monster.get("hit_points") is not None or
                                    monster.get("size") is not None or
                                    monster.get("type") is not None
                                )
                                is_action = (
                                    "attack_bonus" in monster_str and 
                                    monster.get("armor_class") is None and
                                    monster.get("hit_points") is None
                                )
                                
                                if monster.get("name") and has_monster_fields and not is_action:
                                    monsters.append(monster)
                    if monsters:
                        print(f"Successfully extracted {len(monsters)} monster(s) from partial JSON")
                        return monsters
                
                # Last resort: try to extract just the monsters array
                monsters_match = re.search(r'"monsters"\s*:\s*\[(.*?)\]', json_str, re.DOTALL)
                if monsters_match:
                    try:
                        # Try to parse individual monster objects
                        monsters_text = monsters_match.group(1)
                        # Split by monster boundaries (look for opening braces)
                        monster_objects = re.findall(r'\{[^{}]*\}', monsters_text, re.DOTALL)
                        if monster_objects:
                            print(f"Extracted {len(monster_objects)} monster(s) from partial JSON")
                            monsters = []
                            for monster_str in monster_objects:
                                try:
                                    monster = json.loads(monster_str)
                                    # VALIDATION: Only include actual monsters, not actions/special abilities
                                    has_monster_fields = (
                                        monster.get("armor_class") is not None or 
                                        monster.get("hit_points") is not None or
                                        monster.get("size") is not None or
                                        monster.get("type") is not None
                                    )
                                    is_action = (
                                        monster.get("attack_bonus") is not None and 
                                        monster.get("armor_class") is None and
                                        monster.get("hit_points") is None
                                    )
                                    if has_monster_fields and not is_action:
                                        monsters.append(monster)
                                except:
                                    pass
                            if monsters:
                                return monsters
                    except Exception:
                        pass
        
        # Last resort: Try to extract partial monsters from incomplete JSON
        # Look for monster objects that are mostly complete even if JSON is truncated
        print("Attempting to extract partial monsters from incomplete JSON...")
        
        # Try to find complete monster objects by looking for opening/closing braces
        # Pattern: Find { followed by monster fields, ending with } or end of string
        monster_objects_raw = []
        brace_count = 0
        current_obj_start = -1
        for i, char in enumerate(json_str):
            if char == '{':
                if brace_count == 0:
                    current_obj_start = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and current_obj_start != -1:
                    # Found a complete object
                    monster_obj = json_str[current_obj_start:i+1]
                    monster_objects_raw.append(monster_obj)
                    current_obj_start = -1
        
        # Also check if there's an incomplete object at the end
        if current_obj_start != -1 and brace_count > 0:
            # Try to extract what we can from the incomplete object
            incomplete_obj = json_str[current_obj_start:]
            # Close it manually
            incomplete_obj = incomplete_obj.rstrip()
            if not incomplete_obj.endswith('}'):
                # Close all open braces
                incomplete_obj += '}' * brace_count
                # Also close any unclosed strings
                if incomplete_obj.count('"') % 2 == 1:
                    incomplete_obj = incomplete_obj.rstrip('}') + '"}'
                monster_objects_raw.append(incomplete_obj)
        
        # Try to parse each extracted object
        extracted_monsters = []
        for obj_str in monster_objects_raw:
            try:
                # Fix common issues in this object
                fixed_obj = fix_incomplete_json(obj_str)
                fixed_obj = sanitize_json_string(fixed_obj)
                monster = json.loads(fixed_obj, strict=False)
                
                # Validate it's actually a monster (not an action)
                has_monster_fields = (
                    monster.get("armor_class") is not None or 
                    monster.get("hit_points") is not None or
                    monster.get("size") is not None or
                    monster.get("type") is not None
                )
                is_action = (
                    monster.get("attack_bonus") is not None and 
                    monster.get("armor_class") is None and
                    monster.get("hit_points") is None
                )
                
                if has_monster_fields and not is_action and monster.get("name"):
                    extracted_monsters.append(monster)
            except Exception as e:
                # Skip this object if we can't parse it
                continue
        
        if extracted_monsters:
            print(f"Successfully extracted {len(extracted_monsters)} monster(s) from incomplete JSON")
            return extracted_monsters
        
        print("Error parsing monster result: Could not extract valid monsters")
        print(f"JSON string (first 1000 chars): {json_str[:1000]}")
        if len(json_str) > 1000:
            print(f"JSON string (last 500 chars): {json_str[-500:]}")
        return []
        
    except Exception as e:
        print(f"Error parsing monster result: {e}")
        print(f"Response content (first 500 chars): {response[:500]}")
        import traceback
        traceback.print_exc()
        return []


def get_ability_modifier(score: int) -> int:
    """Calculate ability modifier from ability score."""
    return (score - 10) // 2


def get_xp_value(cr: str) -> int:
    """Get XP value for a challenge rating."""
    cr_to_xp = {
        "0": 0, "1/8": 25, "1/4": 50, "1/2": 100,
        "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
        "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
        "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
        "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
        "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
        "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000
    }
    return cr_to_xp.get(cr, 0)


def calculate_encounter_difficulty(monsters: List[Dict[str, Any]], party_level: int, party_size: int) -> str:
    """
    Calculate the difficulty of an encounter based on monsters and party.
    """
    total_cr = 0
    for monster in monsters:
        cr_str = monster.get("challenge_rating", "0")
        try:
            if "/" in cr_str:
                num, denom = cr_str.split("/")
                cr_value = float(num) / float(denom)
            else:
                cr_value = float(cr_str)
            total_cr += cr_value
        except (ValueError, ZeroDivisionError):
            total_cr += 0

    adjusted_cr = total_cr * (party_size / 4.0)

    if adjusted_cr <= party_level * 0.5:
        return "Easy"
    elif adjusted_cr <= party_level * 0.75:
        return "Medium"
    elif adjusted_cr <= party_level * 1.25:
        return "Hard"
    else:
        return "Deadly"


def get_monster_stat_block(monster: Dict[str, Any]) -> str:
    """Format a monster as a D&D stat block string."""
    stat_block = f"""
{monster.get('name', 'Unknown Monster')}
{monster.get('size', 'Unknown')} {monster.get('type', 'unknown')}, {monster.get('alignment', 'unaligned')}

Armor Class {monster.get('armor_class', 0)}
Hit Points {monster.get('hit_points', 0)}
Speed {monster.get('speed', '30 ft.')}

STR {monster.get('strength', 10)} ({get_ability_modifier(monster.get('strength', 10)):+d})
DEX {monster.get('dexterity', 10)} ({get_ability_modifier(monster.get('dexterity', 10)):+d})
CON {monster.get('constitution', 10)} ({get_ability_modifier(monster.get('constitution', 10)):+d})
INT {monster.get('intelligence', 10)} ({get_ability_modifier(monster.get('intelligence', 10)):+d})
WIS {monster.get('wisdom', 10)} ({get_ability_modifier(monster.get('wisdom', 10)):+d})
CHA {monster.get('charisma', 10)} ({get_ability_modifier(monster.get('charisma', 10)):+d})

Challenge {monster.get('challenge_rating', '0')} ({get_xp_value(monster.get('challenge_rating', '0'))} XP)
Proficiency Bonus +{monster.get('proficiency_bonus', 0)}
"""

    saving_throws = monster.get('saving_throws', [])
    if saving_throws:
        stat_block += f"Saving Throws {', '.join(saving_throws)}\n"

    skills = monster.get('skills', [])
    if skills:
        stat_block += f"Skills {', '.join(skills)}\n"

    resistances = monster.get('damage_resistances', [])
    if resistances:
        stat_block += f"Damage Resistances {', '.join(resistances)}\n"

    immunities = monster.get('damage_immunities', [])
    if immunities:
        stat_block += f"Damage Immunities {', '.join(immunities)}\n"

    condition_immunities = monster.get('condition_immunities', [])
    if condition_immunities:
        stat_block += f"Condition Immunities {', '.join(condition_immunities)}\n"

    senses = monster.get('senses', '')
    if senses:
        stat_block += f"Senses {senses}\n"

    languages = monster.get('languages', '')
    if languages:
        stat_block += f"Languages {languages}\n"

    stat_block += "\n"

    special_abilities = monster.get('special_abilities', [])
    for ability in special_abilities:
        stat_block += f"**{ability.get('name', 'Unknown Ability')}.** {ability.get('description', '')}\n\n"

    actions = monster.get('actions', [])
    for action in actions:
        stat_block += f"**{action.get('name', 'Unknown Action')}.** {action.get('description', '')}\n\n"

    return stat_block


def load_monster_from_quest(state: Dict[str, Any], quest_name: str, monster_index: int = 0) -> Optional[Dict[str, Any]]:
    """
    Load a monster from a specific quest by quest name.
    
    Args:
        state: The game state containing monsters
        quest_name: Name of the quest to load monsters from
        monster_index: Index of the monster to load (default: 0 for first monster)
        
    Returns:
        Monster dictionary, or None if not found
    """
    monsters_dict = state.get("monsters", {})
    
    if quest_name not in monsters_dict:
        print(f"\n⚠️  Quest '{quest_name}' not found in generated monsters.")
        print(f"Available quests: {', '.join(monsters_dict.keys())}")
        return None
    
    monsters = monsters_dict[quest_name]
    
    if not monsters:
        print(f"\n⚠️  No monsters found for quest '{quest_name}'.")
        return None
    
    if monster_index >= len(monsters):
        print(f"\n⚠️  Monster index {monster_index} out of range. Quest has {len(monsters)} monster(s).")
        return None
    
    return monsters[monster_index]


def run_combat_from_quest(
    state: Dict[str, Any],
    quest_name: str,
    monster_index: int = 0,
    player_name: str = "Hero",
    player_hp: int = 30,
    player_ac: int = 15,
    player_attack_bonus: int = 5,
    player_damage_dice: str = "1d8",
    player_damage_bonus: int = 3,
    max_rounds: int = 10
) -> Optional[Dict[str, Any]]:
    """
    Run combat with a monster from a specific quest using simplified player stats.
    
    This function uses simple dice-based stats (no full character sheet):
    - player_hp: Hit points
    - player_ac: Armor class
    - player_attack_bonus: Attack bonus (added to d20 roll)
    - player_damage_dice: Damage dice string (e.g., "2d6", "1d8")
    - player_damage_bonus: Damage bonus (added to damage dice)
    
    Args:
        state: The game state containing monsters
        quest_name: Name of the quest to load monsters from
        monster_index: Index of the monster to fight (default: 0)
        player_name: Player character name
        player_hp: Player hit points
        player_ac: Player armor class
        player_attack_bonus: Player attack bonus
        player_damage_dice: Player damage dice (e.g., "1d8", "2d6")
        player_damage_bonus: Player damage bonus
        max_rounds: Maximum number of rounds
        
    Returns:
        Dictionary with combat results, or None if monster not found
    """
    from utils.combat_system import run_simple_encounter
    
    # Load monster from quest
    monster_data = load_monster_from_quest(state, quest_name, monster_index)
    
    if not monster_data:
        return None
    
    print("\n" + "="*60)
    print("COMBAT ENCOUNTER")
    print("="*60)
    print(f"\nQuest: {quest_name}")
    print(f"Monster: {monster_data.get('name', 'Unknown')}")
    print(f"  Type: {monster_data.get('size', 'Unknown')} {monster_data.get('type', 'Unknown')}")
    print(f"  AC: {monster_data.get('armor_class', 0)} | HP: {monster_data.get('hit_points', 0)}")
    print(f"  CR: {monster_data.get('challenge_rating', 'Unknown')}")
    print(f"\nPlayer: {player_name}")
    print(f"  HP: {player_hp} | AC: {player_ac}")
    print(f"  Attack: +{player_attack_bonus} | Damage: {player_damage_dice} + {player_damage_bonus}")
    print("\nStarting combat...")
    
    # Run the encounter
    combat_result = run_simple_encounter(
        monster_data=monster_data,
        player_name=player_name,
        player_max_hp=player_hp,
        player_armor_class=player_ac,
        player_dexterity_modifier=2,  # Default Dex mod for initiative
        player_attack_bonus=player_attack_bonus,
        player_damage_dice=player_damage_dice,
        player_damage_bonus=player_damage_bonus,
        max_rounds=max_rounds
    )
    
    # Print combat log
    for line in combat_result["combat_log"]:
        print(line)
    
    # Print result summary
    result = combat_result["result"]
    if result == "victory":
        print("\n🎉 The hero emerges victorious!")
    elif result == "defeat":
        print("\n💀 The hero has fallen...")
    else:
        print("\n⏰ Combat ended without a clear winner")
    
    return combat_result


def run_combat(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Run a simple test combat encounter using the first available generated monster.
    
    Args:
        state: The game state containing monsters
        
    Returns:
        Dictionary with combat results, or None if no monsters available
    """
    monsters_dict = state.get("monsters", {})
    if not monsters_dict:
        print("\n⚠️  No monsters available for combat test.")
        return None
    
    # Find the first available quest and monster
    quest_name = None
    for q_name in monsters_dict.keys():
        if monsters_dict[q_name]:
            quest_name = q_name
            break
    
    if not quest_name:
        print("\n⚠️  No monsters found for combat test.")
        return None
    
    #TODO: Load player character from state and run combat with player character stats
    return run_combat_from_quest(
        state=state,
        quest_name=quest_name,
        monster_index=0,
        player_name="Test Hero",
        player_hp=30,
        player_ac=15,
        player_attack_bonus=5,
        player_damage_dice="1d8",
        player_damage_bonus=3
    )


def get_player_stats_from_input() -> Dict[str, Any]:
    """
    Get player stats from user input with defaults.
    
    Returns:
        Dictionary with player stats: hp, ac, attack_bonus, damage_dice, damage_bonus
    """
    print("\nEnter player stats (or press Enter for defaults):")
    player_hp = input("  HP [30]: ").strip()
    player_hp = int(player_hp) if player_hp else 30
    
    player_ac = input("  AC [15]: ").strip()
    player_ac = int(player_ac) if player_ac else 15
    
    player_attack = input("  Attack Bonus [5]: ").strip()
    player_attack = int(player_attack) if player_attack else 5
    
    player_damage_dice = input("  Damage Dice [1d8]: ").strip()
    player_damage_dice = player_damage_dice if player_damage_dice else "1d8"
    
    player_damage_bonus = input("  Damage Bonus [3]: ").strip()
    player_damage_bonus = int(player_damage_bonus) if player_damage_bonus else 3
    
    return {
        "hp": player_hp,
        "ac": player_ac,
        "attack_bonus": player_attack,
        "damage_dice": player_damage_dice,
        "damage_bonus": player_damage_bonus
    }


def show_combat_menu(monsters_dict: Dict[str, List[Dict[str, Any]]]) -> List[str]:
    """
    Display combat menu and available quests.
    
    Args:
        monsters_dict: Dictionary mapping quest names to lists of monsters
        
    Returns:
        List of quest names
    """
    print("\nWould you like to start a combat encounter?")
    print("Available quests with monsters:")
    
    quest_list = []
    for i, quest_name in enumerate(monsters_dict.keys(), 1):
        num_monsters = len(monsters_dict[quest_name])
        print(f"  {i}. {quest_name} ({num_monsters} monster(s))")
        quest_list.append(quest_name)
    
    print("\nOptions:")
    print("  [y]es - Start combat with first available quest")
    print("  [c]hoose - Choose a specific quest and monster")
    print("  [n]o - Skip combat testing")
    
    return quest_list


def handle_quick_combat(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Handle quick combat option (first available quest).
    
    Args:
        state: The game state containing monsters
        
    Returns:
        Combat result dictionary or None
    """
    print("\n" + "="*60)
    print("STARTING COMBAT")
    print("="*60)
    combat_result = run_combat(state)
    if combat_result:
        print(f"\n✓ Combat completed: {combat_result['result'].upper()}")
    return combat_result


def handle_choose_combat(state: Dict[str, Any], monsters_dict: Dict[str, List[Dict[str, Any]]], quest_list: List[str]) -> Optional[Dict[str, Any]]:
    """
    Handle interactive combat selection (choose quest and monster).
    
    Args:
        state: The game state containing monsters
        monsters_dict: Dictionary mapping quest names to lists of monsters
        quest_list: List of available quest names
        
    Returns:
        Combat result dictionary or None
    """
    if not quest_list:
        return None
    
    print("\nSelect a quest:")
    for i, quest_name in enumerate(quest_list, 1):
        num_monsters = len(monsters_dict[quest_name])
        print(f"  {i}. {quest_name} ({num_monsters} monster(s))")
    
    try:
        quest_choice = int(input(f"\nEnter quest number (1-{len(quest_list)}): ").strip())
        if not (1 <= quest_choice <= len(quest_list)):
            print("⚠️  Invalid quest selection.")
            return None
        
        selected_quest = quest_list[quest_choice - 1]
        selected_monsters = monsters_dict[selected_quest]
        
        # Show monsters in this quest
        print(f"\nMonsters in '{selected_quest}':")
        for i, monster in enumerate(selected_monsters, 1):
            monster_name = monster.get('name', 'Unknown')
            monster_hp = monster.get('hit_points', 0)
            monster_ac = monster.get('armor_class', 0)
            print(f"  {i}. {monster_name} (HP: {monster_hp}, AC: {monster_ac})")
        
        # Select monster
        monster_choice = int(input(f"\nEnter monster number (1-{len(selected_monsters)}): ").strip())
        if not (1 <= monster_choice <= len(selected_monsters)):
            print("⚠️  Invalid monster selection.")
            return None
        
        monster_index = monster_choice - 1
        
        # Get player stats
        player_stats = get_player_stats_from_input()
        
        print("\n" + "="*60)
        print("STARTING COMBAT")
        print("="*60)
        
        combat_result = run_combat_from_quest(
            state=state,
            quest_name=selected_quest,
            monster_index=monster_index,
            player_name="Hero",
            player_hp=player_stats["hp"],
            player_ac=player_stats["ac"],
            player_attack_bonus=player_stats["attack_bonus"],
            player_damage_dice=player_stats["damage_dice"],
            player_damage_bonus=player_stats["damage_bonus"],
            max_rounds=10
        )
        
        if combat_result:
            print(f"\n✓ Combat completed: {combat_result['result'].upper()}")
        
        return combat_result
        
    except ValueError:
        print("⚠️  Invalid input. Please enter a number.")
        return None
    except KeyboardInterrupt:
        print("\n\n⚠️  Combat cancelled by user.")
        return None


def interactive_combat_testing(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Interactive combat testing menu.
    
    This function handles the entire interactive combat flow:
    - Shows available quests
    - Lets user choose combat options
    - Handles quick combat or detailed selection
    
    Args:
        state: The game state containing monsters
        
    Returns:
        Combat result dictionary or None if skipped/cancelled
    """
    monsters_dict = state.get("monsters", {})
    if not monsters_dict:
        print("\n⚠️  No monsters available for combat testing.")
        return None
    
    print("\n" + "="*60)
    print("COMBAT TESTING")
    print("="*60)
    
    # Wait for user input
    input("\nPress Enter to continue to combat testing...")
    
    # Show menu and get quest list
    quest_list = show_combat_menu(monsters_dict)
    
    # Get user choice
    choice = input("\nYour choice (y/c/n): ").strip().lower()
    
    if choice in ['y', 'yes']:
        return handle_quick_combat(state)
    elif choice in ['c', 'choose']:
        return handle_choose_combat(state, monsters_dict, quest_list)
    else:
        print("\nSkipping combat testing.")
        return None


def print_sample_monsters(state: Dict[str, Any], total_monsters: int, max_monsters_to_show: int = 3):
    """
    Print sample monsters from the state to verify they were generated.
    
    Args:
        state: The game state containing monsters
        total_monsters: Total number of monsters generated
        max_monsters_to_show: Maximum number of monsters to display (default: 3)
    """
    print("\n" + "="*60)
    print("SAMPLE MONSTERS (Verification)")
    print("="*60)
    
    monsters_dict = state.get("monsters", {})
    if monsters_dict:
        monster_count = 0
        
        for quest_name, monsters in monsters_dict.items():
            if not monsters:
                continue
                
            print(f"\n📜 Quest: {quest_name}")
            print(f"   Monsters in this quest: {len(monsters)}")
            
            # Print each monster from this quest (up to max)
            for i, monster in enumerate(monsters):
                if monster_count >= max_monsters_to_show:
                    break
                    
                print(f"\n{'─'*60}")
                print(f"Monster {monster_count + 1}: {monster.get('name', 'Unknown')}")
                print(f"{'─'*60}")
                
                # Print key stats
                print(f"  Name: {monster.get('name', 'Unknown')}")
                print(f"  Size: {monster.get('size', 'Unknown')}")
                print(f"  Type: {monster.get('type', 'Unknown')}")
                print(f"  Alignment: {monster.get('alignment', 'Unknown')}")
                print(f"  Armor Class: {monster.get('armor_class', 0)}")
                print(f"  Hit Points: {monster.get('hit_points', 0)}")
                print(f"  Challenge Rating: {monster.get('challenge_rating', 'Unknown')}")
                print(f"  Speed: {monster.get('speed', 'Unknown')}")
                
                # Ability scores
                print(f"\n  Ability Scores:")
                print(f"    STR: {monster.get('strength', 10)} | DEX: {monster.get('dexterity', 10)} | CON: {monster.get('constitution', 10)}")
                print(f"    INT: {monster.get('intelligence', 10)} | WIS: {monster.get('wisdom', 10)} | CHA: {monster.get('charisma', 10)}")
                
                # Special abilities count
                special_abilities = monster.get('special_abilities', [])
                actions = monster.get('actions', [])
                if special_abilities:
                    print(f"\n  Special Abilities: {len(special_abilities)}")
                    for ability in special_abilities[:2]:  # Show first 2
                        print(f"    • {ability.get('name', 'Unknown')}")
                if actions:
                    print(f"\n  Actions: {len(actions)}")
                    for action in actions[:2]:  # Show first 2
                        print(f"    • {action.get('name', 'Unknown')}: {action.get('damage', 'N/A')} {action.get('damage_type', '')}")
                
                # Description preview
                description = monster.get('description', '')
                if description:
                    desc_preview = description[:100] + "..." if len(description) > 100 else description
                    print(f"\n  Description: {desc_preview}")
                
                monster_count += 1
                
            if monster_count >= max_monsters_to_show:
                break
        
        if monster_count == 0:
            print("\n⚠️  No monsters found in the generated data.")
        else:
            remaining = total_monsters - monster_count
            if remaining > 0:
                print(f"\n... and {remaining} more monster(s) not shown here.")
    else:
        print("\n⚠️  No monsters were generated for any quests.")
    
    print("\n" + "="*60)