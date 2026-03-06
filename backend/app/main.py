import asyncio
import math
import time
from dataclasses import dataclass, field
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymavlink import mavutil
from serial.tools import list_ports

from app.core.mavlink.connection_manager import ConnectionManager


class ConnectRequest(BaseModel):
	connection_string: str


class SetModeRequest(BaseModel):
	mode: str


class CommandRequest(BaseModel):
	command: str
	params: dict = {}


class CalibrationStartRequest(BaseModel):
	type: str


class MotorTestRequest(BaseModel):
	motor_number: int = Field(ge=1, le=12)
	throttle_percent: float = Field(gt=0, le=30)
	duration_sec: float = Field(gt=0, le=5)


class TelemetryProfileRequest(BaseModel):
	low_latency: bool


class PreflightCheckResponse(BaseModel):
	id: str
	name: str
	status: str
	message: str


class ConnectionStatusResponse(BaseModel):
	connected: bool
	connection_string: Optional[str] = None
	connected_at: Optional[float] = None


class ConnectionDeviceResponse(BaseModel):
	id: str
	label: str
	kind: str


class CalibrationItemResponse(BaseModel):
	type: str
	status: str
	last_calibrated: Optional[float] = None
	message: str = ""


@dataclass
class ConnectionState:
	connected: bool = False
	connection_string: Optional[str] = None
	connected_at: Optional[float] = None


@dataclass
class VehicleState:
	armed: bool = False
	mode: str = "UNKNOWN"


@dataclass
class RuntimeState:
	connection_manager: Optional[ConnectionManager] = None
	low_latency: bool = False
	calibration_items: dict[str, CalibrationItemResponse] = None
	recv_lock: asyncio.Lock = field(default_factory=asyncio.Lock)
	latest_telemetry: dict = None


