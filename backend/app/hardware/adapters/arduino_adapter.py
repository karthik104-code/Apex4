import logging
import time
import queue
from typing import List, Optional

logger = logging.getLogger(__name__)

try:
    import serial
    import serial.tools.list_ports
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False
    logger.warning("pyserial library is not installed. Arduino serial adapter operating in simulation mode.")


class ArduinoSerialAdapter:
    """
    Reference Driver for Locked Mantis Shrimp V23 Arduino Actuator Circuit.
    
    Exact Contract matching locked firmware:
    - Baud Rate: 9600
    - Synchronization Header Byte: 255
    - Packet Structure: [255, leftForce, rightForce]
    - leftForce (0 - 255) -> Controls PWM pins: 3, 5, 9, 10, 11 (LEDs)
    - rightForce (0 - 255) -> Trigger input (> 100 activates Solenoid pin 6 for 200ms)
    """

    DEFAULT_BAUD = 9600
    HEADER_BYTE = 255
    DEFAULT_PORT = "COM5"

    def __init__(self):
        self.serial_conn: Optional[serial.Serial] = None
        self.is_connected = False
        self.active_port: Optional[str] = None
        self.packets_sent: int = 0
        self.last_packet_time: float = 0.0

    def list_ports(self) -> List[str]:
        """Discover available Serial COM ports on Windows."""
        if not HAS_PYSERIAL:
            return ["COM5 (Simulated)"]
        try:
            ports = serial.tools.list_ports.comports()
            return [p.device for p in ports] if ports else []
        except Exception as e:
            logger.error(f"Error enumerating COM ports: {e}")
            return []

    def connect(self, port: Optional[str] = None, baud_rate: int = DEFAULT_BAUD) -> bool:
        """Attempt connection to target Arduino serial port."""
        if not HAS_PYSERIAL:
            self.is_connected = False
            self.active_port = None
            return False

        # If already connected to target port, return True
        if self.is_connected and self.serial_conn and self.serial_conn.is_open:
            if not port or port == self.active_port:
                return True

        target_port = port or self.DEFAULT_PORT
        available = self.list_ports()
        
        # If target port not in available, check fallback
        if target_port not in available and available:
            # If COM5 not available, try first available physical COM port
            target_port = available[0]

        try:
            conn = serial.Serial(target_port, baudrate=baud_rate, timeout=0.1)
            time.sleep(1.0)  # Arduino auto-reset settling time
            conn.flushInput()
            conn.flushOutput()
            self.serial_conn = conn
            self.is_connected = True
            self.active_port = target_port
            logger.info(f"Successfully connected to Arduino on {target_port} at {baud_rate} baud.")
            return True
        except Exception as e:
            self.is_connected = False
            self.serial_conn = None
            self.active_port = None
            return False

    def disconnect(self):
        """Disconnect serial connection."""
        if self.serial_conn:
            try:
                self.serial_conn.close()
            except Exception:
                pass
            self.serial_conn = None
        self.is_connected = False
        self.active_port = None
        logger.info("Disconnected Arduino serial port.")

    def send_control_packet(self, left_force: int, right_force: int) -> bool:
        """
        Send packet to locked Arduino firmware:
        bytes([255, leftForce, rightForce])
        """
        if self.is_connected and self.serial_conn and self.serial_conn.is_open:
            try:
                packet = bytes([
                    self.HEADER_BYTE,
                    max(0, min(255, int(left_force))),
                    max(0, min(255, int(right_force)))
                ])
                self.serial_conn.write(packet)
                self.packets_sent += 1
                self.last_packet_time = time.time()
                return True
            except serial.SerialException as e:
                logger.warning(f"Serial write failed: {e}. Marking Arduino disconnected.")
                self.disconnect()
                return False
            except Exception as e:
                logger.error(f"Unexpected serial write error: {e}")
                return False
        return False
