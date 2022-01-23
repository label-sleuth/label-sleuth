from collections import namedtuple
from dataclasses import dataclass

import dacite

from lrtc_lib.config import CONFIGURATION


@dataclass
class User:
    username: str
    token: str
    password: str


users = {x['username']: dacite.from_dict(data_class=User, data=x) for x in CONFIGURATION.users}

tokens = [user.token for user in users.values()]
