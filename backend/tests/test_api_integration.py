import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def _auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/login",
        json={"username": "demo", "password": "demo123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_onboarding_bag_score_flow(client: TestClient):
    headers = _auth_headers(client)

    onboarding = client.put(
        "/api/onboarding",
        headers=headers,
        json={
            "step": 3,
            "region": "Istanbul",
            "family_size": "3",
            "has_children": "yes",
            "has_elderly": "no",
            "completed": True,
        },
    )
    assert onboarding.status_code == 200
    body = onboarding.json()
    assert body["completed"] is True
    assert body["region"] == "Istanbul"

    bag = client.put(
        "/api/bag/items",
        headers=headers,
        json={
            "items": [
                {"item_key": "water", "checked": True},
                {"item_key": "food", "checked": False},
            ]
        },
    )
    assert bag.status_code == 200
    assert len(bag.json()["items"]) == 2

    score = client.put(
        "/api/score",
        headers=headers,
        json={"total_score": 62, "breakdown": {"bagScore": 50, "taskScore": 70}},
    )
    assert score.status_code == 200
    assert score.json()["total_score"] == 62

    read_score = client.get("/api/score", headers=headers)
    assert read_score.status_code == 200
    assert read_score.json()["total_score"] == 62


def test_family_member_and_group_flow(client: TestClient):
    headers = _auth_headers(client)

    client.delete("/api/family/group/leave", headers=headers)

    existing = client.get("/api/family/members", headers=headers)
    assert existing.status_code == 200
    for member in existing.json()["items"]:
        client.delete(f"/api/family/members/{member['id']}", headers=headers)

    created = client.post(
        "/api/family/members",
        headers=headers,
        json={"name": "Ayse", "role": "Parent", "score": 72},
    )
    assert created.status_code == 201
    member_id = created.json()["id"]

    listed = client.get("/api/family/members", headers=headers)
    assert listed.status_code == 200
    assert any(item["id"] == member_id for item in listed.json()["items"])

    group = client.post("/api/family/group", headers=headers)
    assert group.status_code == 201
    invite_code = group.json()["invite_code"]
    assert len(invite_code) == 6

    dashboard = client.get("/api/family/group", headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["invite_code"] == invite_code

    deleted = client.delete(f"/api/family/members/{member_id}", headers=headers)
    assert deleted.status_code == 200


def test_emergency_sos_requires_contacts(client: TestClient):
    headers = _auth_headers(client)

    client.put("/api/emergency/contacts", headers=headers, json={"contacts": []})

    missing = client.post("/api/emergency/sos", headers=headers, json={})
    assert missing.status_code == 400

    saved = client.put(
        "/api/emergency/contacts",
        headers=headers,
        json={"contacts": [{"name": "Ali", "phone": "+905551112233"}]},
    )
    assert saved.status_code == 200
    assert len(saved.json()) == 1

    triggered = client.post("/api/emergency/sos", headers=headers, json={"latitude": 41.0, "longitude": 29.0})
    assert triggered.status_code == 201
    assert triggered.json()["status"] in {"sent", "pending", "failed"}


def test_refresh_token_rotation(client: TestClient):
    login = client.post(
        "/api/auth/login",
        json={"username": "demo", "password": "demo123"},
    )
    assert login.status_code == 200
    payload = login.json()
    refresh = client.post(
        "/api/auth/refresh",
        json={"refresh_token": payload["refresh_token"]},
    )
    assert refresh.status_code == 200
    assert refresh.json()["access_token"]
    assert refresh.json()["refresh_token"]


def test_cors_preflight_for_pages_origin(client: TestClient):
    response = client.options(
        "/api/auth/login",
        headers={
            "Origin": "https://upscholl-301-project.pages.dev",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == (
        "https://upscholl-301-project.pages.dev"
    )
