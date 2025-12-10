# Lynx - Fitness Class Booking Platform v0.91

A complete web application for booking fitness classes with support for users and administrators.

## Features

### Users
- **Login with Microsoft Entra ID (Azure AD)** - Enterprise SSO (only login method)
- View all available fitness classes in **list or calendar view**
- Book classes (if spots are available)
- See which other users have booked the same class
- Cancel booked classes
- **Multi-language support** - Swedish and English

### Administrator
- Login as admin
- Create new fitness classes with:
  - Title
  - Description
  - Number of available spots
  - Date and time
  - Duration in minutes
  - Instructor
- Edit classes
- Delete classes
- View all booked participants for each class
- **User management** - Create, edit, and delete users

### Calendar View
- **Month view** - Overview of all classes during the month
- **Week view** - Detailed view of the week's classes
- **Day view** - Focused view of today's scheduled classes

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: React 18
- **Database**: PostgreSQL (local/traditional) or DynamoDB (AWS Serverless)
- **Authentication**: Microsoft Entra ID (Azure AD) + JWT (JSON Web Tokens)
- **Azure Integration**: MSAL.js (Microsoft Authentication Library)
- **Styling**: Responsive CSS with CSS Custom Properties
- **Internationalization**: React Context for multi-language support

### Deployment Options

| Option | Database | Cost | Usage |
|--------|----------|------|-------|
| Local development | PostgreSQL | Free | Development |
| Traditional hosting | PostgreSQL | Varies | Production |
| AWS Serverless (SAM) | DynamoDB | ~$0.50-2/month | Production (cost-optimized) |

## Database Structure

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │    bookings     │     │    classes      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────<│ user_id (FK)    │     │ id (PK)         │
│ email           │     │ class_id (FK)   │>────│ title           │
│ password_hash   │     │ booked_at       │     │ description     │
│ first_name      │     │ status          │     │ max_capacity    │
│ last_name       │     │ id (PK)         │     │ scheduled_at    │
│ role            │     └─────────────────┘     │ duration_minutes│
│ entra_id        │                             │ instructor      │
│ auth_provider   │                             │ created_by (FK) │
│ created_at      │                             │ created_at      │
│ updated_at      │                             │ updated_at      │
└─────────────────┘                             └─────────────────┘
```

**New columns for Entra ID support:**
- `entra_id` - Unique ID from Microsoft Entra ID
- `auth_provider` - Login method ('local' or 'entra')

## Installation & Running

### Prerequisites
- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm or yarn
- Microsoft Entra ID (Azure AD) app registration (required for login)

### 1. Clone/Copy the project

```bash
cd fitness-booking-app
```

### 2. Set up the database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fitness_booking;

# Exit psql
\q

# Run the schema script
psql -U postgres -d fitness_booking -f database/schema.sql

# Run migration for Entra ID support
psql -U postgres -d fitness_booking -f backend/migrations/add_entra_id_columns.sql
```

### 3. Configure Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env with your settings
```

**.env configuration:**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitness_booking
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=a-secure-secret-key-at-least-32-characters
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000

# Microsoft Entra ID (Azure AD) Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
```

### 4. Configure Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env  # or create manually
```

**Frontend .env configuration:**
```env
REACT_APP_API_URL=http://localhost:5000/api

# Microsoft Entra ID (Azure AD) Configuration
REACT_APP_AZURE_CLIENT_ID=your-client-id
REACT_APP_AZURE_TENANT_ID=your-tenant-id
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
```

### 4.1 Configure Azure App Registration (for Microsoft login)

1. Go to [Azure Portal](https://portal.azure.com) > Microsoft Entra ID > App registrations
2. Create a new app or use an existing one
3. Under **Authentication**:
   - Add the **Single-page application (SPA)** platform
   - Set Redirect URI to `http://localhost:3000`
4. Copy **Application (client) ID** and **Directory (tenant) ID**
5. Update the `.env` files in both frontend and backend

### 5. Start the application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application is now available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## AWS Serverless Deployment

For cost-optimized production deployment, see the [AWS Serverless README](aws-serverless/README.md).

### Quick Start (AWS)

```bash
cd aws-serverless

# Install dependencies
npm install

# Build and deploy
sam build
sam deploy --guided

# Seed initial data
node scripts/seed-data.js $TABLE_NAME

# Deploy frontend
export REACT_APP_AZURE_CLIENT_ID=your-client-id
export REACT_APP_AZURE_TENANT_ID=your-tenant-id
./scripts/deploy-frontend.sh
```

### AWS Architecture

- **Lambda**: Serverless compute (Node.js 20.x)
- **API Gateway**: HTTP API (cost-optimized)
- **DynamoDB**: On-demand pricing
- **S3 + CloudFront**: Frontend hosting with HTTPS

### Estimated Costs (50 users)

