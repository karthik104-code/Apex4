import time
import threading
import logging
import queue
from datetime import datetime
from typing import Optional, Dict, Any, List, Callable

from app.hardware.models import (
    NormalizedHardwareState,
    HardwareStatusModel,
    HardwareDiagnosticsModel,
    HardwareCalibrationModel,
)
from app.hardware.adapters.pedal_adapter import HIDPedalAdapter
from app.hardware.adapters.arduino_adapter import ArduinoSerialAdapter

logger = logging.getLogger(__name__)


def map_value(value: float, in_min: float, in_max: float, out_min: float, out_max: float) -> float:
    """Standard HUD linear mapping with clamp boundaries."""
    if (in_max - in_min) == 0:
        return out_min
    mapped = (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
    return max(out_min, min(out_max, mapped))


class HardwareBridgeService:
    """
    Unified Hardware Bridge Service for Mantis Shrimp V1 / V23 & APEX 4.
    
    Reproduces the exact multi-threaded architecture of the reference HUD:
    - Dedicated High-Speed Non-blocking HID Pedal Reader (~500Hz)
    - Dedicated Asynchronous Serial Writer Thread (Queue-based)
    - Continuous Hardware Watchdog (Auto-detecting & Auto-reconnecting)
    - Strict Separation of Raw HID Reports and Calibrated Mapped Values
    """

    VENDOR_ID = 0x68E
    PRODUCT_ID = 0xF2

    def __init__(self):
        self._lock = threading.Lock()
        self._running = False

        # Adapters
        self.pedal_adapter = HIDPedalAdapter()
        self.arduino_adapter = ArduinoSerialAdapter()

        # Calibration Parameters (matching HUD)
        self.cal_left_min: int = 0
        self.cal_left_max: int = 255
        self.cal_right_min: int = 0
        self.cal_right_max: int = 255

        # Selected COM Port configuration
        self.selected_com_port: str = "COM5"

        # Queues & Threads
        self.serial_queue = queue.Queue(maxsize=10)
        self._threads: List[threading.Thread] = []

        # Real-time Telemetry Subscribers
        self._subscribers: List[Callable[[Dict[str, Any]], None]] = []

    def start(self):
        """Start all background hardware workers and watchdog."""
        with self._lock:
            if not self._running:
                self._running = True
                
                # 1. Start Watchdog Thread
                t_watchdog = threading.Thread(target=self._hardware_watchdog, daemon=True, name="HardwareWatchdog")
                t_watchdog.start()
                self._threads.append(t_watchdog)

                # 2. Start Pedal Reader Thread
                t_pedal = threading.Thread(target=self._read_pedal_thread, daemon=True, name="PedalReader")
                t_pedal.start()
                self._threads.append(t_pedal)

                # 3. Start Arduino Serial Writer Thread
                t_writer = threading.Thread(target=self._arduino_writer_thread, daemon=True, name="ArduinoWriter")
                t_writer.start()
                self._threads.append(t_writer)

                # 4. Start Telemetry Broadcast Loop
                t_broadcast = threading.Thread(target=self._broadcast_loop, daemon=True, name="TelemetryBroadcaster")
                t_broadcast.start()
                self._threads.append(t_broadcast)

                logger.info("APEX 4 Hardware Service workers & Watchdog started.")

    def stop(self):
        """Stop background threads and disconnect physical hardware."""
        self._running = False
        self.disconnect_hardware()

    # --- WATCHDOG THREAD ---
    def _hardware_watchdog(self):
        """Continuously monitors and auto-reconnects HID pedals and Arduino serial."""
        while self._running:
            # 1. Check HID Pedals
            if not self.pedal_adapter.is_connected:
                self.pedal_adapter.connect()

            # 2. Check Arduino Serial
            if not self.arduino_adapter.is_connected:
                self.arduino_adapter.connect(port=self.selected_com_port, baud_rate=9600)

            time.sleep(1.0)

    # --- HIGH-SPEED PEDAL READER THREAD ---
    def _read_pedal_thread(self):
        """High-frequency non-blocking read loop (~500Hz) matching reference HUD."""
        while self._running:
            if self.pedal_adapter.is_connected:
                self.pedal_adapter.read_raw_report()
                time.sleep(0.002)
            else:
                time.sleep(0.5)

    # --- ASYNC ARDUINO WRITER THREAD ---
    def _arduino_writer_thread(self):
        """Dequeues and writes control packets to Arduino without blocking telemetry."""
        while self._running:
            try:
                packet_data = self.serial_queue.get(timeout=0.05)
                if self.arduino_adapter.is_connected:
                    left_val, right_val = packet_data
                    self.arduino_adapter.send_control_packet(left_val, right_val)
                self.serial_queue.task_done()
            except queue.Empty:
                pass
            except Exception as e:
                logger.error(f"Arduino write worker error: {e}")

    # --- TELEMETRY BROADCAST LOOP (20-50Hz) ---
    def _broadcast_loop(self):
        """Maintains state calculation and pushes telemetry to WebSocket subscribers."""
        tick = 0
        while self._running:
            tick += 1
            time.sleep(0.02)  # 50 Hz internal state evaluation

            state = self.get_normalized_state()

            # Enqueue packet for Arduino writer if connected
            if self.arduino_adapter.is_connected:
                try:
                    if self.serial_queue.empty():
                        self.serial_queue.put_nowait((state.leftForce, state.rightForce))
                except queue.Full:
                    pass

            # Notify subscribers at ~20Hz
            if tick % 2 == 0 and self._subscribers:
                payload = state.model_dump() if hasattr(state, 'model_dump') else state.dict()
                for cb in list(self._subscribers):
                    try:
                        cb(payload)
                    except Exception as e:
                        logger.error(f"Subscriber notification error: {e}")

    # --- CALIBRATION & STATE ACCESSORS ---
    def set_calibration(self, left_min: int = 0, left_max: int = 255, right_min: int = 0, right_max: int = 255):
        """Update calibration thresholds matching HUD SET MIN / SET MAX protocol."""
        with self._lock:
            self.cal_left_min = max(0, min(255, left_min))
            self.cal_left_max = max(1, min(255, left_max))
            self.cal_right_min = max(0, min(255, right_min))
            self.cal_right_max = max(1, min(255, right_max))
            logger.info(f"Calibration updated: Left=[{self.cal_left_min}-{self.cal_left_max}], Right=[{self.cal_right_min}-{self.cal_right_max}]")

    def get_calibration(self) -> HardwareCalibrationModel:
        return HardwareCalibrationModel(
            calLeftMin=self.cal_left_min,
            calLeftMax=self.cal_left_max,
            calRightMin=self.cal_right_min,
            calRightMax=self.cal_right_max,
        )

    def set_com_port(self, port: str):
        """Set active Arduino COM port."""
        with self._lock:
            self.selected_com_port = port
            if self.arduino_adapter.is_connected and self.arduino_adapter.active_port != port:
                self.arduino_adapter.disconnect()
                self.arduino_adapter.connect(port=port)

    def connect_hardware(self, port: Optional[str] = None, baud_rate: int = 9600) -> HardwareStatusModel:
        """Explicit connection attempt."""
        if port:
            self.selected_com_port = port
        pedals_ok = self.pedal_adapter.connect()
        arduino_ok = self.arduino_adapter.connect(port=self.selected_com_port, baud_rate=baud_rate)
        return self.get_status()

    def disconnect_hardware(self) -> HardwareStatusModel:
        """Explicit disconnect."""
        self.pedal_adapter.disconnect()
        self.arduino_adapter.disconnect()
        return self.get_status()

    def get_status(self) -> HardwareStatusModel:
        """Return structured status model."""
        pedals_ok = self.pedal_adapter.is_connected
        arduino_ok = self.arduino_adapter.is_connected
        mode = "real" if (pedals_ok or arduino_ok) else "demo"
        return HardwareStatusModel(
            connected=pedals_ok or arduino_ok,
            pedalsConnected=pedals_ok,
            arduinoConnected=arduino_ok,
            port=self.arduino_adapter.active_port or self.selected_com_port,
            mode=mode,
            hidStatus="CONNECTED" if pedals_ok else "DISCONNECTED",
            arduinoStatus="CONNECTED" if arduino_ok else "DISCONNECTED",
        )

    def get_diagnostics(self) -> HardwareDiagnosticsModel:
        """Return real-time hardware diagnostics."""
        raw_l, raw_r, raw_rud = self.pedal_adapter.read_raw_report()
        available_ports = self.arduino_adapter.list_ports()
        return HardwareDiagnosticsModel(
            vendorId="0x68E",
            productId="0xF2",
            hidConnected=self.pedal_adapter.is_connected,
            hidDevicesCount=1 if self.pedal_adapter.is_connected else 0,
            arduinoConnected=self.arduino_adapter.is_connected,
            selectedPort=self.arduino_adapter.active_port or self.selected_com_port,
            availablePorts=available_ports,
            rawLeftForce=raw_l,
            rawRightForce=raw_r,
            rawRudder=raw_rud,
            packetsSent=self.arduino_adapter.packets_sent,
            lastPacketTimestamp=datetime.utcfromtimestamp(self.arduino_adapter.last_packet_time).isoformat() + "Z" if self.arduino_adapter.last_packet_time else None,
        )

    def get_normalized_state(self) -> NormalizedHardwareState:
        """
        Calculates and returns normalized hardware state with strict separation
        between raw 0-255 HID reports and calibrated mapped metrics.
        """
        now_iso = datetime.utcnow().isoformat() + "Z"
        raw_l, raw_r, raw_rud = self.pedal_adapter.read_raw_report()

        # Map values according to calibration thresholds (matching HUD logic)
        m_left = int(map_value(raw_l, self.cal_left_min, self.cal_left_max, 0, 255))
        m_right = int(map_value(raw_r, self.cal_right_min, self.cal_right_max, 0, 255))
        m_rudder = int(map_value(raw_rud, 0, 255, 0, 255))

        pedals_ok = self.pedal_adapter.is_connected
        arduino_ok = self.arduino_adapter.is_connected
        is_hardware = pedals_ok or arduino_ok

        force_pct = round((m_left / 255.0) * 100.0, 1) if is_hardware else max(30.0, min(95.0, 68.0))
        reaction_time = 1.18
        accuracy = 89.0
        consistency = 86.0

        return NormalizedHardwareState(
            connected=is_hardware,
            pedalsConnected=pedals_ok,
            arduinoConnected=arduino_ok,
            rawLeftForce=raw_l,
            rawRightForce=raw_r,
            rawRudder=raw_rud,
            leftForce=m_left,
            rightForce=m_right,
            rudder=m_rudder,
            force=force_pct,
            reactionTime=round(reaction_time, 2),
            accuracy=round(accuracy, 1),
            strikeConsistency=round(consistency, 1),
            timestamp=now_iso,
            source="hardware" if is_hardware else "simulated",
            port=self.arduino_adapter.active_port or self.selected_com_port,
            vendorId="0x68E",
            productId="0xF2",
        )

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[Dict[str, Any]], None]):
        if callback in self._subscribers:
            self._subscribers.remove(callback)


# Global Singleton Hardware Service
hardware_service = HardwareBridgeService()
