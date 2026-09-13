# Red Lantern Restaurant Queue Management System

A restaurant queue management system built with Java, Spring Boot, React, MySQL, Docker Compose, JWT authentication, and WebSocket updates.

The application supports two user roles:

- **Customer** — joins the waiting queue, checks queue status, and cancels their own queue entry.
- **Staff** — monitors all queue entries, calls the next party, and updates queue statuses.

---

## Features

### Customer Features

- Create an account and sign in.
- Join the restaurant queue.
- Enter a party size and optional special notes.
- View the current waiting list.
- View a personal queue ticket and number of parties ahead.
- Cancel a waiting queue entry.
- Receive live queue refreshes through WebSocket notifications.

### Staff Features

- Sign in with a `STAFF` account.
- View all queue entries.
- Filter entries by status.
- Call the next waiting party.
- Mark a called party as seated.
- Cancel a waiting or called queue entry.
- View queue statistics for waiting, called, seated, and cancelled entries.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend language | Java 21 |
| Backend framework | Spring Boot 3.2.0 |
| API gateway | Spring Cloud Gateway 2023.0.0 |
| Authentication | Spring Security and JWT |
| JWT library | JJWT 0.12.3 |
| Database | MySQL 8 |
| Data access | Spring Data JPA and Hibernate |
| Real-time updates | Native Spring WebSocket |
| Frontend | React 18 and Vite 5 |
| Build tool | Maven |
| Containers | Docker and Docker Compose |

> The project uses native WebSocket messages. It does not use STOMP.

---

## Architecture

```text
Browser
  │
  │ HTTP / WebSocket
  ▼
Frontend (React + Vite)
  │
  │ /api and /ws proxy
  ▼
API Gateway :8080
  ├── /api/auth/**  → Auth Service
  ├── /api/queue/** → Queue Service
  ├── /api/staff/** → Queue Service
  └── /ws/**        → Queue Service WebSocket
          │
          ├──────────────────────┐
          ▼                      ▼
Auth Service :8081         Queue Service :8082
          │                      │
          └──────────┬───────────┘
                     ▼
          MySQL 8: restaurant_db
              ├── users
              └── queue_entries
```

---

## User Roles

| Role | Created by | Available actions |
|---|---|---|
| `CUSTOMER` | Public registration | Join queue, view queue status, view own entry, cancel own waiting entry |
| `STAFF` | Staff seed configuration | View all queue entries, call next party, update queue status |

All accounts created through the registration form receive the `CUSTOMER` role.

A staff account can be created automatically when the Auth Service starts. Its credentials are read from the `.env` file.

---

## Queue Statuses

| Status | Meaning |
|---|---|
| `WAITING` | The customer is waiting for a table. |
| `CALLED` | Staff has called the customer. |
| `SEATED` | The customer has been seated. |
| `CANCELLED` | The customer or staff cancelled the queue entry. |

```text
WAITING → CALLED → SEATED
WAITING → CANCELLED
CALLED  → CANCELLED
```

---

## Database

The project uses one MySQL database named `restaurant_db`.

| Table | Description |
|---|---|
| `users` | Stores customer and staff accounts. |
| `queue_entries` | Stores restaurant queue entries. |

Hibernate creates or updates these tables automatically when the services start.

---

## API Endpoints

Base URL:

```text
http://localhost:8080
```

### Authentication

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a customer account |
| `POST` | `/api/auth/login` | Public | Sign in and receive a JWT |

### Customer Queue API

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/api/queue/status` | Public | View waiting queue entries |
| `POST` | `/api/queue/take` | JWT | Join the queue |
| `GET` | `/api/queue/my` | JWT | View the current user's queue entry |
| `DELETE` | `/api/queue/my` | JWT | Cancel the current user's queue entry |

### Staff Queue API

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/api/staff/queue` | JWT + `STAFF` | View all queue entries |
| `POST` | `/api/staff/call-next` | JWT + `STAFF` | Call the first waiting party |
| `PUT` | `/api/staff/status/{id}?status=SEATED` | JWT + `STAFF` | Update a queue entry status |

---

## WebSocket Updates

The Queue Service broadcasts an update whenever queue data changes.

| Environment | WebSocket URL |
|---|---|
| Frontend through Vite proxy | `ws://localhost:3000/ws/queue` |
| Direct API Gateway connection | `ws://localhost:8080/ws/queue` |

---

## Environment Configuration

Create a `.env` file in the project root:

```env
STAFF_SEED_ENABLED=true
STAFF_SEED_USERNAME=staff
STAFF_SEED_EMAIL=staff@redlantern.local
STAFF_SEED_PASSWORD=change-this-password
```

The Auth Service creates this staff account only if the username does not already exist.

Do not commit `.env` to Git.

---

## Run with Docker Compose

### Requirements

- Docker Desktop
- Docker Compose

### Start the application

```powershell
cd D:\queue-management-system-main
docker compose up --build
```

### Open the application

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| MySQL | `127.0.0.1:3310` |

### Stop the application

```powershell
docker compose down
```

### Delete all Docker database data

```powershell
docker compose down -v
```

> Warning: this permanently deletes local MySQL data created by Docker.

---

## MySQL Workbench Connection

```text
Connection Name: Red Lantern Docker
Connection Method: Standard (TCP/IP)
Hostname: 127.0.0.1
Port: 3310
Username: restaurant_user
Password: restaurant_pass
Default Schema: restaurant_db
```

For root access:

```text
Hostname: 127.0.0.1
Port: 3310
Username: root
Password: root
Default Schema: restaurant_db
```

---

## Development Notes

- The frontend runs on Vite port `3000`.
- The frontend proxies `/api` and `/ws` requests to the API Gateway.
- Frontend changes trigger hot reload inside Docker.
- Registration always creates a `CUSTOMER` account.
- Staff accounts are configured through `.env`.
- Java services use Java 21.