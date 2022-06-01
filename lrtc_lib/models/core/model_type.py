class ModelType:
    def __init__(self, cls):
        self.cls = cls
        self.name = cls.__name__