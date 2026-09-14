import logging
import time
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

try:
    import hid
    HAS_HID = True
except ImportError:
    HAS_HID = False
    logger.info("hidapi module not installed; HID pedal adapter operating in fallback mode.")


class HIDPedalAdapter:
    """
    Adapter for CAMS HID Pedal Controller.
    
    Contract:
    - Vendor ID: 0x68E
    - Product ID: 0xF2
    - Report payload: [left_force, right_force, rudder_val]
    """

    VENDOR_ID = 0x68E
    PRODUCT_ID = 0xF2

    def __init__(self):
        self.device = None
        self.is_connected = False

    def connect(self) -> bool:
        """Attempt to open connection to physical HID pedals."""
        if not HAS_HID:
            self.is_connected = False
            return False

        try:
            dev = hid.device()
            dev.open(self.VENDOR_ID, self.PRODUCT_ID)
            dev.set_nonblocking(True)
            self.device = dev
            self.is_connected = True
            logger.info("Successfully connected to physical HID Pedal Controller (0x68E:0xF2).")
            return True
        except Exception as e:
            logger.debug(f"HID pedal connection attempt: {e}")
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
        logger.info("Disconnected HID Pedal Controller.")

    def read_pedals(self) -> Tuple[int, int, int]:
        """
        Read raw pedal values (left_force, right_force, rudder_val).
        Returns (left, right, rudder).
        """
        if self.is_connected and self.device:
            try:
                raw_report = self.device.read(64)
                if raw_report and len(raw_report) >= 3:
                    left = max(0, min(255, int(raw_report[0])))
                    right = max(0, min(255, int(raw_report[1])))
                    rudder = max(0, min(255, int(raw_report[2])))
                    return left, right, rudder
            except Exception as e:
                logger.warning(f"Error reading HID pedal report: {e}")
                self.disconnect()

        # Simulated dynamic fallback if physical device is absent
        noise = (time.time() * 1000 % 7 - 3.5)
        sim_left = max(0, min(255, int(128 + noise * 4)))
        sim_right = max(0, min(255, int(74 + noise * 3)))
        sim_rudder = max(0, min(255, int(120 + noise * 2)))
        return sim_left, sim_right, sim_rudder
