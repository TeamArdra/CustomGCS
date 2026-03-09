import asyncio


class MessageRateController:

    def __init__(self, connection_manager, command_sender):

        self._cm = connection_manager
        self._command_sender = command_sender

    async def set_rate(self, message_id: int, frequency_hz: float):

        if not self._cm.is_connected:
            raise RuntimeError("Vehicle not connected")

        if frequency_hz <= 0:
            interval_us = -1
        else:
            interval_us = int(1_000_000 / frequency_hz)

        await self._command_sender.command_long(
            command=511,  # MAV_CMD_SET_MESSAGE_INTERVAL
            param1=message_id,
            param2=interval_us,
        )