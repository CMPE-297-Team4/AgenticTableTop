# Pinecone Integration Guide

This guide explains how to incorporate Pinecone vector database for storing and retrieving AI-generated campaign data in AgenticTableTop.

## Overview

Pinecone integration provides:
- **Vector Storage**: Store campaign data as embeddings for semantic search
- **Similarity Search**: Find campaigns based on content similarity
- **Campaign Library**: Persistent storage of generated campaigns
- **RAG System**: Retrieve relevant content for AI agents

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment  # e.g., us-east-1
PINECONE_INDEX_NAME=agentictabletop-campaigns

# OpenAI API Key (required for embeddings)
OPENAI_API_KEY=sk-proj-your-key-here
```

### 2. Dependencies

The following packages are automatically installed:

```bash
pip install pinecone-client==3.0.0 openai==1.12.0
```

### 3. Pinecone Account Setup

1. Sign up at [pinecone.io](https://pinecone.io)
2. Create a new project
3. Get your API key from the dashboard
4. Note your environment (e.g., `us-east-1`)

## Architecture

### Data Models

The system stores several types of documents:

#### CampaignDocument
- **Purpose**: Store complete campaign data
- **Fields**: title, background, theme, acts, quests, metadata
- **Vector**: Generated from title + background + theme + tags

#### QuestDocument  
- **Purpose**: Store individual quest data
- **Fields**: quest_name, description, objectives, difficulty, etc.
- **Vector**: Generated from quest content

#### NPCDocument
- **Purpose**: Store NPC data (future feature)
- **Fields**: name, role, description, personality, motivations

#### SessionDocument
- **Purpose**: Store session notes and outcomes (future feature)
- **Fields**: session_number, summary, outcomes, notes

### Vector Generation

All documents are converted to vectors using OpenAI's `text-embedding-3-small` model:

```python
def _get_embedding(self, text: str) -> List[float]:
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
```

### Search Strategy

The system creates searchable text by combining relevant fields:

```python
def _create_searchable_text(self, document: BaseModel) -> str:
    if isinstance(document, CampaignDocument):
        return f"{document.title} {document.background} {document.theme} {' '.join(document.tags)}"
    # ... other document types
```

## API Endpoints

### Campaign Generation with Storage

```http
POST /api/generate-campaign
Content-Type: application/json

{
  "outline": "I want a dark fantasy campaign with dragons",
  "save_to_pinecone": true,
  "user_id": "user123",
  "tags": ["dark-fantasy", "dragons", "mystery"]
}
```

### Search Campaigns

```http
POST /api/search-campaigns
Content-Type: application/json

{
  "query": "dark fantasy with dragons",
  "user_id": "user123",
  "limit": 10
}
```

### Search Quests

```http
POST /api/search-quests
Content-Type: application/json

{
  "query": "rescue mission",
  "limit": 10
}
```

### Save Campaign Manually

```http
POST /api/save-campaign
Content-Type: application/json

{
  "campaign_data": { /* CampaignResponse object */ },
  "user_id": "user123",
  "tags": ["fantasy", "adventure"]
}
```

### Retrieve Campaign

```http
GET /api/campaign/{campaign_id}
```

### Delete Campaign

```http
DELETE /api/campaign/{campaign_id}
```

## Frontend Integration

### Campaign Generation

The frontend now includes Pinecone options:

```typescript
const request: CampaignRequest = {
  outline: "I want a dark fantasy campaign",
  save_to_pinecone: true,
  user_id: "user123",
  tags: ["dark-fantasy", "dragons"]
};

const campaign = await generateCampaign(request);
```

### Campaign Library

A new `/library` page provides:
- **Search Interface**: Natural language search for campaigns
- **Campaign Cards**: Display search results with metadata
- **Actions**: View, delete campaigns
- **Similarity Scores**: Show how well results match the query

### API Service Functions

```typescript
// Search campaigns
const results = await searchCampaigns({
  query: "dark fantasy",
  user_id: "user123",
  limit: 10
});

// Save campaign
const saveResult = await saveCampaign({
  campaign_data: campaign,
  user_id: "user123",
  tags: ["fantasy"]
});

// Get specific campaign
const campaign = await getCampaign("campaign-id");

