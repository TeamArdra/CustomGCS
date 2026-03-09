class HealthState:

    def __init__(self, dispatcher):

        self._is_armable = False
        self._prearm_message = None
        self._gps_fix = False
        self._ekf_ok = False
        self._battery_ok = True

        dispatcher.subscribe("STATUSTEXT", self._handle_status_text)
        dispatcher.subscribe("GPS_RAW_INT", self._handle_gps)
        dispatcher.subscribe("EKF_STATUS_REPORT", self._handle_ekf)
        dispatcher.subscribe("BATTERY_STATUS", self._handle_battery)

    def _handle_status_text(self, msg):

        text = msg.text.decode("utf-8")

        if "PreArm" in text:
            self._prearm_message = text
            self._is_armable = False

        if "Arm" in text and "ready" in text:
            self._is_armable = True

    def _handle_gps(self, msg):

        if msg.fix_type >= 3:
            self._gps_fix = True
        else:
            self._gps_fix = False

    def _handle_ekf(self, msg):

        if msg.flags > 0:
            self._ekf_ok = True
        else:
            self._ekf_ok = False

    def _handle_battery(self, msg):

        voltage = msg.voltages[0] / 1000

        if voltage < 10:
            self._battery_ok = False
        else:
            self._battery_ok = True

    def get_state(self):

        return {
            "armable": self._is_armable,
            "prearm_message": self._prearm_message,
            "gps_fix": self._gps_fix,
            "ekf_ok": self._ekf_ok,
            "battery_ok": self._battery_ok
        }