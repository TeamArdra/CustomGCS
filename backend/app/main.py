#main.py
from fastapi import FastAPI

from app.core.mavlink.connection_manager import ConnectionManager
from app.core.mavlink.message_receiver import MessageReceiver
from app.core.mavlink.message_dispatcher import MessageDispatcher
from app.core.mavlink.heartbeat_sender import HeartbeatSender
from app.core.mavlink.command_sender import CommandSender

from app.core.state.telemetry_state import TelemetryState
from app.api.state_router import get_state_router

from app.core.stream.telemetry_streamer import TelemetryStreamer
from app.core.state.parameter_cache import ParameterCache
from app.api.telemetry_ws import get_telemetry_ws_router
from app.api.command_router import get_command_router
from app.core.mavlink.mission_manager import MissionManager
from app.api.mission_router import get_mission_router

from app.core.mavlink.parameter_manager import ParameterManager
from app.api.parameter_router import get_parameter_router

from app.core.state.parameter_metadata import ParameterMetadataRegistry
from app.core.health.heartbeat_monitor import HeartbeatMonitor

from app.core.health.vehicle_health_monitor import VehicleHealthMonitor
from app.core.health.vehicle_status import VehicleStatusAggregator

from app.core.events.event_manager import EventManager
from app.core.events.alert_engine import AlertEngine

from app.core.events.event_streamer import EventStreamer
from app.api.events_ws import get_events_ws_router

from app.core.logging.mavlink_logger import MAVLinkLogger

from app.core.logging.log_manager import LogManager
from app.api.log_router import get_log_router

from app.core.mavlink.message_rate_controller import MessageRateController
from app.api.message_rate_router import get_message_rate_router

from app.core.state.health_state import HealthState
from app.api.health_router import get_health_router

from app.core.stream.health_streamer import HealthStreamer
from app.api.health_ws import get_health_ws_router

from app.core.mavlink.calibration_manager import CalibrationManager
from app.api.calibration_router import get_calibration_router
# ---------------------------------------------------
# FastAPI Application
# ---------------------------------------------------

app = FastAPI(title="Custom Autonomous GCS Backend")


# ---------------------------------------------------
# Core System Components
# ---------------------------------------------------

# Dispatcher (routes MAVLink messages)
dispatcher = MessageDispatcher()

# MAVLink connection manager
connection_manager = ConnectionManager(connection_string="udpin:0.0.0.0:14550")

# Message receiver (reads MAVLink messages from connection)
message_receiver = MessageReceiver(connection_manager,dispatcher)

# Heartbeat sender (sends GCS heartbeat to vehicle)
heartbeat_sender = HeartbeatSender(connection_manager)

# Command system
command_sender = CommandSender(connection_manager, dispatcher)

# Telemetry state model
telemetry_state = TelemetryState(dispatcher)

telemetry_streamer = TelemetryStreamer(telemetry_state)


mission_manager = MissionManager(connection_manager,dispatcher,command_sender)

parameter_cache = ParameterCache()
parameter_manager = ParameterManager(connection_manager,dispatcher,parameter_cache)

parameter_metadata = ParameterMetadataRegistry()

parameter_metadata.load_from_file("app/data/parameter_metadata.json")

heartbeat_monitor = HeartbeatMonitor(message_receiver)

vehicle_health_monitor = VehicleHealthMonitor(dispatcher)

vehicle_status = VehicleStatusAggregator(
     telemetry_state,
     heartbeat_monitor,
	 vehicle_health_monitor
)

event_manager = EventManager()

alert_engine = AlertEngine(
     vehicle_status,
	 event_manager
)

event_streamer = EventStreamer(event_manager)

mavlink_logger = MAVLinkLogger(dispatcher)

log_manager = LogManager(mavlink_logger)

message_rate_controller = MessageRateController(
	connection_manager,
    command_sender
)

health_state = HealthState(dispatcher)
health_streamer = HealthStreamer(health_state)

calibration_manager = CalibrationManager(connection_manager, command_sender)
# ---------------------------------------------------
# API Routers
# ---------------------------------------------------

app.include_router(
    get_state_router(telemetry_state),
    prefix="/api"
)

app.include_router(
    get_telemetry_ws_router(telemetry_streamer),
    prefix="/ws"
)

app.include_router(
    get_command_router(command_sender),
    prefix="/api"
)

app.include_router(
    get_mission_router(mission_manager),
    prefix="/api"
    
)

app.include_router(
    get_parameter_router(parameter_manager,parameter_metadata),
    prefix="/api"
)

app.include_router(
      get_events_ws_router(event_streamer),
      prefix="/ws"
)

app.include_router(
	get_log_router(log_manager),
    prefix="/api"
)

app.include_router(
      get_message_rate_router(message_rate_controller),
      prefix="/api"
)

app.include_router(
      get_health_router(health_state),
	  prefix="/api"
)

app.include_router(
      get_health_ws_router(health_streamer),
      prefix="/ws"
)

app.include_router(
	get_calibration_router(calibration_manager),
      prefix = "/api"
)
# ---------------------------------------------------
# Application Startup / Shutdown
# ---------------------------------------------------

@app.on_event("startup")
async def startup_event():
    """
    Initialize backend systems when FastAPI starts.
    """

    # Connect MAVLink
    await connection_manager.connect()

    # Start receiver loop
    await message_receiver.start()

    # Start heartbeat loop
    await heartbeat_sender.start()
    
    await telemetry_streamer.start()
    
    await heartbeat_monitor.start()
    
    await alert_engine.start()
    
    await health_streamer.start()
    


@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanly stop backend systems.
    """
    await telemetry_streamer.stop()
    await heartbeat_sender.stop()
    await message_receiver.stop()

    await connection_manager.disconnect()
    
    await heartbeat_monitor.stop()

    await alert_engine.stop()
    
    mavlink_logger.stop()
    
    await health_streamer.stop()
# ---------------------------------------------------
# Root Endpoint (health check)
# ---------------------------------------------------

@app.get("/")
def root():
    return {"status": "GCS backend running"}

@app.get("/api/vehicle/link")
def vehicle_link_status():
    
	return{
          "link_alive": heartbeat_monitor.link_alive
	}

@app.get("/api/vehicle/health")
def vehicle_health():
     return vehicle_health.monitor.get_health()

@app.get("/api/vehicle/status")
def get_vehicle_status():
     
	 return vehicle_status.get_status()

@app.get("/api/events")
def get_events():
      return{
            "events": event_manager.get_events()
	  }