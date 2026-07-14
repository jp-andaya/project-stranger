"""P5 — reports validation, donations stub, suggestion approval flow."""

from conftest import TINY_JPEG_DATAURL, auth_header, signup


def test_report_requires_exactly_one_target(client, make_prompt):
    token, _ = signup(client)
    both = client.post(
        "/api/reports/",
        json={"note_id": 1, "instant_id": 1, "reason": "Spam or ads"},
        headers=auth_header(token),
    )
    assert both.status_code == 422
    neither = client.post(
        "/api/reports/",
        json={"reason": "Spam or ads"},
        headers=auth_header(token),
    )
    assert neither.status_code == 422


def test_report_invalid_reason_rejected(client):
    token, _ = signup(client)
    response = client.post(
        "/api/reports/",
        json={"instant_id": 1, "reason": "I just don't like it"},
        headers=auth_header(token),
    )
    assert response.status_code == 422


def test_report_flags_instant_and_admin_resolves(client, admin_token):
    owner, _ = signup(client, email="owner@example.com")
    instant_id = client.post(
        "/api/instants/",
        json={"photo": TINY_JPEG_DATAURL},
        headers=auth_header(owner),
    ).json()["id"]

    reporter, _ = signup(client, email="reporter@example.com")
    report = client.post(
        "/api/reports/",
        json={"instant_id": instant_id, "reason": "Not a real photo"},
        headers=auth_header(reporter),
    )
    assert report.status_code == 201

    flagged = client.get("/api/admin/instants/flagged", headers=auth_header(admin_token)).json()
    assert [i["id"] for i in flagged] == [instant_id]

    open_reports = client.get("/api/admin/reports", headers=auth_header(admin_token)).json()
    assert len(open_reports) == 1
    resolved = client.patch(
        f"/api/admin/reports/{open_reports[0]['id']}",
        json={"status": "resolved"},
        headers=auth_header(admin_token),
    )
    assert resolved.json()["status"] == "resolved"
    assert client.get("/api/admin/reports", headers=auth_header(admin_token)).json() == []


def test_donation_stub_records_no_card_data(client):
    token, _ = signup(client)
    response = client.post(
        "/api/donations/",
        json={"amount_pence": 500, "frequency": "monthly", "card": "4242424242424242"},
        headers=auth_header(token),
    )
    assert response.status_code == 201
    assert response.json() == {
        "status": "recorded",
        "charity": "Mind",
        "amount_pence": 500,
        "frequency": "monthly",
    }


def test_suggestion_approval_schedules_prompt(client, admin_token, make_prompt):
    make_prompt()  # today's prompt exists
    token, _ = signup(client, email="suggester@example.com")

    suggestion = client.post(
        "/api/prompts/suggestions",
        json={"text": "What made you smile today?"},
        headers=auth_header(token),
    )
    assert suggestion.status_code == 201
    suggestion_id = suggestion.json()["id"]

    mine = client.get("/api/prompts/suggestions/mine", headers=auth_header(token)).json()
    assert mine[0]["status"] == "pending"

    approved = client.patch(
        f"/api/admin/suggestions/{suggestion_id}",
        json={"status": "approved"},
        headers=auth_header(admin_token),
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"

    mine = client.get("/api/prompts/suggestions/mine", headers=auth_header(token)).json()
    assert mine[0]["status"] == "approved"

    # Re-review is a conflict.
    again = client.patch(
        f"/api/admin/suggestions/{suggestion_id}",
        json={"status": "rejected"},
        headers=auth_header(admin_token),
    )
    assert again.status_code == 409


def test_prompt_create_admin_only(client, admin_token):
    token, _ = signup(client, email="pleb@example.com")
    payload = {"text": "What's a small joy from today?", "scheduled_date": "2030-01-01"}
    assert client.post("/api/prompts/", json=payload, headers=auth_header(token)).status_code == 403
    assert client.post("/api/prompts/", json=payload, headers=auth_header(admin_token)).status_code == 201
