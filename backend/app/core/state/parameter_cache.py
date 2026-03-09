class ParameterCache:
    """
    In-memory parameter cache (M3.1 + M3.2)

    Responsibilities:
    - store parameters
    - provide fast lookup
    - support search
    """

    def __init__(self):
        self._params = {}

    def load(self, params: dict):
        self._params = dict(params)

    def update(self, name: str, value: float):
        self._params[name] = value

    def get(self, name: str):
        return self._params.get(name)

    def get_all(self):
        return self._params

    def count(self):
        return len(self._params)

    def search(self, query: str):

        if not query:
            return self._params

        q = query.upper()

        return {
            name: value
            for name, value in self._params.items()
            if q in name.upper()
        }