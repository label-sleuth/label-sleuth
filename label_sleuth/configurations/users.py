from dataclasses import dataclass


@dataclass
class User:
    username: str
    token: str
    password: str



