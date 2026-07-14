"""P1 — signup/login/me/onboarding/handle collisions/admin protection."""

from conftest import auth_header, signup


def test_signup_returns_token_and_user(client):
    token, user = signup(client)
    assert token
    assert user["onboarded"] is False
    assert user["handle"] is None
    assert 1 <= user["number"] <= 9999


def test_signup_duplicate_email_409(client):
    signup(client)
    response = client.post(
        "/api/auth/signup",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert response.status_code == 409


def test_login_roundtrip_and_wrong_password(client):
    signup(client)
    ok = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert ok.status_code == 200
    bad = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "wrong-password"},
    )
    assert bad.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get(
        "/api/auth/me", headers=auth_header("not-a-real-token")
    ).status_code == 401


def test_onboarding_sets_handle_and_collision_409(client):
    token, _ = signup(client)
    response = client.post(
        "/api/auth/onboarding",
        json={"handle": "Brave Otter"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["onboarded"] is True

    token2, _ = signup(client, email="second@example.com")
    collision = client.post(
        "/api/auth/onboarding",
        json={"handle": "brave otter"},  # case-insensitive collision
        headers=auth_header(token2),
    )
    assert collision.status_code == 409


def test_handle_check(client):
    signup(client, handle="Brave Otter")
    taken = client.get("/api/auth/handle-check", params={"handle": "BRAVE OTTER"})
    assert taken.json() == {"available": False}
    free = client.get("/api/auth/handle-check", params={"handle": "Quiet Fox"})
    assert free.json() == {"available": True}


def test_admin_routes_locked_down(client, admin_token):
    token, _ = signup(client, email="pleb@example.com")
    assert client.get("/api/admin/stats").status_code in (401, 403)
    assert client.get("/api/admin/stats", headers=auth_header(token)).status_code == 403
    assert client.get("/api/admin/stats", headers=auth_header(admin_token)).status_code == 200


def test_delete_account_cascades(client, make_prompt):
    prompt = make_prompt()
    token, _ = signup(client, handle="Brave Otter")
    note = client.post(
        "/api/notes/",
        json={
            "prompt_id": prompt.id,
            "content": "A story long enough to pass the minimum length check.",
            "category": "Reflection",
        },
        headers=auth_header(token),
    )
    assert note.status_code == 201

    assert client.delete("/api/auth/me", headers=auth_header(token)).status_code == 204
    # Token now points at a deleted user.
    assert client.get("/api/auth/me", headers=auth_header(token)).status_code == 401

    login = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert login.status_code == 401
