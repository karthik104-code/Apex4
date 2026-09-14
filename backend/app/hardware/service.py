import time
import threading
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Callable

from app.hardware.models import NormalizedHardwareState, HardwareStatusModel
from app.hardware.adapters.pedal_adapter import HIDPedalAdapter
from app.hardware.adapters.arduino_adapter import ArduinoSerialAdapter

logger = logging.getLogger(__name__)


class HardwareBridgeService:
    """
    Core Hardware Service Abstraction for APEX 4 / MSV1.

    Aggregates:
    - HIDPedalAdapter (Pedal controls)
    - ArduinoSerialAdapter (Actuator serial output)

    Maintains normalized state and broadcasts real-time telemetry updates.
    Pedals alone are sufficient for 'connected' status; Arduino is optional.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None

        # Adapters
        self.pedal_adapter = HIDPedalAdapter()
        self.arduino_adapter = ArduinoSerialAdapter()

        # Calibration Offsets
        self.left_offset = 0
        self.right_offset = 0

        # Subscribers
        self._subscribers: List[Callable[[Dict[str, Any]], None]] = []

    def start(self):
        """Start the background polling loop and auto-connect HID pedals."""
        with self._lock:
            if not self._running:
                self._running = True
                self._thread = threading.Thread(target=self._polling_loop, daemon=True)
                self._thread.start()
                logger.info("Hardware Bridge Service background loop started.")

        # Auto-connect pedals on startup (outside lock to avoid deadlock)
        if not self.pedal_adapter.is_connected:
            connected = self.pedal_adapter.connect()
            if connected:
                logger.info("HID Pedal auto-connected on startup.")
            else:
                logger.info("No HID Pedal found on startup; will retry in background loop.")

    def stop(self):
        """Stop background polling loop and release hardware handles."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=1.0)
        self.disconnect_hardware()

    def connect_hardware(self, port: Optional[str] = None, baud_rate: int = 9600) -> HardwareStatusModel:
        """Attempt connection to physical HID pedals and Arduino serial port."""
        pedals_ok = self.pedal_adapter.connect()
        arduino_ok = self.arduino_adapter.connect(port=port, baud_rate=baud_rate)
        mode = "real" if (pedals_ok or arduino_ok) else "demo"
        return HardwareStatusModel(
            connected=pedals_ok,
            pedalsConnected=pedals_ok,
            arduinoConnected=arduino_ok,
            port=self.arduino_adapter.active_port,
            mode=mode,
        )

    def disconnect_hardware(self) -> HardwareStatusModel:
        """Safely release physical handles and switch to demo mode."""
        with self._lock:
            self.pedal_adapter.disconnect()
            self.arduino_adapter.disconnect()
            return HardwareStatusModel(
                connected=False,
                pedalsConnected=False,
                arduinoConnected=False,
                port=None,
                mode="demo",
            )

    def calibrate(self, zero_left: int = 0, zero_right: int = 0):
        """Set neutral baseline pedal offsets."""
        left_raw, right_raw, _ = self.pedal_adapter.read_pedals()
        self.left_offset = zero_left or left_raw
        self.right_offset = zero_right or right_raw
        logger.info(f"Calibrated baseline pedal offsets: Left={self.left_offset}, Right={self.right_offset}")

    def get_status(self) -> HardwareStatusModel:
        """Return connection status model. Pedals alone = connected."""
        pedals_ok = self.pedal_adapter.is_connected
        arduino_ok = self.arduino_adapter.is_connected
        mode = "real" if (pedals_ok or arduino_ok) else "demo"
        return HardwareStatusModel(
            connected=pedals_ok,
            pedalsConnected=pedals_ok,
            arduinoConnected=arduino_ok,
            port=self.arduino_adapter.active_port,
            mode=mode,
        )

    def get_normalized_state(self) -> NormalizedHardwareState:
        """Return current normalized hardware state payload."""
        now_iso = datetime.utcnow().isoformat() + "Z"
        left_raw, right_raw, rudder_raw = self.pedal_adapter.read_pedals()

        pedals_ok = self.pedal_adapter.is_connected
        arduino_ok = self.arduino_adapter.is_connected

        left_force = max(0, left_raw - self.left_offset)
        right_force = max(0, right_raw - self.right_offset)

        # Force readings come from pedals; Arduino is optional (haptic output only)
        if pedals_ok:
            force_pct = min(100.0, (left_force / 255.0) * 100.0)
        else:
            force_pct = 68.0  # demo midpoint

        return NormalizedHardwareState(
            connected=pedals_ok,
            pedalsConnected=pedals_ok,
            arduinoConnected=arduino_ok,
            leftForce=left_force,
            rightForce=right_force,
            rudder=rudder_raw,
            force=round(force_pct, 1),
            reactionTime=1.18,
            accuracy=89.0,
            strikeConsistency=86.0,
            timestamp=now_iso,
            source="hardware" if pedals_ok else "simulated",
            port=self.arduino_adapter.active_port,
        )

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        """Subscribe listener to real-time telemetry updates."""
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[Dict[str, Any]], None]):
        """Unsubscribe listener."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    def _polling_loop(self):
        """Continuous background thread managing adapter reads and serial broadcasts."""
        tick = 0
        while self._running:
            tick += 1
            time.sleep(0.05)  # 20 Hz loop

            # Watchdog: auto-reconnect pedals if disconnected (every 1 second)
            if tick % 20 == 0:
                if not self.pedal_adapter.is_connected:
                    self.pedal_adapter.connect()
                if not self.arduino_adapter.is_connected:
                    self.arduino_adapter.connect()

            state = self.get_normalized_state()

            # If Arduino is connected, write serial packet
            if self.arduino_adapter.is_connected:
                self.arduino_adapter.send_control_packet(state.leftForce, state.rightForce)

            # Broadcast frame to subscribers every 5 ticks (~250ms)
            if tick % 5 == 0 and self._subscribers:
                dict_payload = state.model_dump() if hasattr(state, 'model_dump') else state.dict()
                for cb in list(self._subscribers):
                    try:
                        cb(dict_payload)
                    except Exception as e:
                        logger.error(f"Error notifying subscriber: {e}")


# Global Singleton Hardware Service
hardware_service = HardwareBridgeService()
