from collections import OrderedDict


class LRUCache:
    """
    Basic caching implementation, using a Least Recently Used (LRU) approach for discarding items when the cache is full
    """

    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return None

    def set(self, key, value):
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

    def get_current_size(self):
        return len(self.cache)
