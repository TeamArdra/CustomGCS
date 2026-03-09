import json
from pathlib import Path


class ParameterMetadataRegistry:
    """
    Stores parameter metadata (M3.3)
    """

    def __init__(self):

        self._metadata = {}

    def load_from_file(self, path: str):

        p = Path(path)

        if not p.exists():
            return

        with open(p, "r") as f:
            self._metadata = json.load(f)

    def get(self, name: str):

        return self._metadata.get(name)

    def get_all(self):

        return self._metadata