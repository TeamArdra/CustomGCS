#message_dispatcher.py
from collections import defaultdict
from typing import Callable, Dict, List, Any

class MessageDispatcher:
    """
    Routes MAVLink messages to registered listeners based on message type.

    Responsibilities:
    - Alllow listeners to subscribe MAVLink message types
    - Dispatch incoming messages to matching listeners
    - Isolate failures so one listener cannot break others
    """

    def __init__(self) -> None:
        
        self._listeners: Dict[str, List[Callable[[Any],None]]] = defaultdict(list)
    
    def subscribe(self, message_type: str, listener: Callable[[Any], None]) -> None:
        """
        Register a listener for a given MAVLink message type.

        """
        self._listeners[message_type].append(listener)

    def dispatch(self,message:Any)->None:
        """
        Dispatch a message to all listeners subscribed to its type.
        """

        msg_type = message.get_type()

        listeners = []

        listeners.extend(self._listeners.get(msg_type,[]))

        listeners.extend(self._listeners.get(None,[]))

        for listener in listeners:
            try:
                listener(message)
            except Exception as e:
                print("Dispatcher error:",e)