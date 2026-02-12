"""
SQLite database setup for energy history storage.
"""
import sqlite3
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Database file path (in backend directory)
_DB_PATH = Path(__file__).resolve().parent.parent / "energy.db"


def get_db_connection() -> sqlite3.Connection:
    """Get a connection to the SQLite database. Creates the database file if it doesn't exist."""
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Return rows as dict-like objects
    return conn


def init_db() -> None:
    """Initialize the database schema. Safe to call multiple times (idempotent)."""
    conn = get_db_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS energy_daily (
                date          DATE PRIMARY KEY,
                usage_kwh     REAL,
                cost_usd      REAL,
                created_at    TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_energy_daily_date ON energy_daily(date DESC)
        """)
        conn.commit()
        logger.info(f"Database initialized at {_DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    finally:
        conn.close()


def get_db_path() -> str:
    """Return the database file path (for debugging)."""
    return str(_DB_PATH)
