# Player Attendance Tracker

A comprehensive football club academy attendance management system built with Next.js, designed to help coaches track player attendance across scheduled training sessions.

## Features

### Core Features
- **Coach Authentication**: Secure login system with JWT tokens
- **Session Management**: View today's morning and evening training sessions
- **Player Management**: View players assigned to coach's age group
- **Attendance Tracking**: Mark players as Present (Regular), Present (Complimentary), or Absent
- **Photo Integration**: Take or upload group photos during attendance
- **Statistics Dashboard**: Track session stats per player including booked sessions and complimentary sessions used

### Additional Features
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS and shadcn/ui
- **Export Functionality**: Export attendance data to CSV format
- **Low Attendance Alerts**: Visual indicators for players with attendance below 70%
- **Real-time Updates**: Dynamic dashboard updates after attendance recording

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, JWT Authentication
- **Database**: Mock data (easily replaceable with PostgreSQL/MongoDB)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd player-attendance-tracker
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

For a complete containerized setup:

\`\`\`bash
docker-compose up --build
\`\`\`

This will start both the application and PostgreSQL database.

## Demo Credentials

The system comes with pre-seeded demo data:

**Coach 1 (U-12 Age Group)**
- Username: \`john_doe\`
- Password: \`password123\`

**Coach 2 (U-16 Age Group)**
- Username: \`jane_smith\`
- Password: \`password123\`

## Usage Guide

### 1. Login
- Use the demo credentials to log in as a coach
- Each coach can only see sessions and players for their assigned age group

### 2. Dashboard Overview
- View today's morning and evening sessions
- See player statistics and attendance rates
- Quick overview of active players and session counts

### 3. Mark Attendance
- Click "Mark Attendance" on any session card
- Take or upload a group photo
- Mark each player as Present, Complimentary, or Absent
- Submit attendance record

### 4. Player Statistics
- Switch to the "Player Statistics" tab
- View detailed attendance data for each player
- Export data to CSV format
- Identify players with low attendance (below 70%)

## Project Structure

\`\`\`
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── dashboard/      # Dashboard data
│   │   └── attendance/     # Attendance recording
│   ├── dashboard/          # Main dashboard page
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── attendance-dialog.tsx
│   ├── session-card.tsx
│   ├── player-stats.tsx
│   └── auth-provider.tsx
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── public/               # Static assets
\`\`\`

## Database Schema

The application uses the following data structure (currently mock data):

### Coaches
- id, username, password, name, ageGroup

### Players  
- id, name, ageGroup, bookedSessions, attendedSessions, complimentarySessions

### Sessions
- id, date, timeSlot (morning/evening), ageGroup

### Attendance Records
- id, sessionId, coachId, attendance, photo, timestamp

## API Endpoints

- \`POST /api/auth/login\` - Coach authentication
- \`POST /api/auth/logout\` - Logout
- \`GET /api/auth/me\` - Get current coach info
- \`GET /api/dashboard\` - Get dashboard data (sessions, players)
- \`POST /api/attendance\` - Record attendance
- \`GET /api/attendance\` - Get attendance records

## Environment Variables

Create a \`.env.local\` file:

\`\`\`env
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
\`\`\`

## Production Deployment

### Database Integration
To use a real database, replace the mock data in API routes with:

**PostgreSQL Example:**
\`\`\`javascript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
\`\`\`

**MongoDB Example:**
\`\`\`javascript
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI)
\`\`\`

### File Storage
For production photo storage, integrate with:
- AWS S3
- Cloudinary
- Google Cloud Storage

### Security Enhancements
- Hash passwords using bcrypt
- Implement rate limiting
- Add CSRF protection
- Use environment-specific JWT secrets

## Future Enhancements

- **Email/SMS Notifications**: Alert system for low attendance
- **Advanced Analytics**: Detailed reporting and trends
- **Mobile App**: React Native version
- **Multi-language Support**: Internationalization
- **Role-based Access**: Admin panel for club management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
\`\`\`
