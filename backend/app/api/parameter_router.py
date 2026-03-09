from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import Query


class ParameterSetRequest(BaseModel):
    name: str
    value: float


def get_parameter_router(parameter_manager,parameter_metadata):

    router = APIRouter(prefix="/parameters", tags=["parameters"])


    # ---------------------------------------------------
    # Download all parameters (M2.2)
    # ---------------------------------------------------
    @router.get("/download")
    async def download_parameters():

        params = await parameter_manager.download_all()

        return {
            "param_count": len(params),
            "parameters": params
        }


    # ---------------------------------------------------
    # Set a parameter (M2.3)
    # ---------------------------------------------------
    @router.post("/set")
    async def set_parameter(req: ParameterSetRequest):

        value = await parameter_manager.set_parameter(
            req.name,
            req.value
        )

        return {
            "parameter": req.name,
            "new_value": value
        }
    @router.get("/cache")
    async def get_cached_parameters():

        params = parameter_manager._cache.get_all()

        return {
            "param_count": len(params),
            "parameters" : params
        }
    
    @router.get("/search")
    async def search_parameters(q: str = Query("")):

        results = parameter_manager._cache.search(q)

        return {
            "query": q,
            "count": len(results),
            "parameters": results
        }
    @router.get("/metadata/{param_name}")
    async def get_parameter_metadata(param_name: str):

        meta = parameter_metadata.get(param_name)

        if meta is None:
            return {"parameter": param_name,"metadata": None}

        return {
            "parameter": param_name,
            "metadata": meta
        }

    @router.get("/info/{param_name}")
    async def get_parameter_info(param_name: str):
        value = parameter_manager._cache.get(param_name)
        meta = parameter_metadata.get(param_name)

        return {
            "parameter": param_name,
            "value": value,
            "metadata": meta
        }
    return router