"""P4 — one instant per day, the view-once burn (410), explore, stranger profile."""

from conftest import TINY_JPEG_DATAURL, auth_header, signup


def capture(client, token, retakes=0):
    return client.post(
        "/api/instants/",
        json={"photo": TINY_JPEG_DATAURL, "retakes": retakes},
        headers=auth_header(token),
    )


def test_one_instant_per_day_409(client):
    token, _ = signup(client, handle="Brave Otter")
    assert capture(client, token).status_code == 201
    assert capture(client, token).status_code == 409


def test_retakes_capped_at_3(client):
    token, _ = signup(client)
    assert capture(client, token, retakes=4).status_code == 422


def test_view_once_burn_410(client):
    owner, _ = signup(client, email="owner@example.com", handle="Brave Otter")
    instant_id = capture(client, owner).json()["id"]

    viewer, _ = signup(client, email="viewer@example.com", handle="Quiet Fox")
    first = client.post(f"/api/instants/{instant_id}/view", headers=auth_header(viewer))
    assert first.status_code == 200
    assert first.json()["photo"].startswith("data:image/")

    second = client.post(f"/api/instants/{instant_id}/view", headers=auth_header(viewer))
    assert second.status_code == 410

    # The owner can always re-view their own.
    own = client.post(f"/api/instants/{instant_id}/view", headers=auth_header(owner))
    assert own.status_code == 200


def test_explore_excludes_self_and_has_no_photo(client):
    owner, _ = signup(client, email="owner@example.com", handle="Brave Otter")
    instant_id = capture(client, owner).json()["id"]

    viewer, _ = signup(client, email="viewer@example.com", handle="Quiet Fox")
    cards = client.get("/api/instants/explore", headers=auth_header(viewer)).json()
    assert [c["id"] for c in cards] == [instant_id]
    card = cards[0]
    assert "photo" not in card
    assert card["viewed"] is False
    assert card["author_handle"] == "Brave Otter"

    # After the burn, explore marks it viewed.
    client.post(f"/api/instants/{instant_id}/view", headers=auth_header(viewer))
    cards = client.get("/api/instants/explore", headers=auth_header(viewer)).json()
    assert cards[0]["viewed"] is True

    # Own instant never appears in own explore feed.
    own_cards = client.get("/api/instants/explore", headers=auth_header(owner)).json()
    assert own_cards == []


def test_stranger_profile_and_privacy(client):
    owner, owner_data = signup(client, email="owner@example.com", handle="Brave Otter")
    capture(client, owner)
    number = owner_data["number"]

    viewer, _ = signup(client, email="viewer@example.com")
    profile = client.get(f"/api/instants/users/{number}", headers=auth_header(viewer)).json()
    assert profile["has_instant_today"] is True
    assert profile["handle"] == "Brave Otter"
    assert profile["is_private"] is False

    # Flip profile_private -> profile hides everything.
    client.patch("/api/auth/me", json={"profile_private": True}, headers=auth_header(owner))
    profile = client.get(f"/api/instants/users/{number}", headers=auth_header(viewer)).json()
    assert profile["is_private"] is True
    assert profile["has_instant_today"] is False
    assert profile["handle"] is None


def test_instant_like_persists(client, db_session):
    from models import InstantLike

    owner, _ = signup(client, email="owner@example.com")
    instant_id = capture(client, owner).json()["id"]
    viewer, _ = signup(client, email="viewer@example.com")

    assert client.post(f"/api/instants/{instant_id}/like", headers=auth_header(viewer)).status_code == 204
    # Idempotent.
    assert client.post(f"/api/instants/{instant_id}/like", headers=auth_header(viewer)).status_code == 204
    assert db_session.query(InstantLike).count() == 1
