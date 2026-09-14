import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

try:
    import serial
    import serial.tools.list_ports
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False
    logger.info("pyserial module not installed; Arduino serial adapter operating in simulation mode.")


class ArduinoSerialAdapter:
    """
    Adapter for APEX 4 Arduino Actuator Controller.
    
    Contract:
    - Baud Rate: 9600
    - Header Byte: 255
    - Packet Structure: [255, leftForce, rightForce]
    """

    DEFAULT_BAUD = 9600
    HEADER_BYTE = 255

    def __init__(self):
        self.serial_conn = None
        self.is_connected = False
        self.active_port: Optional[str] = None

    def list_ports(self) -> List[str]:
        """Discover available Serial COM ports."""
        if not HAS_PYSERIAL:
            return ["COM_SIMULATED_1", "COM_SIMULATED_2"]
        try:
            ports = serial.tools.list_ports.comports()
            # Prioritize USB devices (like Arduino) over Bluetooth COM ports
            usb_ports = [p.device for p in ports if p.vid is not None]
            other_ports = [p.device for p in ports if p.vid is None]
            return usb_ports + other_ports
        except Exception:
            return []

    def connect(self, port: Optional[str] = None, baud_rate: int = DEFAULT_BAUD) -> bool:
        """Attempt connection to Arduino serial port."""
        if not HAS_PYSERIAL:
            self.is_connected = False
            self.active_port = None
            return False

        ports_to_try = [port] if port else self.list_ports()

        for target_port in ports_to_try:
            if not target_port or target_port.startswith("COM_SIMULATED"):
                continue

            try:
                conn = serial.Serial(target_port, baudrate=baud_rate, timeout=0.1)
                self.serial_conn = conn
                self.is_connected = True
                self.active_port = target_port
                logger.info(f"Successfully connected to Arduino on {target_port} at {baud_rate} baud.")
                return True
            except Exception as e:
                logger.debug(f"Serial port connection attempt on {target_port} failed: {e}")
                
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
        Send packet to Arduino according to existing contract:
        [HEADER_BYTE (255), leftForce, rightForce]
        """
        if self.is_connected and self.serial_conn:
            try:
                packet = bytes([
                    self.HEADER_BYTE,
                    max(0, min(254, left_force)),
                    max(0, min(254, right_force))
                ])
                self.serial_conn.write(packet)
                return True
            except Exception as e:
                logger.warning(f"Error writing to Arduino serial port: {e}")
                self.disconnect()
                return False
        return False
