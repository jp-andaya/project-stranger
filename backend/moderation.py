"""
Content Moderation Module for Project Stranger.

Provides a keyword-based content filter that:
1. Auto-flags notes containing harmful/inappropriate language
2. Blocks submission of severely inappropriate content
3. Sanitises basic HTML/script injection attempts

Categories:
- BLOCK: Content rejected outright (slurs, extreme content)
- FLAG:  Content published but auto-flagged for admin review
"""

import re
from enum import Enum


class ModerationResult(Enum):
    CLEAN = "clean"
    FLAGGED = "flagged"
    BLOCKED = "blocked"


# ──────────────────────────────────────
#  WORD LISTS
# ──────────────────────────────────────

# Severe terms — submission blocked entirely
BLOCKED_TERMS = [
    # Slurs and hate speech (abbreviated/partial to avoid reproducing full slurs)
    "kill yourself", "kys",
    # Self-harm encouragement
    "you should die", "go die",
    # Extreme violence
    "i will hurt", "i will kill",
]

# Concerning terms — published but auto-flagged for review
FLAGGED_TERMS = [
    # Potential self-harm indicators (flagged for safety, not blocked)
    "self harm", "self-harm", "cutting myself",
    "want to die", "suicide", "suicidal",
    "end it all", "no reason to live",
    # Harassment patterns
    "you're ugly", "you're worthless", "nobody likes you",
    "hate you", "loser",
    # Spam indicators
    "buy now", "click here", "free money",
    "http://", "https://", "www.",
]

# Regex patterns for additional detection
BLOCKED_PATTERNS = [
    r'<\s*script',          # Script injection
    r'javascript\s*:',      # JS protocol
    r'on\w+\s*=',           # Event handlers (onclick, onload, etc.)
]

FLAGGED_PATTERNS = [
    r'(.)\1{8,}',           # Repeated characters (spam: "aaaaaaaaaa")
    r'\b\d{10,}\b',         # Long number sequences (possible phone numbers)
    r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}',  # Email addresses
]


# ──────────────────────────────────────
#  MODERATION FUNCTIONS
# ──────────────────────────────────────

def sanitise_content(text: str) -> str:
    """
    Basic sanitisation: strip HTML tags and excessive whitespace.
    Does NOT modify the user's actual message content beyond safety.
    """
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Normalise whitespace (preserve newlines)
    text = re.sub(r'[ \t]+', ' ', text)
    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines).strip()
    return text


def moderate_content(text: str) -> dict:
    """
    Analyse text content and return a moderation result.

    Returns:
        {
            "result": ModerationResult,
            "reason": str or None,
            "sanitised_content": str
        }
    """
    sanitised = sanitise_content(text)
    lower_text = sanitised.lower()

    # Check blocked terms
    for term in BLOCKED_TERMS:
        if term.lower() in lower_text:
            return {
                "result": ModerationResult.BLOCKED,
                "reason": f"Content contains prohibited language",
                "sanitised_content": sanitised,
            }

    # Check blocked patterns
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, sanitised, re.IGNORECASE):
            return {
                "result": ModerationResult.BLOCKED,
                "reason": "Content contains prohibited patterns",
                "sanitised_content": sanitised,
            }

    # Check flagged terms
    for term in FLAGGED_TERMS:
        if term.lower() in lower_text:
            return {
                "result": ModerationResult.FLAGGED,
                "reason": f"Content flagged for review",
                "sanitised_content": sanitised,
            }

    # Check flagged patterns
    for pattern in FLAGGED_PATTERNS:
        if re.search(pattern, sanitised, re.IGNORECASE):
            return {
                "result": ModerationResult.FLAGGED,
                "reason": "Content flagged for review (pattern match)",
                "sanitised_content": sanitised,
            }

    return {
        "result": ModerationResult.CLEAN,
        "reason": None,
        "sanitised_content": sanitised,
    }
