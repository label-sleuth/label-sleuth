from lrtc_lib.data_access.data_access_api import DataAccessApi
from lrtc_lib.data_access.file_based.file_based_data_access import FileBasedDataAccess


def get_data_access() -> DataAccessApi:
    return FileBasedDataAccess()
