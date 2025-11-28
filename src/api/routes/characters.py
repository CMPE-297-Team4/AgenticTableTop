"""
Character management routes
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from api.models import (
    PlayerCharacterCreateRequest,
    PlayerCharacterResponse,
    PlayerCharacterUpdateRequest,
)
from database.models import PlayerCharacter, User, get_db
from services.character import generate_player_character

router = APIRouter(prefix="/api/characters", tags=["characters"])


@router.post("/create", response_model=PlayerCharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    request: PlayerCharacterCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and create a new D&D 5e player character"""
    try:
        # Use current user's username as player_name if not provided
        player_name = request.player_name or current_user.username

        # Generate character using service
        result = generate_player_character(
            character_name=request.character_name,
            class_and_level=request.class_and_level,
            race=request.race,
            background=request.background,
            alignment=request.alignment,
            player_name=player_name,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        character_data = result["character"]
        image_base64 = result.get("image_base64")
        image_path = result.get("image_path")
        portrait_prompt = result.get("portrait_prompt")

        # Create database record
        db_character = PlayerCharacter(
            user_id=current_user.id,
            campaign_id=request.campaign_id,
            character_name=character_data["character_name"],
            player_name=character_data["player_name"],
            class_and_level=character_data["class_and_level"],
            race=character_data["race"],
            background=character_data["background"],
            alignment=character_data["alignment"],
            character_data=json.dumps(character_data),
            image_base64=image_base64,
            image_path=image_path,
            portrait_prompt=portrait_prompt,
        )

        db.add(db_character)
        db.commit()
        db.refresh(db_character)

        return PlayerCharacterResponse(
            id=db_character.id,
            character_name=db_character.character_name,
            player_name=db_character.player_name,
            class_and_level=db_character.class_and_level,
            race=db_character.race,
            background=db_character.background,
            alignment=db_character.alignment,
            character_data=character_data,
            image_base64=db_character.image_base64,
            image_path=db_character.image_path,
            portrait_prompt=db_character.portrait_prompt,
            created_at=db_character.created_at.isoformat() if db_character.created_at else "",
            updated_at=db_character.updated_at.isoformat() if db_character.updated_at else "",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create character: {str(e)}")


@router.get("", response_model=List[PlayerCharacterResponse])
async def list_characters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all characters for the current user"""
    characters = db.query(PlayerCharacter).filter(PlayerCharacter.user_id == current_user.id).all()

    result = []
    for char in characters:
        character_data = json.loads(char.character_data) if char.character_data else {}
        result.append(
            PlayerCharacterResponse(
                id=char.id,
                character_name=char.character_name,
                player_name=char.player_name,
                class_and_level=char.class_and_level,
                race=char.race,
                background=char.background,
                alignment=char.alignment,
                character_data=character_data,
                image_base64=char.image_base64,
                image_path=char.image_path,
                portrait_prompt=char.portrait_prompt,
                created_at=char.created_at.isoformat() if char.created_at else "",
                updated_at=char.updated_at.isoformat() if char.updated_at else "",
            )
        )

    return result


@router.get("/{character_id}", response_model=PlayerCharacterResponse)
async def get_character(
    character_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific character by ID"""
    character = (
        db.query(PlayerCharacter)
        .filter(PlayerCharacter.id == character_id, PlayerCharacter.user_id == current_user.id)
        .first()
    )

    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    character_data = json.loads(character.character_data) if character.character_data else {}

    return PlayerCharacterResponse(
        id=character.id,
        character_name=character.character_name,
        player_name=character.player_name,
        class_and_level=character.class_and_level,
        race=character.race,
        background=character.background,
        alignment=character.alignment,
        character_data=character_data,
        image_base64=character.image_base64,
        image_path=character.image_path,
        portrait_prompt=character.portrait_prompt,
        created_at=character.created_at.isoformat() if character.created_at else "",
        updated_at=character.updated_at.isoformat() if character.updated_at else "",
    )


@router.put("/{character_id}", response_model=PlayerCharacterResponse)
async def update_character(
    character_id: int,
    request: PlayerCharacterUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a character (HP, stats, etc.)"""
    character = (
        db.query(PlayerCharacter)
        .filter(PlayerCharacter.id == character_id, PlayerCharacter.user_id == current_user.id)
        .first()
    )

    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Load current character data
    character_data = json.loads(character.character_data) if character.character_data else {}

    # Update character data if provided
    if request.character_data:
        character_data.update(request.character_data)
    elif request.current_hit_points is not None:
        # Quick HP update
        if "combat_stats" in character_data:
            character_data["combat_stats"]["current_hit_points"] = request.current_hit_points
    elif request.experience_points is not None:
        # Quick XP update
        character_data["experience_points"] = request.experience_points

    # Save updated character data
    character.character_data = json.dumps(character_data)
    character.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(character)

    return PlayerCharacterResponse(
        id=character.id,
        character_name=character.character_name,
        player_name=character.player_name,
        class_and_level=character.class_and_level,
        race=character.race,
        background=character.background,
        alignment=character.alignment,
        character_data=character_data,
        image_base64=character.image_base64,
        image_path=character.image_path,
        portrait_prompt=character.portrait_prompt,
        created_at=character.created_at.isoformat() if character.created_at else "",
        updated_at=character.updated_at.isoformat() if character.updated_at else "",
    )


@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a character"""
    character = (
        db.query(PlayerCharacter)
        .filter(PlayerCharacter.id == character_id, PlayerCharacter.user_id == current_user.id)
        .first()
    )

    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    db.delete(character)
    db.commit()

    return None


@router.post("/{character_id}/portrait", response_model=PlayerCharacterResponse)
async def regenerate_portrait(
    character_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Regenerate character portrait"""
    character = (
        db.query(PlayerCharacter)
        .filter(PlayerCharacter.id == character_id, PlayerCharacter.user_id == current_user.id)
        .first()
    )

    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    # Load character data
    character_data = json.loads(character.character_data) if character.character_data else {}

    # Generate new portrait using NPC portrait generation
    from services.character import generate_npc_portrait

    npc_description = f"{character.race} {character.class_and_level}, {character.background}, {character.alignment}"
    portrait_result = generate_npc_portrait(
        npc_name=character.character_name, npc_description=npc_description
    )

    if "error" in portrait_result:
        raise HTTPException(status_code=500, detail=portrait_result["error"])

    # Update character with new portrait
    character.image_base64 = portrait_result.get("image_base64")
    character.portrait_prompt = portrait_result.get("prompt_used")
    character.updated_at = datetime.utcnow()

    # Update character_data portrait info
    if "portrait" in character_data:
        character_data["portrait"]["prompt"] = portrait_result.get("prompt_used", "")
    character.character_data = json.dumps(character_data)

    db.commit()
    db.refresh(character)

    return PlayerCharacterResponse(
        id=character.id,
        character_name=character.character_name,
        player_name=character.player_name,
        class_and_level=character.class_and_level,
        race=character.race,
        background=character.background,
        alignment=character.alignment,
        character_data=character_data,
        image_base64=character.image_base64,
        image_path=character.image_path,
        portrait_prompt=character.portrait_prompt,
        created_at=character.created_at.isoformat() if character.created_at else "",
        updated_at=character.updated_at.isoformat() if character.updated_at else "",
    )
