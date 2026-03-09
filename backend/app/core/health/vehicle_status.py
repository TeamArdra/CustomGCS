class VehicleStatusAggregator:
    """
    M4.3 — Unified vehicle status aggregator

    Combines telemetry, link state, and vehicle health
    into a single structure for the UI.
    """

    def __init__(self, telemetry_state, heartbeat_monitor, health_monitor):

        self._telemetry = telemetry_state
        self._heartbeat = heartbeat_monitor
        self._health = health_monitor

    def get_status(self):

        telemetry = {
            "armed": self._telemetry.is_armed,
            "mode": self._telemetry.mode,
            "system_status": self._telemetry.system_status,
            "roll": self._telemetry.roll,
            "pitch": self._telemetry.pitch,
            "yaw": self._telemetry.yaw,
            "latitude": self._telemetry.latitude,
            "longitude": self._telemetry.longtitude,
            "altitude": self._telemetry.altitude,
            "battery_voltage": self._telemetry.battery_voltage,
        }

        link = {
            "link_alive": self._heartbeat.link_alive
        }

        health = self._health.get_health()

        return {
            "link": link,
            "telemetry": telemetry,
            "health": health
        }