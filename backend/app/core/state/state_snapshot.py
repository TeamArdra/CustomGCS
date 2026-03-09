#state_snapshot.py
class TelemetrySnapshot:

    def __init__(self, state):

        self._data = {
            "armed": state.is_armed,
            "mode": state.mode,
            "system_status": state.system_status,
            "roll": state.roll,
            "pitch": state.pitch,
            "yaw": state.yaw,
            "latitude": state.latitude,
            "longtitude": state.longtitude,
            "altitude": state.altitude,
            "battery_voltage": state.battery_voltage,
        }

    def to_dict(self):

        return dict(self._data)