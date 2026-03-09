class VehicleHealthMonitor:
    """
    M4.2 — Vehicle Health Monitoring
    """

    def __init__(self, dispatcher):

        self._battery_voltage = None
        self._gps_fix = False
        self._ekf_ok = False
        self._system_status = None

        dispatcher.subscribe("SYS_STATUS", self._handle_sys_status)
        dispatcher.subscribe("GPS_RAW_INT", self._handle_gps)
        dispatcher.subscribe("EKF_STATUS_REPORT", self._handle_ekf)
        dispatcher.subscribe("HEARTBEAT", self._handle_heartbeat)

    def _handle_sys_status(self, msg):

        self._battery_voltage = msg.voltage_battery / 1000.0

    def _handle_gps(self, msg):

        # fix_type >= 3 means 3D GPS lock
        self._gps_fix = msg.fix_type >= 3

    def _handle_ekf(self, msg):

        # EKF good if flags != 0
        self._ekf_ok = msg.flags != 0

    def _handle_heartbeat(self, msg):

        self._system_status = msg.system_status

    def get_health(self):

        return {

            "battery_voltage": self._battery_voltage,

            "gps_lock": self._gps_fix,

            "ekf_ok": self._ekf_ok,

            "system_status": self._system_status,

            "battery_ok": (
                self._battery_voltage is not None
                and self._battery_voltage > 10.5
            )
        }