from fastapi.testclient import TestClient

from main import app


def run_auth_flow() -> None:
    client = TestClient(app)

    email = "test@example.com"
    password = "secret123"

    # Register (idempotent: ignore \"already registered\" as success)
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    print("REGISTER", r.status_code, r.json())

    # Login
    r = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    print("LOGIN", r.status_code, r.json())
    r.raise_for_status()
    data = r.json()
    token = data["access_token"]

    # Me
    r = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    print("ME", r.status_code, r.json())
    r.raise_for_status()


if __name__ == "__main__":
    run_auth_flow()

