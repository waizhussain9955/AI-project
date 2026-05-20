# Vigil AI — Backend Service History & Documentation

This document tracks the history, architectural design, APIs, and updates of the Vigil AI backend service.

---

## 🛠️ Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma ORM
- **Database**: PostgreSQL (or SQLite/local fallback depending on deployment configuration)
- **Real-time Communication**: Socket.IO for live incident broadcast and client telemetry
- **AI Integration**: Gemini / LLM APIs for automated threat confidence scoring and categorization

---

## 📅 Version & Update History

### v1.0.0 (Current Stable Release)
- **Expo SDK 52 / React Native 0.76.x Support**: Aligned socket and API integrations to remain compatible with Expo SDK 52 mobile clients.
- **Incident Simulation Engine**: Implemented `/api/v1/simulation/complex` to generate complex multi-point incident chains (fires, floods, accidents) for hackathon demonstrations.
- **Auto-linking & Mock Support**: Added environment variable fallbacks and dynamic LAN resolution so web and physical phone apps can connect seamlessly.

---

## 📡 API Reference

### 1. Authentication (`/api/v1/auth`)
- `POST /login` — Authenticates user credentials.
- `POST /signup` — Registers new responder / dispatch officer.

### 2. Incidents (`/api/v1/incidents`)
- `GET /` — Fetches all historical and active incidents.
- `POST /` — Creates a new incident manually or through automated AI ingestion.
- `GET /stats` — Summarizes incident counts by severity (Critical, High, Medium, Low).

### 3. Simulation (`/api/v1/simulation`)
- `POST /complex` — Triggers real-time generation of synthetic incident streams inside Karachi sectors. Useful for testing Mapbox heatmaps and client socket syncs.

---

## 🔌 Socket.IO Real-time Events
The backend runs a Socket.IO namespace that clients (web and mobile apps) bind to automatically:
- **`incident:new`** — Dispatched instantly when a new threat/incident is created.
- **`incident:update`** — Fired on status edits or severity level changes.
- **`telemetry:ping`** — Client sends location updates which the backend handles.

---

## 🗄️ Database Architecture
Database is modeled using **Prisma Schema** comprising:
- **`User`** (Credentials, Role, Active Status)
- **`Incident`** (Title, Description, Type, Severity, Latitude, Longitude, Status, Confidence Score, Timeline Log)
