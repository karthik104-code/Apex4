import asyncio
import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.schemas import (
    HardwareStatusResponse,
    HardwareTelemetryPayload,
    HardwareConnectRequest,
    HardwareCalibrateRequest,
)
from app.hardware import hardware_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Ensure background bridge worker is active
hardware_service.start()


@router.get("/status", response_model=HardwareStatusResponse)
def get_hardware_status():
    """Return physical APEX 4 / MSV1 hardware connection status."""
    status = hardware_service.get_status()
    return HardwareStatusResponse(
        connected=status.connected,
        pedalsConnected=status.pedalsConnected,
        arduinoConnected=status.arduinoConnected,
        port=status.port,
        mode=status.mode,
    )


@router.get("/telemetry", response_model=HardwareTelemetryPayload)
def get_hardware_telemetry():
    """Return latest structured hardware telemetry snapshot."""
    state = hardware_service.get_normalized_state()
    return HardwareTelemetryPayload(
        connected=state.connected,
        pedalsConnected=state.pedalsConnected,
        arduinoConnected=state.arduinoConnected,
        leftForce=state.leftForce,
        rightForce=state.rightForce,
        rudder=state.rudder,
        force=state.force,
        reactionTime=state.reactionTime,
        accuracy=state.accuracy,
        strikeConsistency=state.strikeConsistency,
        timestamp=state.timestamp,
        source=state.source,
    )


@router.get("/ports", response_model=List[str])
def list_available_ports():
    """List available Serial COM ports for hardware connection."""
    return hardware_service.arduino_adapter.list_ports()


@router.post("/connect", response_model=HardwareStatusResponse)
def connect_hardware(req: HardwareConnectRequest):
    """Attempt connection to specified Serial COM port and HID pedals."""
    status = hardware_service.connect_hardware(port=req.port, baud_rate=req.baudRate)
    return HardwareStatusResponse(
        connected=status.connected,
        pedalsConnected=status.pedalsConnected,
        arduinoConnected=status.arduinoConnected,
        port=status.port,
        mode=status.mode,
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
    )


@router.post("/calibrate")
def calibrate_hardware(req: HardwareCalibrateRequest):
    """Calibrate neutral posture baseline for pedals."""
    hardware_service.calibrate(zero_left=req.zeroLeft or 0, zero_right=req.zeroRight or 0)
    return {"status": "calibrated", "leftOffset": req.zeroLeft, "rightOffset": req.zeroRight}


@router.websocket("/ws")
async def hardware_telemetry_websocket(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for continuous hardware telemetry streaming.
    Broadcasts normalized telemetry packets at ~20 Hz / on update.
    """
    await websocket.accept()
    logger.info("Client connected to APEX 4 Hardware WebSocket stream.")

    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def on_telemetry_update(payload: dict):
        loop.call_soon_threadsafe(queue.put_nowait, payload)

    hardware_service.subscribe(on_telemetry_update)

    # Send initial snapshot immediately
    initial_state = hardware_service.get_normalized_state()
    payload = initial_state.model_dump() if hasattr(initial_state, 'model_dump') else initial_state.dict()
    await websocket.send_json(payload)

    try:
        while True:
            telemetry_data = await queue.get()
            await websocket.send_json(telemetry_data)
    except WebSocketDisconnect:
        logger.info("Client disconnected from APEX 4 Hardware WebSocket stream.")
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
    finally:
        hardware_service.unsubscribe(on_telemetry_update)
