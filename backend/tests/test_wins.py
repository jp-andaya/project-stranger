"""P3 — wins CRUD, streak math, likes/comments, win-with-photo instant capture."""

from datetime import date, timedelta

from conftest import TINY_JPEG_DATAURL, auth_header, signup


def make_win(client, token, text="Had a great cup of coffee.", **extra):
    return client.post(
        "/api/wins/",
        json={"text": text, **extra},
        headers=auth_header(token),
    )


def test_win_crud(client):
    token, _ = signup(client, handle="Brave Otter")
    created = make_win(client, token)
    assert created.status_code == 201
    win = created.json()
    assert win["likes"] == 0 and win["is_private"] is False

    patched = client.patch(
        f"/api/wins/{win['id']}",
        json={"text": "Edited win", "is_private": True},
        headers=auth_header(token),
    ).json()
    assert patched["text"] == "Edited win" and patched["is_private"] is True

    assert client.delete(f"/api/wins/{win['id']}", headers=auth_header(token)).status_code == 204
    assert client.get("/api/wins/mine", headers=auth_header(token)).json() == []


def test_streak_math(client, db_session):
    from models import User, Win

    token, user_data = signup(client, handle="Brave Otter")
    user = db_session.query(User).filter(User.number == user_data["number"]).first()
    today = date.today()

    # 3 consecutive days ending yesterday -> streak of 3 (not broken until today ends).
    for offset in (1, 2, 3):
        db_session.add(Win(user_id=user.id, text="w", win_date=today - timedelta(days=offset)))
    db_session.commit()
    summary = client.get("/api/wins/summary", headers=auth_header(token)).json()
    assert summary["streak"] == 3

    # Logging today extends it to 4.
    make_win(client, token)
    summary = client.get("/api/wins/summary", headers=auth_header(token)).json()
    assert summary["streak"] == 4
    assert len(summary["week_days"]) == 7
    assert len(summary["logged_dates"]) == 4

    # A gap resets: only dates 6+ days ago -> streak 0.
    db_session.query(Win).delete()
    db_session.add(Win(user_id=user.id, text="w", win_date=today - timedelta(days=6)))
    db_session.commit()
    summary = client.get("/api/wins/summary", headers=auth_header(token)).json()
    assert summary["streak"] == 0


def test_win_likes_and_comments(client):
    owner, _ = signup(client, email="owner@example.com", handle="Brave Otter")
    win_id = make_win(client, owner).json()["id"]

    friend, _ = signup(client, email="friend@example.com", handle="Quiet Fox")
    liked = client.post(f"/api/wins/{win_id}/like", headers=auth_header(friend)).json()
    assert liked["likes"] == 1 and liked["liked"] is True

    commented = client.post(
        f"/api/wins/{win_id}/comments",
        json={"text": "Small rituals are everything."},
        headers=auth_header(friend),
    ).json()
    assert len(commented["comments"]) == 1
    assert commented["comments"][0]["author_is_me"] is True  # viewer is the commenter


def test_private_win_hidden_from_others(client):
    owner, _ = signup(client, email="owner@example.com")
    win_id = make_win(client, owner, is_private=True).json()["id"]

    stranger, _ = signup(client, email="stranger@example.com")
    assert client.post(f"/api/wins/{win_id}/like", headers=auth_header(stranger)).status_code == 404


def test_win_with_photo_creates_instant(client):
    token, _ = signup(client, handle="Brave Otter")
    response = make_win(client, token, photo=TINY_JPEG_DATAURL, retakes=1)
    assert response.status_code == 201
    assert response.json()["photo_url"]

    instant = client.get("/api/instants/mine/today", headers=auth_header(token))
    assert instant.status_code == 200
    data = instant.json()
    assert data["retakes"] == 1
    assert data["caption"] == "Had a great cup of coffee."
    assert data["photo"].startswith("data:image/")


def test_deleting_photo_win_removes_its_instant(client):
    token, _ = signup(client, handle="Brave Otter")
    win = make_win(client, token, photo=TINY_JPEG_DATAURL, retakes=1).json()

    # The win-with-photo created today's instant.
    assert client.get("/api/instants/mine/today", headers=auth_header(token)).status_code == 200

    # Deleting the win should take its instant with it, not leave it orphaned.
    assert client.delete(f"/api/wins/{win['id']}", headers=auth_header(token)).status_code == 204
    assert client.get("/api/instants/mine/today", headers=auth_header(token)).status_code == 404


def test_deleting_photoless_win_leaves_instant_alone(client):
    token, _ = signup(client, handle="Brave Otter")
    photo_win = make_win(client, token, photo=TINY_JPEG_DATAURL, retakes=0).json()
    text_win = make_win(client, token, text="A second, photo-less win today.").json()

    # Deleting the photo-less win must not touch the instant the other win made.
    assert client.delete(f"/api/wins/{text_win['id']}", headers=auth_header(token)).status_code == 204
    assert client.get("/api/instants/mine/today", headers=auth_header(token)).status_code == 200


def test_win_photo_served_with_privacy(client):
    owner, _ = signup(client, email="owner@example.com")
    win = make_win(client, owner, photo=TINY_JPEG_DATAURL, is_private=True).json()

    # <img> tags can't send headers, so the media route authenticates via ?token=.
    assert client.get(win["photo_url"], params={"token": owner}).status_code == 200
    stranger, _ = signup(client, email="stranger@example.com")
    assert client.get(win["photo_url"], params={"token": stranger}).status_code == 404
    assert client.get(win["photo_url"], params={"token": "garbage"}).status_code == 401
