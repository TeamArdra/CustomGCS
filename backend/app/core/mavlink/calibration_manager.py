from pymavlink import mavutil


class CalibrationManager:

    def __init__(self, connection_manager, command_sender):

        self._cm = connection_manager
        self._command_sender = command_sender


    async def accel_calibration(self):

        await self._command_sender.command_long(
            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
            0,
            0,
            0,
            0,
            1,  # accelerometer calibration
            0,
            0
        )

        return {"status": "Accelerometer calibration started"}


    async def compass_calibration(self):

        await self._command_sender.command_long(
            mavutil.mavlink.MAV_CMD_DO_START_MAG_CAL,
            0,
            0,
            1,
            0,
            0,
            0,
            0
        )

        return {"status": "Compass calibration started"}


    async def level_calibration(self):

        await self._command_sender.command_long(
            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
            0,
            0,
            0,
            0,
            0,
            0,
            2  # board level calibration
        )

        return {"status": "Level calibration started"}


    async def esc_calibration(self):

        await self._command_sender.command_long(
            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
            0,
            0,
            0,
            0,
            0,
            0,
            3  # ESC calibration
        )

        return {"status": "ESC calibration initiated"}