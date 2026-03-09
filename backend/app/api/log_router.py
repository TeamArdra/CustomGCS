from fastapi import APIRouter
from fastapi.responses import FileResponse


def get_log_router(log_manager):

    router = APIRouter()

    @router.post("/logs/start")
    async def start_log():

        filename = log_manager.start_logging()

        return {"log_started": filename}

    @router.post("/logs/stop")
    async def stop_log():

        filename = log_manager.stop_logging()

        return {"log_stopped": filename}

    @router.get("/logs")
    async def list_logs():

        return {"logs": log_manager.list_logs()}

    @router.get("/logs/{filename}")
    async def download_log(filename: str):

        path = log_manager.get_log_path(filename)

        return FileResponse(path)

    @router.delete("/logs/{filename}")
    async def delete_log(filename: str):

        log_manager.delete_log(filename)

        return {"deleted": filename}

    return router