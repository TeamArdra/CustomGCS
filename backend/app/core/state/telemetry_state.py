#telemetry_state.py
class TelemetryState:

    def __init__(self,dispatcher):
        self._dispatcher = dispatcher

        self._is_armed = False
        self._mode = None
        self._system_status = None

        self._roll = 0.0
        self._pitch = 0.0
        self._yaw = 0.0

        self._latitude = None
        self._longtitude = None
        self._altitude = None

        self._battery_voltage = None

        self._dispatcher.subscribe("HEARTBEAT",self._handle_heartbeat)
        self._dispatcher.subscribe("ATTITUDE",self._handle_attitude)
        self._dispatcher.subscribe("GLOBAL_POSITION_INT",self._handle_global_position)
        self._dispatcher.subscribe("SYS_STATUS",self._handle_sys_status)
    
    def _handle_heartbeat(self,msg):
        
        self._is_armed = bool(msg.base_mode & 128)

        self._mode = msg.custom_mode
        self._system_status = msg.system_status
    
    def _handle_attitude(self,msg):
        self._roll = msg.roll
        self._pitch = msg.pitch
        self._yaw = msg.yaw
    
    def _handle_global_position(self,msg):
        self._latitude = msg.lat/1e7
        self._longtitude = msg.lon/1e7
        self._altitude = msg.alt / 1000.0
    
    def _handle_sys_status(self,msg):
        self._battery_voltage = msg.voltage_battery/1000

        if self._system_status is None:
            self._system_status = msg.system_status
    
    def _handle_message(self,msg):
        """
        Route incoming MAVLink messages to appropriate handlers.
        """
        msg_type = msg.get_type()

        if msg_type == "HEARTBEAT":
            self._handle_heartbeat(msg)
        
        elif msg_type == "ATTITUDE":
            self._handle_attitude(msg)
        
        elif msg_type == "GLOBAL_POSITION_INT":
            self._handle_global_position(msg)
        
        elif msg_type == "SYS_STATUS":
            self._handle_sys_status(msg)
        
    
    @property
    def is_armed(self):
        return self._is_armed
    
    @property
    def mode(self):
        return self._mode
    
    @property
    def system_status(self):
        return self._system_status
    
    @property
    def roll(self):
        return self._roll
    
    @property
    def pitch(self):
        return self._pitch
    
    @property
    def yaw(self):
        return self._yaw
    
    @property
    def latitude(self):
        return self._latitude
    
    @property
    def longtitude(self):
        return self._longtitude
    
    @property
    def altitude(self):
        return self._altitude
    
    @property
    def battery_voltage(self):
        return self._battery_voltage