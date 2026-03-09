from fastapi import APIRouter
from app.core.mavlink.flight_modes import ARDUCOPTER_MODES

from pydantic import BaseModel

class ModeRequest(BaseModel):
    mode: str

def get_command_router(command_sender):

    router = APIRouter()

    @router.post("/arm")
    async def arm():

        await command_sender.send_command(
            command_id=400,
            params=[1,0,0,0,0,0,0]
        )  # MAV_CMD_COMPONENT_ARM_DISARM

        return {"status": "armed"}


    @router.post("/disarm")
    async def disarm():

        await command_sender.send_command(
            command_id=400,
            params=[0,0,0,0,0,0,0]
        )

        return {"status": "disarmed"}
    
    @router.post("/mode")
    async def set_mode(request: ModeRequest):

        mode_name = request.mode.upper()

        if mode_name not in ARDUCOPTER_MODES:
            raise ValueError("Invalid mode")
        
        mode_id = ARDUCOPTER_MODES[mode_name]

        await command_sender.send_command(
            command_id=176,
            params=[1,mode_id,0,0,0,0,0]
        )

        return {"mode":mode_name}



    return router