"""
Retrieval-Augmented Generation (RAG) Service
Integrates Pinecone vector database with OpenAI embeddings for knowledge-based generation.
"""

import os
import re
import textwrap
import time
from typing import List, Optional

import fitz  # PyMuPDF (binary version)
from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec

# Load environment variables
load_dotenv()


class RAGService:
    """
    RAG Service for managing knowledge bases and retrieving augmented context.
    """

    def __init__(
        self,
        pinecone_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        embed_model: str = "text-embedding-3-small",
        default_index_name: str = "agentic-tabletop",
    ):
        """
        Initialize RAG Service.

        Args:
            pinecone_api_key: Pinecone API key (defaults to env var PINECONE_API_KEY)
            openai_api_key: OpenAI API key (defaults to env var OPENAI_API_KEY)
            embed_model: OpenAI embedding model to use
            default_index_name: Default Pinecone index name
        """
        self.pinecone_api_key = pinecone_api_key or os.getenv("PINECONE_API_KEY")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")

        if not self.pinecone_api_key or not self.openai_api_key:
            raise ValueError("Please set PINECONE_API_KEY and OPENAI_API_KEY environment variables")

        self.client = OpenAI(api_key=self.openai_api_key)
        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.embed_model = embed_model
        self.default_index_name = default_index_name
        self.index = None
        self.current_index_name = None

    def ensure_index(self, index_name: str = None) -> None:
        """
        Ensure Pinecone index exists and is ready. Creates if needed.

        Args:
            index_name: Name of index (defaults to default_index_name)
        """
        index_name = index_name or self.default_index_name

        # Check if index exists, create if not
        if index_name not in self.pc.list_indexes().names():
            print(f"Creating Pinecone index '{index_name}'...")
            self.pc.create_index(
                name=index_name,
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
                deletion_protection="disabled",
                tags={"environment": "production"},
                vector_type="dense",
            )

        # Wait for index to be ready
        while not self.pc.describe_index(index_name).status["ready"]:
            time.sleep(1)

        print(f"Index '{index_name}' is ready.")
        self.index = self.pc.Index(index_name)
        self.current_index_name = index_name

    def get_index_stats(self, index_name: str = None):
        """Get statistics about the Pinecone index."""
        index_name = index_name or self.current_index_name
        if not index_name:
            raise ValueError("No index specified. Call ensure_index() first.")
        self.ensure_index(index_name)
        return self.index.describe_index_stats()

    @staticmethod
    def extract_clean_text_from_pdf(pdf_path: str) -> List[str]:
        """
        Extract and clean text from PDF as list of lines (wrapped at 120 chars).

        Args:
            pdf_path: Path to PDF file

        Returns:
            List of text lines
        """
        doc = fitz.open(pdf_path)
        raw = "\n".join(page.get_text() for page in doc)

        # Fix hyphenations and unwrap soft breaks
        text = re.sub(r"(\w)-\n(\w)", r"\1\2", raw)
        text = re.sub(r"(?<![.!?;:])\n(?!\n)", " ", text)
        text = re.sub(r"[ \t]+", " ", text).strip()
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Split into paragraphs, wrap to 120 chars
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        wrapped_paras = [
            textwrap.fill(p, width=120, break_long_words=False, break_on_hyphens=False)
            for p in paras
        ]

        # Flatten paragraphs into list of lines
        lines = []
        for para in wrapped_paras:
            lines.extend(para.splitlines())
            lines.append("")  # Keep blank line between paragraphs

        if lines and lines[-1] == "":
            lines.pop()  # Remove trailing blank line

        return lines

    def upsert_pdf_to_knowledge_base(
        self,
        pdf_path: str,
        namespace: str,
        chunk_size: int = 5,
        stride: int = 2,
        index_name: str = None,
        doc_id_prefix: str = None,
    ) -> int:
        """
        Upsert PDF content to Pinecone knowledge base.

        Args:
            pdf_path: Path to PDF file
            namespace: Namespace in Pinecone index
            chunk_size: Number of lines per chunk
            stride: Overlap between chunks
            index_name: Pinecone index name (uses default if not provided)
            doc_id_prefix: Prefix for document IDs (uses filename if not provided)

        Returns:
            Number of vectors upserted
        """
        index_name = index_name or self.default_index_name
        self.ensure_index(index_name)

        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        doc_id_prefix = doc_id_prefix or os.path.splitext(os.path.basename(pdf_path))[0]

        print(f"Extracting text from {pdf_path}...")
        doc_lines = self.extract_clean_text_from_pdf(pdf_path)
        print(f"Extraction complete. Total lines: {len(doc_lines)}")

        count = 0
        for i in range(0, len(doc_lines), chunk_size):
            # Find beginning and end of chunk
            i_begin = max(0, i - stride)
            i_end = min(len(doc_lines), i_begin + chunk_size)

            doc_chunk = doc_lines[i_begin:i_end]
            texts = "\n".join(doc_chunk)

            # Skip empty chunks
            if not texts.strip():
                continue

            try:
                # Create embedding
                res = self.client.embeddings.create(input=texts, model=self.embed_model)
                embed = res.data[0].embedding

                # Metadata preparation
                metadata = {"text": texts, "source": os.path.basename(pdf_path)}

                # Upsert to Pinecone
                count += 1
                vector_id = f"{doc_id_prefix}_{count}"
                self.index.upsert(
                    vectors=[{"id": vector_id, "metadata": metadata, "values": embed}],
                    namespace=namespace,
                )

                if count % 10 == 0:
                    print(f"  Upserted {count} vectors...")

            except Exception as e:
                print(f"Error processing chunk {count}: {e}")
                # Retry after brief delay
                time.sleep(2)

        print(f"Successfully upserted {count} vectors to namespace '{namespace}'")
        return count

    def retrieve_context(
        self,
        query: str,
        namespace: str,
        top_k: int = 3,
        limit: int = 8000,
        index_name: str = None,
    ) -> str:
        """
        Retrieve relevant context from knowledge base for a query.

        Args:
            query: Query text
            namespace: Namespace to search in
            top_k: Number of top matches to retrieve
            limit: Maximum total characters to include
            index_name: Pinecone index name

        Returns:
            Formatted context string wrapped in delimiters
        """
        index_name = index_name or self.default_index_name
        self.ensure_index(index_name)

        # Create query embedding
        res = self.client.embeddings.create(input=[query], model=self.embed_model)
        query_vector = res.data[0].embedding

        # Query Pinecone
        results = self.index.query(
            vector=query_vector, top_k=top_k, include_metadata=True, namespace=namespace
        )

        contexts = [x["metadata"]["text"] for x in results.get("matches", [])]

        # Build prompt with context up to limit
        prompt = " "
        count = 0
        while count < len(contexts) and len(prompt) + len(contexts[count]) < limit:
            prompt += contexts[count] + "\n"
            count += 1

        # Wrap in delimiters
        delimiter = "####"
        return f"{delimiter}\n{prompt}\n{delimiter}"

    def delete_namespace(self, namespace: str, index_name: str = None) -> None:
        """Delete all vectors in a namespace."""
        index_name = index_name or self.default_index_name
        self.ensure_index(index_name)
        self.index.delete(delete_all=True, namespace=namespace)
        print(f"Deleted all vectors in namespace '{namespace}'")

    def delete_index(self, index_name: str = None) -> None:
        """Delete entire Pinecone index. Use with caution!"""
        index_name = index_name or self.default_index_name
        self.pc.delete_index(index_name)
        print(f"Deleted Pinecone index '{index_name}'")


# Global instance (optional, for convenience)
_rag_instance: Optional[RAGService] = None


def get_rag_service(
    pinecone_api_key: Optional[str] = None,
    openai_api_key: Optional[str] = None,
    reset: bool = False,
) -> RAGService:
    """
    Get or create global RAG service instance.

    Args:
        pinecone_api_key: Pinecone API key
        openai_api_key: OpenAI API key
        reset: Force creation of new instance

    Returns:
        RAGService instance
    """
    global _rag_instance
    if _rag_instance is None or reset:
        _rag_instance = RAGService(
            pinecone_api_key=pinecone_api_key,
            openai_api_key=openai_api_key,
        )
    return _rag_instance
