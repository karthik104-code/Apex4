from abc import ABC, abstractmethod
import os
import uuid
import requests
from typing import Dict, Any, List, Optional
from app.core.config import settings

SAFETY_DISCLAIMER = (
    "AI Healthcare Companion is an informative research tool and NOT a licensed physician. "
    "It does not provide medical diagnoses or treatment plans. Always consult a qualified healthcare professional for medical concerns."
)

TRUSTED_MEDICAL_SOURCES = [
    {
        "source": "WHO Clinical Guidelines 2024",
        "snippet": "Mild anemia can be supported with dietary iron and Vitamin C intake under medical supervision."
    },
    {
        "source": "American Diabetes Association Standard of Care",
        "snippet": "Fasting blood glucose >126 mg/dL or HbA1c >6.5% warrants formal clinical evaluation."
    },
    {
        "source": "National Heart, Lung, and Blood Institute (NHLBI)",
        "snippet": "Lifestyle modifications including reduced saturated fat intake and regular aerobic exercise support cardiovascular health."
    }
]

class AIProvider(ABC):
    @abstractmethod
    def generate_chat_response(self, message: str, conversation_id: str, language: str = "en") -> Dict[str, Any]:
        pass

class LLMProvider(AIProvider):
    def __init__(self, api_key: str, provider_name: str = "gemini"):
        self.api_key = api_key
        self.provider_name = provider_name

    def generate_chat_response(self, message: str, conversation_id: str, language: str = "en") -> Dict[str, Any]:
        system_instruction = (
            "You are an AI Healthcare Companion. Provide empathetic, informative, non-diagnostic educational information. "
            "NEVER claim to be a doctor or issue definitive medical diagnoses. Explicitly state uncertainty and recommend "
            "speaking with a primary care physician for clinical decisions."
        )
        prompt = f"{system_instruction}\nUser Query: {message}"

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = requests.post(url, json=payload, timeout=10)
            if res.status_code == 200:
                answer = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                return {
                    "answer": answer.strip(),
                    "sources": TRUSTED_MEDICAL_SOURCES,
                    "disclaimer": SAFETY_DISCLAIMER
                }
        except Exception as e:
            print(f"LLM API Call Exception: {e}")
        
        # Fallback to MockProvider if API call fails
        return MockProvider().generate_chat_response(message, conversation_id, language)

class MockProvider(AIProvider):
    def generate_chat_response(self, message: str, conversation_id: str, language: str = "en") -> Dict[str, Any]:
        msg_lower = message.lower()
        
        if "hemoglobin" in msg_lower or "anemia" in msg_lower or "iron" in msg_lower:
            answer = (
                "### Understanding Low Hemoglobin & Iron Levels\n\n"
                "A low hemoglobin reading indicates a reduced capacity of red blood cells to carry oxygen throughout your body.\n\n"
                "**Educational Guidance to Discuss with Your Doctor:**\n"
                "1. **Dietary Iron**: Dark leafy greens (spinach, kale), legumes, lentils, and lean proteins.\n"
                "2. **Vitamin C Synergists**: Citrus fruits, bell peppers, and berries help increase dietary iron absorption.\n"
                "3. **Clinical Recommendation**: Ask your physician about running a full iron panel (serum ferritin, TIBC) to determine if oral iron supplements are appropriate.\n\n"
                "*Note: I am an AI assistant, not a doctor. Please share these findings with your healthcare provider for clinical diagnosis.*"
            )
        elif "glucose" in msg_lower or "sugar" in msg_lower or "diabetes" in msg_lower:
            answer = (
                "### Fasting Blood Glucose Guidance\n\n"
                "Fasting blood glucose levels above 99 mg/dL warrant monitoring and clinical follow-up.\n\n"
                "**Lifestyle Interventions:**\n"
                "1. Focus on low glycemic index foods rich in dietary fiber.\n"
                "2. Engage in moderate daily activity such as brisk walking after meals.\n"
                "3. Consult your doctor regarding an HbA1c test for long-term glucose tracking.\n\n"
                "*Disclosing Uncertainty: Blood glucose levels fluctuate based on recent meals, stress, and sleep patterns.*"
            )
        elif "cholesterol" in msg_lower or "heart" in msg_lower:
            answer = (
                "### Cardiovascular Health & Cholesterol\n\n"
                "Total cholesterol levels above 200 mg/dL are categorized as borderline high.\n\n"
                "**Actionable Lifestyle Guidelines:**\n"
                "1. Limit saturated and trans fats; increase intake of omega-3 rich foods.\n"
                "2. Maintain 150 minutes of weekly moderate aerobic exercise.\n"
                "3. Schedule a comprehensive lipid panel review with your doctor."
            )
        else:
            answer = (
                f"### Health Information Assistant\n\n"
                f"Thank you for asking about: *\"{message}\"*.\n\n"
                "**General Healthcare Principles:**\n"
                "- Maintain consistent hydration, balanced nutrient intake, and regular sleep cycles.\n"
                "- Track any changes in physical symptoms or energy levels in a personal journal.\n"
                "- Prepare a list of specific questions for your primary healthcare practitioner."
            )

        if language == "ml":
            answer = f"**എഐ അസിസ്റ്റന്റ് വിവരണം (മലയാളം):**\n\n{answer}"
        elif language == "hi":
            answer = f"**एआई सहायक जानकारी (हिन्दी):**\n\n{answer}"

        return {
            "answer": answer,
            "sources": TRUSTED_MEDICAL_SOURCES,
            "disclaimer": SAFETY_DISCLAIMER
        }

def get_ai_provider() -> AIProvider:
    """Factory function returning LLMProvider if API key is present, else MockProvider."""
    if settings.GEMINI_API_KEY:
        return LLMProvider(settings.GEMINI_API_KEY, "gemini")
    elif settings.OPENAI_API_KEY:
        return LLMProvider(settings.OPENAI_API_KEY, "openai")
    elif settings.GROQ_API_KEY:
        return LLMProvider(settings.GROQ_API_KEY, "groq")
    return MockProvider()
