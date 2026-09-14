from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class NormalizedHardwareState(BaseModel):
    """
    Normalized APEX 4 / Mantis Shrimp V1 hardware telemetry payload.
    Contains both raw 0-255 HID input reports and calibrated/mapped display metrics.
    """
    connected: bool = False
    pedalsConnected: bool = False
    arduinoConnected: bool = False
    
    # Raw HID reports (0-255) directly from Mantis Shrimp HID
    rawLeftForce: int = 0
    rawRightForce: int = 0
    rawRudder: int = 128
    
    # Calibrated / Mapped values (0-255) matching HUD logic
    leftForce: int = 0
    rightForce: int = 0
    rudder: int = 128
    
    # Derived performance metrics
    force: float = 0.0
    reactionTime: float = 0.0
    accuracy: float = 0.0
    strikeConsistency: float = 0.0
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    source: str = "simulated"  # "hardware" | "simulated"
    port: Optional[str] = None
    vendorId: str = "0x68E"
    productId: str = "0xF2"


class HardwareStatusModel(BaseModel):
    """Connection status for physical actuators and HID pedals."""
    connected: bool = False
    pedalsConnected: bool = False
    arduinoConnected: bool = False
    port: Optional[str] = None
    mode: str = "demo"  # "real" | "demo"
    hidStatus: str = "DISCONNECTED"      # CONNECTED | DISCONNECTED | RECONNECTING
    arduinoStatus: str = "DISCONNECTED"  # CONNECTED | DISCONNECTED | RECONNECTING


class HardwareCalibrationModel(BaseModel):
    """Mantis Shrimp Calibration parameters matching HUD."""
    calLeftMin: int = 0
    calLeftMax: int = 255
    calRightMin: int = 0
    calRightMax: int = 255


class HardwareDiagnosticsModel(BaseModel):
    """Diagnostic readout for hardware inspection."""
    vendorId: str = "0x68E"
    productId: str = "0xF2"
    hidConnected: bool = False
    hidDevicesCount: int = 0
    arduinoConnected: bool = False
    selectedPort: Optional[str] = None
    availablePorts: List[str] = []
    rawLeftForce: int = 0
    rawRightForce: int = 0
    rawRudder: int = 0
    packetsSent: int = 0
    lastPacketTimestamp: Optional[str] = None


class ArduinoPacket(BaseModel):
    """Control packet written to Arduino over serial connection."""
    header: int = 255
    leftForce: int = Field(default=0, ge=0, le=255)
    rightForce: int = Field(default=0, ge=0, le=255)

    def to_bytes(self) -> bytes:
        return bytes([self.header, max(0, min(255, self.leftForce)), max(0, min(255, self.rightForce))])
