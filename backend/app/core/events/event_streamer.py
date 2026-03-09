import asyncio


class EventStreamer:
    """
    M5.3 — Streams events to WebSocket clients
    """

    def __init__(self, event_manager):

        self._event_manager = event_manager
        self._clients = set()

        # subscribe to event manager
        event_manager.subscribe(self._on_event)

    async def connect(self, websocket):

        await websocket.accept()
        self._clients.add(websocket)

    def disconnect(self, websocket):

        self._clients.discard(websocket)

    def _on_event(self, event):

        asyncio.create_task(self._broadcast(event))

    async def _broadcast(self, event):

        for ws in list(self._clients):

            try:
                await ws.send_json(event)
            except Exception:
                self._clients.discard(ws)