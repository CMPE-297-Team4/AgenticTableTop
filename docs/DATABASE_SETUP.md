# Database Setup Guide

This guide explains how to use the database system for storing login information and NPC images in AgenticTableTop.

## Overview

The database system provides:
- **User Authentication**: Secure user registration and login with JWT tokens
- **NPC Image Storage**: Persistent storage of generated NPC images
- **Image Retrieval**: Fast lookup of previously generated images
- **User Isolation**: Each user's images are kept separate

## Database Technology

- **Development**: SQLite (file-based, zero configuration)
- **Production**: PostgreSQL (recommended for scalability)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `sqlalchemy` - Database ORM
- `passlib[bcrypt]` - Password hashing
- `python-jose[cryptography]` - JWT token generation

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Database Configuration
DATABASE_URL=sqlite:///./agentictabletop.db

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-change-in-production-use-openssl-rand-hex-32
```

**Generate a secure JWT secret:**
```bash
openssl rand -hex 32
```

### 3. Initialize Database

The database is automatically initialized when the API starts. Tables are created automatically:
- `users` - User accounts
- `npc_images` - Stored NPC images
- `campaigns` - Campaign metadata (future use)

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "dm_user",
  "email": "dm@example.com",
  "password": "secure_password"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=dm_user&password=secure_password
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "username": "dm_user"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

### NPC Images

#### Generate/Retrieve NPC Image
```http
POST /api/generate-npc-image
Authorization: Bearer <access_token>  # Optional
Content-Type: application/json

{
  "npc_name": "Elder Harlan",
  "npc_description": "A wise old human wizard with a long beard",
  "quest_context": "Main quest giver in Act I",
  "campaign_id": "optional-campaign-id"
}
```

**Behavior:**
1. Checks database for existing image (by NPC name)
2. If found, returns stored image immediately
3. If not found, generates new image
4. Saves new image to database
5. Returns image

#### List NPC Images
```http
GET /api/npc-images?campaign_id=xxx&npc_name=Elder
Authorization: Bearer <access_token>  # Optional
```

**Response:**
```json
[
  {
    "id": 1,
    "npc_name": "Elder Harlan",
    "npc_description": "A wise old human wizard",
    "quest_context": "Main quest giver",
    "campaign_id": "campaign-123",
    "created_at": "2025-01-15T10:30:00",
    "has_image": true
  }
]
```

#### Get Specific NPC Image
```http
GET /api/npc-images/Elder%20Harlan?campaign_id=xxx
Authorization: Bearer <access_token>  # Optional
```

#### Delete NPC Image
```http
DELETE /api/npc-images/1
Authorization: Bearer <access_token>  # Required
```

## Frontend Usage

### Authentication

```typescript
import { register, login, logout, getCurrentUser } from '@/services/campaignApi';

// Register new user
const user = await register({
  username: 'dm_user',
  email: 'dm@example.com',
  password: 'secure_password'
});

// Login
const token = await login({
  username: 'dm_user',
  password: 'secure_password'
});
// Token is automatically stored in localStorage

// Get current user
const currentUser = await getCurrentUser();

// Logout
logout();
```

### NPC Images

```typescript
import { generateNPCImage, getNPCImage, listNPCImages } from '@/services/campaignApi';

// Generate or retrieve NPC image
// Automatically checks database first
const image = await generateNPCImage(
  'Elder Harlan',
  'A wise old human wizard',
  'Main quest giver',
  'campaign-123'  // Optional campaign ID
);

// Get stored image
const storedImage = await getNPCImage('Elder Harlan', 'campaign-123');

// List all NPC images
const images = await listNPCImages('campaign-123', 'Elder');
```

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `hashed_password` - Bcrypt hashed password
- `is_active` - Account status
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### NPC Images Table
- `id` - Primary key
- `user_id` - Foreign key to users (optional)
- `campaign_id` - Campaign identifier (optional)
- `npc_name` - NPC name (indexed)
- `npc_description` - NPC description
- `quest_context` - Quest context
- `image_base64` - Base64 encoded image
- `prompt_used` - Generation prompt
- `image_path` - Optional file path
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **JWT Tokens**: Secure token-based authentication
3. **User Isolation**: Users can only access their own images
4. **Optional Authentication**: NPC image generation works without login, but images are user-specific when logged in

## Migration to PostgreSQL

For production, update your `.env`:

```bash
DATABASE_URL=postgresql://user:password@localhost/agentictabletop
```

Install PostgreSQL driver:
```bash
pip install psycopg2-binary
```

The same code works with both SQLite and PostgreSQL!

## Troubleshooting

### Database not initializing
- Check that SQLAlchemy is installed: `pip install sqlalchemy`
- Check file permissions for SQLite database file
- Verify DATABASE_URL in `.env` file

### Authentication not working
- Verify JWT_SECRET_KEY is set in `.env`
- Check that token is being sent in Authorization header
- Ensure token hasn't expired (default: 7 days)

### Images not saving
- Check database file permissions
- Verify user is authenticated (optional but recommended)
- Check database connection

## Example Workflow

1. **User registers:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"dm","email":"dm@test.com","password":"test123"}'
   ```

2. **User logs in:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -d "username=dm&password=test123"
   ```

3. **Generate NPC image (checks database first):**
   ```bash
   curl -X POST http://localhost:8000/api/generate-npc-image \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"npc_name":"Elder","npc_description":"Wise wizard"}'
   ```

4. **Retrieve stored image:**
   ```bash
   curl http://localhost:8000/api/npc-images/Elder \
     -H "Authorization: Bearer <token>"
   ```

The system automatically checks the database before generating new images, saving time and API costs!