| Service | Cost |
|---------|------|
| Lambda | $0.00 (free tier) |
| API Gateway | $0.00 (free tier) |
| DynamoDB | $0.00-$1.00 |
| S3 | ~$0.01 |
| CloudFront | $0.50-$1.00 |
| **Total** | **$0.50-$2.00/month** |

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/entra-login` | Login with Microsoft Entra ID |
| GET | `/api/auth/me` | Get logged in user |

### Fitness Classes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/classes` | List all classes | - |
| GET | `/api/classes/:id` | Get a class with participants | - |
| POST | `/api/classes` | Create new class | Admin |
| PUT | `/api/classes/:id` | Update class | Admin |
| DELETE | `/api/classes/:id` | Delete class | Admin |

### Bookings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bookings` | My bookings | User |
| POST | `/api/bookings/:classId` | Book class | User |
| DELETE | `/api/bookings/:classId` | Cancel booking | User |
| GET | `/api/bookings/class/:classId` | Participants for class | User |

### Users (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user details | Admin |
| POST | `/api/users` | Create user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

## User Management

Users are automatically created on first login via Microsoft Entra ID.

### Upgrade user to admin

After a user logs in for the first time, you can upgrade them to admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@company.com';
```

Or use the superuser role for full permissions:
```sql
UPDATE users SET role = 'superuser' WHERE email = 'user@company.com';
```

## Project Structure

```
fitness-booking-app/
├── backend/                          # Express.js backend (PostgreSQL)
│   ├── migrations/
│   │   └── add_entra_id_columns.sql  # Migration for Entra ID
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # Database connection
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.js               # Authentication (incl. Entra ID)
│   │   │   ├── classes.js            # Fitness class endpoints
│   │   │   ├── bookings.js           # Booking endpoints
│   │   │   └── users.js              # User management (admin)
│   │   └── server.js                 # Express server
│   ├── ssl/                          # SSL certificates (optional)
│   ├── .env.example
│   └── package.json
├── frontend/                         # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── Lynx_Logo_Color.svg       # Lynx logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js             # Navigation header
│   │   │   ├── ClassCard.js          # Fitness class card
│   │   │   ├── CalendarView.js       # Calendar view component
│   │   │   └── Modal.js              # Modal component
│   │   ├── config/
│   │   │   └── msalConfig.js         # Microsoft MSAL configuration
│   │   ├── context/
│   │   │   ├── AuthContext.js        # Auth state management
│   │   │   └── LanguageContext.js    # Multi-language support
│   │   ├── pages/
│   │   │   ├── LoginPage.js          # Login (Microsoft Entra ID)
│   │   │   ├── ClassesPage.js        # List fitness classes + calendar
│   │   │   ├── MyBookingsPage.js     # My bookings
│   │   │   └── AdminPage.js          # Admin panel
│   │   ├── services/
│   │   │   └── api.js                # Axios API client
│   │   ├── styles/
│   │   │   └── index.css             # Global styling (Lynx theme)
│   │   ├── App.js                    # App routing + MSAL Provider
│   │   └── index.js                  # Entry point
│   ├── .env
│   └── package.json
├── aws-serverless/                   # AWS SAM Serverless deployment
│   ├── src/
│   │   ├── handlers/                 # Lambda functions
│   │   │   ├── auth.js               # Authentication
│   │   │   ├── bookings.js           # Bookings
│   │   │   ├── classes.js            # Fitness classes
│   │   │   ├── users.js              # Users
│   │   │   └── health.js             # Health check
│   │   ├── middleware/               # Shared middleware
│   │   └── lib/                      # Utility functions
│   ├── scripts/
│   │   ├── deploy-frontend.sh        # Frontend deployment
│   │   └── seed-data.js              # Seed data for DynamoDB
│   ├── template.yaml                 # SAM CloudFormation template
│   └── README.md                     # AWS deployment guide
├── database/
│   └── schema.sql                    # PostgreSQL schema
└── README.md
```

## SSL/HTTPS Support

Backend has built-in support for HTTPS with SSL certificates.

### Enable SSL

1. Generate a self-signed certificate (for development):
```bash
cd backend/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt -subj "/CN=localhost"
```

2. Enable SSL in `.env`:
```env
SSL_ENABLED=true
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.crt
```

3. Restart the server - it now runs on `https://localhost:5000`

**Note:** For production, use proper certificates from e.g. Let's Encrypt.

## Security

- **Microsoft Entra ID** for enterprise SSO (only login method)
- **SSL/HTTPS support** for encrypted traffic
- JWT for session management
- MSAL.js with secure token handling (sessionStorage)
- Input validation with express-validator
- CORS configuration
- Prepared statements for SQL (protection against SQL injection)
- Admin permission control on protected endpoints
- Race condition prevention in bookings (database transactions)

## Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## License

MIT
