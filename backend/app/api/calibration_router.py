from fastapi import APIRouter


def get_calibration_router(calibration_manager):

    router = APIRouter()

    @router.post("/calibration/accelerometer")
    async def accel_calibration():

        return await calibration_manager.accel_calibration()


    @router.post("/calibration/compass")
    async def compass_calibration():

        return await calibration_manager.compass_calibration()


    @router.post("/calibration/level")
    async def level_calibration():

        return await calibration_manager.level_calibration()


    @router.post("/calibration/esc")
    async def esc_calibration():

        return await calibration_manager.esc_calibration()


    return router