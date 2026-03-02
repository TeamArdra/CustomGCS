import asyncio
from typing import Dict, Optional, Any

class CommandSender:
    """
    Sends MAVLink commands and waits for COMMAND_ACK responses.

    Responsibilities:
    - Enforce connection precondition
    - Send COMMAND LONG via MAVLink
    - Correlate COMMAND_ACK messages to sent commands
    - Enforce timeout on command completion
    """
    def __init__(self,connection_manager,dispatcher,timeout_s: float = 1.0):
        self._cm = connection_manager
        self._dispatcher = dispatcher
        self._timeout_s = timeout_s

        self._pending: Dict[int,asyncio.Future] = {}

        self._dispatcher.subscribe("COMMAND_ACK",self._on_command_ack)

    async def send_command(self,command_id:int) -> Any:
        
        if not self._cm.is_connected:
            raise RuntimeError("Not connected to vehicle")
        
        loop = asyncio.get_running_loop()
        future: asyncio.Future = loop.create_future()

        self._pending[command_id] = future

        self._cm.mavlink.mav.command_long_send(
            0,
            0,
            command_id,
            0,
            0, 0, 0, 0, 0, 0, 0
        )

        try:
            return await asyncio.wait_for(future, timeout=self._timeout_s)
        
        except asyncio.TimeoutError:
            self._pending.pop(command_id,None)
            raise RuntimeError("Command ACK timeout")
    
    def _on_command_ack(self,msg) -> None:

        command_id = msg.command

        future: Optional[asyncio.Future] = self._pending.get(command_id)

        if future is None or future.done():
            return
        
        future.set_result(msg)

        self._pending.pop(command_id,None)
        