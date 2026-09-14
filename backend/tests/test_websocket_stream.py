import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.hardware import hardware_service

client = TestClient(app)


def assert_true(cond, msg):
    if not cond:
        raise AssertionError(f"Test Failed: {msg}")


def test_rest_hardware_endpoints():
    print("[TEST 1] Testing /api/hardware/status and /api/hardware/telemetry REST endpoints...")

    # Status endpoint test
    res_status = client.get("/api/hardware/status")
    assert_true(res_status.status_code == 200, "GET /api/hardware/status status 200")
    status_data = res_status.json()
    assert_true("connected" in status_data, "Status JSON has 'connected'")
    assert_true("pedalsConnected" in status_data, "Status JSON has 'pedalsConnected'")
    assert_true("arduinoConnected" in status_data, "Status JSON has 'arduinoConnected'")
    assert_true("mode" in status_data, "Status JSON has 'mode'")

    # Telemetry endpoint test
    res_tel = client.get("/api/hardware/telemetry")
    assert_true(res_tel.status_code == 200, "GET /api/hardware/telemetry status 200")
    tel_data = res_tel.json()
    assert_true("leftForce" in tel_data, "Telemetry JSON has 'leftForce'")
    assert_true("rightForce" in tel_data, "Telemetry JSON has 'rightForce'")
    assert_true("rudder" in tel_data, "Telemetry JSON has 'rudder'")
    assert_true("timestamp" in tel_data, "Telemetry JSON has 'timestamp'")
    assert_true("source" in tel_data, "Telemetry JSON has 'source'")

    print("  [PASS] REST hardware endpoints return valid normalized JSON data.")


def test_websocket_stream_connection_and_broadcast():
    print("[TEST 2] Testing /api/hardware/ws WebSocket streaming connection...")

    with client.websocket_connect("/api/hardware/ws") as websocket:
        # Receive initial state snapshot
        initial_frame = websocket.receive_json()
        assert_true("leftForce" in initial_frame, "WebSocket initial frame has leftForce")
        assert_true("rightForce" in initial_frame, "WebSocket initial frame has rightForce")
        assert_true("rudder" in initial_frame, "WebSocket initial frame has rudder")
        assert_true("timestamp" in initial_frame, "WebSocket initial frame has timestamp")
        assert_true("source" in initial_frame, "WebSocket initial frame has source")

        print("  [PASS] WebSocket client connected and received initial normalized telemetry snapshot.")


def test_hardware_connect_disconnect_rest():
    print("[TEST 3] Testing /api/hardware/connect and /api/hardware/disconnect handlers...")

    res_connect = client.post("/api/hardware/connect", json={"port": "COM_MOCK_1", "baudRate": 9600})
    assert_true(res_connect.status_code == 200, "POST /api/hardware/connect returns 200")

    res_disconnect = client.post("/api/hardware/disconnect")
    assert_true(res_disconnect.status_code == 200, "POST /api/hardware/disconnect returns 200")
    disc_data = res_disconnect.json()
    assert_true(disc_data["mode"] == "demo", "Disconnect resets mode to demo")

    print("  [PASS] Hardware connect and disconnect REST endpoints operate safely.")


if __name__ == "__main__":
    print("Starting APEX 4 WebSocket & Real-Time Hardware Stream Unit Tests...\n")
    test_rest_hardware_endpoints()
    test_websocket_stream_connection_and_broadcast()
    test_hardware_connect_disconnect_rest()
    print("\n[RESULT] All 3 WebSocket Stream Backend Tests Passed Successfully!")
