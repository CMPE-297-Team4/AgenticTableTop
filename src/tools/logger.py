"""
Centralized JSON logging utility for AgenticTableTop

All logs are formatted as JSON with timestamps for easy parsing and analysis.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs logs as JSON"""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        # Add any extra attributes
        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
                "extra_fields",
            ]:
                log_data[key] = value

        return json.dumps(log_data, ensure_ascii=False)


def setup_logger(
    name: str,
    level: int = logging.INFO,
    stream: Optional[Any] = None,
) -> logging.Logger:
    """
    Set up a logger with JSON formatting

    Args:
        name: Logger name (typically __name__)
        level: Logging level (default: INFO)
        stream: Output stream (default: sys.stdout)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    # Create handler
    handler = logging.StreamHandler(stream or sys.stdout)
    handler.setLevel(level)

    # Set JSON formatter
    handler.setFormatter(JSONFormatter())

    logger.addHandler(handler)
    logger.propagate = False

    return logger


# Default logger for the application
_default_logger = setup_logger("agentictabletop")


def log_json(
    level: str,
    message: str,
    logger: Optional[logging.Logger] = None,
    extra_fields: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log a message as JSON with optional extra fields

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        message: Log message
        logger: Logger instance (default: _default_logger)
        extra_fields: Additional fields to include in JSON log
    """
    log = logger or _default_logger
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Create a log record with extra fields
    extra = {"extra_fields": extra_fields or {}}
    log.log(log_level, message, extra=extra)


def log_info(
    message: str,
    logger: Optional[logging.Logger] = None,
    extra_fields: Optional[Dict[str, Any]] = None,
) -> None:
    """Log info message as JSON"""
    log_json("INFO", message, logger, extra_fields)


def log_error(
    message: str,
    logger: Optional[logging.Logger] = None,
    extra_fields: Optional[Dict[str, Any]] = None,
) -> None:
    """Log error message as JSON"""
    log_json("ERROR", message, logger, extra_fields)


def log_warning(
    message: str,
    logger: Optional[logging.Logger] = None,
    extra_fields: Optional[Dict[str, Any]] = None,
) -> None:
    """Log warning message as JSON"""
    log_json("WARNING", message, logger, extra_fields)


def log_debug(
    message: str,
    logger: Optional[logging.Logger] = None,
    extra_fields: Optional[Dict[str, Any]] = None,
) -> None:
    """Log debug message as JSON"""
    log_json("DEBUG", message, logger, extra_fields)
