# TalentSphere - Setup Instructions

## Quick Start

### With Docker
```bash
docker-compose up -d
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Manual Setup

1. **Database**: Run `database/schema.sql` in PostgreSQL
2. **Backend**: `cd backend && npm install && npm run dev`
3. **Frontend**: `cd frontend && npm install && npm start`

## Default Credentials
- Admin: admin@talentsphere.com / Admin@123
- Recruiter: recruiter@techcorp.com / Recruiter@123  
- Seeker: seeker@example.com / Seeker@123

## Features
- JWT Authentication with RBAC
- Job Listings with Full-Text Search
- Company Reviews & Ratings
- Application Tracking
- Real-time Notifications (WebSocket)