---
# TaskFlow — Task Manager

A full-stack task management web app built with React (Vite) on the frontend
and Node.js/Express on the backend, with persistent storage via libSQL.

## Live Demo

- **Frontend**: https://task-manager-beta-mocha-96.vercel.app
- **Backend API**: https://task-manager-htxd.onrender.com

## Features

- User registration and authentication (JWT)
- Create, edit, delete, and complete tasks
- Categorize tasks by priority and category
- Due date reminders and notifications
- Fully responsive UI

## Tech Stack

**Frontend**
- React 18 + Vite
- Deployed on Vercel (global CDN, free tier)

**Backend**
- Node.js + Express
- libSQL / SQLite for data persistence
- JWT authentication with bcrypt password hashing
- Deployed on Render (free tier)

## Architecture

Browser → Vercel (React/Vite static build)
               ↓  HTTPS API calls
          Render (Express REST API)
               ↓
          SQLite (libSQL)

## Local Development

# Install dependencies
npm install
cd server && npm install && cd ..

# Start both frontend and backend
npm run dev

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

No .env file needed for local development — everything uses safe defaults.

Environment Variables

Frontend (Vercel)

Backend (Render)

Built With Claude Code

This project was developed with the assistance of
Claude Code (https://claude.com/claude-code), Anthropic's AI coding agent.
Claude Code helped with debugging the production deployment, fixing a missing
database driver dependency on Render, wiring CORS between the Vercel frontend
and Render backend, and setting up automatic database migrations on server
startup.

---
