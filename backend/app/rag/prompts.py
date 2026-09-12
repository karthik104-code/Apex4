from typing import List, Dict, Any, Optional

RAG_SYSTEM_PROMPT = (
    "You are an Evidence-Based AI Healthcare Companion. Your job is to answer patient questions using "
    "retrieved medical evidence and uploaded lab report context.\n\n"
    "CRITICAL RULES:\n"
    "1. Distinguish between: (A) User's Extracted Report Findings, (B) Retrieved Clinical Guidelines, and (C) Educational AI Guidance.\n"
    "2. NEVER invent lab test numbers or claim to issue definitive medical diagnoses.\n"
    "3. Always recommend consulting a primary physician for clinical decisions.\n"
    "4. Do NOT fabricate citations. Use only provided evidence."
)

def build_rag_prompt(query: str, report_summary: Optional[str], evidence: List[Dict[str, Any]]) -> str:
    prompt_parts = [RAG_SYSTEM_PROMPT, "\n---"]
    
    if report_summary:
        prompt_parts.append(f"### [1] EXTRACTED USER REPORT DATA:\n{report_summary}\n")
    else:
        prompt_parts.append("### [1] EXTRACTED USER REPORT DATA:\nNo specific report context attached.\n")

    prompt_parts.append("### [2] RETRIEVED TRUSTED MEDICAL EVIDENCE:")
    for idx, item in enumerate(evidence, 1):
        prompt_parts.append(f"Evidence #{idx} ({item['source']}): \"{item['snippet']}\"")

    prompt_parts.append(f"\n### [3] PATIENT QUESTION:\n\"{query}\"")
    prompt_parts.append("\nGenerate a clear, structured response separating report findings, evidence sources, and advice.")
    
    return "\n".join(prompt_parts)
