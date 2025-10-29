#!/bin/bash

# Pinecone Setup Script for AgenticTableTop
# This script helps set up Pinecone integration

echo "🚀 Setting up Pinecone integration for AgenticTableTop..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your API keys."
else
    echo "✅ .env file already exists."
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install pinecone-client==3.0.0 openai==1.12.0

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if [ -z "$PINECONE_API_KEY" ]; then
    echo "⚠️  PINECONE_API_KEY not set. Please add it to your .env file."
    echo "   Get your API key from: https://app.pinecone.io/organizations"
fi

if [ -z "$PINECONE_ENVIRONMENT" ]; then
    echo "⚠️  PINECONE_ENVIRONMENT not set. Please add it to your .env file."
    echo "   Common values: us-east-1, us-west-2, eu-west-1"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set. Please add it to your .env file."
    echo "   Get your API key from: https://platform.openai.com/api-keys"
fi

# Test Pinecone connection
echo "🧪 Testing Pinecone connection..."
python3 -c "
import os
from utils.pinecone_service import pinecone_service

if pinecone_service.index:
    print('✅ Pinecone connection successful!')
    print(f'📊 Index: {pinecone_service.index.describe_index_stats()}')
else:
    print('❌ Pinecone connection failed. Check your API keys.')
"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Start the backend: python api.py"
echo "3. Start the frontend: cd ui && npm run dev"
echo "4. Visit http://localhost:5173 and try generating a campaign with Pinecone storage!"
echo ""
echo "📚 For more information, see docs/PINECONE_INTEGRATION.md"
