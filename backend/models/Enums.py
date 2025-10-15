from enum import Enum

class ScoreType(Enum):
    STANDARD = "standard"
    STEAL = "steal"


class Role(Enum):
    PLAYER = "player"
    DJ = "dj"
    STEALER = "stealer"