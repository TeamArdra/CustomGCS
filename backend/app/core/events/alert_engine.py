import asyncio


class AlertEngine:
    """
    M5.2 — Generates alerts from vehicle status
    """

    def __init__(self, vehicle_status, event_manager):

        self._vehicle_status = vehicle_status
        self._events = event_manager

        self._running = False
        self._task = None

        self._last_link_state = True

    async def _loop(self):

        while self._running:

            status = self._vehicle_status.get_status()

            link_alive = status["link"]["link_alive"]
            health = status["health"]

            # Link lost
            if not link_alive and self._last_link_state:
                self._events.add_event(
                    "CRITICAL",
                    "Vehicle link lost"
                )

            if link_alive and not self._last_link_state:
                self._events.add_event(
                    "INFO",
                    "Vehicle link restored"
                )

            self._last_link_state = link_alive

            # Battery warning
            if health["battery_ok"] is False:
                self._events.add_event(
                    "WARNING",
                    "Battery voltage low"
                )

            # GPS warning
            if health["gps_lock"] is False:
                self._events.add_event(
                    "WARNING",
                    "GPS lock lost"
                )

            # EKF warning
            if health["ekf_ok"] is False:
                self._events.add_event(
                    "WARNING",
                    "EKF not healthy"
                )

            await asyncio.sleep(2)

    async def start(self):

        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self):

        self._running = False

        if self._task:
            self._task.cancel()

            try:
                await self._task
            except asyncio.CancelledError:
                pass