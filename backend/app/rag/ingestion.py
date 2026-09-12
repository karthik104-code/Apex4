import uuid
from typing import List, Dict, Any
from app.rag.embeddings import get_embedding_provider

class DocumentChunk:
    def __init__(self, document_id: str, chunk_text: str, embedding: List[float], metadata: Dict[str, Any]):
        self.chunk_id = str(uuid.uuid4())
        self.document_id = document_id
        self.chunk_text = chunk_text
        self.embedding = embedding
        self.metadata = metadata

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
    """Splits text into overlapping chunks for semantic retrieval."""
    words = text.split()
    if not words:
        return []
    
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
        i += (chunk_size - overlap)
    return chunks

def ingest_document(document_id: str, raw_text: str, metadata: Dict[str, Any]) -> List[DocumentChunk]:
    """Ingests raw text, creates chunks, computes embeddings, and packages DocumentChunks."""
    text_chunks = chunk_text(raw_text)
    embedder = get_embedding_provider()
    embeddings = embedder.embed_documents(text_chunks)
    
    chunks: List[DocumentChunk] = []
    for idx, (txt, emb) in enumerate(zip(text_chunks, embeddings)):
        meta = metadata.copy()
        meta["chunk_index"] = idx
        chunks.append(DocumentChunk(
            document_id=document_id,
            chunk_text=txt,
            embedding=emb,
            metadata=meta
        ))
    return chunks
