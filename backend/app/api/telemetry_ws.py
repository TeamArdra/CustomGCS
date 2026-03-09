from fastapi import APIRouter, WebSocket

router = APIRouter()


def get_telemetry_ws_router(streamer):

    @router.websocket("/telemetry")

    async def telemetry_stream(websocket: WebSocket):

        await streamer.register(websocket)

        try:
            while True:
                await websocket.receive_text()

        except Exception:
            pass

        finally:
            await streamer.unregister(websocket)

    return router