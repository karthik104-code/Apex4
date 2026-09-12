from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class SpeechToTextProvider(ABC):
    @abstractmethod
    def transcribe_audio(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        pass

class TextToSpeechProvider(ABC):
    @abstractmethod
    def synthesize_speech(self, text: str, language: str = "en") -> Dict[str, Any]:
        pass

class MockSpeechToTextProvider(SpeechToTextProvider):
    """Development fallback STT provider."""
    def transcribe_audio(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        if language == "ml":
            transcription = "എന്റെ ഹീമോഗ്ലോബിൻ വർദ്ധിപ്പിക്കാൻ ഞാൻ എന്താണ് കഴിക്കേണ്ടത്?"
        elif language == "hi":
            transcription = "हीमोग्लोबिन बढ़ाने के लिए मुझे क्या खाना चाहिए?"
        else:
            transcription = "What foods should I eat to increase my hemoglobin levels?"

        return {
            "text": transcription,
            "language": language,
            "provider": "mock_stt"
        }

class MockTextToSpeechProvider(TextToSpeechProvider):
    """Development fallback TTS provider returning audio metadata."""
    def synthesize_speech(self, text: str, language: str = "en") -> Dict[str, Any]:
        return {
            "audio_url": None,  # Client utilizes Web Speech API SpeechSynthesis
            "text": text,
            "language": language,
            "provider": "browser_speech_synthesis"
        }

def get_stt_provider() -> SpeechToTextProvider:
    return MockSpeechToTextProvider()

def get_tts_provider() -> TextToSpeechProvider:
    return MockTextToSpeechProvider()
