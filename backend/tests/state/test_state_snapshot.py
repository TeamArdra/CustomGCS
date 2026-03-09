from unittest.mock import MagicMock

from app.core.state.telemetry_state import TelemetryState
from app.core.state.state_snapshot import TelemetrySnapshot


def test_snapshot_contains_all_state_fields():

    dispatcher = MagicMock()
    state = TelemetryState(dispatcher)

    # populate state manually
    state._is_armed = True
    state._mode = 4
    state._roll = 0.1
    state._pitch = -0.2
    state._yaw = 1.5
    state._latitude = 12.34
    state._longtitude = 56.78
    state._altitude = 100
    state._battery_voltage = 11.9

    snapshot = TelemetrySnapshot(state)

    data = snapshot.to_dict()

    assert data["armed"] is True
    assert data["mode"] == 4
    assert data["roll"] == 0.1
    assert data["pitch"] == -0.2
    assert data["yaw"] == 1.5
    assert data["latitude"] == 12.34
    assert data["longtitude"] == 56.78
    assert data["altitude"] == 100
    assert data["battery_voltage"] == 11.9

def test_snapshot_is_immutable():

    dispatcher = MagicMock()
    state = TelemetryState(dispatcher)

    state._roll = 0.5

    snapshot = TelemetrySnapshot(state)

    # mutate state after snapshot
    state._roll = 1.5

    data = snapshot.to_dict()

    assert data["roll"] == 0.5