"""Prompt-related utilities: template filling, JSON stripping, report validation. Prompt text lives in app.constants.prompts."""

import re
from typing import Any

from app.constants.prompts import (
    DEVELOPMENT_REPORT_PROMPT,
    REPORT_TOP_LEVEL_KEYS,
)


def strip_json_from_completion(text: str) -> str:
    """Remove markdown code fences around JSON if present."""
    text = text.strip()
    m = re.search(r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    return text


def build_report_prompt(master_plan_context_str: str, list_of_objects_str: str) -> str:
    """Fill DEVELOPMENT_REPORT_PROMPT with master_plan_context and list_of_objects."""
    return DEVELOPMENT_REPORT_PROMPT.replace(
        "{master_plan_context}", master_plan_context_str
    ).replace("{list_of_objects}", list_of_objects_str)


def validate_report_top_level(report: Any) -> None:
    """Raise ValueError if report is not a dict or is missing required top-level keys."""
    if not isinstance(report, dict):
        raise ValueError("Report must be a JSON object.")
    missing = REPORT_TOP_LEVEL_KEYS - set(report.keys())
    if missing:
        raise ValueError(f"Report missing required keys: {sorted(missing)}")
