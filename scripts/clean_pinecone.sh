#!/bin/bash
# Clean Pinecone Vector Storage
# This script deletes all indexes from Pinecone

echo "==================================="
echo "Cleaning Pinecone Vector Storage"
echo "==================================="
echo ""

# Check if virtual environment exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Check if Pinecone API key is set
if [ -z "$PINECONE_API_KEY" ]; then
    echo "❌ ERROR: PINECONE_API_KEY not set"
    echo ""
    echo "Please set your Pinecone API key:"
    echo "  export PINECONE_API_KEY='your-key-here'"
    echo ""
    echo "Or add it to your .env file"
    exit 1
fi

echo "⚠️  WARNING: This will DELETE ALL Pinecone indexes!"
echo ""
echo "This cannot be undone. All vector data will be permanently deleted."
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
echo

if [[ ! $REPLY == "yes" ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Deleting Pinecone indexes..."

# Run Python script to delete all indexes
python3 << 'EOF'
import os
try:
    from pinecone import Pinecone
    
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ No Pinecone API key found")
        exit(1)
    
    pc = Pinecone(api_key=api_key)
    
    # List all indexes
    indexes = pc.list_indexes()
    
    if not indexes or len(indexes.names()) == 0:
        print("ℹ️  No indexes found - nothing to delete")
        exit(0)
    
    print(f"Found {len(indexes.names())} index(es):")
    for idx_name in indexes.names():
        print(f"  - {idx_name}")
    
    print("")
    print("Deleting indexes...")
    
    for idx_name in indexes.names():
        try:
            pc.delete_index(idx_name)
            print(f"  ✓ Deleted: {idx_name}")
        except Exception as e:
            print(f"  ✗ Failed to delete {idx_name}: {e}")
    
    print("")
    print("✅ Pinecone cleanup complete!")
    
except ImportError:
    print("❌ Error: pinecone-client not installed")
    print("   Run: pip install pinecone-client")
    exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
EOF

echo ""
echo "==================================="
echo "Done!"
echo "==================================="




