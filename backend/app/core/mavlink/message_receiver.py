import asyncio
import time
from typing import Optional

class MessageReceiver:
    """
    Background MAVLink message receiver (M1.3).

    Responsibilites:
    - Continously receive MAVLink messages
    - Track last recieved HEARTBEAT timestamp
    - Run as a managed async background task
    """
    def __init__(self,connection_manager):
        self._cm = connection_manager

        self._running: bool = False
        self._rx_task: Optional[asyncio.Task] = None

        self._last_rx_time: Optional[float] = None

    async def _rx_loop(self) -> None:
        try:
            while self._running:
                msg = self._cm.mavlink.recv_match(blocking=False)

                if msg is not None:
                    if msg.get_type() == "HEARTBEAT":
                        self._last_rx_time = time.monotonic()
                
                await asyncio.sleep(0)
        
        except asyncio.CancelledError:
            pass
    
    async def start(self) -> None:
        if not self._cm.is_connected:
            raise RuntimeError("Connection Manager is not connected")
        
        if self._running:
            raise RuntimeError("MessageReceiver already running")
        
        self._running = True
        self._last_rx_time = None

        self._rx_task = asyncio.create_task(self._rx_loop())

        await asyncio.sleep(0)

    async def stop(self) -> None:
        if not self._running:
            return
        
        self._running = False

        if self._rx_task is not None:
            self._rx_task.cancel()
            try:
                await self._rx_task
            except asyncio.CancelledError:
                pass
        
        self._rx_task = None
        
