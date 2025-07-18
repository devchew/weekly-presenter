# Team Presentation Scheduler

A web application for managing weekly presentation schedules with automatic rotation.

## Migration from Supabase to SQLite

This application has been successfully migrated from Supabase to a local SQLite database with Express.js API backend.

### Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js REST API
- **Database**: SQLite with sqlite3 driver
- **Development**: Concurrent development servers

### Database Schema

#### Teams Table
- `id` (TEXT PRIMARY KEY) - Unique team identifier
- `presentation_day` (INTEGER) - Day of week (0-6, Sunday-Saturday)
- `created_at` (DATETIME) - Timestamp

#### Team Members Table
- `id` (TEXT PRIMARY KEY) - Unique member identifier
- `team_id` (TEXT) - Foreign key to teams table
- `name` (TEXT) - Member name
- `position` (INTEGER) - Position in rotation
- `created_at` (DATETIME) - Timestamp

### API Endpoints

#### Teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team details
- `PATCH /api/teams/:id` - Update team presentation day

#### Team Members
- `POST /api/teams/:teamId/members` - Add team member(s)
- `GET /api/teams/:teamId/members` - Get team members
- `PATCH /api/team-members/:id` - Update member position
- `DELETE /api/team-members/:id` - Delete team member
- `PATCH /api/team-members/bulk-update` - Bulk update positions

### Development

```bash
# Install dependencies
npm install

# Start development servers (API + Frontend)
npm run dev

# Start only API server
npm run dev:server

# Start only frontend
npm run dev:client
```

### Production Deployment

#### Using Docker

```bash
# Build the Docker image
docker build -t team-scheduler .

# Run with docker-compose (recommended)
docker-compose up -d

# Or run manually with volume mount for data persistence
docker run -p 3001:3001 -v $(pwd)/data:/app/data team-scheduler
```

#### Manual Deployment

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Set environment variables
export NODE_ENV=production
export DATABASE_PATH=/path/to/your/database.sqlite

# Start the server
node server/index.js
```

The server will serve both the API and the built React frontend on port 3001.

### Features

- ✅ Create teams with custom presentation days
- ✅ Add/remove team members
- ✅ Automatic weekly rotation calculation
- ✅ Swap presenters functionality
- ✅ Upcoming presentations preview
- ✅ Persistent SQLite storage
- ✅ Responsive design with Tailwind CSS

### Database Location

The SQLite database file is located at: `server/database.sqlite`

### Changes Made

1. **Removed Supabase dependency** - No more external database service required
2. **Added SQLite + Express.js backend** - Local database with REST API
3. **Updated frontend API calls** - Modified React components to use new API endpoints
4. **Concurrent development** - Both servers run simultaneously during development
5. **Proper error handling** - Added comprehensive error handling for all operations
6. **ES modules support** - Updated server code to use ES modules syntax

### Running the Application

#### Development Mode
The application runs on separate ports:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

The frontend automatically proxies API calls to the backend server.

#### Production Mode
The application runs on a single port:
- Full Application: http://localhost:3001

The Express server serves both the API and the built React frontend.
