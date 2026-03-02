import pytest
import asyncio

from unittest.mock import MagicMock
from app.core.mavlink.command_sender import CommandSender

class FakeConnectionManager:
    def __init__(self):
        self.is_connected = False
        self.mavlink = MagicMock()
        self.mavlink.mav = MagicMock()

class FakeCommandAck:
    def __init__(self,command):
        self.command = command
    
    def get_type(self):
        return "COMMAND_ACK"

class FakeDispatcher:
    def __init__(self):
        self.listener = None
    
    def subscribe(self,msg_type,listener):
        if msg_type == "COMMAND_ACK":
            self.listener = listener

    def dispatch(self,msg):
        if self.listener:
            self.listener(msg)
        
@pytest.mark.asyncio
async def test_send_command_fails_when_not_connected():
    cm = FakeConnectionManager()
    dispatcher = FakeDispatcher()
    sender = CommandSender(cm,dispatcher)


    with pytest.raises(RuntimeError):
        await sender.send_command(command_id=400)

@pytest.mark.asyncio
async def test_send_command_calls_mavlink():
    cm = FakeConnectionManager()
    cm.is_connected = True
    dispatcher = FakeDispatcher()
    sender = CommandSender(cm, dispatcher)

    # Start command but do NOT await completion
    task = asyncio.create_task(sender.send_command(command_id=400))

    # Let the coroutine run until the send happens
    await asyncio.sleep(0)

    cm.mavlink.mav.command_long_send.assert_called_once()

    # Cleanup: cancel task to avoid timeout
    task.cancel()
    
@pytest.mark.asyncio
async def test_send_command_waits_for_ack():
    cm = FakeConnectionManager()
    cm.is_connected = True
    dispatcher = FakeDispatcher()

    sender = CommandSender(cm,dispatcher)

    async def send_and_wait():
        return await sender.send_command(command_id=400)
    
    task = asyncio.create_task(send_and_wait())

    await asyncio.sleep(0)

    ack = FakeCommandAck(command=400)
    dispatcher.dispatch(ack)

    result = await task
    assert result == ack

@pytest.mark.asyncio
async def test_only_matching_ack_resolves_command():
    cm = FakeConnectionManager()
    cm.is_connected = True
    dispatcher = FakeDispatcher()
    sender = CommandSender(cm,dispatcher)

    task = asyncio.create_task(sender.send_command(command_id=400))
    await asyncio.sleep(0)

    wrong_ack = FakeCommandAck(command=401)
    dispatcher.dispatch(wrong_ack)

    assert not task.done()

    correct_ack = FakeCommandAck(command=400)
    dispatcher.dispatch(correct_ack)

    result = await task
    assert result == correct_ack

@pytest.mark.asyncio
async def test_command_times_out_if_no_ack():
    cm = FakeConnectionManager()
    cm.is_connected = True
    dispatcher = FakeDispatcher()
    sender = CommandSender(cm,dispatcher,timeout_s=0.05)

    with pytest.raises(RuntimeError):
        await sender.send_command(command_id=400)

@pytest.mark.asyncio
async def test_unexpected_ack_is_ignored():
    cm = FakeConnectionManager()
    cm.is_connected = True
    dispatcher = FakeDispatcher()
    sender = CommandSender(cm,dispatcher)

    ack = FakeCommandAck(command=400)
    dispatcher.dispatch(ack)
    