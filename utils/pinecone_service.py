"""
Pinecone Vector Database Service for AgenticTableTop

This module handles storing and retrieving AI-generated campaign data using Pinecone.
It provides vector storage capabilities for:
- Campaign metadata and content
- Quest information
- NPC and monster data
- Player character data
- Session notes and outcomes
"""

import os
import uuid
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

from openai import OpenAI
from pinecone import Pinecone
from pydantic import BaseModel

# Try to import ServerlessSpec for v5.x compatibility
try:
    from pinecone import ServerlessSpec
except ImportError:
    # For Pinecone v5.x, ServerlessSpec is in a different location or not needed
    try:
        from pinecone.grpc import ServerlessSpec
    except ImportError:
        # Fallback: ServerlessSpec might not be needed in v5.x
        ServerlessSpec = None

# Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "agentictabletop-campaigns")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client for embeddings
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Initialize Pinecone
if PINECONE_API_KEY:
    pc = Pinecone(api_key=PINECONE_API_KEY)
else:
    pc = None


class CampaignDocument(BaseModel):
    """Document model for storing campaign data in Pinecone"""
    
    id: str
    title: str
    background: str
    theme: str
    acts: List[Dict[str, Any]]
    quests: Dict[str, List[Dict[str, Any]]]
    created_at: datetime
    updated_at: datetime
    user_id: Optional[str] = None
    tags: List[str] = []
    metadata: Dict[str, Any] = {}


class QuestDocument(BaseModel):
    """Document model for storing individual quest data"""
    
    id: str
    campaign_id: str
    act_title: str
    quest_name: str
    quest_type: str
    description: str
    objectives: List[str]
    difficulty: str
    estimated_time: str
    npcs: List[str]
    locations: List[str]
    rewards: str
    prerequisites: str
    outcomes: str
    created_at: datetime
    metadata: Dict[str, Any] = {}


class NPCDocument(BaseModel):
    """Document model for storing NPC data"""
    
    id: str
    campaign_id: str
    name: str
    role: str
    description: str
    personality: str
    motivations: List[str]
    relationships: Dict[str, str]
    stats: Dict[str, Any]
    created_at: datetime
    metadata: Dict[str, Any] = {}


class SessionDocument(BaseModel):
    """Document model for storing session notes and outcomes"""
    
    id: str
    campaign_id: str
    session_number: int
    date: datetime
    participants: List[str]
    summary: str
    outcomes: List[str]
    notes: str
    quests_completed: List[str]
    quests_started: List[str]
    created_at: datetime
    metadata: Dict[str, Any] = {}


