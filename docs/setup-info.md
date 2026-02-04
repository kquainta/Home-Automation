# Initial Project Setup Information

This document outlines the initial configuration and setup of the Home Automation project as established by the virtual development team.

## Project Vision
A modular, scalable home automation system built with modern technologies to manage IoT devices and automation routines.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Validation**: Pydantic v2
- **Communication**: MQTT (paho-mqtt)
- **API Documentation**: Swagger/OpenAPI (built-in)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **MQTT Broker**: Eclipse Mosquitto

## Project Structure
```text
/
├── .cursor/rules/      # Role-specific AI instructions
├── backend/            # FastAPI source code
│   ├── api/            # API route definitions
│   ├── core/           # Configuration and core logic
│   ├── services/       # External services (MQTT, etc.)
│   └── Dockerfile      # Backend container definition
├── frontend/           # React source code
│   ├── src/            # Components, hooks, and pages
│   ├── index.html      # Entry point
│   └── Dockerfile      # Frontend container definition
├── docs/               # Documentation
├── scripts/            # Utility scripts
├── AGENTS.md           # Virtual team roles and responsibilities
├── docker-compose.yml  # Local development orchestration
└── README.md           # Project overview
```

## Virtual Team Roles
- **Tech Lead**: Architecture and standards.
- **Backend Developer**: API and IoT integration.
- **Frontend Developer**: UI/UX and dashboard.
- **DevOps Engineer**: Deployment and CI/CD.
- **QA Engineer**: Testing and quality assurance.

## Getting Started

### Local Development with Docker
1. Ensure Docker and Docker Compose are installed.
2. Run the following command from the root directory:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs
   - **MQTT Broker**: localhost:1883

### Manual Setup (Optional)
Refer to the `requirements.txt` in the `backend/` folder and `package.json` in the `frontend/` folder for manual dependency installation.
