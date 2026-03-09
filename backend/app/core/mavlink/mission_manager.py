import asyncio


class MissionManager:

    def __init__(self, connection_manager, dispatcher,command_sender):

        self._cm = connection_manager
        self._dispatcher = dispatcher
        self._command_sender = command_sender

        self._items = []
        self._ack_future = None

        dispatcher.subscribe("MISSION_REQUEST", self._handle_request)
        dispatcher.subscribe("MISSION_ACK", self._handle_ack)

        dispatcher.subscribe("MISSION_COUNT",self._handle_count)

        dispatcher.subscribe("MISSION_ITEM",self._handle_item)
        dispatcher.subscribe("MISSION_ITEM_INT",self._handle_item)


    async def upload(self, mission_items):

        if not self._cm.is_connected:
            raise RuntimeError("Vehicle not connected")

        self._mission_items = mission_items

        loop = asyncio.get_running_loop()
        self._ack_future = loop.create_future()

        self._cm.mavlink.mav.mission_count_send(
            self._cm.target_system,
            self._cm.target_component,
            len(mission_items)
        )

        return await asyncio.wait_for(self._ack_future, timeout=10)

    async def download(self):

        if not self._cm.is_connected:
            raise RuntimeError("Vehicle not connected")
        
        loop = asyncio.get_running_loop()
        self._download_future = loop.create_future()

        self._mission_items = []
        self._expected_count = None
        
        self._cm.mavlink.mav.mission_request_list_send(
            self._cm.target_system,
            self._cm.target_component
        )

        return await asyncio.wait_for(self._download_future, timeout=10)

    async def clear(self):

        if not self._cm.is_connected:
            raise RuntimeError("Vehicle not connected")
        
        loop = asyncio.get_running_loop()
        self._ack_future = loop.create_future()

        self._cm.mavlink.mav.mission_clear_all_send(
            self._cm.target_system,
            self._cm.target_component
        )

        return await asyncio.wait_for(self._ack_future, timeout=50)
    
    async def start(self):

        if not self._cm.is_connected:
            raise RuntimeError("Vehicle not connected")
        
        result = await self._command_sender.send_command(300)
        return result
    
    def _handle_request(self, msg):

        seq = msg.seq

        if seq >= len(self._mission_items):
            return

        item = self._mission_items[seq]

        self._cm.mavlink.mav.mission_item_int_send(
            self._cm.target_system,
            self._cm.target_component,
            seq,
            item["frame"],
            item["command"],
            0,
            1,
            item["param1"],
            item["param2"],
            item["param3"],
            item["param4"],
            item["x"],
            item["y"],
            item["z"]
        )


    def _handle_ack(self, msg):

        if self._ack_future and not self._ack_future.done():
            self._ack_future.set_result(msg.type)
    
    def _handle_count(self,msg):
        self._expected_count = msg.count

        if msg.count == 0:
            if not self._download_future.done():
                self._download_future.set_result([])
            return
        
        self._cm.mavlink.mav.mission_request_int_send(
            self._cm.target_system,
            self._cm.target_component,
            0
        )
    
    def _handle_item(self,msg):
        
        if hasattr(msg,"x"):
            lat = msg.x/1e7
            lon=msg.y/1e7
        else:
            lat = msg.x
            lon = msg.y

        item = {
            "seq":msg.seq,
            "command": msg.command,
            "frame": msg.frame,
            "lat": lat,
            "lon": lon,
            "alt": msg.z
        }

        self._mission_items.append(item)

        if len(self._mission_items) < self._expected_count:

            next_seq = len(self._mission_items)

            self._cm.mavlink.mav.mission_request_int_send(
                self._cm.target_system,
                self._cm.target_component,
                next_seq
            )
        else:
            if not self._download_future.done():
                self._download_future.set_result(self._mission_items)