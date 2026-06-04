"""Rule-based anomaly detection with severity levels. Pure functions."""
import uuid
from datetime import datetime

from ..config import get_settings
from ..models import Event

settings = get_settings()

_EXPLANATIONS = {
    "Queue spike": "Sustained queue growth detected. Recommend opening another register.",
    "Dwell anomaly": "Dwell time deviates from baseline, suggesting interest or confusion.",
    "Camera dropout": "Camera heartbeat lost; affected zone analytics paused.",
    "Crowd density": "Person density exceeded the safe ceiling; safety escalation triggered.",
}

_ACTIONS = {
    "Queue spike": "Open an additional billing counter to recover conversion.",
    "Dwell anomaly": "Dispatch floor staff to assist customers in this zone.",
    "Camera dropout": "Restart the camera feed; failover analytics engaged.",
    "Crowd density": "Trigger crowd-control protocol and notify the floor manager.",
}


def _explain(anomaly_type: str, severity: str, store_id: str) -> str:
    body = _EXPLANATIONS.get(anomaly_type, "Anomaly detected.")
    return f"[{severity}] {store_id}: {body}"


def detect_anomalies(events: list[Event]) -> list[dict]:
    """Apply detection rules across a window of events."""
    anomalies: list[dict] = []

    for e in events:
        anomaly_type: str | None = None
        severity = "LOW"
        change = ""

        if e.event_type == "QUEUE_SPIKE":
            anomaly_type = "Queue spike"
            severity = "MEDIUM"
            change = "Queue length exceeded the configured threshold"
        elif e.dwell_ms and e.dwell_ms / 1000 > settings.high_dwell_seconds:
            anomaly_type = "Dwell anomaly"
            severity = "LOW"
            change = f"Dwell {round(e.dwell_ms / 1000)}s exceeds baseline"
        elif (
            e.confidence is not None
            and e.confidence < settings.detection_confidence_threshold
        ):
            anomaly_type = "Camera dropout"
            severity = "CRITICAL"
            change = "Detection confidence collapsed — feed unstable"

        if anomaly_type:
            anomalies.append(
                {
                    "id": f"anm_{uuid.uuid4().hex[:8]}",
                    "store_id": e.store_id,
                    "store_name": e.store_id,
                    "type": anomaly_type,
                    "severity": severity,
                    "message": f"{anomaly_type} on camera {e.camera_id}",
                    "explanation": _explain(anomaly_type, severity, e.store_id),
                    "suggested_action": _ACTIONS.get(
                        anomaly_type, "Review the affected zone."
                    ),
                    "confidence": round(e.confidence or 0.9, 2),
                    "metric_change": change,
                    "zone_id": e.zone_id,
                    "timestamp": e.timestamp or datetime.utcnow(),
                    "acknowledged": False,
                }
            )
    return anomalies
