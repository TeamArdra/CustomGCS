from pathlib import Path
from pprint import pformat

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .mission_template_store import CODE_MISSION_TEMPLATE


class MissionUploadRequest(BaseModel):
    items: list[dict] = Field(default_factory=list)


def _clone_mission(items: list[dict]) -> list[dict]:
    return [dict(item) for item in items]


def _persist_code_mission_template(items: list[dict]) -> None:
    target = Path(__file__).with_name("mission_template_store.py")
    content = "CODE_MISSION_TEMPLATE = " + pformat(items, width=100, sort_dicts=False) + "\n"
    target.write_text(content, encoding="utf-8")


def _validate_mission_items(items: list[dict]) -> list[dict]:
    if not items:
        raise HTTPException(status_code=422, detail="Mission items cannot be empty")

    normalized: list[dict] = []
    required_fields = {"frame", "command", "x", "y", "z"}

    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise HTTPException(status_code=422, detail=f"Mission item at index {index} must be an object")

        if not required_fields.issubset(item.keys()):
            missing = sorted(list(required_fields - set(item.keys())))
            raise HTTPException(
                status_code=422,
                detail=f"Mission item at index {index} is missing required fields: {', '.join(missing)}",
            )

        try:
            normalized.append(
                {
                    "frame": int(item["frame"]),
                    "command": int(item["command"]),
                    "param1": float(item.get("param1", 0)),
                    "param2": float(item.get("param2", 0)),
                    "param3": float(item.get("param3", 0)),
                    "param4": float(item.get("param4", 0)),
                    "x": float(item["x"]),
                    "y": float(item["y"]),
                    "z": float(item["z"]),
                }
            )
        except (TypeError, ValueError) as error:
            raise HTTPException(
                status_code=422,
                detail=f"Mission item at index {index} has invalid numeric values",
            ) from error

    return normalized


def get_mission_router(mission_manager):

    router = APIRouter()
    queued_mission: list[dict] = _clone_mission(CODE_MISSION_TEMPLATE)

    @router.post("/mission/upload")
    async def upload_mission(payload: MissionUploadRequest | None = None):
        nonlocal queued_mission

        if payload is None:
            mission = _validate_mission_items(_clone_mission(CODE_MISSION_TEMPLATE))
            source = "code"
        else:
            if not payload.items:
                raise HTTPException(status_code=422, detail="Mission items cannot be empty")
            mission = _validate_mission_items(payload.items)
            source = "payload"

            # Keep template in memory and persist into a .py file.
            CODE_MISSION_TEMPLATE.clear()
            CODE_MISSION_TEMPLATE.extend(_clone_mission(mission))
            _persist_code_mission_template(CODE_MISSION_TEMPLATE)

        # Always keep latest mission in memory so upload works while disconnected.
        queued_mission = list(mission)

        try:
            result = await mission_manager.upload(mission)
            queued = False
            synced_to_vehicle = True
        except RuntimeError:
            # Offline path: mission is queued server-side and can be synced later.
            result = None
            queued = True
            synced_to_vehicle = False

        return {
            "mission_upload": result,
            "mission_count": len(mission),
            "source": source,
            "queued": queued,
            "synced_to_vehicle": synced_to_vehicle,
        }
    
    @router.get("/mission/download")
    async def download_mission():
        nonlocal queued_mission

        try:
            mission = await mission_manager.download()
            queued = False
            source = "vehicle"
        except RuntimeError:
            mission = queued_mission
            queued = True
            source = "queued"

        return {
            "mission_count": len(mission),
            "items": mission,
            "queued": queued,
            "source": source,
        }

    @router.delete("/mission/clear")
    async def clear_mission():
        nonlocal queued_mission

        queued_mission = []

        try:
            result = await mission_manager.clear()
            return {
                "mission_clear": result,
                "queued": False,
            }
        except RuntimeError:
            return {
                "mission_clear": "queued_mission_cleared",
                "queued": True,
            }

    @router.post("/mission/start")
    async def start_mission():

        result = await mission_manager.start()

        return {
            "mission_start": result
        }
    return router