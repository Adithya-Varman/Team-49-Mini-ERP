from ._base import BaseRepository


class AuditRepository(BaseRepository):
    COLLECTION = "audit_logs"
