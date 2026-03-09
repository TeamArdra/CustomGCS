from fastapi import APIRouter, WebSocket


def get_events_ws_router(event_streamer):

    router = APIRouter()

    @router.websocket("/events")
    async def events_ws(websocket: WebSocket):

        await event_streamer.connect(websocket)

        try:
            while True:
                await websocket.receive_text()
        except Exception:
            event_streamer.disconnect(websocket)

    return router