# Authentication Design (Public Website)

**Led by:** Eugene (Tech Lead)  
**Goal:** Add authentication so users can sign up, log in, and access a protected dashboard.

---

## 1. Architecture Overview

- **Strategy:** JWT (access token) in `Authorization: Bearer <token>`.
- **Backend:** FastAPI auth routes under `/api/v1/auth` (register, login, me). Token created with a shared secret; no session store.
- **Frontend:** React auth context; token stored in `localStorage`; sent on API requests. Public landing page; login/register pages; protected dashboard route.
- **User storage:** File-based store (`api/v1/auth_store.py`). Seed users (E2E, Admin, USER1, USER2, USER3) can be created from `.env` on startup; see `core/config.py` and `_seed_dev_users()` in `auth.py`. First-admin registration flow when no admin exists (see `GET /auth/registration-allowed`).

---

## 2. API Contract (Baggs – Backend)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Body: `{ "email", "password" }`. Create user, return `{ "access_token", "token_type", "user": { "email" } }`. |
| POST | `/api/v1/auth/login` | No | Body: `{ "email", "password" }`. Validate, return same token + user. |
| GET | `/api/v1/auth/me` | Bearer | Return current user `{ "email" }`. 401 if invalid/missing token. |

- **Config (env):** `SECRET_KEY` (required in prod), `ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=60`.
- **Password:** Hash with bcrypt; never store plain text.
- **Token:** JWT with `sub` = email, `exp` = expiry.

---

## 3. Frontend (Mike)

- **Auth context:** `user` (email or null), `token`, `login(email, password)`, `register(email, password)`, `logout()`, `loading`. Restore token from `localStorage` on load; optional call to `/auth/me` to validate.
- **Routes:**
  - `/` – Public landing (current dashboard-style page).
  - `/login` – Login form (email + password).
  - `/register` – Register form (email + password).
  - `/dashboard` – Protected; redirect to `/login` if not authenticated.
- **Nav:** When logged out: “Login”, “Register”, “Launch Console” (e.g. link to `/login` or `/dashboard`). When logged in: show email, “Logout”, “Dashboard”.
- **API client:** Send `Authorization: Bearer <token>` on requests to backend; 401 → clear token and redirect to login.

---

## 4. DevOps / Security (Thyya)

- **Production:** Set `SECRET_KEY` in environment (strong random string). Do not commit secrets.
- **HTTPS:** Use in production so the token is not sent in clear text (already recommended for GCP deploy).

---

## 5. Implementation Checklist

- [x] Eugene: This design doc.
- [x] Baggs: Auth routes, JWT utils, in-memory user store, config, CORS.
- [x] Mike: AuthContext, Login/Register pages, ProtectedRoute, routing, nav, api client.
- [x] Thyya: Document SECRET_KEY in deployment docs; backend env in compose.
