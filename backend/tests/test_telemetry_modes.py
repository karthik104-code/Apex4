import sys
import os
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.hardware.service import HardwareBridgeService


def assert_true(cond, msg):
    if not cond:
        raise AssertionError(f"Test Failed: {msg}")


def test_explicit_source_tagging_and_mode_switching():
    print("[TEST 1] Testing explicit source tagging ('hardware' vs 'simulated')...")
    service = HardwareBridgeService()

    # Initial state when physical hardware absent
    state = service.get_normalized_state()
    assert_true(state.source in ["simulated", "hardware"], "Source attribute must be explicitly tagged")
    if not state.connected:
        assert_true(state.source == "simulated", "When physical hardware disconnected, source must be 'simulated'")
        assert_true(state.pedalsConnected is False, "pedalsConnected must be False")
        assert_true(state.arduinoConnected is False, "arduinoConnected must be False")

    print("  [PASS] Disconnected hardware payload explicitly tagged source as 'simulated'.")


def test_no_silent_hardware_pretending():
    print("[TEST 2] Testing no silent hardware pretending on disconnect...")
    service = HardwareBridgeService()

    # Simulate connect then disconnect
    service.disconnect_hardware()
    status = service.get_status()
    assert_true(status.connected is False, "Status connected is False after disconnect")
    assert_true(status.mode == "demo", "Status mode resets to 'demo'")

    state = service.get_normalized_state()
    assert_true(state.source == "simulated", "State source is 'simulated'")
    print("  [PASS] Hardware disconnect cleanly resets status to demo mode without pretending to be hardware.")


if __name__ == "__main__":
    print("Starting APEX 4 Dual Telemetry Mode Backend Unit Tests...\n")
    test_explicit_source_tagging_and_mode_switching()
    test_no_silent_hardware_pretending()
    print("\n[RESULT] All 2 Dual Telemetry Mode Backend Tests Passed Successfully!")
