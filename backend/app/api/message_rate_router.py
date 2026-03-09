from fastapi import APIRouter


def get_message_rate_router(rate_controller):

    router = APIRouter()

    @router.post("/telemetry/rate")
    async def set_message_rate(message_id: int, frequency_hz: float):

        await rate_controller.set_rate(message_id, frequency_hz)

        return {
            "message_id": message_id,
            "frequency_hz": frequency_hz
        }

    return router