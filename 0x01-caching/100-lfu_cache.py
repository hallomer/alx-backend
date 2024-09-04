#!/usr/bin/env python3
""" LFUCache module
"""

from base_caching import BaseCaching
from collections import OrderedDict


class LFUCache(BaseCaching):
    """ LFUCache class
    """

    def __init__(self):
        """ Initialize
        """
        super().__init__()
        self.usage_count = {}
        self.order = OrderedDict()

    def put(self, key, item):
        """ Add an item in the cache
        """
        if key is not None and item is not None:
            if key in self.cache_data:
                self.cache_data[key] = item
                self.usage_count[key] += 1
            else:
                if len(self.cache_data) >= BaseCaching.MAX_ITEMS:
                    lfu_key = min(
                        self.usage_count,
                        key=lambda k: (self.usage_count[k], self.order[k])
                    )
                    self.cache_data.pop(lfu_key)
                    self.usage_count.pop(lfu_key)
                    self.order.pop(lfu_key)
                    print(f"DISCARD: {lfu_key}")

                self.cache_data[key] = item
                self.usage_count[key] = 1

            self.order.pop(key, None)
            self.order[key] = None

    def get(self, key):
        """ Get an item by key
        """
        if key in self.cache_data:
            self.usage_count[key] += 1
            self.order.pop(key, None)
            self.order[key] = None
            return self.cache_data[key]
        return None
