"""YOLOv8 person detection with a configurable confidence threshold."""
from dataclasses import dataclass

import numpy as np

PERSON_CLASS_ID = 0


@dataclass
class Detection:
    bbox: tuple[int, int, int, int]  # x, y, w, h
    confidence: float
    class_id: int = PERSON_CLASS_ID

    @property
    def centroid(self) -> tuple[int, int]:
        x, y, w, h = self.bbox
        return x + w // 2, y + h // 2


class PersonDetector:
    """Wraps an Ultralytics YOLOv8 model; loads lazily so imports stay cheap."""

    def __init__(self, model_path: str = "yolov8n.pt", confidence: float = 0.45):
        self.model_path = model_path
        self.confidence = confidence
        self._model = None

    def _ensure_model(self):
        if self._model is None:
            from ultralytics import YOLO  # imported lazily

            self._model = YOLO(self.model_path)
        return self._model

    def detect(self, frame: np.ndarray) -> list[Detection]:
        model = self._ensure_model()
        results = model(frame, verbose=False)[0]
        detections: list[Detection] = []
        for box in results.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            if cls != PERSON_CLASS_ID or conf < self.confidence:
                continue
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0])
            detections.append(
                Detection(bbox=(x1, y1, x2 - x1, y2 - y1), confidence=conf)
            )
        return detections
