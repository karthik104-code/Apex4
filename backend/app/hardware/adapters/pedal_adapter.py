import logging
import time
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

try:
    import hid
    HAS_HID = True
except ImportError:
    HAS_HID = False
    logger.warning("hidapi library is not installed. Running in simulation mode.")


class HIDPedalAdapter:
    """
    Reference Driver for Mantis Shrimp V1 / V23 HID Pedal Controller.
    
    Exact Contract matching HUD reference implementation:
    - Vendor ID: 0x68E (1678)
    - Product ID: 0xF2 (242)
    - Non-blocking read mode (set_nonblocking(1))
    - Report extraction:
        report[0] -> left_force  (0 - 255)
        report[1] -> right_force (0 - 255)
        report[2] -> rudder_val  (0 - 255)
    """

    VENDOR_ID = 0x68E
    PRODUCT_ID = 0xF2

    def __init__(self):
        self.device = None
        self.is_connected = False
        self.raw_left: int = 0
        self.raw_right: int = 0
        self.raw_rudder: int = 128
        self.last_read_time: float = 0.0

    def connect(self) -> bool:
        """Attempt to open connection to physical Mantis Shrimp HID."""
        if not HAS_HID:
            self.is_connected = False
            return False

        try:
            dev = hid.device()
            dev.open(self.VENDOR_ID, self.PRODUCT_ID)
            dev.set_nonblocking(1)
            self.device = dev
            self.is_connected = True
            logger.info("Successfully connected to physical Mantis Shrimp HID (0x68E:0xF2).")
            return True
        except Exception as e:
            self.is_connected = False
            self.device = None
            return False

    def disconnect(self):
        """Disconnect HID device handle."""
        if self.device:
            try:
                self.device.close()
            except Exception:
                pass
            self.device = None
        self.is_connected = False
        logger.info("Disconnected Mantis Shrimp HID device handle.")

    def read_raw_report(self) -> Tuple[int, int, int]:
        """
        Poll physical HID device for raw 0-255 report packet.
        Returns: (raw_left_force, raw_right_force, raw_rudder)
        """
        if self.is_connected and self.device:
            try:
                report = self.device.read(64)
                if report and len(report) >= 3:
                    self.raw_left = max(0, min(255, int(report[0])))
                    self.raw_right = max(0, min(255, int(report[1])))
                    self.raw_rudder = max(0, min(255, int(report[2])))
                    self.last_read_time = time.time()
                return self.raw_left, self.raw_right, self.raw_rudder
            except Exception as e:
                logger.warning(f"Error reading Mantis Shrimp HID report: {e}")
                self.disconnect()

        # Simulated dynamic fallback if physical device is offline
        noise = (time.time() * 1000 % 7 - 3.5)
        sim_left = max(0, min(255, int(128 + noise * 4)))
        sim_right = max(0, min(255, int(74 + noise * 3)))
        sim_rudder = max(0, min(255, int(120 + noise * 2)))
        return sim_left, sim_right, sim_rudder
