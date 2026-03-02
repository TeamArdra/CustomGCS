import asyncio
import pytest
import time

from app.core.mavlink.message_receiver import MessageReceiver

class FakeHeartbeatMsg:
    def get_type(self):
        return "HEARTBEAT"

class FakeNonHeartbeatMsg:
    def get_type(self):
        return "ATTITUDE"

class FakeMavlink:
    def __init__(self, messages):
        self._messages = messages
    
    def recv_match(self,blocking=False):
        if self._messages:
            return self._messages.pop(0)
        return None


class FakeConnectionManager:
    def __init__(self,connected=True, messages=None):
        self._connected = connected
        self._mavlink = FakeMavlink(messages or [])
    
    @property
    def is_connected(self):
        return self._connected
    
    @property
    def mavlink(self):
        return self._mavlink

@pytest.mark.asyncio
async def test_start_requires_active_connection():
    cm = FakeConnectionManager(connected=False)
    rx = MessageReceiver(cm)

    with pytest.raises(Exception):
        await rx.start()

@pytest.mark.asyncio
async def test_double_start_raises():
    cm = FakeConnectionManager(connected=True)
    rx = MessageReceiver(cm)

    await rx.start()

    with pytest.raises(Exception):
        await rx.start()

@pytest.mark.asyncio
async def test_start_creates_rx_task():
    cm = FakeConnectionManager(connected=True)
    rx = MessageReceiver(cm)

    await rx.start()

    assert rx._rx_task is not None

    await rx.stop()

@pytest.mark.asyncio
async def test_heartbeat_updates_last_rx_time():
    fake_msg = FakeHeartbeatMsg()
    cm = FakeConnectionManager(connected=True,messages=[fake_msg])
    rx = MessageReceiver(cm)

    before = rx._last_rx_time

    await rx.start()
    await asyncio.sleep(0.01)
    await rx.stop()

    assert rx._last_rx_time is not None
    assert rx._last_rx_time != before

@pytest.mark.asyncio
async def test_non_heartbeat_does_not_update_last_rx_time():
    fake_msg = FakeNonHeartbeatMsg()
    cm = fake_msg = FakeConnectionManager(
        connected=True,
        messages=[fake_msg],
    )
    rx = MessageReceiver(cm)
    
    before = rx._last_rx_time

    await rx.start()
    await asyncio.sleep(0.01)
    await rx.stop()

    assert rx._last_rx_time == before

@pytest.mark.asyncio
async def test_stop_is_idempotent():
    cm = FakeConnectionManager(connected=True)
    rx = MessageReceiver(cm)

    await rx.start()
    await rx.stop()
    await rx.stop()

    assert rx._rx_task is None or rx._rx_task.cancelled()