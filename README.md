# WEBTE2 Final Project

## Project Summary
WEBTE2 is a full-stack engineering web application for computer-aided calculations and control-system simulations.  
It integrates GNU Octave through a custom REST API, visualizes dynamic systems in real time, stores operational data in PostgreSQL, and is deployed with Docker.

## Live Demo
- App: https://node80.webte.fei.stuba.sk/webte2/
- API: https://node80.webte.fei.stuba.sk/webte2/api

## What Was Built
- Terminal-style Octave command execution with session support.
- Two interactive simulations:
  - Inverted Pendulum
  - Ball-and-Beam
- Real-time Canvas animation synchronized with Chart.js graphs.
- Request logging with pagination and CSV export.
- Usage analytics for simulations with detailed records (time, city, country).
- Bilingual user interface (Slovak/English) with responsive design.
- OpenAPI documentation for backend endpoints.

## How It Was Implemented
- **Backend:** Node.js + Express, modular route/service architecture.
- **CAS Integration:** Dedicated Octave service for process/session management and command execution.
- **Database:** PostgreSQL tables for sessions, logs, and simulation usage analytics.
- **Security:** Bearer API key authentication on API routes and anonymous UUID cookie tokens for usage tracking.
- **Data Quality:** Configurable cooldown window for repeated simulation tracking.
- **Deployment:** Docker + docker-compose setup behind reverse proxy routing.

## Technology Stack
- Node.js, Express
- GNU Octave
- PostgreSQL
- HTML, CSS, Vanilla JavaScript
- Chart.js, Canvas
- Docker, docker-compose

## Employer-Relevant Value
This project demonstrates practical capability to:
- design and build production-style REST APIs;
- integrate external computational engines into web systems;
- implement real-time frontend visualization and interaction;
- model and persist operational/analytics data;
- ship full-stack applications with containerized deployment.

## Team Roles
- **Bohdan Serdiukov:** Backend, REST API, Octave integration, PostgreSQL, Docker deployment
- **Lepskyi Maksym:** Frontend, animations, charts, bilingual UI, responsive design
