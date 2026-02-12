# QA User Stories & Test Automation

**Owner:** Tony (QA Engineer)  
**Purpose:** User stories and acceptance criteria that drive manual and automated testing of the Home Automation site.  
**Current app name:** Q-CENTRAL. **Hosting:** Local only (Docker Compose); see [current-state.md](current-state.md).

---

## How It Works

1. **User stories** below describe behaviour from a user’s perspective and list **acceptance criteria**.
2. **E2E tests** (Playwright) in `e2e/` are written to satisfy these criteria: each story maps to one or more test specs.
3. **Running tests:** Start the app (frontend + backend), then run `npm run test:e2e` from the project root (or `npx playwright test`). See [Running E2E tests](#running-e2e-tests) below.

---

## User Stories

### US-1: View the public home page

**As a** visitor  
**I want to** open the home page  
**So that** I can learn about the product and choose to log in or register.

| ID   | Acceptance criterion                         | Automated? |
|------|----------------------------------------------|------------|
| 1.1  | Home page loads at `/` without errors       | ✅ `home.spec.js` |
| 1.2  | Page shows expected content (e.g. heading, CTA) | ✅ |
| 1.3  | Navigation shows “Login” and “Register” when not logged in | ✅ |

---

### US-2: Register a new account

**As a** visitor  
**I want to** register with email and password  
**So that** I can create an account and access the dashboard.

| ID   | Acceptance criterion                         | Automated? |
|------|----------------------------------------------|------------|
| 2.1  | I can open `/register` and see the form      | ✅ `auth-register.spec.js` |
| 2.2  | Submitting valid email + password creates an account and I am signed in (e.g. redirected to dashboard or home) | ✅ |
| 2.3  | Submitting invalid or duplicate email shows an error message | ✅ |
| 2.4  | Form validation: required fields enforced    | ✅ (optional) |

---

### US-3: Log in with existing account

**As a** registered user  
**I want to** log in with email and password  
**So that** I can access my dashboard.

| ID   | Acceptance criterion                         | Automated? |
|------|----------------------------------------------|------------|
| 3.1  | I can open `/login` and see the form         | ✅ `auth-login.spec.js` |
| 3.2  | Correct email + password logs me in and redirects (e.g. to dashboard) | ✅ |
| 3.3  | Wrong credentials show an error; I stay on login | ✅ |
| 3.4  | After login, nav shows “Dashboard” and “Logout” (or equivalent) | ✅ |

---

### US-4: Access protected dashboard when authenticated

**As a** logged-in user  
**I want to** open the dashboard  
**So that** I can use the automation console.

| ID   | Acceptance criterion                         | Automated? |
|------|----------------------------------------------|------------|
| 4.1  | When logged in, `/dashboard` loads and shows dashboard content | ✅ `dashboard.spec.js` |
| 4.2  | When not logged in, visiting `/dashboard` redirects to `/login` | ✅ |
| 4.3  | After login, I can navigate to dashboard via nav link | ✅ |

---

### US-5: Log out

**As a** logged-in user  
**I want to** log out  
**So that** my session ends and others cannot use my browser to access my account.

| ID   | Acceptance criterion                         | Automated? |
|------|----------------------------------------------|------------|
| 5.1  | “Logout” (or equivalent) is visible when logged in | ✅ `auth-logout.spec.js` |
| 5.2  | Clicking Logout clears session and shows public nav (Login, Register) | ✅ |
| 5.3  | After logout, `/dashboard` redirects to login | ✅ |

---

### US-6: Change password (authenticated)

**As a** logged-in user  
**I want to** change my password  
**So that** I can keep my account secure.

| ID   | Acceptance criterion                         | Automated? |
|------|----------------------------------------------|------------|
| 6.1  | I can open `/change-password` when logged in and see the form | ✅ `change-password.spec.js` |
| 6.2  | Submitting valid current + new password updates password and shows success (or redirect) | ✅ |
| 6.3  | Wrong current password shows an error        | ✅ |
| 6.4  | When not logged in, change-password redirects to login (if protected) | ✅ (if applicable) |

---

### US-7: Navigation and routing

**As a** user (visitor or logged in)  
**I want to** use clear navigation links  
**So that** I can move between Home, Login, Register, and Dashboard.

| ID   | Acceptance criterion                         | Automated? |
|------|----------------------------------------------|------------|
| 7.1  | Nav links go to correct routes (`/`, `/login`, `/register`, `/dashboard`) | ✅ `navigation.spec.js` |
| 7.2  | Unknown path (e.g. `/unknown`) redirects to `/` or appropriate page | ✅ |

---

## Test Layout

```
e2e/
├── playwright.config.js     # Base URL, browsers, timeouts
├── auth.setup.js            # Optional: global setup (e.g. ensure backend is up)
├── specs/
│   ├── home.spec.js         # US-1
│   ├── auth-register.spec.js # US-2
│   ├── auth-login.spec.js   # US-3
│   ├── dashboard.spec.js    # US-4
│   ├── auth-logout.spec.js  # US-5
│   ├── change-password.spec.js # US-6
│   └── navigation.spec.js   # US-7
└── fixtures/
    └── auth.js              # Helpers: login(), register(), logout()
```

---

## E2E seed users

Login and other auth tests use **seeded users** whose credentials come from **env only** (never committed):

- **Where to set them:** Copy `.env.example` to `.env` in the project root and set:
  - `E2E_SEED_EMAIL`, `E2E_SEED_PASSWORD` (used by the "correct credentials" login test)
  - `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (optional admin account)
- **Do not commit `.env`** — it is in `.gitignore`. Use `.env.example` as a template (no real secrets).
- **How they're created:** Tests call `POST /api/v1/auth/dev/seed-e2e-user`; the backend reads credentials from env and creates both users when both email and password are set.
- **Optional (backend reload):** Set `E2E_SEED_USER=true` in `.env` so both users are created on backend startup.

---

## Running E2E tests

1. **Install dependencies and browsers** (once), from project root:
   ```bash
   npm install
   npx playwright install
   ```
2. **Start the app** (frontend + backend), e.g.:
   - `docker-compose up` (frontend on 5173, backend on 8000), or
   - Backend: `python -m uvicorn backend.main:app --reload` from repo root (or `scripts/run-backend.ps1`)
   - Frontend: `cd frontend && npm run dev`
3. **Run E2E** from project root:
   ```bash
   npm run test:e2e
   ```
   Or: `npx playwright test`
4. **Headed / debug:** `npm run test:e2e:headed` or `npx playwright test --debug`.

---

## Backend API tests

Existing backend smoke test: `backend/auth_smoke_test.py` (register → login → /me).  
Run with: `cd backend && python auth_smoke_test.py` (or add a pytest wrapper).  
E2E tests cover the *site* (browser + API together); API tests validate the contract and backend logic in isolation.
