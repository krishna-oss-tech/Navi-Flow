import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from app.domain.models import AuditEvent, AuditEventType

class AuditTrailManager:
    """
    Immutable Audit Trail for Nagpur Traffic Operations.
    Logs every system decision, operator override, deployment acceptance, and simulation execution.
    """

    def __init__(self):
        self._events: List[AuditEvent] = []

    def record_event(
        self,
        event_type: AuditEventType,
        summary: str,
        actor: str = "HUMAN_OPERATOR",
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        event = AuditEvent(
            eventId=f"audit_{int(time.time()*1000)}_{len(self._events)+1}",
            eventType=event_type,
            actor=actor,
            summary=summary,
            details=details or {},
            timestamp=datetime.now(timezone.utc),
        )
        # Append-only immutable log
        self._events.append(event)
        return event

    def get_events(self, limit: int = 50) -> List[AuditEvent]:
        return list(reversed(self._events[-limit:]))

    def clear(self):
        """Used strictly for test teardowns."""
        self._events.clear()

audit_trail = AuditTrailManager()
