"""
Seed the database with initial prompts and sample notes.
Run once after first setup: python seed_data.py
"""

from datetime import date, timedelta
from database import engine, SessionLocal, Base
from models import Prompt, Note


def seed():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Check if already seeded
    if db.query(Prompt).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return

    today = date.today()

    # ── Prompts ──────────────────────────
    prompts = [
        Prompt(
            text="What do you pretend to understand but don't?",
            category="TRUTH",
            scheduled_date=today,
        ),
        Prompt(
            text="What would you tell your younger self?",
            category="REFLECTION",
            scheduled_date=today - timedelta(days=1),
        ),
        Prompt(
            text="Describe a moment that changed everything.",
            category="MEMORY",
            scheduled_date=today - timedelta(days=2),
        ),
        Prompt(
            text="What is the kindest thing a stranger has done for you?",
            category="GRATITUDE",
            scheduled_date=today - timedelta(days=3),
        ),
        Prompt(
            text="What do you wish someone would ask you?",
            category="TRUTH",
            scheduled_date=today - timedelta(days=4),
        ),
        Prompt(
            text="What does home feel like to you?",
            category="REFLECTION",
            scheduled_date=today - timedelta(days=5),
        ),
        Prompt(
            text="What are you silently struggling with right now?",
            category="VULNERABILITY",
            scheduled_date=today - timedelta(days=6),
        ),
        Prompt(
            text="What is a lie you tell yourself often?",
            category="TRUTH",
            scheduled_date=today + timedelta(days=1),
        ),
        Prompt(
            text="When did you last feel truly seen?",
            category="CONNECTION",
            scheduled_date=today + timedelta(days=2),
        ),
        Prompt(
            text="What would you do if nobody was watching?",
            category="FREEDOM",
            scheduled_date=today + timedelta(days=3),
        ),
    ]
    db.add_all(prompts)
    db.flush()  # Get IDs assigned

    # ── Sample notes for today's prompt ──
    notes_today = [
        Note(
            content="I pretend to understand why people ghost each other. I smile and nod when friends explain their reasons, but deep down I still don't get how someone can just... disappear.",
            prompt_id=prompts[0].id,
            likes=23,
        ),
        Note(
            content="Cryptocurrency. I nod along in conversations, I even own some, but I genuinely have no idea what I'm doing or why any of it has value.",
            prompt_id=prompts[0].id,
            likes=47,
        ),
        Note(
            content="How to be okay with being alone. I tell everyone I love my independence but some nights the silence is so loud.",
            prompt_id=prompts[0].id,
            likes=89,
        ),
        Note(
            content="Adult friendships. Why is it so hard to make real connections after 25? Everyone seems to know something I don't.",
            prompt_id=prompts[0].id,
            likes=156,
        ),
        Note(
            content="Grief. People say it gets easier but I pretend to understand what that means. It's been three years and I still can't visit his favourite coffee shop.",
            prompt_id=prompts[0].id,
            likes=201,
        ),
        Note(
            content="Taxes. I'm 28 years old and every year I just stare at the forms and hope for the best.",
            prompt_id=prompts[0].id,
            likes=34,
        ),
    ]

    # ── Notes for yesterday's prompt ──
    notes_yesterday = [
        Note(
            content="Dear younger me, stop trying so hard to fit in. The things that make you different will make you shine.",
            prompt_id=prompts[1].id,
            likes=67,
        ),
        Note(
            content="I'd tell myself to call Grandma more. You think there's always tomorrow until there isn't.",
            prompt_id=prompts[1].id,
            likes=142,
        ),
        Note(
            content="It's okay to say no. You don't owe anyone an explanation for choosing yourself.",
            prompt_id=prompts[1].id,
            likes=98,
        ),
    ]

    # ── Notes for two days ago ──
    notes_older = [
        Note(
            content="The moment my dad said he was proud of me. Not for achieving anything, just for being me.",
            prompt_id=prompts[2].id,
            likes=203,
        ),
        Note(
            content="When I got the rejection letter from my dream university. I cried for a week. But it led me to where I am now, and I wouldn't change it.",
            prompt_id=prompts[2].id,
            likes=78,
        ),
    ]

    db.add_all(notes_today + notes_yesterday + notes_older)
    db.commit()
    db.close()

    print("Database seeded successfully!")
    print(f"  - {len(prompts)} prompts (including 3 future)")
    print(f"  - {len(notes_today) + len(notes_yesterday) + len(notes_older)} sample notes")


if __name__ == "__main__":
    seed()
