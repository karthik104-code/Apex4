import asyncio
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.schemas import (
    HardwareStatusResponse,
    HardwareTelemetryPayload,
    HardwareConnectRequest,
    HardwareCalibrateRequest,
)
from app.hardware.models import (
    HardwareDiagnosticsModel,
    HardwareCalibrationModel,
)
from app.hardware import hardware_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Ensure background bridge worker and watchdog are active
hardware_service.start()


@router.get("/status", response_model=HardwareStatusResponse)
def get_hardware_status():
    """Return physical Mantis Shrimp HID and Arduino connection status."""
    status = hardware_service.get_status()
    return HardwareStatusResponse(
        connected=status.connected,
        pedalsConnected=status.pedalsConnected,
        arduinoConnected=status.arduinoConnected,
        port=status.port,
        mode=status.mode,
        hidStatus=status.hidStatus,
        arduinoStatus=status.arduinoStatus,
        vendorId="0x68E",
        productId="0xF2",
    )


@router.get("/telemetry", response_model=HardwareTelemetryPayload)
def get_hardware_telemetry():
    """Return latest structured hardware telemetry snapshot."""
    state = hardware_service.get_normalized_state()
    return HardwareTelemetryPayload(
        connected=state.connected,
        pedalsConnected=state.pedalsConnected,
        arduinoConnected=state.arduinoConnected,
        rawLeftForce=state.rawLeftForce,
        rawRightForce=state.rawRightForce,
        rawRudder=state.rawRudder,
        leftForce=state.leftForce,
        rightForce=state.rightForce,
        rudder=state.rudder,
        force=state.force,
        reactionTime=state.reactionTime,
        accuracy=state.accuracy,
        strikeConsistency=state.strikeConsistency,
        timestamp=state.timestamp,
        source=state.source,
        port=state.port,
        vendorId="0x68E",
        productId="0xF2",
    )


@router.get("/ports", response_model=List[str])
def list_available_ports():
    """List available Serial COM ports for Arduino connection."""
    return hardware_service.arduino_adapter.list_ports()


@router.post("/connect", response_model=HardwareStatusResponse)
def connect_hardware(req: HardwareConnectRequest):
    """Attempt connection to specified Serial COM port and Mantis Shrimp HID."""
    status = hardware_service.connect_hardware(port=req.port, baud_rate=req.baudRate)
    return HardwareStatusResponse(
        connected=status.connected,
        pedalsConnected=status.pedalsConnected,
        arduinoConnected=status.arduinoConnected,
        port=status.port,
        mode=status.mode,
        hidStatus=status.hidStatus,
        arduinoStatus=status.arduinoStatus,
        vendorId="0x68E",
        productId="0xF2",
    )


@router.post("/disconnect", response_model=HardwareStatusResponse)
def disconnect_hardware():
    """Disconnect physical hardware handles and reset to Demo Mode."""
    status = hardware_service.disconnect_hardware()
    return HardwareStatusResponse(
        connected=status.connected,
        pedalsConnected=status.pedalsConnected,
        arduinoConnected=status.arduinoConnected,
        port=status.port,
        mode=status.mode,
        hidStatus=status.hidStatus,
        arduinoStatus=status.arduinoStatus,
        vendorId="0x68E",
        productId="0xF2",
    )


@router.get("/calibration", response_model=HardwareCalibrationModel)
def get_calibration():
    """Get current calibration thresholds (Left Min/Max, Right Min/Max)."""
    return hardware_service.get_calibration()


@router.post("/calibrate", response_model=HardwareCalibrationModel)
def calibrate_hardware(req: HardwareCalibrateRequest):
    """Update calibration thresholds matching HUD protocol."""
    hardware_service.set_calibration(
        left_min=req.calLeftMin if req.calLeftMin is not None else 0,
        left_max=req.calLeftMax if req.calLeftMax is not None else 255,
        right_min=req.calRightMin if req.calRightMin is not None else 0,
        right_max=req.calRightMax if req.calRightMax is not None else 255,
    )
    return hardware_service.get_calibration()


@router.get("/diagnostics", response_model=HardwareDiagnosticsModel)
def get_diagnostics():
    """Get live hardware diagnostics, VID/PID, port status, and raw report bytes."""
    return hardware_service.get_diagnostics()


@router.websocket("/ws")
async def hardware_telemetry_websocket(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for continuous hardware telemetry streaming.
    Broadcasts normalized telemetry packets at ~20-50 Hz.
    """
    await websocket.accept()
    logger.info("Client connected to APEX 4 Hardware WebSocket stream.")

    queue_inst: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def on_telemetry_update(payload: dict):
        loop.call_soon_threadsafe(queue_inst.put_nowait, payload)

    hardware_service.subscribe(on_telemetry_update)

    # Send initial snapshot immediately
    initial_state = hardware_service.get_normalized_state()
    payload = initial_state.model_dump() if hasattr(initial_state, 'model_dump') else initial_state.dict()
    await websocket.send_json(payload)

    try:
        while True:
            telemetry_data = await queue_inst.get()
            await websocket.send_json(telemetry_data)
    except WebSocketDisconnect:
        logger.info("Client disconnected from APEX 4 Hardware WebSocket stream.")
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
    finally:
        hardware_service.unsubscribe(on_telemetry_update)
