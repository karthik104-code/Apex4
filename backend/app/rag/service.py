import uuid
from typing import Dict, Any, List, Optional
from app.rag.ingestion import ingest_document
from app.rag.retriever import vector_store, retrieve_evidence
from app.rag.prompts import build_rag_prompt
from app.ai.provider import get_ai_provider, SAFETY_DISCLAIMER

def ingest_patient_report(report_id: str, title: str, raw_text: str, key_findings: List[str]) -> int:
    """Ingests extracted lab report text and key findings into vector store."""
    combined_text = f"{title}\nKey Findings:\n" + "\n".join(key_findings) + f"\nRaw Document:\n{raw_text}"
    chunks = ingest_document(
        document_id=report_id,
        raw_text=combined_text,
        metadata={"title": title, "source_type": "patient_lab_report"}
    )
    vector_store.add_chunks(chunks)
    return len(chunks)

def query_rag_pipeline(query: str, report_id: Optional[str] = None, language: str = "en") -> Dict[str, Any]:
    """Runs end-to-end RAG pipeline: Retriever -> Prompt -> LLM/Mock -> Structured Evidence Response."""
    
    # Step 1: Retrieve semantic evidence chunks
    evidence = retrieve_evidence(query, top_k=3, document_id=report_id)

    # Step 2: Extract report summary context if report_id provided
    report_summary = None
    if report_id:
        report_chunks = [c for c in vector_store.chunks if c.document_id == report_id]
        if report_chunks:
            report_summary = "\n".join([c.chunk_text for c in report_chunks[:2]])

    # Step 3: Format prompt
    formatted_prompt = build_rag_prompt(query, report_summary, evidence)

    # Step 4: Generate response via AI Provider abstraction
    provider = get_ai_provider()
    result = provider.generate_chat_response(query, conversation_id=str(uuid.uuid4()), language=language)

    # Ensure evidence sources are attached
    sources = []
    for item in evidence:
        sources.append({
            "source": item["source"],
            "snippet": item["snippet"]
        })

    return {
        "answer": result["answer"],
        "sources": sources,
        "disclaimer": SAFETY_DISCLAIMER
    }
