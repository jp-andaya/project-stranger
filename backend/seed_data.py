"""
Seed the database with demo users, prompts, notes, wins and instants.

Usage
-----
python seed_data.py           # idempotent: skips if prompts already exist
python seed_data.py --reset   # drop all tables, recreate, reseed

--reset is the project's "migration" strategy: single developer, zero
production data, SQLite. Schema changes = reset + reseed (decision D9).
"""

import base64
import os
import sys
from datetime import date, datetime, timedelta

from auth import hash_password
from database import Base, SessionLocal, engine
from models import (
    Instant, Note, NoteLike, Prompt, User, Win, WinComment,
)
from seed_content import PROMPTS, SAMPLE_NOTES, SAMPLE_WINS, handle_from_number
from storage import UPLOAD_DIR

# 1x1 grey JPEG — placeholder photo for seeded instants/wins.
_PLACEHOLDER_JPEG = base64.b64decode(
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
    "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
    "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR"
    "CAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAA"
    "AgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkK"
    "FhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWG"
    "h4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl"
    "5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREA"
    "AgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYk"
    "NOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOE"
    "hYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk"
    "5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
)

# Public numbers used by SAMPLE_NOTES / SAMPLE_WINS comments; these become
# real "stranger" accounts so FKs, likes and profiles all work.
STRANGER_NUMBERS = sorted({n["author"] for n in SAMPLE_NOTES})


def _placeholder_photo(subdir: str, name: str) -> str:
    relative = f"{subdir}/{name}.jpg"
    target = UPLOAD_DIR / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(_PLACEHOLDER_JPEG)
    return relative


def seed(reset: bool = False):
    if reset:
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(Prompt).count() > 0:
            print("Database already seeded. Skipping. (Use --reset to reseed.)")
            return

        now = datetime.utcnow()
        today = date.today()

        # ── Admin ────────────────────────────
        admin = User(
            number=1,
            email="admin@pondr.dev",
            password_hash=hash_password(os.environ.get("ADMIN_PASSWORD", "admin-dev-password")),
            handle="Pondr Admin",
            is_admin=True,
        )
        db.add(admin)

        # ── Stranger accounts ────────────────
        strangers: dict[int, User] = {}
        for number in STRANGER_NUMBERS:
            user = User(
                number=number,
                email=f"stranger{number}@pondr.dev",
                password_hash=hash_password(f"stranger-{number}-demo"),
                handle=handle_from_number(number),
            )
            strangers[number] = user
            db.add(user)
        db.flush()

        # ── Prompts: one per day, today backwards ──
        prompts: list[Prompt] = []
        for offset, text in enumerate(PROMPTS):
            prompt = Prompt(text=text, scheduled_date=today - timedelta(days=offset))
            prompts.append(prompt)
            db.add(prompt)
        db.flush()
        prompt_by_text = {p.text: p for p in prompts}

        # ── Notes (bodies trimmed to the 280-char API limit) ──
        note_count = 0
        for idx, sample in enumerate(SAMPLE_NOTES):
            prompt = prompt_by_text[sample["prompt"]]
            author = strangers[sample["author"]]
            body = sample["body"][:280]
            db.add(Note(
                title=sample["title"][:80],
                content=body,
                category=sample["cat"],
                prompt_id=prompt.id,
                author_id=author.id,
                # spread creation over recent hours so "when" labels vary
                created_at=now - timedelta(hours=2 * (idx + 1)),
                likes=0,
            ))
            note_count += 1
        db.flush()

        # ── A few cross-user likes so counters aren't all zero ──
        seeded_notes = db.query(Note).limit(8).all()
        stranger_list = list(strangers.values())
        like_count = 0
        for i, note in enumerate(seeded_notes):
            for liker in stranger_list[i % 4: (i % 4) + 3]:
                if liker.id != note.author_id:
                    db.add(NoteLike(note_id=note.id, user_id=liker.id))
                    note.likes += 1
                    like_count += 1

        # ── Demo wins for one stranger (438): consecutive streak + comments ──
        demo = strangers[STRANGER_NUMBERS[0]]
        win_count = 0
        for offset, sample in enumerate(SAMPLE_WINS):
            win = Win(
                user_id=demo.id,
                icon=sample["icon"],
                text=sample["text"][:140],
                win_date=today - timedelta(days=offset),
                is_private=bool(sample.get("private")),
            )
            db.add(win)
            db.flush()
            for comment in sample.get("comments", []):
                commenter = strangers.get(comment["author"])
                if commenter:
                    db.add(WinComment(
                        win_id=win.id,
                        user_id=commenter.id,
                        text=comment["text"][:120],
                    ))
            win_count += 1

        # ── Seeded instants for today (placeholder photos) ──
        instant_count = 0
        for number in STRANGER_NUMBERS[:3]:
            user = strangers[number]
            db.add(Instant(
                user_id=user.id,
                instant_date=today,
                photo_path=_placeholder_photo("instants", f"seed-{number}"),
                caption="A small win from a stranger",
                retakes=number % 4,
                taken_at=now - timedelta(minutes=17 * (number % 9 + 1)),
            ))
            instant_count += 1

        db.commit()

        print("Database seeded successfully!")
        print(f"  - 1 admin (admin@pondr.dev / $ADMIN_PASSWORD)")
        print(f"  - {len(strangers)} stranger accounts")
        print(f"  - {len(prompts)} prompts (today backwards)")
        print(f"  - {note_count} notes, {like_count} likes")
        print(f"  - {win_count} wins for @{demo.number} ({demo.handle})")
        print(f"  - {instant_count} instants for today")
    finally:
        db.close()


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
