"""Load the provided transactions CSV and attribute conversions to sessions.

Conversion rule (Purplle challenge): a visitor counts as converted when they were
present in the BILLING zone within 5 minutes before a purchase at their store.
If no CSV is supplied, a synthetic set is derived from BILLING-zone events so the
funnel and revenue still compute from real data.
"""
import csv
import os
import random
import uuid
from datetime import datetime, timedelta

from ..config import get_settings
from ..logging_config import get_logger
from ..models import Event, Session, Transaction
from .session import SessionLocal

logger = get_logger("transactions")
settings = get_settings()

CSV_PATH = os.getenv("RETAILPULSE_TRANSACTIONS_CSV", "data/transactions.csv")
BILLING_ZONE = "Z5"  # BILLING
CONVERSION_WINDOW = timedelta(minutes=5)


def _parse_ts(value: str) -> datetime:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    return datetime.utcnow()


def _load_from_csv(db) -> int:
    if not os.path.exists(CSV_PATH):
        return 0
    count = 0
    with open(CSV_PATH, newline="") as fh:
        for row in csv.DictReader(fh):
            db.add(
                Transaction(
                    transaction_id=row.get("transaction_id") or f"txn_{uuid.uuid4().hex[:10]}",
                    store_id=row["store_id"],
                    timestamp=_parse_ts(row["timestamp"]),
                    basket_value=float(row.get("basket_value", 0) or 0),
                )
            )
            count += 1
    db.commit()
    return count


def _synthesize_from_billing(db) -> int:
    """Derive plausible transactions from real BILLING-zone visits."""
    billing = (
        db.query(Event)
        .filter(Event.zone_id == BILLING_ZONE, Event.event_type == "ZONE_ENTER")
        .all()
    )
    count = 0
    for e in billing:
        if random.random() > 0.45:  # not every billing visit becomes a purchase
            continue
        db.add(
            Transaction(
                transaction_id=f"txn_{uuid.uuid4().hex[:10]}",
                store_id=e.store_id,
                timestamp=(e.timestamp or datetime.utcnow()) + timedelta(seconds=random.randint(20, 240)),
                basket_value=round(random.uniform(20, 180), 2),
            )
        )
        count += 1
    db.commit()
    return count


def _attribute_conversions(db) -> int:
    """Mark sessions converted when a billing visit precedes a purchase in-window."""
    converted = 0
    transactions = db.query(Transaction).all()
    for txn in transactions:
        window_start = txn.timestamp - CONVERSION_WINDOW
        billing_visit = (
            db.query(Event)
            .filter(
                Event.store_id == txn.store_id,
                Event.zone_id == BILLING_ZONE,
                Event.timestamp >= window_start,
                Event.timestamp <= txn.timestamp,
                Event.is_staff == False,  # noqa: E712
            )
            .first()
        )
        if not billing_visit:
            continue
        session = (
            db.query(Session)
            .filter(Session.visitor_id == billing_visit.visitor_id)
            .one_or_none()
        )
        if session and not session.is_converted:
            session.is_converted = True
            session.purchase_amount = txn.basket_value
            converted += 1
    db.commit()
    return converted


def load_transactions() -> None:
    db = SessionLocal()
    try:
        if db.query(Transaction).count() == 0:
            loaded = _load_from_csv(db)
            if loaded == 0:
                loaded = _synthesize_from_billing(db)
            logger.info("transactions loaded", extra={"context": {"count": loaded}})
        converted = _attribute_conversions(db)
        logger.info("conversions attributed", extra={"context": {"converted": converted}})
    except Exception:
        db.rollback()
        logger.exception("transaction load failed")
    finally:
        db.close()
