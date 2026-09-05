# GoRide — MERN Bus Ticket Booking

Sample full-stack bus booking app (2026 stack):

- **MongoDB** + Mongoose 8
- **Express** REST API + JWT auth
- **React 19** + **Vite 6** + React Router 7
- Dark, readable UI (custom CSS, no extra design system to install)

Repo: https://github.com/Manjusri-developer/bus-ticket-booking-mern

---

## How it works

```
Browser (Vite :5173)
   → /api/* proxied to Express :5000
        → MongoDB (local or Atlas)
```

1. User searches **from / to / date** on the home page.
2. Frontend calls `GET /api/buses?from=&to=&date=`.
3. User opens a bus and picks available seats.
4. After login/register, frontend sends `POST /api/bookings` with a JWT.
5. Server checks that seats are free, stores a booking, and marks those seats booked.
6. `GET /api/bookings/me` lists that user's tickets.

### API map

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | no | Liveness check |
| POST | `/api/auth/register` | no | Create user |
| POST | `/api/auth/login` | no | Get JWT |
| GET | `/api/buses` | no | Search buses |
| GET | `/api/buses/:id` | no | Bus + booked seats |
| POST | `/api/bookings` | Bearer JWT | Create booking |
| GET | `/api/bookings/me` | Bearer JWT | My bookings |

---

## Run locally

### Prerequisites

- Node.js 20 or 22 LTS
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB Atlas URI

### 1. Clone

```bash
git clone https://github.com/Manjusri-developer/bus-ticket-booking-mern.git
cd bus-ticket-booking-mern
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env if you use Atlas instead of local Mongo
npm install
npm run seed
npm run dev
```

API: http://localhost:5000/api/health

`npm run seed` loads sample buses for **today + next 2 days** on routes:

- Bengaluru → Chennai / Hyderabad / Mysuru
- Chennai → Bengaluru

### 3. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:5173

Vite proxies `/api` to port 5000, so you do not need CORS gymnastics in local dev.

### Demo login flow

1. Open http://localhost:5173/login
2. Register (or login). Sample fields are prefilled.
3. Search **Bengaluru → Chennai** for tomorrow.
4. Select seats and confirm.
5. Open **My tickets**.

---

## Test with Postman

Base URL: `http://localhost:5000`

### 0. Health

- **GET** `{{base}}/api/health`
- Expect: `{ "ok": true, ... }`

### 1. Register

- **POST** `{{base}}/api/auth/register`
- Body → raw JSON:

```json
{
  "name": "Demo User",
  "email": "demo@goride.test",
  "password": "secret12"
}
```

Save `token` from the response.

### 2. Login

- **POST** `{{base}}/api/auth/login`
- Body:

```json
{
  "email": "demo@goride.test",
  "password": "secret12"
}
```

### 3. Search buses

- **GET** `{{base}}/api/buses?from=Bengaluru&to=Chennai&date=2026-09-06`
- Change `date` to today or tomorrow (seed covers 3 days).
- Copy a bus `_id`.

### 4. Get one bus

- **GET** `{{base}}/api/buses/<BUS_ID>`

### 5. Book seats (auth)

Postman: Authorization → Bearer Token → paste JWT.

- **POST** `{{base}}/api/bookings`
- Body:

```json
{
  "busId": "PASTE_BUS_ID",
  "seats": [7, 8],
  "passengerName": "Demo User",
  "passengerPhone": "9876543210"
}
```

Expect `201` and `status: "confirmed"`. Booking the same seats again returns `409`.

### 6. My bookings

- **GET** `{{base}}/api/bookings/me`
- Same Bearer token.

### Postman collection (quick import)

Create an environment:

- `base` = `http://localhost:5000`
- `token` = (set after login with a Tests script if you want)

Optional test script on Login:

```javascript
const json = pm.response.json();
if (json.token) pm.environment.set('token', json.token);
```

Then set collection auth to Bearer `{{token}}`.

---

## Project layout

```
backend/
  server.js           Express app + Mongo connect
  seed.js             Sample buses
  models/             User, Bus, Booking
  routes/             auth, buses, bookings
  middleware/auth.js  JWT guard
frontend/
  src/App.jsx         Pages + routing
  src/api.js          fetch helper
  src/index.css       UI
```

Code is intentionally small and commented by structure so it is easy to read and extend (payments, admin panel, cancellation).
