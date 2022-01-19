# (c) Copyright IBM Corporation 2020.

# LICENSE: Apache License 2.0 (Apache-2.0)
# http://www.apache.org/licenses/LICENSE-2.0

from lrtc_lib.data_access.data_access_api import DataAccessApi
from lrtc_lib.data_access.data_access_in_memory import DataAccessInMemory


def get_data_access() -> DataAccessApi:
    return DataAccessInMemory()