class PineconeService:
    """Service class for managing Pinecone operations"""
    
    def __init__(self):
        self.index = None
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize Pinecone index"""
        if not pc:
            print("Warning: Pinecone not configured. Set PINECONE_API_KEY environment variable.")
            return
        
        try:
            # Check if index exists (compatible with both v3.x and v5.x)
            index_list = pc.list_indexes()
            index_names = []
            
            # Handle different return types from list_indexes()
            if hasattr(index_list, 'names'):
                index_names = index_list.names()
            elif isinstance(index_list, list):
                index_names = [idx.name if hasattr(idx, 'name') else str(idx) for idx in index_list]
            elif hasattr(index_list, '__iter__'):
                index_names = [idx.name if hasattr(idx, 'name') else str(idx) for idx in index_list]
            
            if PINECONE_INDEX_NAME not in index_names:
                # Create index if it doesn't exist (compatible with both v3.x and v5.x)
                create_params = {
                    "name": PINECONE_INDEX_NAME,
                    "dimension": 1536,  # OpenAI embedding dimension
                    "metric": "cosine",
                }
                
                # Add ServerlessSpec if available (v3.x style)
                if ServerlessSpec is not None:
                    create_params["spec"] = ServerlessSpec(
                        cloud="aws",
                        region=PINECONE_ENVIRONMENT
                    )
                else:
                    # For v5.x, might use different parameters
                    create_params["cloud"] = "aws"
                    create_params["region"] = PINECONE_ENVIRONMENT
                
                pc.create_index(**create_params)
                print(f"Created Pinecone index: {PINECONE_INDEX_NAME}")
            
            self.index = pc.Index(PINECONE_INDEX_NAME)
            print(f"Connected to Pinecone index: {PINECONE_INDEX_NAME}")
            
        except Exception as e:
            print(f"Error initializing Pinecone: {e}")
            import traceback
            traceback.print_exc()
            self.index = None
    
    def _get_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        if not openai_client:
            raise ValueError("OpenAI API key not configured")
        
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            raise
    
    def _create_searchable_text(self, document: BaseModel) -> str:
        """Create searchable text from document"""
        if isinstance(document, CampaignDocument):
            return f"{document.title} {document.background} {document.theme} {' '.join(document.tags)}"
        elif isinstance(document, QuestDocument):
            return f"{document.quest_name} {document.description} {document.quest_type} {' '.join(document.objectives)}"
        elif isinstance(document, NPCDocument):
            return f"{document.name} {document.description} {document.role} {' '.join(document.motivations)}"
        elif isinstance(document, SessionDocument):
            return f"{document.summary} {document.notes} {' '.join(document.outcomes)}"
        else:
            return str(document)
    
    def store_campaign(self, campaign_data: Dict[str, Any], user_id: Optional[str] = None, tags: Optional[List[str]] = None) -> str:
        """Store campaign data in Pinecone"""
        if not self.index:
            raise RuntimeError("Pinecone not initialized")
        
        campaign_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Create campaign document
        campaign_doc = CampaignDocument(
            id=campaign_id,
            title=campaign_data.get("title", "Untitled Campaign"),
            background=campaign_data.get("background", ""),
            theme=campaign_data.get("theme", ""),
            acts=campaign_data.get("acts", []),
            quests=campaign_data.get("quests", {}),
            created_at=now,
            updated_at=now,
            user_id=user_id,
            tags=tags or campaign_data.get("tags", []),
            metadata=campaign_data.get("metadata", {})
        )
        
        # Create searchable text
        searchable_text = self._create_searchable_text(campaign_doc)
        
        # Generate embedding
        embedding = self._get_embedding(searchable_text)
        
        # Store in Pinecone
        self.index.upsert(
            vectors=[{
                "id": f"campaign_{campaign_id}",
                "values": embedding,
                "metadata": {
                    "type": "campaign",
                    "campaign_id": campaign_id,
                    "title": campaign_doc.title,
                    "theme": campaign_doc.theme,
                    "created_at": now.isoformat(),
                    "user_id": user_id or "",
                    "tags": ",".join(campaign_doc.tags),
                    "searchable_text": searchable_text[:1000]  # Truncate for metadata
                }
            }]
        )
        
        # Store individual quests
        for act_title, quests in campaign_doc.quests.items():
            for quest_data in quests:
                self.store_quest(quest_data, campaign_id, act_title)
        
        return campaign_id
    
    def store_quest(self, quest_data: Dict[str, Any], campaign_id: str, act_title: str) -> str:
        """Store individual quest data"""
        if not self.index:
            raise RuntimeError("Pinecone not initialized")
        
        quest_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        quest_doc = QuestDocument(
            id=quest_id,
            campaign_id=campaign_id,
            act_title=act_title,
            quest_name=quest_data.get("name", "Unnamed Quest"),
            quest_type=quest_data.get("type", ""),
            description=quest_data.get("description", ""),
            objectives=quest_data.get("objectives", []),
            difficulty=quest_data.get("difficulty", ""),
            estimated_time=str(quest_data.get("estimated_time", "")),
            npcs=quest_data.get("npcs", []),
            locations=quest_data.get("locations", []),
            rewards=quest_data.get("rewards", ""),
            prerequisites=quest_data.get("prerequisites", ""),
            outcomes=quest_data.get("outcomes", ""),
            created_at=now,
            metadata=quest_data.get("metadata", {})
        )
        
        searchable_text = self._create_searchable_text(quest_doc)
        embedding = self._get_embedding(searchable_text)
        
        self.index.upsert(
            vectors=[{
                "id": f"quest_{quest_id}",
                "values": embedding,
                "metadata": {
                    "type": "quest",
                    "quest_id": quest_id,
                    "campaign_id": campaign_id,
                    "act_title": act_title,
                    "quest_name": quest_doc.quest_name,
                    "quest_type": quest_doc.quest_type,
                    "difficulty": quest_doc.difficulty,
                    "created_at": now.isoformat(),
                    "searchable_text": searchable_text[:1000]
                }
            }]
        )
        
        return quest_id
    
    def search_campaigns(self, query: str, user_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for campaigns using vector similarity"""
        if not self.index:
            raise RuntimeError("Pinecone not initialized")
        
        # Generate embedding for query
        query_embedding = self._get_embedding(query)
        
        # Build filter
        filter_dict = {"type": "campaign"}
        if user_id:
            filter_dict["user_id"] = user_id
        
        # Search
        results = self.index.query(
            vector=query_embedding,
            filter=filter_dict,
            top_k=limit,
            include_metadata=True
        )
        
        return [
            {
                "id": match.metadata["campaign_id"],
                "title": match.metadata["title"],
                "theme": match.metadata["theme"],
                "created_at": match.metadata["created_at"],
                "score": match.score,
                "tags": match.metadata.get("tags", "").split(",") if match.metadata.get("tags") else []
            }
            for match in results.matches
        ]
    
    def search_quests(self, query: str, campaign_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for quests using vector similarity"""
        if not self.index:
            raise RuntimeError("Pinecone not initialized")
        
        query_embedding = self._get_embedding(query)
        
        filter_dict = {"type": "quest"}
        if campaign_id:
            filter_dict["campaign_id"] = campaign_id
        
        results = self.index.query(
            vector=query_embedding,
            filter=filter_dict,
            top_k=limit,
            include_metadata=True
        )
        
        return [
            {
                "id": match.metadata["quest_id"],
                "campaign_id": match.metadata["campaign_id"],
                "act_title": match.metadata["act_title"],
                "quest_name": match.metadata["quest_name"],
                "quest_type": match.metadata["quest_type"],
                "difficulty": match.metadata["difficulty"],
                "created_at": match.metadata["created_at"],
                "score": match.score
            }
            for match in results.matches
        ]
    
    def get_campaign_by_id(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve campaign by ID"""
        if not self.index:
            raise RuntimeError("Pinecone not initialized")
        
        # This would require storing the full campaign data separately
        # For now, we'll implement a basic version
        results = self.index.query(
            vector=[0.0] * 1536,  # Dummy vector
            filter={"type": "campaign", "campaign_id": campaign_id},
            top_k=1,
            include_metadata=True
        )
        
        if results.matches:
            return results.matches[0].metadata
        
        return None
    
    def delete_campaign(self, campaign_id: str) -> bool:
        """Delete campaign and related data"""
        if not self.index:
            raise RuntimeError("Pinecone not initialized")
        
        try:
            # Delete campaign vector
            self.index.delete(filter={"type": "campaign", "campaign_id": campaign_id})
            
            # Delete related quest vectors
            self.index.delete(filter={"type": "quest", "campaign_id": campaign_id})
            
            return True
        except Exception as e:
            print(f"Error deleting campaign: {e}")
            return False


# Global service instance
pinecone_service = PineconeService()
