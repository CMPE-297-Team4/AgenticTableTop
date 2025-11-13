"""
NPC image generation and management routes
"""

import os
import traceback
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.dependencies import get_current_user as get_current_user_required
from api.dependencies import get_current_user_optional
from api.models import NPCImageRequest, NPCImageResponse
from database.models import NPCImage, User, get_db
from services.cache import cache_response, get_cached_response
from services.character import generate_npc_portrait

router = APIRouter(prefix="/api", tags=["npcs"])


@router.post("/generate-npc-image", response_model=NPCImageResponse)
async def generate_npc_image(
    request: NPCImageRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a portrait image for an NPC using OpenAI's image generation API

    This endpoint:
    1. Checks database for existing image (by NPC name and description)
    2. If found, returns stored image
    3. If not found, generates new image using DALL-E 3
    4. Saves new image to database
    5. Returns base64-encoded image

    Useful for DMs who want visual representations of NPCs in their campaigns
    """
    try:
        # First, check database for existing image
        query = db.query(NPCImage).filter(NPCImage.npc_name == request.npc_name)

        # If user is authenticated, prefer their images
        if current_user:
            query = query.filter(NPCImage.user_id == current_user.id)

        # If campaign_id provided, filter by it
        if request.campaign_id:
            query = query.filter(NPCImage.campaign_id == request.campaign_id)

        # Try to find matching image (by name and similar description)
        existing_image = query.first()

        if existing_image:
            print(f"Returning stored NPC image from database for: {request.npc_name}")
            return NPCImageResponse(
                npc_name=existing_image.npc_name,
                image_base64=existing_image.image_base64,
                prompt_used=existing_image.prompt_used or "",
            )

        # Check if caching is enabled (fallback to LLM cache)
        cache_enabled = os.environ.get("LLM_CACHE_ENABLED", "true").lower() == "true"

        # Create cache key from request
        cache_key = (
            f"npc_image:{request.npc_name}:{request.npc_description}:{request.quest_context or ''}"
        )

        # Try to get cached response
        if cache_enabled:
            cached_response = get_cached_response(cache_key, "npc_image")
            if cached_response:
                print(f"Returning cached NPC image for: {request.npc_name}")
                # Save cached image to database for future use
                new_image = NPCImage(
                    user_id=current_user.id if current_user else None,
                    campaign_id=request.campaign_id,
                    npc_name=request.npc_name,
                    npc_description=request.npc_description,
                    quest_context=request.quest_context,
                    image_base64=cached_response["image_base64"],
                    prompt_used=cached_response.get("prompt_used", ""),
                )
                db.add(new_image)
                db.commit()
                return NPCImageResponse(**cached_response)

        print(f"Generating new NPC image for: {request.npc_name}")

        result = generate_npc_portrait(
            npc_name=request.npc_name,
            npc_description=request.npc_description,
            quest_context=request.quest_context,
        )

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        # Save to database
        new_image = NPCImage(
            user_id=current_user.id if current_user else None,
            campaign_id=request.campaign_id,
            npc_name=result["npc_name"],
            npc_description=request.npc_description,
            quest_context=request.quest_context,
            image_base64=result["image_base64"],
            prompt_used=result.get("prompt_used", ""),
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)

        print(f"Saved NPC image to database (ID: {new_image.id})")

        # Cache the response if caching is enabled
        if cache_enabled:
            cache_response(
                cache_key,
                {
                    "npc_name": result["npc_name"],
                    "image_base64": result["image_base64"],
                    "prompt_used": result.get("prompt_used", ""),
                },
                "npc_image",
            )

        return NPCImageResponse(
            npc_name=result["npc_name"],
            image_base64=result["image_base64"],
            prompt_used=result.get("prompt_used", ""),
        )

    except Exception as e:
        print(f"Error generating NPC image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate NPC image: {str(e)}")


@router.get("/npc-images", response_model=List[Dict[str, Any]])
async def list_npc_images(
    campaign_id: Optional[str] = None,
    npc_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    List NPC images from database

    Returns stored NPC images filtered by:
    - campaign_id (optional)
    - npc_name (optional)
    - user_id (if authenticated)
    """
    try:
        query = db.query(NPCImage)

        # Filter by user if authenticated
        if current_user:
            query = query.filter(NPCImage.user_id == current_user.id)

        # Filter by campaign if provided
        if campaign_id:
            query = query.filter(NPCImage.campaign_id == campaign_id)

        # Filter by NPC name if provided
        if npc_name:
            query = query.filter(NPCImage.npc_name.ilike(f"%{npc_name}%"))

        images = query.order_by(NPCImage.created_at.desc()).all()

        return [
            {
                "id": img.id,
                "npc_name": img.npc_name,
                "npc_description": img.npc_description,
                "quest_context": img.quest_context,
                "campaign_id": img.campaign_id,
                "created_at": img.created_at.isoformat() if img.created_at else None,
                "has_image": bool(img.image_base64),
            }
            for img in images
        ]
    except Exception as e:
        print(f"Error listing NPC images: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to list NPC images: {str(e)}")


@router.get("/npc-images/{npc_name}", response_model=NPCImageResponse)
async def get_npc_image(
    npc_name: str,
    campaign_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get a specific NPC image by name

    Returns the stored image if found in database
    """
    try:
        query = db.query(NPCImage).filter(NPCImage.npc_name == npc_name)

        # If user is authenticated, prefer their images
        if current_user:
            query = query.filter(NPCImage.user_id == current_user.id)

        # If campaign_id provided, filter by it
        if campaign_id:
            query = query.filter(NPCImage.campaign_id == campaign_id)

        image = query.first()

        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"NPC image not found for: {npc_name}",
            )

        return NPCImageResponse(
            npc_name=image.npc_name,
            image_base64=image.image_base64,
            prompt_used=image.prompt_used or "",
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving NPC image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to retrieve NPC image: {str(e)}")


@router.delete("/npc-images/{image_id}")
async def delete_npc_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_required),
):
    """
    Delete an NPC image by ID

    Only the owner can delete their images
    """
    try:
        image = db.query(NPCImage).filter(NPCImage.id == image_id).first()

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        # Check ownership
        if image.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own images",
            )

        db.delete(image)
        db.commit()

        return {"success": True, "message": "Image deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting NPC image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to delete NPC image: {str(e)}")
