import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)


@pytest.fixture
def activities_snapshot():
    """Capture and restore the global activity state between tests."""
    original_activities = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(copy.deepcopy(original_activities))


def test_root_redirects_to_index_html():
    # Arrange
    expected_location = "/static/index.html"

    # Act
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code in (301, 302, 307, 308)
    assert response.headers["location"].endswith(expected_location)


def test_static_index_page_is_served():
    # Arrange
    expected_text = "Mergington High School"

    # Act
    response = client.get("/static/index.html")

    # Assert
    assert response.status_code == 200
    assert expected_text in response.text


def test_get_activities_returns_activity_list():
    # Arrange
    expected_key = "Chess Club"

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert expected_key in response.json()


def test_signup_for_activity_succeeds(activities_snapshot):
    # Arrange
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    payload = {"email": email}

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params=payload)

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in activities[activity_name]["participants"]


def test_signup_for_activity_already_registered_returns_400(activities_snapshot):
    # Arrange
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    payload = {"email": email}

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params=payload)

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_for_nonexistent_activity_returns_404(activities_snapshot):
    # Arrange
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"
    payload = {"email": email}

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params=payload)

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_from_activity_succeeds(activities_snapshot):
    # Arrange
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    payload = {"email": email}

    # Act
    response = client.delete(f"/activities/{activity_name}/unregister", params=payload)

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email} from {activity_name}"}
    assert email not in activities[activity_name]["participants"]


def test_unregister_not_registered_returns_400(activities_snapshot):
    # Arrange
    activity_name = "Chess Club"
    email = "nonmember@mergington.edu"
    payload = {"email": email}

    # Act
    response = client.delete(f"/activities/{activity_name}/unregister", params=payload)

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student not registered for this activity"


def test_unregister_nonexistent_activity_returns_404(activities_snapshot):
    # Arrange
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"
    payload = {"email": email}

    # Act
    response = client.delete(f"/activities/{activity_name}/unregister", params=payload)

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
