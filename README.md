# TutorNearby

**Find Trusted Tutors Near You.**

TutorNearby is a production-ready edtech marketplace that connects students and parents with verified, trusted tutors in their area.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router v6 |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (httpOnly cookies) + bcrypt |
| Storage | Cloudinary |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |
| Deployment | Frontend → Vercel, Backend → Render, DB → MongoDB Atlas |

## Project Structure

```
TutorNearby/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite SPA
├── .gitignore
├── .env.example
└── package.json      # Monorepo scripts
```

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Cloudinary account
- Razorpay account (test keys for development)

### 1. Clone & Install
```bash
git clone <repo-url>
cd TutorNearby
npm run install:all
```

### 2. Configure Environment Variables
```bash
# Backend
cp backend/.env.example backend/.env
# Fill in all values in backend/.env

# Frontend
cp frontend/.env.example frontend/.env
# Fill in VITE_API_URL
```

### 3. Seed Admin Account
```bash
npm run seed
```

### 4. Start Development
```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Environment Variables

See `backend/.env.example` for all required variables.

**Never commit `.env` files. They are in `.gitignore`.**

## Deployment

- **Frontend**: Deploy to Vercel. Set `VITE_API_URL` to your Render backend URL.
- **Backend**: Deploy to Render. Set all environment variables in Render dashboard.
- **Database**: MongoDB Atlas (whitelist Render IP or use 0.0.0.0/0 for Render).

## User Roles

- **STUDENT/PARENT** — Search, compare, and contact tutors
- **TUTOR** — Create profile, submit KYC, receive inquiries
- **ADMIN** — Manage users, KYC, reports, payments, settings

## Security

- JWT stored in httpOnly cookies
- bcrypt password hashing
- Helmet security headers
- CORS locked to frontend URL
- Rate limiting on auth endpoints
- MongoDB injection protection
- Input validation & sanitization
- Private KYC documents never publicly exposed
- Razorpay signature verified server-side

## License

UNLICENSED — Private commercial project.
