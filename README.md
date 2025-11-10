# KONE Team Retro Application

A comprehensive retrospective tool for KONE's agile teams to streamline sprint retrospectives, track improvements, and collaborate effectively across distributed teams.

## 📋 Project Overview

This application enables Scrum Masters and team members to:
- Create and manage retrospective sessions
- Collect feedback anonymously or openly
- Vote on ideas and group similar concepts
- Track action items with assignments and due dates
- Generate analytics and export results

## 🏗️ Project Structure

```
Team-Retro/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── server.ts       # Entry point
│   ├── database/
│   │   ├── schema.sql      # Database schema
│   │   └── seed.sql        # Seed data
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/                # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # React context
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── README.md
│
└── requirements.md          # Product requirements document
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up database
psql -U postgres
CREATE DATABASE team_retro;
\q
psql -U postgres -d team_retro -f database/schema.sql
psql -U postgres -d team_retro -f database/seed.sql

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend runs on: http://localhost:3000

## 🔑 Key Features

### ✅ Implemented

1. **Landing Page**
   - Introduction to the tool
   - Create retrospective form
   - Session name and context inputs
   - Anonymity selection
   - Template selection
   - Advanced settings (voting limits, timer)

2. **Authentication**
   - Login/Signup pages
   - KONE email validation (@kone.com)
   - JWT-based authentication
   - Protected routes

3. **Backend Infrastructure**
   - Express server with TypeScript
   - PostgreSQL database schema
   - Authentication middleware
   - Data models for all entities
   - Security with bcrypt and JWT
   - Error handling

4. **Frontend Infrastructure**
   - React with TypeScript
   - Tailwind CSS styling
   - React Router for navigation
   - Axios for API calls
   - Form validation with react-hook-form
   - Toast notifications

### 🚧 To Be Implemented

5. **Dashboard**
   - List user's retrospectives
   - Filter by status
   - Create new retro button

6. **Retro Board**
   - Interactive kanban-style board
   - Real-time collaboration
   - Card creation, editing, voting
   - Card grouping
   - Timer functionality

7. **Action Items**
   - Create and assign action items
   - Track status and progress
   - Due date management
   - Priority levels

8. **Analytics**
   - Team participation metrics
   - Voting patterns
   - Action item completion rates
   - Data export (CSV/Excel)

9. **Real-time Features**
   - Socket.io integration
   - Live updates for cards
   - Presence indicators
   - Timer synchronization

## 🎨 Design System

### Colors (KONE Brand)
- Primary Blue: `#0077C8`
- Dark Blue: `#005499`
- Light Blue: `#4DA6D9`

### Templates
1. **Start/Stop/Continue**
2. **Mad/Sad/Glad**
3. **Liked/Learned/Lacked**
4. **4Ls** (Liked, Learned, Lacked, Longed For)

## 🔒 Security

- KONE email domain validation
- Password hashing with bcrypt
- JWT authentication
- Role-based access control (RBAC)
- SQL injection prevention
- XSS protection
- CORS configuration
- Helmet.js security headers

## 📊 Database Schema

### Main Tables
- `users` - User accounts
- `templates` - Retro templates
- `retros` - Retrospective sessions
- `retro_participants` - Session membership
- `cards` - Feedback cards
- `card_votes` - Voting records
- `card_comments` - Card comments
- `card_groups` - Card groupings
- `action_items` - Action items with assignments

## 🛠️ Technology Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- pg (PostgreSQL client)
- bcrypt
- jsonwebtoken
- Socket.io
- Helmet, Morgan, CORS

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form
- Zod
- Socket.io Client
- React Hot Toast
- Lucide React (icons)

## 📝 API Endpoints (Planned)

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Retros
- `GET /api/retros`
- `GET /api/retros/:id`
- `POST /api/retros`
- `PATCH /api/retros/:id`
- `DELETE /api/retros/:id`

### Cards
- `GET /api/cards?retroId=xxx`
- `POST /api/cards`
- `PATCH /api/cards/:id`
- `DELETE /api/cards/:id`
- `POST /api/cards/:id/vote`

### Action Items
- `GET /api/actions?retroId=xxx`
- `POST /api/actions`
- `PATCH /api/actions/:id`
- `DELETE /api/actions/:id`

### Templates
- `GET /api/templates`
- `GET /api/templates/:id`

## 👥 User Roles

1. **Team Member**
   - Join retrospectives
   - Submit feedback
   - Vote on cards
   - Comment on cards

2. **Scrum Master / Facilitator**
   - All Team Member permissions
   - Create retrospectives
   - Manage retro settings
   - Assign action items
   - Export results

3. **Admin**
   - All permissions
   - Create custom templates
   - Manage users
   - View analytics across teams

## 📖 Documentation

- [Backend README](./backend/README.md) - Backend setup and API details
- [Frontend README](./frontend/README.md) - Frontend setup and components
- [Requirements](./requirements.md) - Product requirements document

## 🧪 Testing

```bash
# Backend tests (to be implemented)
cd backend
npm test

# Frontend tests (to be implemented)
cd frontend
npm test
```

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with your preferred hosting
```

## 📄 License

Internal Use Only - KONE Corporation

## 👨‍💻 Development Team

KONE Product Development Team

---

## 🎯 Next Steps

1. **Complete Controllers & Routes** - Implement all API endpoints
2. **Dashboard Implementation** - Build retro list and management
3. **Retro Board** - Interactive board with real-time features
4. **Socket.io Integration** - Real-time collaboration
5. **Action Items Module** - Complete tracking system
6. **Analytics Dashboard** - Metrics and export
7. **Testing** - Unit, integration, and E2E tests
8. **Deployment** - Production deployment setup

For detailed implementation guidance, see individual README files in backend and frontend directories.
