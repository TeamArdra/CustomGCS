import asyncio
import json

class HealthStreamer:

    def __init__(self, health_state):

        self._health_state = health_state
        self._clients = set()
        self._running = False
        self._task = None

    async def start(self):

        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._stream_loop())

    async def stop(self):

        self._running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def register(self, websocket):

        await websocket.accept()
        self._clients.add(websocket)

    async def unregister(self, websocket):

        if websocket in self._clients:
            self._clients.remove(websocket)

    async def _stream_loop(self):

        while self._running:

            state = self._health_state.get_state()
            message = json.dumps(state)

            dead_clients = []

            for ws in self._clients:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead_clients.append(ws)

            for ws in dead_clients:
                await self.unregister(ws)

            await asyncio.sleep(0.5)