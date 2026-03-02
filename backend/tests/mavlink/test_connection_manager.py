# backend/tests/mavlink/test_connection_manager.py

import asyncio
import pytest
from unittest.mock import MagicMock, patch

from app.core.mavlink.connection_manager import ConnectionManager

@pytest.mark.asyncio
async def test_connect_success_sets_target_ids():
    """
    On successful connection:
    - connect() should complete
    - target_system and target_component must be set
    - is_connected must be True
    """
    fake_mav =  MagicMock()
    fake_mav.target_system = 1
    fake_mav.target_component = 1

    with patch("app.core.mavlink.connection_manager.mavutil.mavlink_connection") as mock_conn:
        mock_conn.return_value = fake_mav
        fake_mav.wait_heartbeat.return_value = True

        cm = ConnectionManager("udp:127.0.0.1:14550")
        await cm.connect()

        assert cm.is_connected is True
        assert cm.target_system == 1
        assert cm.target_component == 1
        assert cm.mavlink is fake_mav

@pytest.mark.asyncio
async def test_connect_timeout_raises():
    """
    If heartbeat is not received within timeout,
    connect() must raise an exception.
    """
    fake_mav = MagicMock()

    with patch("app.core.mavlink.connection_manager.mavutil.mavlink_connection") as mock_conn:
        mock_conn.return_value = fake_mav
        fake_mav.wait_heartbeat.side_effect = TimeoutError

        cm =  ConnectionManager("udp:127.0.0.1:14550")

        with pytest.raises(Exception):
            await cm.connect()
        
        assert cm.is_connected is False

@pytest.mark.asyncio
async def test_double_connect_raises():
    """
    Calling connect() twice without disconnect()
    must raise an invalid state exception.
    """

    fake_mav = MagicMock()
    fake_mav.target_system = 1
    fake_mav.target_component = 1
    fake_mav.wait_heartbeat.return_value = True

    with patch("app.core.mavlink.connection_manager.mavutil.mavlink_connection") as mock_conn:
        mock_conn.return_value = fake_mav

        cm = ConnectionManager("udp:127.0.0.1:14550")
        await cm.connect()

        with pytest.raises(Exception):
            await cm.connect()

@pytest.mark.asyncio
async def test_disconnect_idempotent():
    """
    disconnect() should be safe to call multiple times.
    """
    fake_mav = MagicMock()
    fake_mav.target_system = 1
    fake_mav.target_component = 1
    fake_mav.wait_heartbeat.return_value = True

    with patch("app.core.mavlink.connection_manager.mavutil.mavlink_connection") as mock_conn:
        mock_conn.return_value = fake_mav

        cm = ConnectionManager("udp:127.0.0.1:14550")
        await cm.connect()

        await cm.disconnect()
        await cm.disconnect()

        assert cm.is_connected is False


def test_accessors_before_connect_fail():
    """
    Accessing target IDs before connect() must fail.
    """
    cm = ConnectionManager("udp;127.0.0.1:14550")

    with pytest.raises(Exception):
        _ = cm.target_system
    
    with pytest.raises(Exception):
        _ = cm.target_component

    with pytest.raises(Exception):
        _ = cm.mavlink