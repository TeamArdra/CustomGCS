import time
import json


class MAVLinkLogger:
    """
    M6.1 — MAVLink telemetry logger
    """

    def __init__(self, dispatcher):

        self._file = None
        self._enabled = False

        dispatcher.subscribe(None, self._handle_message)

    def start(self, filename):

        self._file = open(filename, "w")
        self._enabled = True

    def stop(self):

        if self._file:
            self._file.close()

        self._enabled = False

    def _handle_message(self, msg):

        if not self._enabled:
            return

        entry = {
            "timestamp": time.time(),
            "type": msg.get_type(),
            "data": msg.to_dict()
        }

        self._file.write(json.dumps(entry) + "\n")