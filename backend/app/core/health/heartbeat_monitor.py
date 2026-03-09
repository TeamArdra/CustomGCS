import asyncio
import time


class HeartbeatMonitor:
    """
    M4.1 — Vehicle heartbeat watchdog

    Detects loss of MAVLink heartbeat.
    """

    def __init__(self, message_receiver, timeout=5.0):

        self._receiver = message_receiver
        self._timeout = timeout

        self._running = False
        self._task = None

        self._link_alive = True

    async def _monitor_loop(self):

        while self._running:

            last = self._receiver._last_rx_time

            if last is None:
                await asyncio.sleep(1)
                continue

            elapsed = time.monotonic() - last

            if elapsed > self._timeout:
                self._link_alive = False
            else:
                self._link_alive = True

            await asyncio.sleep(1)

    async def start(self):

        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._monitor_loop())

    async def stop(self):

        self._running = False

        if self._task:
            self._task.cancel()

            try:
                await self._task
            except asyncio.CancelledError:
                pass

    @property
    def link_alive(self):

        return self._link_alive