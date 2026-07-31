from enum import Enum
from typing import Final, List


class UserRole(str, Enum):
    """
    User authorization roles.
    """

    SUPER_ADMIN = "super_admin"
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    EDITOR = "editor"
    MEMBER = "member"
    VIEWER = "viewer"
    SERVICE_ACCOUNT = "service_account"


class OrganizationPlan(str, Enum):
    """
    Subscription plan tiers for organizations.
    """

    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class MemberStatus(str, Enum):
    """
    Organization member status.
    """

    PENDING = "pending"
    ACTIVE = "active"
    REMOVED = "removed"
    SUSPENDED = "suspended"


class InvitationStatus(str, Enum):
    """
    Organization invitation status.
    """

    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class WorkspaceVisibility(str, Enum):
    """
    Workspace privacy visibility tiers.
    """

    PRIVATE = "private"
    INTERNAL = "internal"
    PUBLIC = "public"


class WorkspaceStatus(str, Enum):
    """
    Workspace operational statuses.
    """

    ACTIVE = "active"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"


class WorkspaceRole(str, Enum):
    """
    Workspace member roles.
    """

    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    CONTRIBUTOR = "contributor"
    VIEWER = "viewer"


class DocumentStatus(str, Enum):
    """
    Document operational status.
    """

    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    ARCHIVED = "archived"


class DocumentVisibility(str, Enum):
    """
    Document visibility scope.
    """

    PRIVATE = "private"
    WORKSPACE = "workspace"
    ORGANIZATION = "organization"


class DocumentProcessingStatus(str, Enum):
    """
    Document background processing state.
    """

    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


SUPPORTED_FILE_EXTENSIONS = {
    "pdf",
    "docx",
    "txt",
    "md",
    "csv",
    "xlsx",
    "json",
    "html",
    "pptx",
}


class DatasetType(str, Enum):
    """
    Supported dataset file formats.
    """

    CSV = "csv"
    XLSX = "xlsx"
    JSON = "json"
    PARQUET = "parquet"
    SQL = "sql"
    TXT = "txt"
    PDF = "pdf"
    DOCX = "docx"
    MARKDOWN = "markdown"
    HTML = "html"
    XML = "xml"


class DatasetStatus(str, Enum):
    """
    Dataset operational status.
    """

    UPLOADING = "uploading"
    READY = "ready"
    PROCESSING = "processing"
    FAILED = "failed"
    ARCHIVED = "archived"
    DELETED = "deleted"


class DatasetProcessingStatus(str, Enum):
    """
    Dataset background processing states.
    """

    PENDING = "pending"
    QUEUED = "queued"
    VALIDATING = "validating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DatasetVisibility(str, Enum):
    """
    Dataset visibility scope.
    """

    PRIVATE = "private"
    WORKSPACE = "workspace"
    ORGANIZATION = "organization"







class AIProvider(str, Enum):
    """
    Supported AI / LLM Providers.
    """

    OPENAI = "openai"
    GROQ = "groq"
    GOOGLE = "google"
    ANTHROPIC = "anthropic"


class AIModel(str, Enum):
    """
    Default AI Model identifiers.
    """

    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20241022"
    GEMINI_1_5_PRO = "gemini-1.5-pro"
    LLAMA_3_70B = "llama-3.3-70b-versatile"


class StatusEnum(str, Enum):
    """
    Standard resource and entity status values.
    """

    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    ARCHIVED = "archived"
    FAILED = "failed"


class ResponseMessages(str, Enum):
    """
    Standard HTTP response messages across API routes.
    """

    SUCCESS = "Operation completed successfully"
    CREATED = "Resource created successfully"
    ACCEPTED = "Request accepted for processing"
    UNAUTHORIZED = "Authentication credentials were not provided or are invalid"
    FORBIDDEN = "You do not have permission to perform this action"
    NOT_FOUND = "Requested resource could not be found"
    INTERNAL_ERROR = "An unexpected internal server error occurred"


# File & Storage Constraints
ALLOWED_FILE_EXTENSIONS: Final[List[str]] = [
    ".pdf",
    ".docx",
    ".txt",
    ".md",
    ".json",
    ".csv",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
]

# Pagination Defaults
DEFAULT_PAGE: Final[int] = 1
DEFAULT_PAGE_SIZE: Final[int] = 20
MAX_PAGE_SIZE: Final[int] = 100
