# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

class ModelType(object):
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        if isinstance(other, ModelType):
            return self.name == other.name
        else:
            raise TypeError(f"comparing {other.__class__} to ModelType is not allowed! ")

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return hash(self.name)


class ModelTypes(object):
    RAND = ModelType("RAND")
    HFBERT = ModelType("HFBERT") # TODO make it work. not for the first version
    SVM_OVER_GLOVE = ModelType("SVM_OVER_GLOVE")
    SVM_OVER_BOW = ModelType("SVM_OVER_BOW")
    M_SVM = ModelType("M_SVM")
    NB_OVER_GLOVE = ModelType("NB_OVER_GLOVE")
    NB_OVER_BOW = ModelType("NB_OVER_BOW")

    @classmethod
    def get_all_types(cls):
        return [v for base_class in [cls, *cls.__bases__]
                for k, v in vars(base_class).items() if not callable(getattr(cls, k)) and not k.startswith("__")]


if __name__ == '__main__':
    print([x.name for x in ModelTypes.get_all_types()])
