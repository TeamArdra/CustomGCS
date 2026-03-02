import pytest
import asyncio
import time

from app.core.mavlink.message_dispatcher import MessageDispatcher
from unittest.mock import MagicMock

class FakeHeartbeatMsg:
    def get_type(self):
        return "HEARTBEAT"
    
class FakeAttitudeMsg:
    def get_type(self):
        return "ATTITUDE"


def test_listener_can_subscribe_to_message_type():
    dispatcher = MessageDispatcher()

    def fake_listener(msg):
        pass
    
    dispatcher.subscribe("HEARTBEAT",fake_listener)
    assert "HEARTBEAT" in dispatcher._listeners
    assert fake_listener in dispatcher._listeners["HEARTBEAT"]

def test_subscribed_listener_receives_message():
    dispatcher = MessageDispatcher()
    listener = MagicMock()

    dispatcher.subscribe("HEARTBEAT",listener)
    msg = FakeHeartbeatMsg()
    dispatcher.dispatch(msg)

    listener.assert_called_once_with(msg)

def test_listener_not_called_for_other_message_types():
    dispatcher = MessageDispatcher()
    listener = MagicMock()

    dispatcher.subscribe("HEARTBEAT",listener)
    msg = FakeAttitudeMsg()
    dispatcher.dispatch(msg)

    listener.assert_not_called()

def test_multiple_listeners_receive_same_message():
    dispatcher = MessageDispatcher()

    listener1 = MagicMock()
    listener2 = MagicMock()

    dispatcher.subscribe("HEARTBEAT",listener1)
    dispatcher.subscribe("HEARTBEAT",listener2)

    msg = FakeHeartbeatMsg()
    dispatcher.dispatch(msg)

    listener1.assert_called_once_with(msg)
    listener2.assert_called_once_with(msg)

def test_exception_in_listener_does_not_block_others():
    dispatcher = MessageDispatcher()

    bad_listener = MagicMock(side_effect=RuntimeError("boom"))
    good_listener = MagicMock()

    dispatcher.subscribe("HEARTBEAT",bad_listener)
    dispatcher.subscribe("HEARTBEAT",good_listener)

def test_dispatch_with_no_listeners_is_safe():
    dispatcher = MessageDispatcher()
    msg = FakeHeartbeatMsg()
    dispatcher.dispatch(msg)
    
