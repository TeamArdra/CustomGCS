import asyncio
from typing import Set

from fastapi import WebSocket

from app.core.state.state_snapshot import TelemetrySnapshot


class TelemetryStreamer:
    """
    Streams telemetry snapshots to connected websocket clients.
    """

    def __init__(self, telemetry_state, interval_s: float = 0.1):

        self._state = telemetry_state
        self._interval = interval_s

        self._clients: Set[WebSocket] = set()

        self._running = False
        self._task: asyncio.Task | None = None


    async def register(self, websocket: WebSocket):

        await websocket.accept()

        self._clients.add(websocket)


    async def unregister(self, websocket: WebSocket):

        self._clients.discard(websocket)


    async def start(self):

        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._stream_loop())


    async def stop(self):

        if not self._running:
            return

        self._running = False

        if self._task:
            self._task.cancel()

            try:
                await self._task
            except asyncio.CancelledError:
                pass


    async def _stream_loop(self):

        try:

            while self._running:

                snapshot = TelemetrySnapshot(self._state)
                data = snapshot.to_dict()

                dead_clients = []

                for ws in self._clients:

                    try:
                        await ws.send_json(data)

                    except Exception:
                        dead_clients.append(ws)

                for ws in dead_clients:
                    await self.unregister(ws)

                await asyncio.sleep(self._interval)

        except asyncio.CancelledError:
            pass