"""
Heartbeat Sender (M1.2)

Responsible for:
- Periodically sending GCS heartbeats to the vehicle
- Tracking reception of vehicle heartbeats
- Reporting connection health

This module does NOT:
- Open or close connections
- Perform reconnect logic
"""

import asyncio
import time
from typing import Optional
from pymavlink import mavutil

class HeartbeatSender:
    """
    Manages GCS heartbeat transmission and vehicle heartbeat monitoring.
    """

    def __init__(
        self,
        connection_manager,
        interval_s: float = 1.0,
        timeout_s: float = 3.0,
    ) -> None:
        self._cm = connection_manager
        self._interval_s = interval_s
        self._timeout_s = timeout_s

        # Internal state
        self._running: bool = False
        self._healthy: bool = False

        self._tx_task: Optional[asyncio.Task] = None

        # Timestamp of last received vehicle heartbeat
        self._last_rx_time: Optional[float] = None
        self._mav = None
    
    async def _tx_loop(self) -> None:
        """Periodically send GCS heartbeats."""
        
        try:
            while self._running:
                self._mav.heartbeat_send(
                    mavutil.mavlink.MAV_TYPE_GCS,
                    mavutil.mavlink.MAV_AUTOPILOT_INVALID,
                    0,
                    0,
                    mavutil.mavlink.MAV_STATE_ACTIVE,
                )
                await asyncio.sleep(self._interval_s)
        except asyncio.CancelledError:
            pass

    async def start(self) -> None:
        """Start heartbeat transmission and monitoring."""
        #Must have an active connection
        if not self._cm.is_connected:
            raise RuntimeError("Connection Manager is not connected")
        
        #Prevent double start
        if self._running:
            raise RuntimeError("HeartbeatSender already running")
        
        #Mark running: tasks will be added in later steps
        self._running = True
        self._healthy = False

        self._mav = self._cm.mavlink.mav

        self._mav.heartbeat_send(
            mavutil.mavlink.MAV_TYPE_GCS,
            mavutil.mavlink.MAV_AUTOPILOT_INVALID,
            0,
            0,
            mavutil.mavlink.MAV_STATE_ACTIVE,
        )

        #Start TX heartbeat task
        self._tx_task = asyncio.create_task(self._tx_loop())

        await asyncio.sleep(0)

    async def stop(self) -> None:
        """Stop heartbeat transmission and monitoring."""

        if not self._running:
            return
        
        self._running = False
        self._healthy = False

        if self._tx_task is not None:
            self._tx_task.cancel()
            try:
                await self._tx_task
            except asyncio.CancelledError:
                pass
        self._tx_task = None

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def is_healthy(self) -> bool:
        if not self._running:
            return False
        if self._last_rx_time is None:
            return False
        return (time.monotonic() - self._last_rx_time) <= self._timeout_s