import pytest

from unittest.mock import MagicMock
from app.core.state.telemetry_state import TelemetryState

def test_initial_state_defaults():
    
    dispatcher = MagicMock()
    
    state = TelemetryState(dispatcher)

    assert state.is_armed is False
    assert state.mode is None
    assert state.system_status is None

    assert state.roll == 0.0
    assert state.pitch == 0.0
    assert state.yaw == 0.0

    assert state.longtitude is None
    assert state.latitude is None
    assert state.altitude is None

    assert state.battery_voltage is None

def test_heartbeat_updates_state():

    dispatcher = MagicMock()
    state = TelemetryState(dispatcher)

    heartbeat = MagicMock()
    heartbeat.get_type.return_value = "HEARTBEAT"
    heartbeat.base_mode = 128
    heartbeat.custom_mode = 4
    heartbeat.system_status = 3

    state._handle_heartbeat(heartbeat)

    assert state.is_armed is True
    assert state.mode == 4
    assert state.system_status == 3

def test_attitude_updates_state():

    dispatcher = MagicMock()
    state = TelemetryState(dispatcher)

    attitude = MagicMock()
    attitude.get_type.return_value = "ATTITUDE"
    attitude.roll = 0.1
    attitude.pitch = -0.2
    attitude.yaw = 1.57

    state._handle_attitude(attitude)

    assert state.roll == 0.1
    assert state.pitch == -0.2
    assert state.yaw == 1.57

def test_global_position_updates_state():
    
    dispatcher = MagicMock()
    state = TelemetryState(dispatcher)

    position = MagicMock()
    position.get_type.return_value = "GLOBAL_POSITION_INT"
    position.lat = 123456789
    position.lon = 987654321
    position.alt = 12345

    state._handle_global_position(position)

    assert state.latitude == 12.3456789
    assert state.longtitude == 98.7654321
    assert state.altitude == 12.345

def test_sys_status_updates_battery_voltage():

    dispatcher = MagicMock()
    state = TelemetryState(dispatcher)

    sys_status = MagicMock()
    sys_status.get_type.return_value = "SYS_STATUS"
    sys_status.voltage_battery = 12000

    state._handle_sys_status(sys_status)

    assert state.battery_voltage == 12.0

def test_unknown_message_is_ignored():
    """
    Unknown message types should not raise errors
    and should not modify state.
    """

    dispatcher = MagicMock()
    state = TelemetryState(dispatcher)

    # Capture initial state snapshot
    initial_snapshot = (
        state.is_armed,
        state.mode,
        state.system_status,
        state.roll,
        state.pitch,
        state.yaw,
        state.latitude,
        state.longtitude,
        state.altitude,
        state.battery_voltage,
    )

    unknown_msg = MagicMock()
    unknown_msg.get_type.return_value = "SOME_UNKNOWN_MESSAGE"

    # Should not raise
    state._handle_message(unknown_msg)

    # State should remain unchanged
    assert (
        state.is_armed,
        state.mode,
        state.system_status,
        state.roll,
        state.pitch,
        state.yaw,
        state.latitude,
        state.longtitude,
        state.altitude,
        state.battery_voltage,
    ) == initial_snapshot