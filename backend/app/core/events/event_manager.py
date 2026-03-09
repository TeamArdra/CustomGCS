import time


class EventManager:
    """
    M5.1 — Event storage and management
    """

    def __init__(self):

        self._events = []
        self._max_events = 100
        self._listeners = []

    def add_event(self, level: str, message: str):

        event = {
            "timestamp": time.time(),
            "level": level,
            "message": message
        }

        self._events.append(event)

        if len(self._events) > self._max_events:
            self._events.pop(0)

        # notify listeners
        for listener in self._listeners:
            listener(event)

    def get_events(self):
        return list(self._events)

    def subscribe(self, listener):
        self._listeners.append(listener)