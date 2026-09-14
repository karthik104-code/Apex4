import logging
from typing import Tuple

logger = logging.getLogger(__name__)

try:
    import hid  # type: ignore[import]
    HAS_HID = True
except Exception as e:
    HAS_HID = False
    logger.info(f"hidapi not available ({type(e).__name__}: {e}); HID pedal adapter in fallback mode.")


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
        self.last_left = 0
        self.last_right = 0
        self.last_rudder = 0

    def connect(self) -> bool:
        """Attempt to open connection to physical HID pedals."""
        if not HAS_HID:
            self.is_connected = False
            return False

        # Close any existing handle first
        if self.device:
            try:
                self.device.close()
            except Exception:
                pass
            self.device = None

        try:
            dev = hid.device()
            dev.open(self.VENDOR_ID, self.PRODUCT_ID)
            dev.set_nonblocking(True)
            self.device = dev
            self.is_connected = True
            logger.info("Successfully connected to physical HID Pedal Controller (0x68E:0xF2).")
            return True
        except Exception as e:
            logger.debug(f"HID pedal connection attempt failed: {e}")
            self.is_connected = False
            self.device = None
            return False

    def disconnect(self):
        """Disconnect HID device handle."""
        self.is_connected = False
        if self.device:
            try:
                self.device.close()
            except Exception:
                pass
            self.device = None
        logger.info("Disconnected HID Pedal Controller.")

    def read_pedals(self) -> Tuple[int, int, int]:
        """
        Read raw pedal values (left_force, right_force, rudder_val).
        Returns last known values if no new report available.
        Detects disconnection from read exceptions — NO hid.enumerate() call
        (calling enumerate while device is open causes Windows HID driver crashes).
        """
        if not self.is_connected or not self.device:
            return self.last_left, self.last_right, self.last_rudder

        try:
            # Drain all buffered reports and take the most recent
            latest_report = None
            while True:
                report = self.device.read(64)
                if report:
                    latest_report = report
                else:
                    break

            if latest_report and len(latest_report) >= 3:
                self.last_left = max(0, min(255, int(latest_report[0])))
                self.last_right = max(0, min(255, int(latest_report[1])))
                self.last_rudder = max(0, min(255, int(latest_report[2])))

            return self.last_left, self.last_right, self.last_rudder

        except Exception as e:
            logger.warning(f"HID pedal read failed (device disconnected?): {e}")
            # Mark as disconnected — service watchdog will attempt reconnect
            self.is_connected = False
            if self.device:
                try:
                    self.device.close()
                except Exception:
                    pass
                self.device = None
            return self.last_left, self.last_right, self.last_rudder
