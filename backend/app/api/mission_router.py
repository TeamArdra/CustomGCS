from fastapi import APIRouter


def get_mission_router(mission_manager):

    router = APIRouter()

    @router.post("/mission/upload")
    async def upload_mission():

        mission = [

            {
                "frame": 10,        # GLOBAL_RELATIVE_ALT
                "command": 22,     # MAV_CMD_NAV_TAKEOFF
                "param1": 0,
                "param2": 0,
                "param3": 0,
                "param4": 0,
                "x": 0,
                "y": 0,
                "z": 3
            },

            {
                "frame": 10,
                "command": 19,     # MAV_CMD_NAV_WAYPOINT
                "param1": 5,
                "param2": 2,
                "param3": 1,
                "param4": 0,
                "x": 0,
                "y": 0,
                "z": 0
            },
            {
                "frame": 10,
                "command": 21,
                "param1": 0,
                "param2": 1,
                "param3": 0,
                "param4": 0,
                "param5": 0,
                "x": 0,
                "y": 0,
                "z": 0
            }
        ]

        result = await mission_manager.upload(mission)

        return {"mission_upload": result}
    
    @router.get("/mission/download")
    async def download_mission():

        mission = await mission_manager.download()

        return {
            "mission_count": len(mission),
            "items": mission
        }
    @router.delete("/mission/clear")
    async def clear_mission():

        result = await mission_manager.clear()

        return{
            "mission_clear": result
        }

    @router.post("/mission/start")
    async def start_mission():

        result = await mission_manager.start()

        return {
            "mission_start": result
        }
    return router