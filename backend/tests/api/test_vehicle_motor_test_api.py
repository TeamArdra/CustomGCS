from unittest.mock import MagicMock

from fastapi.testclient import TestClient
from pymavlink import mavutil

from app.main import app, connection_state, runtime_state, vehicle_state


class FakeAck:
	def __init__(self, command: int, result: int):
		self.command = command
		self.result = result


def _fake_connection_manager(ack_result: int = mavutil.mavlink.MAV_RESULT_ACCEPTED):
	ack = FakeAck(
		command=mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST,
		result=ack_result,
	)

	fake_mav = MagicMock()
	fake_mav.command_long_send = MagicMock()

	fake_link = MagicMock()
	fake_link.recv_match = MagicMock(return_value=ack)
	fake_link.mav = fake_mav

	fake_cm = MagicMock()
	fake_cm.target_system = 1
	fake_cm.target_component = 1
	fake_cm.mavlink = fake_link
	return fake_cm, fake_mav


def _reset_runtime_state() -> None:
	connection_state.connected = False
	connection_state.connection_string = None
	connection_state.connected_at = None
	vehicle_state.armed = False
	vehicle_state.mode = "UNKNOWN"
	runtime_state.connection_manager = None
	runtime_state.latest_telemetry = {}


def test_motor_test_requires_connection() -> None:
	_reset_runtime_state()
	client = TestClient(app)

	response = client.post(
		"/api/vehicle/motor-test",
		json={"motor_number": 1, "throttle_percent": 8, "duration_sec": 1.5},
	)

	assert response.status_code == 409
	assert response.json()["detail"] == "Vehicle not connected"


def test_motor_test_requires_disarmed_vehicle() -> None:
	_reset_runtime_state()
	fake_cm, _ = _fake_connection_manager()
	runtime_state.connection_manager = fake_cm
	connection_state.connected = True
	vehicle_state.armed = True

	client = TestClient(app)
	response = client.post(
		"/api/vehicle/motor-test",
		json={"motor_number": 1, "throttle_percent": 8, "duration_sec": 1.5},
	)

	assert response.status_code == 409
	assert response.json()["detail"] == "Motor test requires vehicle to be disarmed"


def test_motor_test_requires_disarmed_when_telemetry_is_armed() -> None:
	_reset_runtime_state()
	fake_cm, _ = _fake_connection_manager()
	runtime_state.connection_manager = fake_cm
	connection_state.connected = True
	vehicle_state.armed = False
	runtime_state.latest_telemetry = {"armed": True}

	client = TestClient(app)
	response = client.post(
		"/api/vehicle/motor-test",
		json={"motor_number": 1, "throttle_percent": 8, "duration_sec": 1.5},
	)

	assert response.status_code == 409
	assert response.json()["detail"] == "Motor test requires vehicle to be disarmed"


def test_motor_test_sends_mavlink_command() -> None:
	_reset_runtime_state()
	fake_cm, fake_mav = _fake_connection_manager()
	runtime_state.connection_manager = fake_cm
	connection_state.connected = True
	vehicle_state.armed = False

	client = TestClient(app)
	response = client.post(
		"/api/vehicle/motor-test",
		json={"motor_number": 2, "throttle_percent": 10, "duration_sec": 2},
	)

	assert response.status_code == 200
	body = response.json()
	assert body["ok"] is True
	assert body["motor_number"] == 2

	fake_mav.command_long_send.assert_called_once()
	args = fake_mav.command_long_send.call_args.args
	assert args[0] == 1
	assert args[1] == 1
	assert args[2] == mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST
	assert args[4] == 2.0


def test_motor_test_validates_ranges() -> None:
	_reset_runtime_state()
	client = TestClient(app)

	response = client.post(
		"/api/vehicle/motor-test",
		json={"motor_number": 0, "throttle_percent": 50, "duration_sec": 12},
	)

	assert response.status_code == 422