app = FastAPI(title="CustomGCS Backend", version="0.2.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

connection_state = ConnectionState()
vehicle_state = VehicleState()
runtime_state = RuntimeState()
runtime_state.latest_telemetry = {}
runtime_state.calibration_items = {
	"compass": CalibrationItemResponse(
		type="compass",
		status="needs_calibration",
		message="Compass calibration pending",
	),
	"accelerometer": CalibrationItemResponse(
		type="accelerometer",
		status="needs_calibration",
		message="Accelerometer calibration pending",
	),
	"radio": CalibrationItemResponse(
		type="radio",
		status="unknown",
		message="Radio calibration status unknown",
	),
	"esc": CalibrationItemResponse(
		type="esc",
		status="unknown",
		message="ESC calibration manual on most vehicles",
	),
}

TELEMETRY_PUSH_INTERVAL_S = 0.05
MAX_MESSAGES_PER_TICK = 200
BLOCKING_POLL_TIMEOUT_S = 0.02

DEFAULT_MESSAGE_INTERVAL_US = {
	mavutil.mavlink.MAVLINK_MSG_ID_HEARTBEAT: 500000,
	mavutil.mavlink.MAVLINK_MSG_ID_ATTITUDE: 100000,
	mavutil.mavlink.MAVLINK_MSG_ID_VFR_HUD: 100000,
	mavutil.mavlink.MAVLINK_MSG_ID_GLOBAL_POSITION_INT: 100000,
	mavutil.mavlink.MAVLINK_MSG_ID_GPS_RAW_INT: 200000,
	mavutil.mavlink.MAVLINK_MSG_ID_SYS_STATUS: 250000,
}

LOW_LATENCY_MESSAGE_INTERVAL_US = {
	mavutil.mavlink.MAVLINK_MSG_ID_HEARTBEAT: 250000,
	mavutil.mavlink.MAVLINK_MSG_ID_ATTITUDE: 50000,
	mavutil.mavlink.MAVLINK_MSG_ID_VFR_HUD: 50000,
	mavutil.mavlink.MAVLINK_MSG_ID_GLOBAL_POSITION_INT: 50000,
	mavutil.mavlink.MAVLINK_MSG_ID_GPS_RAW_INT: 100000,
	mavutil.mavlink.MAVLINK_MSG_ID_SYS_STATUS: 100000,
}


def default_telemetry_payload() -> dict:
	now = time.time()
	return {
		"roll": 0.0,
		"pitch": 0.0,
		"yaw": 0.0,
		"altitude": 0.0,
		"groundSpeed": 0.0,
		"airSpeed": 0.0,
		"climbRate": 0.0,
		"heading": 0.0,
		"latitude": 0.0,
		"longitude": 0.0,
		"batteries": [
			{
				"cellCount": 0,
				"voltage": 0.0,
				"current": 0.0,
				"capacity": 0,
				"remaining": 0.0,
			}
		],
		"gpsStatus": "no_fix",
		"satCount": 0,
		"temperature": 0.0,
		"mode": vehicle_state.mode,
		"armed": vehicle_state.armed,
		"timestamp": int(now * 1000),
	}


def parse_connection_string(connection_string: str) -> tuple[str, Optional[int]]:
	if connection_string.startswith("serial:"):
		parts = connection_string.split(":")
		if len(parts) >= 2 and parts[1]:
			baudrate = None
			if len(parts) >= 3:
				try:
					baudrate = int(parts[2])
				except ValueError:
					baudrate = None
			return parts[1], baudrate
	return connection_string, None


def ensure_connected_manager() -> ConnectionManager:
	cm = runtime_state.connection_manager
	if cm is None or not connection_state.connected:
		raise HTTPException(status_code=409, detail="Vehicle not connected")
	return cm


def telemetry_push_interval() -> float:
	return 0.03 if runtime_state.low_latency else TELEMETRY_PUSH_INTERVAL_S


def apply_telemetry_profile(cm: ConnectionManager, low_latency: bool) -> None:
	intervals = LOW_LATENCY_MESSAGE_INTERVAL_US if low_latency else DEFAULT_MESSAGE_INTERVAL_US

	for message_id, interval_us in intervals.items():
		try:
			cm.mavlink.mav.command_long_send(
				cm.target_system,
				cm.target_component,
				mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL,
				0,
				float(message_id),
				float(interval_us),
				0,
				0,
				0,
				0,
				0,
			)
		except Exception:
			continue


def build_preflight_checks() -> tuple[list[PreflightCheckResponse], bool]:
	telemetry = runtime_state.latest_telemetry or default_telemetry_payload()
	checks: list[PreflightCheckResponse] = []

	if connection_state.connected:
		checks.append(
			PreflightCheckResponse(
				id="connection",
				name="Vehicle Link",
				status="passed",
				message="Vehicle connection is active",
			)
		)
	else:
		checks.append(
			PreflightCheckResponse(
				id="connection",
				name="Vehicle Link",
				status="failed",
				message="No active vehicle link",
			)
		)

	gps_status = telemetry.get("gpsStatus", "no_fix")
	sat_count = int(telemetry.get("satCount", 0) or 0)
	if gps_status == "3d" and sat_count >= 8:
		checks.append(
			PreflightCheckResponse(
				id="gps",
				name="GPS Lock",
				status="passed",
				message=f"3D fix with {sat_count} satellites",
			)
		)
	elif gps_status == "2d" or sat_count >= 6:
		checks.append(
			PreflightCheckResponse(
				id="gps",
				name="GPS Lock",
				status="warning",
				message=f"Limited fix ({gps_status}) with {sat_count} satellites",
			)
		)
	else:
		checks.append(
			PreflightCheckResponse(
				id="gps",
				name="GPS Lock",
				status="failed",
				message=f"No reliable GPS fix ({sat_count} satellites)",
			)
		)

	batteries = telemetry.get("batteries", [])
	battery_remaining = 0.0
	battery_voltage = 0.0
	if batteries and isinstance(batteries, list):
		battery_remaining = float(batteries[0].get("remaining", 0.0) or 0.0)
		battery_voltage = float(batteries[0].get("voltage", 0.0) or 0.0)

	if battery_remaining >= 30:
		checks.append(
			PreflightCheckResponse(
				id="battery",
				name="Battery",
				status="passed",
				message=f"{battery_remaining:.1f}% ({battery_voltage:.2f}V)",
			)
		)
	elif battery_remaining >= 20:
		checks.append(
			PreflightCheckResponse(
				id="battery",
				name="Battery",
				status="warning",
				message=f"Low battery {battery_remaining:.1f}% ({battery_voltage:.2f}V)",
			)
		)
	else:
		checks.append(
			PreflightCheckResponse(
				id="battery",
				name="Battery",
				status="failed",
				message=f"Critical battery {battery_remaining:.1f}% ({battery_voltage:.2f}V)",
			)
		)

	timestamp = int(telemetry.get("timestamp", 0) or 0)
	age_ms = int(time.time() * 1000) - timestamp if timestamp else 999999
	if age_ms < 1000:
		checks.append(
			PreflightCheckResponse(
				id="telemetry",
				name="Telemetry Freshness",
				status="passed",
				message=f"Fresh data ({age_ms} ms old)",
			)
		)
	elif age_ms < 2500:
		checks.append(
			PreflightCheckResponse(
				id="telemetry",
				name="Telemetry Freshness",
				status="warning",
				message=f"Slight delay ({age_ms} ms old)",
			)
		)
	else:
		checks.append(
			PreflightCheckResponse(
				id="telemetry",
				name="Telemetry Freshness",
				status="failed",
				message=f"Stale data ({age_ms} ms old)",
			)
		)

	climb_rate = float(telemetry.get("climbRate", 0.0) or 0.0)
	if abs(climb_rate) < 1.0:
		checks.append(
			PreflightCheckResponse(
				id="vertical_stability",
				name="Vertical Stability",
				status="passed",
				message=f"Climb rate stable ({climb_rate:.2f} m/s)",
			)
		)
	else:
		checks.append(
			PreflightCheckResponse(
				id="vertical_stability",
				name="Vertical Stability",
				status="warning",
				message=f"Vertical movement detected ({climb_rate:.2f} m/s)",
			)
		)

	if vehicle_state.armed:
		checks.append(
			PreflightCheckResponse(
				id="arm_state",
				name="Arm State",
				status="warning",
				message="Vehicle is ARMED",
			)
		)
	else:
		checks.append(
			PreflightCheckResponse(
				id="arm_state",
				name="Arm State",
				status="passed",
				message="Vehicle is disarmed",
			)
		)

	has_failed = any(item.status == "failed" for item in checks)
	ready_for_flight = (not has_failed) and connection_state.connected
	return checks, ready_for_flight


def update_filtered_altitude(snapshot: dict, new_altitude: float) -> None:
	current_altitude = float(snapshot.get("altitude", 0.0) or 0.0)
	ground_speed = float(snapshot.get("groundSpeed", 0.0) or 0.0)
	climb_rate = float(snapshot.get("climbRate", 0.0) or 0.0)

	is_stationary = ground_speed < 0.6 and abs(climb_rate) < 0.2
	delta = new_altitude - current_altitude

	# Ignore tiny altitude jitter while stationary
	if is_stationary and abs(delta) < 0.35:
		return

	# Smooth altitude transitions to reduce sensor flicker
	alpha = 0.2 if is_stationary else 0.35
	filtered = current_altitude + (delta * alpha)
	snapshot["altitude"] = round(filtered, 2)


def apply_message_to_telemetry(snapshot: dict, msg) -> None:
	msg_type = msg.get_type()

	if msg_type == "ATTITUDE":
		snapshot["roll"] = round(math.degrees(msg.roll), 2)
		snapshot["pitch"] = round(math.degrees(msg.pitch), 2)
		snapshot["yaw"] = round((math.degrees(msg.yaw) + 360) % 360, 2)

	elif msg_type == "VFR_HUD":
		snapshot["groundSpeed"] = round(float(msg.groundspeed), 2)
		snapshot["airSpeed"] = round(float(msg.airspeed), 2)
		snapshot["climbRate"] = round(float(msg.climb), 2)
		snapshot["heading"] = round(float(msg.heading), 2)

	elif msg_type == "GLOBAL_POSITION_INT":
		snapshot["latitude"] = round(float(msg.lat) / 1e7, 7)
		snapshot["longitude"] = round(float(msg.lon) / 1e7, 7)
		rel_alt_m = float(getattr(msg, "relative_alt", 0.0) or 0.0) / 1000.0
		update_filtered_altitude(snapshot, rel_alt_m)

	elif msg_type == "GPS_RAW_INT":
		fix_map = {0: "no_gps", 1: "no_fix", 2: "2d", 3: "3d", 4: "3d", 5: "3d"}
		snapshot["gpsStatus"] = fix_map.get(int(msg.fix_type), "no_fix")
		snapshot["satCount"] = int(getattr(msg, "satellites_visible", 0) or 0)

	elif msg_type == "SYS_STATUS":
		remaining = float(getattr(msg, "battery_remaining", 0) or 0)
		voltage = float(getattr(msg, "voltage_battery", 0) or 0) / 1000.0
		current = float(getattr(msg, "current_battery", 0) or 0) / 100.0
		snapshot["batteries"] = [
			{
				"cellCount": 4,
				"voltage": round(voltage, 2),
				"current": round(current, 2),
				"capacity": 0,
				"remaining": round(max(0.0, remaining), 2),
			}
		]

	elif msg_type == "HEARTBEAT":
		base_mode = int(getattr(msg, "base_mode", 0) or 0)
		vehicle_state.armed = bool(base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED)


def update_mode_from_connection(cm: ConnectionManager) -> None:
	flight_mode = getattr(cm.mavlink, "flightmode", None)
	if isinstance(flight_mode, str) and flight_mode:
		vehicle_state.mode = flight_mode.upper()


async def send_arm_command(arm: bool) -> None:
	cm = ensure_connected_manager()
	command_id = mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM

	async with runtime_state.recv_lock:
		cm.mavlink.mav.command_long_send(
			cm.target_system,
			cm.target_component,
			command_id,
			0,
			1 if arm else 0,
			0,
			0,
			0,
			0,
			0,
			0,
		)

		deadline = time.monotonic() + 3.0
		ack = None
		while time.monotonic() < deadline:
			remaining = max(0.1, deadline - time.monotonic())
			candidate = await asyncio.to_thread(
				cm.mavlink.recv_match,
				type="COMMAND_ACK",
				blocking=True,
				timeout=min(0.5, remaining),
			)
			if candidate is None:
				continue
			if int(getattr(candidate, "command", -1)) == int(command_id):
				ack = candidate
				break

	if ack is None:
		raise HTTPException(status_code=504, detail="No COMMAND_ACK for arm/disarm")

	result = int(getattr(ack, "result", mavutil.mavlink.MAV_RESULT_FAILED))
	if result not in (mavutil.mavlink.MAV_RESULT_ACCEPTED, mavutil.mavlink.MAV_RESULT_IN_PROGRESS):
		raise HTTPException(status_code=400, detail=f"Arm/Disarm rejected (result={result})")

	vehicle_state.armed = arm


async def send_calibration_command(calibration_type: str) -> None:
	cm = ensure_connected_manager()

	param1 = 0.0  # gyro
	param2 = 0.0  # magnetometer
	param3 = 0.0
	param4 = 0.0  # radio
	param5 = 0.0  # accelerometer
	param6 = 0.0
	param7 = 0.0

	if calibration_type == "gyroscope":
		param1 = 1.0
	elif calibration_type == "compass":
		param2 = 1.0
	elif calibration_type == "radio":
		param4 = 1.0
	elif calibration_type == "accelerometer":
		param5 = 1.0
	elif calibration_type == "esc":
		raise HTTPException(
			status_code=400,
			detail="ESC calibration is vehicle-specific and not supported by this command",
		)
	else:
		raise HTTPException(status_code=400, detail=f"Unsupported calibration type: {calibration_type}")

	command_id = mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION

	async with runtime_state.recv_lock:
		cm.mavlink.mav.command_long_send(
			cm.target_system,
			cm.target_component,
			command_id,
			0,
			param1,
			param2,
			param3,
			param4,
			param5,
			param6,
			param7,
		)

		deadline = time.monotonic() + 4.0
		ack = None
		while time.monotonic() < deadline:
			remaining = max(0.1, deadline - time.monotonic())
			candidate = await asyncio.to_thread(
				cm.mavlink.recv_match,
				type="COMMAND_ACK",
				blocking=True,
				timeout=min(0.5, remaining),
			)
			if candidate is None:
				continue
			if int(getattr(candidate, "command", -1)) == int(command_id):
				ack = candidate
				break

	if ack is None:
		raise HTTPException(status_code=504, detail="No COMMAND_ACK for calibration command")

	result = int(getattr(ack, "result", mavutil.mavlink.MAV_RESULT_FAILED))
	if result not in (mavutil.mavlink.MAV_RESULT_ACCEPTED, mavutil.mavlink.MAV_RESULT_IN_PROGRESS):
		raise HTTPException(
			status_code=400,
			detail=f"Calibration command rejected (result={result})",
		)


async def send_motor_test_command(
	motor_number: int,
	throttle_percent: float,
	duration_sec: float,
) -> None:
	cm = ensure_connected_manager()
	telemetry_armed = bool((runtime_state.latest_telemetry or {}).get("armed", False))
	if vehicle_state.armed or telemetry_armed:
		raise HTTPException(status_code=409, detail="Motor test requires vehicle to be disarmed")

	command_id = mavutil.mavlink.MAV_CMD_DO_MOTOR_TEST
	throttle_type_percent = float(
		getattr(
			mavutil.mavlink,
			"MOTOR_TEST_THROTTLE_PERCENT",
			getattr(mavutil.mavlink, "MAV_MOTOR_TEST_THROTTLE_PERCENT", 0),
		)
	)
	test_motor_count = 1.0
	test_order_default = float(
		getattr(
			mavutil.mavlink,
			"MOTOR_TEST_ORDER_DEFAULT",
			getattr(mavutil.mavlink, "MOTOR_TEST_ORDER_BOARD", 0),
		)
	)

	async with runtime_state.recv_lock:
		cm.mavlink.mav.command_long_send(
			cm.target_system,
			cm.target_component,
			command_id,
			0,
			float(motor_number),
			throttle_type_percent,
			float(throttle_percent),
			float(duration_sec),
			test_motor_count,
			test_order_default,
			0,
		)

		deadline = time.monotonic() + 3.0
		ack = None
		while time.monotonic() < deadline:
			remaining = max(0.1, deadline - time.monotonic())
			candidate = await asyncio.to_thread(
				cm.mavlink.recv_match,
				type="COMMAND_ACK",
				blocking=True,
				timeout=min(0.5, remaining),
			)
			if candidate is None:
				continue
			if int(getattr(candidate, "command", -1)) == int(command_id):
				ack = candidate
				break

	if ack is None:
		raise HTTPException(status_code=504, detail="No COMMAND_ACK for motor test")

	result = int(getattr(ack, "result", mavutil.mavlink.MAV_RESULT_FAILED))
	if result not in (mavutil.mavlink.MAV_RESULT_ACCEPTED, mavutil.mavlink.MAV_RESULT_IN_PROGRESS):
		raise HTTPException(status_code=400, detail=f"Motor test rejected (result={result})")


@app.get("/api/health")
async def health() -> dict:
	return {"status": "ok"}


@app.post("/api/connection/connect", response_model=ConnectionStatusResponse)
async def connect_vehicle(payload: ConnectRequest) -> ConnectionStatusResponse:
	if connection_state.connected:
		return ConnectionStatusResponse(
			connected=True,
			connection_string=connection_state.connection_string,
			connected_at=connection_state.connected_at,
		)

	connection_string, baudrate = parse_connection_string(payload.connection_string)
	cm = ConnectionManager(connection_string, baudrate=baudrate)

	try:
		await cm.connect()
	except Exception as error:
		raise HTTPException(status_code=400, detail=f"Connection failed: {error}") from error

	runtime_state.connection_manager = cm
	connection_state.connected = True
	connection_state.connection_string = payload.connection_string
	connection_state.connected_at = time.time()
	update_mode_from_connection(cm)
	apply_telemetry_profile(cm, runtime_state.low_latency)

	return ConnectionStatusResponse(
		connected=connection_state.connected,
		connection_string=connection_state.connection_string,
		connected_at=connection_state.connected_at,
	)


@app.post("/api/connection/disconnect", response_model=ConnectionStatusResponse)
async def disconnect_vehicle() -> ConnectionStatusResponse:
	cm = runtime_state.connection_manager
	if cm is not None:
		await cm.disconnect()

	runtime_state.connection_manager = None
	connection_state.connected = False
	connection_state.connection_string = None
	connection_state.connected_at = None
	vehicle_state.armed = False
	vehicle_state.mode = "UNKNOWN"

	return ConnectionStatusResponse(connected=False)


@app.get("/api/connection/status", response_model=ConnectionStatusResponse)
async def connection_status() -> ConnectionStatusResponse:
	return ConnectionStatusResponse(
		connected=connection_state.connected,
		connection_string=connection_state.connection_string,
		connected_at=connection_state.connected_at,
	)


@app.get("/api/connection/ports")
async def connection_ports() -> dict:
	devices: list[ConnectionDeviceResponse] = []

	try:
		serial_ports = await asyncio.wait_for(
			asyncio.to_thread(list_ports.comports),
			timeout=2.5,
		)
	except TimeoutError:
		serial_ports = []

	for port in serial_ports:
		description = port.description if port.description else "Serial Device"
		devices.append(
			ConnectionDeviceResponse(
				id=f"serial:{port.device}:57600",
				label=f"{port.device} ({description})",
				kind="serial",
			)
		)

	devices.append(
		ConnectionDeviceResponse(
			id="udp:127.0.0.1:14550",
			label="UDP (127.0.0.1:14550)",
			kind="network",
		)
	)
	devices.append(
		ConnectionDeviceResponse(
			id="tcp:192.168.1.100:5760",
			label="TCP (192.168.1.100:5760)",
			kind="network",
		)
	)

	return {"devices": [device.model_dump() for device in devices]}


@app.get("/api/telemetry/profile")
async def telemetry_profile() -> dict:
	return {"low_latency": runtime_state.low_latency}


@app.post("/api/telemetry/profile")
async def set_telemetry_profile(payload: TelemetryProfileRequest) -> dict:
	runtime_state.low_latency = payload.low_latency

	cm = runtime_state.connection_manager
	if cm is not None and connection_state.connected:
		apply_telemetry_profile(cm, runtime_state.low_latency)

	return {"ok": True, "low_latency": runtime_state.low_latency}


@app.get("/api/vehicle/info")
async def vehicle_info() -> dict:
	return {
		"connected": connection_state.connected,
		"armed": vehicle_state.armed,
		"mode": vehicle_state.mode,
	}


@app.post("/api/vehicle/arm")
async def arm_vehicle() -> dict:
	await send_arm_command(True)
	return {"ok": True, "armed": vehicle_state.armed}


@app.post("/api/vehicle/disarm")
async def disarm_vehicle() -> dict:
	await send_arm_command(False)
	return {"ok": True, "armed": vehicle_state.armed}


@app.post("/api/vehicle/mode")
async def set_vehicle_mode(payload: SetModeRequest) -> dict:
	cm = ensure_connected_manager()
	mode = payload.mode.upper()

	mode_mapping = cm.mavlink.mode_mapping()
	if not mode_mapping or mode not in mode_mapping:
		raise HTTPException(status_code=400, detail=f"Unsupported mode: {mode}")

	cm.mavlink.set_mode(mode_mapping[mode])
	vehicle_state.mode = mode
	return {"ok": True, "mode": vehicle_state.mode}


@app.post("/api/vehicle/command")
async def send_vehicle_command(payload: CommandRequest) -> dict:
	ensure_connected_manager()
	return {"ok": True, "command": payload.command, "params": payload.params}


@app.post("/api/vehicle/motor-test")
async def motor_test_vehicle(payload: MotorTestRequest) -> dict:
	await send_motor_test_command(
		motor_number=payload.motor_number,
		throttle_percent=payload.throttle_percent,
		duration_sec=payload.duration_sec,
	)
	return {
		"ok": True,
		"motor_number": payload.motor_number,
		"throttle_percent": payload.throttle_percent,
		"duration_sec": payload.duration_sec,
	}


@app.post("/api/vehicle/rtl")
async def rtl_vehicle() -> dict:
	return await set_vehicle_mode(SetModeRequest(mode="RTL"))


@app.post("/api/vehicle/land")
async def land_vehicle() -> dict:
	return await set_vehicle_mode(SetModeRequest(mode="LAND"))


@app.post("/api/vehicle/loiter")
async def loiter_vehicle() -> dict:
	return await set_vehicle_mode(SetModeRequest(mode="LOITER"))


@app.get("/api/calibration/status")
async def calibration_status() -> dict:
	items = [item.model_dump() for item in runtime_state.calibration_items.values()]
	return {"items": items}


@app.post("/api/calibration/start")
async def start_calibration(payload: CalibrationStartRequest) -> dict:
	calibration_type = payload.type.lower()

	if calibration_type not in runtime_state.calibration_items:
		raise HTTPException(status_code=404, detail=f"Unknown calibration type: {calibration_type}")

	item = runtime_state.calibration_items[calibration_type]
	item.status = "in_progress"
	item.message = "Calibration command sent"

	try:
		await send_calibration_command(calibration_type)
		item.status = "calibrated"
		item.last_calibrated = time.time()
		item.message = "Calibration acknowledged"
		return {"ok": True, "item": item.model_dump()}
	except HTTPException as error:
		item.status = "needs_calibration"
		item.message = str(error.detail)
		raise


@app.get("/api/preflight/checks")
async def preflight_checks() -> dict:
	checks, ready_for_flight = build_preflight_checks()
	return {
		"checks": [item.model_dump() for item in checks],
		"ready_for_flight": ready_for_flight,
		"timestamp": int(time.time() * 1000),
	}


@app.post("/api/preflight/run")
async def run_preflight_checks() -> dict:
	checks, ready_for_flight = build_preflight_checks()
	return {
		"checks": [item.model_dump() for item in checks],
		"ready_for_flight": ready_for_flight,
		"timestamp": int(time.time() * 1000),
	}


@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket) -> None:
	await websocket.accept()
	snapshot = default_telemetry_payload()

	try:
		while True:
			if connection_state.connected and runtime_state.connection_manager is not None:
				cm = runtime_state.connection_manager
				async with runtime_state.recv_lock:
					processed = 0
					for _ in range(MAX_MESSAGES_PER_TICK):
						msg = cm.mavlink.recv_match(blocking=False)
						if msg is None:
							break
						apply_message_to_telemetry(snapshot, msg)
						processed += 1

					if processed == 0:
						msg = await asyncio.to_thread(
							cm.mavlink.recv_match,
							blocking=True,
							timeout=BLOCKING_POLL_TIMEOUT_S,
						)
						if msg is not None:
							apply_message_to_telemetry(snapshot, msg)

				update_mode_from_connection(cm)
				snapshot["mode"] = vehicle_state.mode
				snapshot["armed"] = vehicle_state.armed
				snapshot["timestamp"] = int(time.time() * 1000)
				runtime_state.latest_telemetry = dict(snapshot)

				await websocket.send_json({"type": "telemetry", "data": snapshot})
			else:
				await websocket.send_json({"type": "connection", "data": {"connected": False}})

			await asyncio.sleep(telemetry_push_interval())
	except WebSocketDisconnect:
		return

