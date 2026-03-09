from fastapi import APIRouter

def get_health_router(health_state):

    router = APIRouter()

    @router.get("/health")

    def get_health():

        return health_state.get_state()

    return router