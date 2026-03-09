import os
import time
from pathlib import Path


class LogManager:

    def __init__(self, logger, log_dir="logs"):

        self._logger = logger
        self._log_dir = Path(log_dir)

        self._log_dir.mkdir(parents=True, exist_ok=True)

        self._active_log = None

    def start_logging(self):

        if self._active_log:
            raise RuntimeError("Logging already active")

        filename = f"flight_{int(time.time())}.json"

        filepath = self._log_dir / filename

        self._logger.start(str(filepath))

        self._active_log = filename

        return filename

    def stop_logging(self):

        if not self._active_log:
            return None

        self._logger.stop()

        finished = self._active_log
        self._active_log = None

        return finished

    def list_logs(self):

        logs = []

        for file in self._log_dir.glob("*.json"):
            logs.append(file.name)

        return logs

    def delete_log(self, filename):

        path = self._log_dir / filename

        if path.exists():
            path.unlink()

    def get_log_path(self, filename):

        return self._log_dir / filename