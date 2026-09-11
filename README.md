# 🥢 Chinese Restaurant Queue System

A microservices-based queue management system built with Java 17, Spring Boot, Spring Cloud Gateway, MySQL, Docker, and WebSocket.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│         (Customer Portal + Staff Dashboard)          │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / WebSocket
                        ▼
┌─────────────────────────────────────────────────────┐
│               API Gateway (Port 8080)               │
│            spring-cloud-gateway                     │
│   Route: /api/auth/**  → Auth Service (8081)        │
│   Route: /api/queue/** → Queue Service (8082)       │
│   Route: /ws/**        → Queue Service (8082)       │
└───────────┬─────────────────────┬───────────────────┘
            │                     │
            ▼                     ▼
┌──────────────────┐   ┌─────────────────────────┐
│   Auth Service   │   │     Queue Service        │
│   (Port 8081)    │   │     (Port 8082)          │
│                  │   │                          │
│ - Register       │   │ - Take queue number      │
│ - Login / JWT    │   │ - View queue status      │
│ - Validate token │   │ - Call next (staff)      │
│                  │   │ - Update status (staff)  │
│   MySQL DB       │   │ - WebSocket broadcast    │
│   (auth_db)      │   │                          │
└──────────────────┘   │   MySQL DB (queue_db)    │
                       └─────────────────────────┘
```

---

## 📁 Folder Structure

```
chinese-restaurant-queue/
├── docker-compose.yml
├── README.md
│
├── api-gateway/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/restaurant/gateway/
│       │   ├── GatewayApplication.java
│       │   └── config/
│       │       ├── GatewayConfig.java
│       │       └── JwtAuthFilter.java
│       └── resources/
│           └── application.yml
│
├── auth-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/restaurant/auth/
│       │   ├── AuthApplication.java
│       │   ├── controller/
│       │   │   └── AuthController.java
│       │   ├── service/
│       │   │   ├── AuthService.java
│       │   │   └── JwtService.java
│       │   ├── model/
│       │   │   ├── User.java
│       │   │   └── Role.java (enum)
│       │   ├── repository/
│       │   │   └── UserRepository.java
│       │   ├── dto/
│       │   │   ├── RegisterRequest.java
│       │   │   ├── LoginRequest.java
│       │   │   └── AuthResponse.java
│       │   ├── config/
│       │   │   └── SecurityConfig.java
│       │   └── exception/
│       │       └── GlobalExceptionHandler.java
│       └── resources/
│           └── application.yml
│
├── queue-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/restaurant/queue/
│       │   ├── QueueApplication.java
│       │   ├── controller/
│       │   │   ├── QueueController.java
│       │   │   └── StaffController.java
│       │   ├── service/
│       │   │   └── QueueService.java
│       │   ├── model/
│       │   │   ├── QueueEntry.java
│       │   │   └── QueueStatus.java (enum)
│       │   ├── repository/
│       │   │   └── QueueRepository.java
│       │   ├── dto/
│       │   │   ├── TakeQueueRequest.java
│       │   │   └── QueueResponse.java
│       │   ├── websocket/
│       │   │   ├── WebSocketConfig.java
│       │   │   └── QueueWebSocketHandler.java
│       │   ├── config/
│       │   │   └── SecurityConfig.java
│       │   └── exception/
│       │       └── GlobalExceptionHandler.java
│       └── resources/
│           └── application.yml
│
└── frontend/ (optional React app)
    ├── package.json
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── CustomerPage.jsx
        │   └── StaffPage.jsx
        └── services/
            └── api.js
```

---

## 🗄️ Database Schema

### auth_db

```sql
CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

CREATE TABLE users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,         -- BCrypt hashed
    role        ENUM('CUSTOMER', 'STAFF') NOT NULL DEFAULT 'CUSTOMER',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### queue_db

```sql
CREATE DATABASE IF NOT EXISTS queue_db;
USE queue_db;

CREATE TABLE queue_entries (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    queue_number    INT NOT NULL UNIQUE,
    customer_id     BIGINT NOT NULL,            -- references auth_db users.id
    customer_name   VARCHAR(100) NOT NULL,
    party_size      INT NOT NULL DEFAULT 1,
    status          ENUM('WAITING', 'CALLED', 'SEATED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    notes           TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    called_at       DATETIME,
    seated_at       DATETIME,
    INDEX idx_status (status),
    INDEX idx_queue_number (queue_number),
    INDEX idx_customer_id (customer_id)
);
```

---

## 🔌 REST API Design

### Auth Service (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new account |
| POST | `/api/auth/login` | None | Login, receive JWT |
| GET | `/api/auth/me` | JWT | Get current user info |

### Queue Service (`/api/queue`) — Customer

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/queue/take` | JWT (CUSTOMER) | Take a queue number |
| GET | `/api/queue/status` | JWT | View full queue |
| GET | `/api/queue/my` | JWT (CUSTOMER) | My current queue entry |
| DELETE | `/api/queue/my` | JWT (CUSTOMER) | Cancel my queue entry |

### Queue Service (`/api/staff`) — Staff

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/staff/call-next` | JWT (STAFF) | Call the next queue number |
| PUT | `/api/staff/status/{id}` | JWT (STAFF) | Update queue entry status |
| GET | `/api/staff/queue` | JWT (STAFF) | View all entries |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8080/ws/queue` | Live queue updates (broadcast to all) |

---

## 🔐 JWT Authentication Flow

```
1. Client → POST /api/auth/login { username, password }
2. Auth Service verifies credentials against auth_db
3. Auth Service → returns { token: "eyJ...", role: "CUSTOMER" }
4. Client stores token in localStorage / memory
5. Client → GET /api/queue/status
         Headers: Authorization: Bearer eyJ...
6. API Gateway intercepts request
7. Gateway validates JWT signature using shared secret
8. Gateway extracts role claim, forwards X-User-Id and X-User-Role headers
9. Queue Service trusts these headers (no re-validation needed)
10. Queue Service returns data
```

---

## 🐳 Docker Compose

See `docker-compose.yml` in project root.

Services:
- `mysql-auth` — MySQL 8 for auth_db (port 3306)
- `mysql-queue` — MySQL 8 for queue_db (port 3307)
- `auth-service` — Spring Boot (port 8081)
- `queue-service` — Spring Boot (port 8082)
- `api-gateway` — Spring Cloud Gateway (port 8080)

---

## 🚀 Quick Start

```bash
# Build all services
./mvnw clean package -DskipTests

# Start everything
docker-compose up --build

# Access
# API Gateway: http://localhost:8080
# WebSocket:   ws://localhost:8080/ws/queue
```

---

## 🔑 Key Technologies

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.x |
| Gateway | Spring Cloud Gateway |
| Security | Spring Security + JWT (jjwt) |
| Database | MySQL 8 |
| Real-time | Spring WebSocket (STOMP) |
| Container | Docker + Docker Compose |
| Build | Maven |
| Frontend | React 18 + Vite (optional) |

