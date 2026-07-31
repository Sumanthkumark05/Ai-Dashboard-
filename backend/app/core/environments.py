from enum import Enum


class EnvironmentType(str, Enum):
    """
    Enum representing application execution environments.
    """

    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"
