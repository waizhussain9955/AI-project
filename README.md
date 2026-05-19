# 🚨 ResQ AI — Autonomous Disaster Command System

> **Pakistan's AI-Powered National Emergency Operating System**
> *"AI that saves lives before humans react."*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-blue?style=for-the-badge&logo=flutter)](https://flutter.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-teal?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

---

## 🌐 Platform Overview

ResQ AI is an autonomous AI-powered disaster command ecosystem built for Karachi, Pakistan. It combines multi-agent AI orchestration, real-time emergency response, citizen SOS systems, and predictive analytics into a single unified platform.

### Platform Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| 📱 Mobile App | Flutter + Dart | Citizen & Responder interface |
| 🖥️ Web Command Center | Next.js 15 + TypeScript | AI operations dashboard |
| ⚙️ Backend API | Node.js + Express | Core business logic |
| 🤖 AI Services | FastAPI + Python | Multi-agent AI orchestration |
| 🗄️ Database | PostgreSQL + Prisma | Data persistence |
| ⚡ Realtime | Socket.IO + Redis | Live event streaming |

---

## 🏗️ Monorepo Structure

```
/resq-ai
├── apps/
│   ├── mobile/          # Flutter mobile application
│   ├── web/             # Next.js command center
│   ├── backend/         # Node.js REST + WebSocket API
│   └── ai-services/     # FastAPI AI agent system
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── config/          # Shared configuration
│   └── utils/           # Shared utilities
├── docs/                # Architecture & API docs
├── scripts/             # Build & deployment scripts
├── docker-compose.yml   # Container orchestration
└── .env.example         # Environment template
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Flutter 3.x
- Docker & Docker Compose
- Python 3.11+

### 1. Clone & Install
```bash
git clone https://github.com/your-org/resq-ai.git
cd resq-ai
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Fill in your API keys
```

### 3. Start Backend Services
```bash
docker-compose up -d postgres redis
cd apps/backend && npm run dev
cd apps/ai-services && uvicorn main:app --reload
```

### 4. Start Web Dashboard
```bash
cd apps/web && npm run dev
```

### 5. Run Mobile App
```bash
cd apps/mobile && flutter pub get && flutter run
```

---

## 🤖 AI Agent System

ResQ AI uses a **multi-agent orchestration** system with 8 specialized agents:

1. **Signal Collector Agent** — Ingests data from all sensors & reports
2. **Crisis Detection Agent** — AI-powered disaster detection (Gemini 1.5 Pro)
3. **Severity Analyzer** — Classifies and scores emergencies
4. **Prediction Agent** — Forecasts disaster spread & impact
5. **Resource Planner** — Optimizes rescue resource allocation
6. **Dispatch Coordinator** — Routes emergency teams
7. **Citizen Notification Agent** — Multilingual alert broadcasting (English & Urdu)
8. **Route Optimization Agent** — Dynamic safe route calculation

---

## 🌍 Multilingual Reach

ResQ AI features a specialized **Urdu AI Translation Engine**, ensuring that life-saving alerts reach 100% of Karachi's population, including those who prefer Urdu for emergency communications.

---

## 🎯 Supported Disaster Types

Floods · Earthquakes · Heatwaves · Building Collapses · Gas Leaks ·
Road Accidents · Medical Emergencies · Fires · Infrastructure Failures ·
Water System Breakdowns · Electrical Failures · Traffic Blockages

---

## 📍 Target City: Karachi, Pakistan

Built for Pakistan's largest metropolitan area with 16M+ citizens.

---

## 🔐 Security

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- End-to-end encryption for sensitive data
- Rate limiting & DDoS protection
- Audit logging

---

## 📄 License

MIT License — Built for the betterment of humanity.
