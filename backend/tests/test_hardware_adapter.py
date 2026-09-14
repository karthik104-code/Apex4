import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.hardware.models import NormalizedHardwareState, HardwareStatusModel, ArduinoPacket
from app.hardware.adapters.pedal_adapter import HIDPedalAdapter
from app.hardware.adapters.arduino_adapter import ArduinoSerialAdapter
from app.hardware.service import HardwareBridgeService, hardware_service


def assert_true(cond, msg):
    if not cond:
        raise AssertionError(f"Test Failed: {msg}")


def test_pedal_adapter_contract():
    print("[TEST 1] HID Pedal Adapter Contract (VID 0x68E, PID 0xF2)...")
    adapter = HIDPedalAdapter()
    assert_true(adapter.VENDOR_ID == 0x68E, "Vendor ID must be 0x68E")
    assert_true(adapter.PRODUCT_ID == 0xF2, "Product ID must be 0xF2")

    # Safe read when hardware is absent (must not crash)
    left, right, rudder = adapter.read_pedals()
    assert_true(isinstance(left, int) and 0 <= left <= 255, "left_force must be int in 0..255")
    assert_true(isinstance(right, int) and 0 <= right <= 255, "right_force must be int in 0..255")
    assert_true(isinstance(rudder, int) and 0 <= rudder <= 255, "rudder_val must be int in 0..255")
    print("  [PASS] HID pedal adapter respects hardware HID contract and handles missing hardware safely.")


def test_arduino_adapter_protocol():
    print("[TEST 2] Arduino Serial Protocol Contract (9600 Baud, Header 255)...")
    adapter = ArduinoSerialAdapter()
    assert_true(adapter.DEFAULT_BAUD == 9600, "Baud rate must be 9600")
    assert_true(adapter.HEADER_BYTE == 255, "Header byte must be 255")

    # Verify packet encoding
    packet = ArduinoPacket(header=255, leftForce=128, rightForce=74)
    raw_bytes = packet.to_bytes()
    assert_true(raw_bytes == bytes([255, 128, 74]), f"Packet payload mismatch: {list(raw_bytes)}")

    # Mock serial write test
    mock_serial = MagicMock()
    adapter.serial_conn = mock_serial
    adapter.is_connected = True

    ok = adapter.send_control_packet(160, 80)
    assert_true(ok is True, "Serial write should succeed with mock connection")
    mock_serial.write.assert_called_once_with(bytes([255, 160, 80]))
    print("  [PASS] Arduino serial adapter encodes 3-byte protocol packets correctly.")


def test_hardware_service_normalized_payload():
    print("[TEST 3] Hardware Bridge Service Normalized Payload...")
    service = HardwareBridgeService()
    state = service.get_normalized_state()

    assert_true(hasattr(state, "leftForce"), "State has leftForce")
    assert_true(hasattr(state, "rightForce"), "State has rightForce")
    assert_true(hasattr(state, "rudder"), "State has rudder")
    assert_true(hasattr(state, "pedalsConnected"), "State has pedalsConnected")
    assert_true(hasattr(state, "arduinoConnected"), "State has arduinoConnected")
    assert_true(hasattr(state, "timestamp"), "State has timestamp")
    assert_true(hasattr(state, "source"), "State has source")

    dict_state = state.model_dump() if hasattr(state, 'model_dump') else state.dict()
    assert_true("leftForce" in dict_state, "dict contains leftForce")
    assert_true("rightForce" in dict_state, "dict contains rightForce")
    assert_true("rudder" in dict_state, "dict contains rudder")
    assert_true("pedalsConnected" in dict_state, "dict contains pedalsConnected")
    assert_true("arduinoConnected" in dict_state, "dict contains arduinoConnected")
    assert_true("timestamp" in dict_state, "dict contains timestamp")
    assert_true("source" in dict_state, "dict contains source")
    print("  [PASS] Normalized state fields correctly structured.")


def test_calibration_and_subscriber_events():
    print("[TEST 4] Hardware Baseline Calibration & Telemetry Subscriber...")
    service = HardwareBridgeService()
    service.calibrate(zero_left=10, zero_right=20)
    assert_true(service.left_offset == 10, "Left zero offset set")
    assert_true(service.right_offset == 20, "Right zero offset set")

    events = []
    def callback(data):
        events.append(data)

    service.subscribe(callback)
    state = service.get_normalized_state()

    # Manually trigger subscriber notification
    for cb in service._subscribers:
        cb(state.model_dump() if hasattr(state, 'model_dump') else state.dict())

    assert_true(len(events) == 1, "Subscriber received telemetry event")
    assert_true(events[0]["leftForce"] >= 0, "Telemetry payload leftForce valid")
    service.unsubscribe(callback)
    print("  [PASS] Calibration offset and telemetry subscriber callbacks function properly.")


if __name__ == "__main__":
    print("Starting APEX 4 Hardware Adapter Layer Unit Tests...\n")
    test_pedal_adapter_contract()
    test_arduino_adapter_protocol()
    test_hardware_service_normalized_payload()
    test_calibration_and_subscriber_events()
    print("\n[RESULT] All 4 Hardware Adapter Backend Tests Passed Successfully!")
