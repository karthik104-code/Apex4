import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings

# Mandatory safety disclaimer
SAFETY_DISCLAIMER = (
    "\n\n**Medical Disclaimer**: AI Healthcare Companion is an informative research tool "
    "and NOT a licensed physician. It does not provide definitive medical diagnoses or treatment plans. "
    "Always consult a qualified healthcare professional for medical concerns."
)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def enforce_safety_guardrails(response_text: str) -> str:
    """Ensure all AI responses have appropriate safety phrasing and mandatory disclaimer."""
    cleaned = response_text.strip()
    
    # Check if safety disclaimer is present, add if missing
    if "Medical Disclaimer" not in cleaned:
        cleaned += SAFETY_DISCLAIMER
        
    return cleaned
