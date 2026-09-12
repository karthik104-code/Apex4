import math
from typing import List, Dict, Any, Tuple
from app.rag.ingestion import DocumentChunk
from app.rag.embeddings import get_embedding_provider

# Trusted Medical Knowledge Base Guidelines for RAG
CLINICAL_KNOWLEDGE_BASE = [
    {
        "doc_id": "kb-who-anemia-2024",
        "title": "WHO Clinical Guidelines on Anemia Management 2024",
        "text": "Hemoglobin concentrations below 12.0 g/dL in women and 13.0 g/dL in men represent anemia. Primary dietary interventions include heme iron from lean meats and non-heme iron from legumes, spinach, and fortified cereals, enhanced by Vitamin C intake."
    },
    {
        "doc_id": "kb-ada-diabetes-2024",
        "title": "American Diabetes Association Standards of Care 2024",
        "text": "Fasting blood glucose levels between 100-125 mg/dL reflect impaired fasting glucose (prediabetes), while fasting glucose >=126 mg/dL on repeated testing confirms diabetes mellitus. Post-meal walking and fiber intake assist glycemic regulation."
    },
    {
        "doc_id": "kb-nhlbi-cholesterol",
        "title": "National Heart, Lung, and Blood Institute Lipid Protocols",
        "text": "Total serum cholesterol above 200 mg/dL increases atherosclerotic cardiovascular disease risk. Soluble fiber (oats, flaxseeds) and aerobic activity reduce LDL cholesterol levels."
    },
    {
        "doc_id": "kb-endocrine-vit-d",
        "title": "Endocrine Society Vitamin D Clinical Practice Guidelines",
        "text": "Serum 25-hydroxyvitamin D concentrations below 30 ng/mL indicate insufficiency. Safe sun exposure and oral cholecalciferol (Vitamin D3) supplementation are standard corrective measures."
    }
]

class VectorStore:
    def __init__(self):
        self.chunks: List[DocumentChunk] = []
        self._seed_knowledge_base()

    def _seed_knowledge_base(self):
        embedder = get_embedding_provider()
        for doc in CLINICAL_KNOWLEDGE_BASE:
            emb = embedder.embed_text(doc["text"])
            self.chunks.append(DocumentChunk(
                document_id=doc["doc_id"],
                chunk_text=doc["text"],
                embedding=emb,
                metadata={"title": doc["title"], "source_type": "clinical_guideline"}
            ))

    def add_chunks(self, chunks: List[DocumentChunk]):
        self.chunks.extend(chunks)

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1)) or 1.0
        norm2 = math.sqrt(sum(b * b for b in vec2)) or 1.0
        return dot / (norm1 * norm2)

    def search(self, query: str, top_k: int = 3, filter_document_id: str = None) -> List[Tuple[DocumentChunk, float]]:
        embedder = get_embedding_provider()
        query_emb = embedder.embed_text(query)

        candidates = self.chunks
        if filter_document_id:
            candidates = [c for c in self.chunks if c.document_id == filter_document_id or c.metadata.get("source_type") == "clinical_guideline"]

        results = []
        for chunk in candidates:
            score = self._cosine_similarity(query_emb, chunk.embedding)
            results.append((chunk, score))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

# Global VectorStore Instance
vector_store = VectorStore()

def retrieve_evidence(query: str, top_k: int = 3, document_id: str = None) -> List[Dict[str, Any]]:
    matches = vector_store.search(query, top_k=top_k, filter_document_id=document_id)
    evidence = []
    for chunk, score in matches:
        evidence.append({
            "source": chunk.metadata.get("title", "Trusted Medical Reference"),
            "snippet": chunk.chunk_text,
            "document_id": chunk.document_id,
            "relevance_score": round(score, 3)
        })
    return evidence
