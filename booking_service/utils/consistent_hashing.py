import hashlib

class ConsistentHashing:
    def __init__(self, nodes=None, replicas=None):
        self.replicas = replicas if replicas is not None else 3
        self.ring = {}
        self.sorted_keys = []
        if nodes:
            for node in nodes:
                self.add_node(node)

    def _hash(self, key):
        return int(hashlib.sha256(key.encode('utf-8')).hexdigest(), 16)

    def add_node(self, node):
        for i in range(self.replicas):
            key = self._hash(f"{node}:{i}")
            replica_name = f"{node}:{i}"
            self.ring[key] = replica_name
            self.sorted_keys.append(key)
        self.sorted_keys.sort()

    def get_node(self, key):
        if not self.ring:
            return None
        hashed_key = self._hash(key)
        for k in self.sorted_keys:
            if hashed_key <= k:
                return self.ring[k]
        return self.ring[self.sorted_keys[0]]

