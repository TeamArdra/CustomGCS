from fastapi import APIRouter, WebSocket, WebSocketDisconnect

def get_health_ws_router(streamer):

    router = APIRouter()

    @router.websocket("/health")

    async def health_ws(websocket: WebSocket):

        await streamer.register(websocket)

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await streamer.unregister(websocket)

    return router