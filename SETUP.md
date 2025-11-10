# Setup and Installation Guide

## Prerequisites
- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm or yarn

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up PostgreSQL database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE team_retro;
\q

# Run schema (creates all tables)
psql -U postgres -d team_retro -f database/schema.sql

# Seed default templates
psql -U postgres -d team_retro -f database/seed.sql
```

### 4. Configure environment variables
```bash
# Copy the example file
copy .env.example .env

# Edit .env and update these values:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=team_retro
# DB_USER=postgres
# DB_PASSWORD=your_actual_password
# JWT_SECRET=your_secure_random_secret_key_here
```

### 5. Start development server
```bash
npm run dev
```

Backend should now be running on: **http://localhost:5000**

### 6. Test the backend
Open browser and visit: http://localhost:5000/health
You should see: `{"status":"OK","message":"Server is running"}`

---

## Frontend Setup

### 1. Open a NEW terminal and navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
# Copy the example file
copy .env.example .env

# The default values should work:
# VITE_API_URL=http://localhost:5000/api
```

### 4. Start development server
```bash
npm run dev
```

Frontend should now be running on: **http://localhost:3000**

### 5. Open the application
Open your browser and visit: http://localhost:3000

---

## Verification Checklist

✅ **Backend:**
- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] PostgreSQL database created
- [ ] Database tables created (run schema.sql)
- [ ] Default templates seeded
- [ ] `.env` file configured
- [ ] Server running on port 5000
- [ ] Health check endpoint working

✅ **Frontend:**
- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] `.env` file configured
- [ ] Server running on port 3000
- [ ] Landing page loads successfully
- [ ] Can navigate to Login/Signup pages

---

## Common Issues and Solutions

### Issue: "Cannot connect to database"
**Solution:** 
- Make sure PostgreSQL is running
- Check credentials in `.env`
- Verify database `team_retro` exists

### Issue: "Module not found" errors
**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Port already in use
**Solution:**
```bash
# Backend (port 5000):
# Change PORT in backend/.env

# Frontend (port 3000):
# Change port in frontend/vite.config.ts
```

### Issue: TypeScript errors after installation
**Solution:**
```bash
# Restart your IDE/VS Code
# Sometimes needed for TypeScript to recognize new types
```

---

## Available Scripts

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Run production server
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Frontend
```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

---

## Testing the Application

### 1. Sign Up
- Go to http://localhost:3000/signup
- Use a KONE email: `test@kone.com`
- Fill in first name, last name, password
- Click "Create Account"

### 2. Create a Retrospective
- Click "Start a Retrospective" on landing page
- Fill in session name: "Sprint 42 Retro"
- Add context (optional)
- Select a template
- Toggle anonymity if desired
- Click "Create Retrospective"

### 3. API Testing with curl
```bash
# Test health check
curl http://localhost:5000/health

# Test signup (once backend controllers are implemented)
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@kone.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

---

## Next Development Steps

After successful installation:

1. **Implement Backend Controllers**
   - Create controllers for auth, retros, cards, actions
   - Define routes and connect to controllers
   - Test with Postman/curl

2. **Complete Dashboard Page**
   - Fetch and display user's retros
   - Add filters and search
   - Create new retro button

3. **Build Retro Board**
   - Interactive kanban board
   - Real-time with Socket.io
   - Card CRUD operations

4. **Add Action Items**
   - Create action item modal
   - Assignment and tracking
   - Status updates

5. **Implement Analytics**
   - Charts and metrics
   - Export functionality

---

## Environment Variables Reference

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=team_retro
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Support

For issues or questions:
1. Check the README files in backend/ and frontend/ directories
2. Review requirements.md for feature specifications
3. Check TypeScript errors in your IDE
4. Verify all dependencies are installed

---

**Last Updated:** October 31, 2025
