from abc import ABC, abstractmethod
import math
from typing import List
from app.core.config import settings

class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        pass

class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic, zero-dependency embedding provider producing 384-dim normalized vectors."""
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def _hash_vector(self, text: str) -> List[float]:
        # Generate deterministic pseudo-random embedding based on text character codes
        vec = []
        seed = sum(ord(c) for c in text) + 1
        for i in range(self.dimension):
            val = math.sin(seed * (i + 1))
            vec.append(val)
        
        # Normalize vector to unit length
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]

    def embed_text(self, text: str) -> List[float]:
        return self._hash_vector(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]

def get_embedding_provider() -> EmbeddingProvider:
    """Factory function for embedding provider abstraction."""
    return MockEmbeddingProvider()
