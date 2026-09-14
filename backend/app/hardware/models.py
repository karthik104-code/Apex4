from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NormalizedHardwareState(BaseModel):
    """Normalized APEX 4 / MSV1 hardware state payload."""
    connected: bool = False
    pedalsConnected: bool = False
    arduinoConnected: bool = False
    leftForce: int = 0
    rightForce: int = 0
    rudder: int = 128
    force: float = 0.0
    reactionTime: float = 0.0
    accuracy: float = 0.0
    strikeConsistency: float = 0.0
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    source: str = "simulated"  # "hardware" | "simulated"
    port: Optional[str] = None


class HardwareStatusModel(BaseModel):
    """Connection status for physical actuators and HID pedals."""
    connected: bool = False
    pedalsConnected: bool = False
    arduinoConnected: bool = False
    port: Optional[str] = None
    mode: str = "demo"  # "real" | "demo"


class ArduinoPacket(BaseModel):
    """Control packet written to Arduino over serial connection."""
    header: int = 255
    leftForce: int = Field(default=0, ge=0, le=254)
    rightForce: int = Field(default=0, ge=0, le=254)

    def to_bytes(self) -> bytes:
        return bytes([self.header, self.leftForce, self.rightForce])
