"""P2 — cooldown 409, unlock economy tiers, per-user likes, moderation."""

from conftest import auth_header, signup

NOTE_BODY = "A story long enough to pass the minimum length validation check."


def make_note(client, token, prompt_id, body=NOTE_BODY, category="Reflection"):
    return client.post(
        "/api/notes/",
        json={"prompt_id": prompt_id, "content": body, "category": category},
        headers=auth_header(token),
    )


def test_create_note_derives_title(client, make_prompt):
    prompt = make_prompt()
    token, _ = signup(client, handle="Brave Otter")
    response = make_note(client, token, prompt.id)
    assert response.status_code == 201
    data = response.json()
    assert data["title"].startswith("A story long enough to")
    assert data["category"] == "Reflection"
    assert data["when"] == "Just now"


def test_cooldown_second_note_same_prompt_409(client, make_prompt):
    prompt = make_prompt()
    token, _ = signup(client, handle="Brave Otter")
    assert make_note(client, token, prompt.id).status_code == 201
    second = make_note(client, token, prompt.id)
    assert second.status_code == 409
    assert "unlock_at" in second.json()["detail"]


def test_invalid_category_rejected(client, make_prompt):
    prompt = make_prompt()
    token, _ = signup(client)
    response = make_note(client, token, prompt.id, category="NotACategory")
    assert response.status_code == 422


def test_blocked_content_400(client, make_prompt):
    prompt = make_prompt()
    token, _ = signup(client)
    response = make_note(
        client, token, prompt.id,
        body="I think you should just kill yourself honestly and truly",
    )
    assert response.status_code == 400


def test_unlock_economy_tiers(client, make_prompt):
    """0 subs -> no notes; 1-4 subs -> first FREE_NOTES; >=5 -> everything."""
    prompts = [make_prompt(days_ago=i) for i in range(6)]

    # Strangers fill prompt 0 with 5 notes.
    for i in range(5):
        token, _ = signup(client, email=f"stranger{i}@example.com")
        assert make_note(client, token, prompts[0].id, body=f"{NOTE_BODY} v{i}").status_code == 201

    reader, _ = signup(client, email="reader@example.com")

    # Tier 0: nothing visible.
    feed = client.get(f"/api/notes/prompt/{prompts[0].id}", headers=auth_header(reader)).json()
    assert feed["total"] == 5
    assert feed["unlocked"] is False
    assert feed["notes"] == []

    # Tier 1: one submission -> first 3 visible.
    assert make_note(client, reader, prompts[1].id).status_code == 201
    feed = client.get(f"/api/notes/prompt/{prompts[0].id}", headers=auth_header(reader)).json()
    assert len(feed["notes"]) == feed["free_limit"] == 3
    assert feed["unlocked"] is False

    # Tier 2: five submissions -> everything visible.
    for prompt in prompts[2:6]:
        assert make_note(client, reader, prompt.id).status_code == 201
    feed = client.get(f"/api/notes/prompt/{prompts[0].id}", headers=auth_header(reader)).json()
    assert feed["unlocked"] is True
    assert len(feed["notes"]) == 5


def test_random_note_requires_contribution(client, make_prompt):
    prompt = make_prompt()
    author, _ = signup(client, email="author@example.com")
    assert make_note(client, author, prompt.id).status_code == 201

    reader, _ = signup(client, email="reader@example.com")
    locked = client.get(f"/api/notes/random/{prompt.id}", headers=auth_header(reader))
    assert locked.status_code == 403

    other = make_prompt(days_ago=1)
    assert make_note(client, reader, other.id).status_code == 201
    unlocked = client.get(f"/api/notes/random/{prompt.id}", headers=auth_header(reader))
    assert unlocked.status_code == 200


def test_like_unlike_per_user(client, make_prompt):
    prompt = make_prompt()
    author, _ = signup(client, email="author@example.com")
    note_id = make_note(client, author, prompt.id).json()["id"]

    liker, _ = signup(client, email="liker@example.com")
    first = client.post(f"/api/notes/{note_id}/like", headers=auth_header(liker)).json()
    assert first == {"likes": 1, "liked": True}
    # Idempotent — second like doesn't double count.
    second = client.post(f"/api/notes/{note_id}/like", headers=auth_header(liker)).json()
    assert second == {"likes": 1, "liked": True}

    gone = client.delete(f"/api/notes/{note_id}/like", headers=auth_header(liker)).json()
    assert gone == {"likes": 0, "liked": False}


def test_category_filter(client, make_prompt):
    prompts = [make_prompt(days_ago=i) for i in range(5)]
    author, _ = signup(client, email="author@example.com")
    make_note(client, author, prompts[0].id, category="Hope")
    # Unlock the author fully so the feed shows everything.
    for prompt in prompts[1:5]:
        make_note(client, author, prompt.id, category="Memory")

    feed = client.get(
        f"/api/notes/prompt/{prompts[0].id}",
        params={"category": "Hope"},
        headers=auth_header(author),
    ).json()
    assert feed["total"] == 1
    assert feed["notes"][0]["category"] == "Hope"
