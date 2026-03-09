from fastapi import APIRouter
from app.core.state.state_snapshot import TelemetrySnapshot

router = APIRouter()


def get_state_router(telemetry_state):
    """
    Factory to create a router bound to a specific TelemetryState instance.
    """

    @router.get("/state")
    def get_state():

        snapshot = TelemetrySnapshot(telemetry_state)

        return snapshot.to_dict()

    return router