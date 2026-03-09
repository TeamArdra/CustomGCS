import asyncio


class ParameterManager:

    def __init__(self, connection_manager, dispatcher,cache):

        self._cm = connection_manager
        self._dispatcher = dispatcher
        self._cache = cache

        self._params = {}
        self._download_future = None
        self._expected_count = None
        self._pending_sets = {}

        dispatcher.subscribe("PARAM_VALUE", self.handle_param_value)


    async def download_all(self):

        if not self._cm.is_connected:
            raise RuntimeError("Vehicle not connected")

        loop = asyncio.get_running_loop()
        self._loop = loop
        self._download_future = loop.create_future()

        self._params = {}
        self._expected_count = None

        self._cm.mavlink.mav.param_request_list_send(
            self._cm.mavlink.target_system,
            self._cm.mavlink.target_component
        )

        return await asyncio.wait_for(self._download_future, timeout=30)
    
    async def set_parameter(self, name: str, value: float):

        if not self._cm.is_connected:
            raise RuntimeError("Vehicle not connected")

        loop = asyncio.get_running_loop()
        future = loop.create_future()

        # Track pending parameter update
        self._pending_sets[name] = future

        # Send PARAM_SET
        self._cm.mavlink.mav.param_set_send(
            self._cm.target_system,
            self._cm.target_component,
            name.encode("utf-8"),
            float(value),
            9  # MAV_PARAM_TYPE_REAL32
        )

        # Immediately request confirmation
        self._cm.mavlink.mav.param_request_read_send(
            self._cm.target_system,
            self._cm.target_component,
            name.encode("utf-8"),
            -1
        )

        return await asyncio.wait_for(future, timeout=5)
    
    def handle_param_value(self, msg):
        param_id = msg.param_id

        if isinstance(param_id,bytes):
            name = param_id.decode("utf-8").strip("\x00")
        else:
            name = param_id.strip("\x00")

        value = msg.param_value

        self._params[name] = value
        self._cache.update(name,value)

        if self._expected_count is None:
            self._expected_count = msg.param_count

    # Completion condition
        if (
            self._expected_count is not None
            and len(self._params) >= self._expected_count
        ):
            if self._download_future and not self._download_future.done():
                self._cache.load(self._params)
                self._loop.call_soon_threadsafe(
                    self._download_future.set_result,
                    self._params
                )
        if name in self._pending_sets:

            future = self._pending_sets.pop(name)

            if not future.done():
                self._loop.call_soon_threadsafe(
                    future.set_result,
                    msg.param_value
                )