// Delete campaign
await deleteCampaign("campaign-id");
```

## Usage Examples

### 1. Generate and Store Campaign

```typescript
// Generate campaign with Pinecone storage
const campaign = await generateCampaign({
  outline: "A steampunk adventure in floating cities",
  save_to_pinecone: true,
  user_id: "dm123",
  tags: ["steampunk", "adventure", "floating-cities"]
});
```

### 2. Search for Similar Campaigns

```typescript
// Find campaigns similar to "steampunk adventure"
const results = await searchCampaigns({
  query: "steampunk adventure with airships",
  user_id: "dm123",
  limit: 5
});

// Results include similarity scores
results.results.forEach(result => {
  console.log(`${result.title}: ${(result.score * 100).toFixed(1)}% match`);
});
```

### 3. Find Specific Quest Types

```typescript
// Search for rescue missions
const quests = await searchQuests({
  query: "rescue mission with stealth elements",
  limit: 10
});
```

## Best Practices

### 1. Tagging Strategy

Use consistent, descriptive tags:
- **Genre**: `fantasy`, `sci-fi`, `horror`, `steampunk`
- **Tone**: `dark`, `comedy`, `serious`, `mystery`
- **Elements**: `dragons`, `magic`, `technology`, `politics`
- **Style**: `sandbox`, `linear`, `open-world`

### 2. Search Queries

Use natural language for better results:
- ✅ "dark fantasy with dragons and ancient ruins"
- ✅ "comedy adventure with talking animals"
- ❌ "fantasy dragons" (too generic)

### 3. User Organization

Use `user_id` to organize campaigns:
- Personal campaigns: `user_123`
- Shared campaigns: `shared`
- Public campaigns: `public`

### 4. Error Handling

The system gracefully handles Pinecone failures:
- Campaign generation continues even if Pinecone save fails
- Search returns empty results if Pinecone is unavailable
- Logs warnings for debugging

## Future Enhancements

### 1. RAG System Integration

Use stored campaigns to enhance AI generation:

```python
def generate_with_rag(self, query: str):
    # Find similar campaigns
    similar_campaigns = self.search_campaigns(query, limit=3)
    
    # Use as context for generation
    context = self._build_context(similar_campaigns)
    
    # Generate with context
    return self._generate_with_context(query, context)
```

### 2. Session Tracking

Store session outcomes to improve future campaigns:

```python
def store_session_outcome(self, campaign_id: str, session_data: dict):
    session_doc = SessionDocument(
        campaign_id=campaign_id,
        session_number=session_data["number"],
        summary=session_data["summary"],
        outcomes=session_data["outcomes"],
        # ...
    )
    self._store_document(session_doc)
```

### 3. NPC Memory

Store NPC interactions for consistent character development:

```python
def store_npc_interaction(self, npc_id: str, interaction: dict):
    # Update NPC with new interaction data
    # Store for future reference
```

## Troubleshooting

### Common Issues

1. **Pinecone Not Initialized**
   - Check `PINECONE_API_KEY` environment variable
   - Verify Pinecone account is active

2. **Embedding Generation Fails**
   - Check `OPENAI_API_KEY` environment variable
   - Verify OpenAI account has credits

3. **Search Returns No Results**
   - Ensure campaigns have been saved to Pinecone
   - Check if `user_id` filter is too restrictive

4. **Index Creation Fails**
   - Verify Pinecone environment is correct
   - Check if index name conflicts with existing indexes

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Check

Test Pinecone connectivity:

```python
from utils.pinecone_service import pinecone_service

# Check if service is initialized
if pinecone_service.index:
    print("Pinecone connected successfully")
else:
    print("Pinecone not initialized")
```

## Performance Considerations

### 1. Embedding Costs

- OpenAI embeddings cost ~$0.0001 per 1K tokens
- Average campaign: ~2K tokens = ~$0.0002 per campaign
- Monitor usage in OpenAI dashboard

### 2. Pinecone Costs

- Serverless pricing: ~$0.0004 per 1K vector operations
- Storage: ~$0.0001 per 1K vectors per month
- Monitor usage in Pinecone dashboard

### 3. Optimization

- Batch operations when possible
- Use appropriate vector dimensions (1536 for OpenAI)
- Implement caching for frequent searches

## Security

### 1. API Keys

- Store API keys in environment variables
- Never commit keys to version control
- Use different keys for development/production

### 2. Data Privacy

- User data is isolated by `user_id`
- Consider data retention policies
- Implement user consent for data storage

### 3. Access Control

- Implement user authentication
- Validate user permissions for operations
- Log access for audit trails
