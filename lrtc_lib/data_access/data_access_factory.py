from lrtc_lib.data_access.data_access_api import DataAccessApi
from lrtc_lib.data_access.data_access_in_memory import DataAccessInMemory


def get_data_access() -> DataAccessApi:
    return DataAccessInMemory()
