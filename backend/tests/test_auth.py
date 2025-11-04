import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi.testclient import TestClient


def test_register_user(client: TestClient):
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "password": "testpassword",
            "email": "test@example.com"
        }
    )
    assert response.status_code == 201
    assert response.json() == {"message": "User registered successfully"}

def test_register_existing_user(client: TestClient):
    # Register user first
    client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "password": "testpassword",
            "email": "test@example.com"
        }
    )
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "password": "anotherpassword",
            "email": "another@example.com"
        }
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Username already registered"}

def test_login_user(client: TestClient):
    # Register user first
    client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "password": "testpassword",
            "email": "test@example.com"
        }
    )
    response = client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_incorrect_password(client: TestClient):
    # Register user first
    client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "password": "testpassword",
            "email": "test@example.com"
        }
    )
    response = client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password"}

def test_login_non_existent_user(client: TestClient):
    response = client.post(
        "/auth/login",
        data={
            "username": "nonexistent",
            "password": "password"
        }
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password"}