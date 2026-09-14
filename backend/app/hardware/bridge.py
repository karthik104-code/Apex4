import time
import threading
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Callable

logger = logging.getLogger(__name__)

# Try importing pyserial and hid safely
try:
    import serial
    import serial.tools.list_ports
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False
    logger.info("pyserial not installed; serial communication will run in simulation mode.")

try:
    import hid
    HAS_HID = True
except ImportError:
    HAS_HID = False
    logger.info("hidapi not installed; HID pedal controller will run in simulation mode.")


class APEX4HardwareBridge:
    """
    Local Hardware Bridge Service for APEX 4 / MSV1 Rehabilitation Platform.
    
    Interfaces with:
    1. HID Pedal Controller (Vendor ID: 0x68e, Product ID: 0xf2)
    2. Arduino Actuator Controller via Serial (9600 baud, 255 header byte)
    
    Maintains safe background polling loop and broadcasts real-time telemetry updates.
    """

    PEDAL_VENDOR_ID = 0x68E
    PEDAL_PRODUCT_ID = 0xF2
    DEFAULT_BAUD = 9600
    HEADER_BYTE = 255

    def __init__(self):
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None

        # Hardware connection state
        self.arduino_connected = False
        self.pedals_connected = False
        self.active_port: Optional[str] = None
        self.mode: str = "demo"  # "real" | "demo"

        # Raw values from HID / serial
        self.left_force = 0
        self.right_force = 0
        self.rudder_val = 0

        # Derived telemetry metrics
        self.force_pct = 64.0
        self.reaction_time = 1.24
        self.accuracy = 87.0
        self.strike_consistency = 82.0

        # Calibration offset
        self.left_offset = 0
        self.right_offset = 0

        # Hardware handles
        self._serial_conn = None
        self._hid_device = None

        # Subscribers for WebSocket broadcasting
        self._subscribers: List[Callable[[Dict[str, Any]], None]] = []

    def start(self):
        """Start the background hardware reading loop."""
        with self._lock:
            if not self._running:
                self._running = True
                self._thread = threading.Thread(target=self._worker_loop, daemon=True)
                self._thread.start()
                logger.info("APEX 4 Hardware Bridge background thread started.")

    def stop(self):
        """Stop background worker and close handles."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=1.0)
        self.disconnect_hardware()

    def discover_ports(self) -> List[str]:
        """Discover available Serial COM ports."""
        if not HAS_PYSERIAL:
            return ["COM_SIMULATED_1", "COM_SIMULATED_2"]
        ports = serial.tools.list_ports.comports()
        return [p.device for p in ports]

    def connect_hardware(self, port: Optional[str] = None, baud_rate: int = DEFAULT_BAUD) -> Dict[str, Any]:
        """Attempt connection to Arduino serial port and HID pedal device."""
        with self._lock:
            # 1. Connect HID Pedals
            if HAS_HID:
                try:
                    dev = hid.device()
                    dev.open(self.PEDAL_VENDOR_ID, self.PEDAL_PRODUCT_ID)
                    dev.set_nonblocking(True)
                    self._hid_device = dev
                    self.pedals_connected = True
                    logger.info("Connected to HID Pedal device (0x68e:0xf2)")
                except Exception as e:
                    logger.warning(f"Could not connect to HID pedals: {e}")
                    self.pedals_connected = False
            else:
                self.pedals_connected = False

            # 2. Connect Arduino Serial Port
            target_port = port or (self.discover_ports()[0] if self.discover_ports() else None)
            if HAS_PYSERIAL and target_port and not target_port.startswith("COM_SIMULATED"):
                try:
                    conn = serial.Serial(target_port, baudrate=baud_rate, timeout=0.1)
                    self._serial_conn = conn
                    self.arduino_connected = True
                    self.active_port = target_port
                    logger.info(f"Connected to Arduino serial port {target_port} at {baud_rate} baud")
                except Exception as e:
                    logger.warning(f"Could not connect to Serial port {target_port}: {e}")
                    self.arduino_connected = False
                    self.active_port = None
            else:
                self.arduino_connected = False
                self.active_port = None

            self.mode = "real" if (self.pedals_connected or self.arduino_connected) else "demo"
            return self.get_status()

    def disconnect_hardware(self):
        """Safely close serial and HID handles."""
        with self._lock:
            if self._serial_conn:
                try:
                    self._serial_conn.close()
                except Exception:
                    pass
                self._serial_conn = None

            if self._hid_device:
                try:
                    self._hid_device.close()
                except Exception:
                    pass
                self._hid_device = None

            self.arduino_connected = False
            self.pedals_connected = False
            self.active_port = None
            self.mode = "demo"
            logger.info("Disconnected physical hardware handles.")

    def calibrate(self, zero_left: int = 0, zero_right: int = 0):
        """Set neutral baseline offsets."""
        with self._lock:
            self.left_offset = zero_left or self.left_force
            self.right_offset = zero_right or self.right_force
            logger.info(f"Calibrated posture pedals: Left={self.left_offset}, Right={self.right_offset}")

    def send_arduino_packet(self, left_force: int, right_force: int):
        """
        Send packet to Arduino according to existing contract:
        [HEADER_BYTE (255), leftForce, rightForce]
        """
        if self._serial_conn and self.arduino_connected:
            try:
                packet = bytes([
                    self.HEADER_BYTE,
                    max(0, min(254, left_force)),
                    max(0, min(254, right_force))
                ])
                self._serial_conn.write(packet)
            except Exception as e:
                logger.error(f"Error writing packet to Arduino: {e}")
                self.arduino_connected = False

    def get_status(self) -> Dict[str, Any]:
        """Return current hardware connection status."""
        return {
            "connected": self.pedals_connected or self.arduino_connected,
            "pedalsConnected": self.pedals_connected,
            "arduinoConnected": self.arduino_connected,
            "port": self.active_port,
            "mode": self.mode,
        }

    def get_telemetry(self) -> Dict[str, Any]:
        """Return structured telemetry snapshot."""
        now_iso = datetime.utcnow().isoformat() + "Z"
        source = "hardware" if (self.pedals_connected or self.arduino_connected) else "simulated"

        with self._lock:
            return {
                "connected": self.pedals_connected or self.arduino_connected,
                "pedalsConnected": self.pedals_connected,
                "arduinoConnected": self.arduino_connected,
                "leftForce": self.left_force,
                "rightForce": self.right_force,
                "rudder": self.rudder_val,
                "force": round(self.force_pct, 1),
                "reactionTime": round(self.reaction_time, 2),
                "accuracy": round(self.accuracy, 1),
                "strikeConsistency": round(self.strike_consistency, 1),
                "timestamp": now_iso,
                "source": source,
            }

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        """Subscribe to real-time telemetry updates."""
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[Dict[str, Any]], None]):
        """Unsubscribe from real-time updates."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    def _worker_loop(self):
        """Continuous background thread reading HID/Serial and calculating telemetry."""
        tick = 0
        while self._running:
            tick += 1
            time.sleep(0.05)  # 20 Hz update frequency

            # Read physical HID device if connected
            if self.pedals_connected and self._hid_device:
                try:
                    data = self._hid_device.read(64)
                    if data:
                        # Extract pedal report according to CAMS contract
                        raw_left = data[0] if len(data) > 0 else 0
                        raw_right = data[1] if len(data) > 1 else 0
                        raw_rudder = data[2] if len(data) > 2 else 128

                        with self._lock:
                            self.left_force = max(0, raw_left - self.left_offset)
                            self.right_force = max(0, raw_right - self.right_offset)
                            self.rudder_val = raw_rudder
                            self.force_pct = min(100.0, (self.left_force / 255.0) * 100.0)

                        # Send control packet to Arduino
                        self.send_arduino_packet(self.left_force, self.right_force)
                except Exception as e:
                    logger.warning(f"Error reading HID pedal data: {e}")

            # If running in Demo Mode, generate realistic dynamic telemetry
            if not self.pedals_connected and not self.arduino_connected:
                noise = (time.time() * 1000 % 7 - 3.5)
                with self._lock:
                    self.left_force = int(128 + noise * 4)
                    self.right_force = int(74 + noise * 3)
                    self.rudder_val = int(120 + noise * 2)
                    self.force_pct = max(30.0, min(95.0, 68.0 + noise))
                    self.reaction_time = max(0.8, min(2.5, 1.18 + (noise * 0.02)))
                    self.accuracy = max(50.0, min(100.0, 89.0 + noise * 0.5))
                    self.strike_consistency = max(50.0, min(100.0, 86.0 + noise * 0.4))

            # Broadcast to WebSocket subscribers every 10 ticks (~250ms)
            if tick % 5 == 0 and self._subscribers:
                telemetry = self.get_telemetry()
                for cb in list(self._subscribers):
                    try:
                        cb(telemetry)
                    except Exception as e:
                        logger.error(f"Error notifying telemetry subscriber: {e}")


# Global Singleton Instance
hardware_bridge = APEX4HardwareBridge()
