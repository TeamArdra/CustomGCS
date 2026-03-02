"""
MAVLink Connection Manager (M1.1)

This module is the single authority responsible for:
- Establishing a MAVLink connection to a vehicle
- Receiving the first valid heartbeat
- Locking target system and component IDs
- Exposing a validated MAVLink connection handle

No other module may create or manage a MAVLink connection.
"""

from typing import Optional

from pymavlink import mavutil


class ConnectionManager:
    """
    Manages the lifecycle of a MAVLink connection.

    States:
        - INIT        : Created, not connected
        - CONNECTING  : Attempting connection
        - CONNECTED   : Heartbeat received, IDs locked
        - CLOSED      : Disconnected / cleaned up
    """

    def __init__(
        self,
        connection_string: str,
        source_system: int = 255,
        source_component: int = 0,
    ) -> None:
        self._connection_string = connection_string
        self._source_system = source_system
        self._source_component = source_component

        # Internal connection handle (pymavlink)
        self._mavlink: Optional[mavutil.mavlink_connection] = None

        # Target vehicle identity (set after heartbeat)
        self._target_system: Optional[int] = None
        self._target_component: Optional[int] = None

        # State flag
        self._connected: bool = False

    async def connect(self) -> None:
        """
        Establish a MAVLink connection and wait for the first heartbeat.

        Must be called exactly once before use.
        """
        if self._connected:
            raise RuntimeError("Connection already established")
        
        #Create MAVLink connection
        mav = mavutil.mavlink_connection(
            self._connection_string,
            source_system=self._source_system,
            source_component=self._source_component,
        )

        #Wait for first heartbeat (blocking, mocked in tests)
        mav.wait_heartbeat()

        #Lock target IDs
        self._mavlink = mav
        self._target_system = mav.target_system
        self._target_component = mav.target_component
        self._connected = True

    async def disconnect(self) -> None:
        """
        Safely close the MAVLink connection.

        This method must be idempotent.
        """
        #If already disconnected, do nothing
        if not self._connected:
            return
        
        if self._mavlink is not None:
            try:
                self._mavlink.close()
            except Exception:
                pass
        
        #Reset all state
        self._mavlink = None
        self._target_system = None
        self._target_component = None
        self._connected = False

    @property
    def is_connected(self) -> bool:
        """Return True if the connection is established."""
        return self._connected

    @property
    def target_system(self) -> int:
        """Return the locked target system ID."""
        if not self._connected or self._target_system is None:
            raise RuntimeError("Connection not established")
        return self._target_system

    @property
    def target_component(self) -> int:
        """Return the locked target component ID."""
        if not self._connected or self._target_component is None:
            raise RuntimeError("Connection not established")
        return self._target_component

    @property
    def mavlink(self):
        """Return the active pymavlink connection."""
        if not self._connected or self._mavlink is None:
            raise RuntimeError("Connection not established")
        return self._mavlink