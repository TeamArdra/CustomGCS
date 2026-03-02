# backend/tests/mavlink/test_heartbeat_sender.py

import asyncio
import time
from unittest.mock import MagicMock, patch

import pytest

from app.core.mavlink.heartbeat_sender import HeartbeatSender


class FakeConnectionManager:
    """Minimal stand-in for ConnectionManager used by HeartbeatSender."""
    def __init__(self, connected=True):
        self._connected = connected
        self._mavlink = MagicMock()
        self._mavlink.mav = MagicMock()
        self._target_system = 1
        self._target_component = 1

    @property
    def is_connected(self):
        return self._connected

    @property
    def mavlink(self):
        if not self._connected:
            raise RuntimeError("Not connected")
        return self._mavlink

    @property
    def target_system(self):
        return self._target_system

    @property
    def target_component(self):
        return self._target_component


@pytest.mark.asyncio
async def test_start_requires_active_connection():
    cm = FakeConnectionManager(connected=False)
    hb = HeartbeatSender(cm)

    with pytest.raises(Exception):
        await hb.start()


@pytest.mark.asyncio
async def test_double_start_raises():
    cm = FakeConnectionManager(connected=True)
    hb = HeartbeatSender(cm, interval_s=0.01)

    await hb.start()
    with pytest.raises(Exception):
        await hb.start()

    await hb.stop()


@pytest.mark.asyncio
async def test_heartbeat_tx_called_periodically():
    cm = FakeConnectionManager(connected=True)
    hb = HeartbeatSender(cm, interval_s=0.01)

    # Mock the MAVLink heartbeat send
    cm.mavlink.mav.heartbeat_send = MagicMock()

    await hb.start()
    await asyncio.sleep(0.05)
    await hb.stop()

    assert cm.mavlink.mav.heartbeat_send.call_count >= 2


@pytest.mark.asyncio
async def test_health_false_before_first_rx():
    cm = FakeConnectionManager(connected=True)
    hb = HeartbeatSender(cm, interval_s=0.01, timeout_s=0.05)

    await hb.start()
    await asyncio.sleep(0.02)

    assert hb.is_healthy is False

    await hb.stop()


@pytest.mark.asyncio
async def test_health_true_after_rx():
    cm = FakeConnectionManager(connected=True)
    hb = HeartbeatSender(cm, interval_s=0.01, timeout_s=0.1)

    await hb.start()

    # Simulate receiving a vehicle heartbeat
    hb._last_rx_time = time.monotonic()

    await asyncio.sleep(0.02)
    assert hb.is_healthy is True

    await hb.stop()


@pytest.mark.asyncio
async def test_health_false_after_timeout():
    cm = FakeConnectionManager(connected=True)
    hb = HeartbeatSender(cm, interval_s=0.01, timeout_s=0.02)

    await hb.start()

    # Simulate an old heartbeat
    hb._last_rx_time = time.monotonic() - 1.0

    await asyncio.sleep(0.02)
    assert hb.is_healthy is False

    await hb.stop()


@pytest.mark.asyncio
async def test_stop_is_idempotent():
    cm = FakeConnectionManager(connected=True)
    hb = HeartbeatSender(cm, interval_s=0.01)

    await hb.start()
    await hb.stop()
    await hb.stop()  # must not raise

    assert hb.is_running is False