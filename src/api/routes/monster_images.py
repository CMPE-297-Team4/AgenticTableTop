"""
Monster image generation and management routes
"""

import os
import traceback
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.dependencies import get_current_user_optional
from api.models import MonsterImageRequest, MonsterImageResponse
from database.models import MonsterImage, User, get_db
from services.cache import cache_response, get_cached_response
from services.character import generate_npc_portrait  # Reuse NPC portrait generation for monsters

router = APIRouter(prefix="/api", tags=["monster-images"])


@router.post("/generate-monster-image", response_model=MonsterImageResponse)
async def generate_monster_image(
    request: MonsterImageRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a portrait image for a monster using OpenAI's image generation API

    This endpoint:
    1. Checks database for existing image (by monster name and description)
    2. If found, returns stored image
    3. If not found, generates new image using DALL-E 3
    4. Saves new image to database
    5. Returns base64-encoded image

    Useful for visualizing monsters in combat encounters
    """
    try:
        # First, check database for existing image
        query = db.query(MonsterImage).filter(MonsterImage.monster_name == request.monster_name)

        if request.campaign_id:
            query = query.filter(MonsterImage.campaign_id == request.campaign_id)

        existing_image = query.first()

        if existing_image:
            print(f"Returning existing monster image from database for: {request.monster_name}")
            return MonsterImageResponse(
                monster_name=existing_image.monster_name,
                image_base64=existing_image.image_base64,
                prompt_used=existing_image.prompt_used or "",
            )

        # Check if caching is enabled
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"
        cache_key = (
            f"monster_image:{request.monster_name}:"
            f"{request.monster_description or ''}:{request.quest_context or ''}"
        )

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "monster_image")
            if cached_response:
                print(f"Returning cached monster image for: {request.monster_name}")
                # Save cached image to database for future use
                new_image = MonsterImage(
                    user_id=current_user.id if current_user else None,
                    campaign_id=request.campaign_id,
                    monster_name=request.monster_name,
                    monster_type=request.monster_type,
                    monster_description=request.monster_description,
                    quest_context=request.quest_context,
                    image_base64=cached_response["image_base64"],
                    prompt_used=cached_response.get("prompt_used", ""),
                )
                db.add(new_image)
                db.commit()
                return MonsterImageResponse(**cached_response)

        print(f"Generating new monster image for: {request.monster_name}")

        # Generate monster description if not provided
        monster_description = (
            request.monster_description
            or f"A {request.monster_type or 'fantasy'} monster named {request.monster_name}"
        )

        # Use NPC portrait generation (works for monsters too)
        result = generate_npc_portrait(
            npc_name=request.monster_name,
            npc_description=monster_description,
            quest_context=request.quest_context,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        # Save to database
        new_image = MonsterImage(
            user_id=current_user.id if current_user else None,
            campaign_id=request.campaign_id,
            monster_name=result["npc_name"],
            monster_type=request.monster_type,
            monster_description=monster_description,
            quest_context=request.quest_context,
            image_base64=result["image_base64"],
            prompt_used=result.get("prompt_used", ""),
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)

        print(f"Saved monster image to database (ID: {new_image.id})")

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(cache_key, result, "monster_image")

        return MonsterImageResponse(
            monster_name=result["npc_name"],
            image_base64=result["image_base64"],
            prompt_used=result.get("prompt_used", ""),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating monster image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate monster image: {str(e)}")


@router.get("/monster-images/{monster_name}")
async def get_monster_image(
    monster_name: str,
    campaign_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get a specific monster image by name
    """
    try:
        query = db.query(MonsterImage).filter(MonsterImage.monster_name == monster_name)

        if campaign_id:
            query = query.filter(MonsterImage.campaign_id == campaign_id)

        monster_image = query.first()

        if not monster_image:
            raise HTTPException(
                status_code=404, detail=f"Monster image not found for: {monster_name}"
            )

        return MonsterImageResponse(
            monster_name=monster_image.monster_name,
            image_base64=monster_image.image_base64,
            prompt_used=monster_image.prompt_used or "",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get monster image: {str(e)}")
