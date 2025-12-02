# FitBook - Bokningsplattform för Träningspass

En komplett webapplikation för att boka träningspass med stöd för användare och administratörer.

## Funktioner

### Användare
- Registrera sig och logga in
- Se alla tillgängliga träningspass
- Boka pass (om platser finns)
- Se vilka andra användare som har bokat samma pass
- Avboka bokade pass

### Administratör
- Logga in som admin
- Skapa nya träningspass med:
  - Titel
  - Beskrivning
  - Antal bokningsbara platser
  - Datum och tid
  - Längd i minuter
  - Instruktör
- Redigera pass
- Ta bort pass
- Se alla bokade deltagare för varje pass

## Teknisk Stack

- **Backend**: Node.js med Express
- **Frontend**: React
- **Databas**: PostgreSQL
- **Autentisering**: JWT (JSON Web Tokens)
- **Styling**: Responsiv CSS

## Databasstruktur

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
│ created_at      │                             │ instructor      │
│ updated_at      │                             │ created_by (FK) │
└─────────────────┘                             │ created_at      │
                                                │ updated_at      │
                                                └─────────────────┘
```

## Installation & Körning

### Förutsättningar
- Node.js (v18 eller senare)
- PostgreSQL (v14 eller senare)
- npm eller yarn

### 1. Klona/Kopiera projektet

```bash
cd fitness-booking-app
```

### 2. Sätt upp databasen

```bash
# Logga in på PostgreSQL
psql -U postgres

# Skapa databas
CREATE DATABASE fitness_booking;

# Avsluta psql
\q

# Kör schema-skriptet
psql -U postgres -d fitness_booking -f database/schema.sql
```

### 3. Konfigurera Backend

```bash
cd backend

# Installera beroenden
npm install

# Skapa .env-fil från mall
cp .env.example .env

# Redigera .env med dina inställningar
```

**.env-konfiguration:**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitness_booking
DB_USER=postgres
DB_PASSWORD=ditt_lösenord

JWT_SECRET=en-säker-hemlig-nyckel-minst-32-tecken
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

### 4. Konfigurera Frontend

```bash
cd ../frontend

# Installera beroenden
npm install
```

### 5. Starta applikationen

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

Applikationen är nu tillgänglig på:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## API-dokumentation

### Autentisering

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| POST | `/api/auth/register` | Registrera ny användare |
| POST | `/api/auth/login` | Logga in |
| GET | `/api/auth/me` | Hämta inloggad användare |

### Träningspass

| Metod | Endpoint | Beskrivning | Auth |
|-------|----------|-------------|------|
| GET | `/api/classes` | Lista alla pass | - |
| GET | `/api/classes/:id` | Hämta ett pass med deltagare | - |
| POST | `/api/classes` | Skapa nytt pass | Admin |
| PUT | `/api/classes/:id` | Uppdatera pass | Admin |
| DELETE | `/api/classes/:id` | Ta bort pass | Admin |

### Bokningar

| Metod | Endpoint | Beskrivning | Auth |
|-------|----------|-------------|------|
| GET | `/api/bookings` | Mina bokningar | User |
| POST | `/api/bookings/:classId` | Boka pass | User |
| DELETE | `/api/bookings/:classId` | Avboka pass | User |
| GET | `/api/bookings/class/:classId` | Deltagare för pass | User |

## Testanvändare

Efter att ha kört schema.sql finns en admin-användare:
- **E-post**: admin@fitness.se
- **Lösenord**: (måste skapas manuellt, se nedan)

### Skapa admin-användare

```bash
# Generera lösenordshash (kör i Node.js)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))"

# Uppdatera i databasen
psql -U postgres -d fitness_booking -c "UPDATE users SET password_hash='DIN_HASH_HÄR' WHERE email='admin@fitness.se'"
```

Eller registrera en ny användare via appen och uppgradera till admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'din@email.se';
```

## Projektstruktur

```
fitness-booking-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # Databasanslutning
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT-autentisering
│   │   ├── routes/
│   │   │   ├── auth.js           # Autentisering endpoints
│   │   │   ├── classes.js        # Träningspass endpoints
│   │   │   └── bookings.js       # Bokningar endpoints
│   │   └── server.js             # Express server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js         # Navigation header
│   │   │   ├── ClassCard.js      # Kort för träningspass
│   │   │   └── Modal.js          # Modal-komponent
│   │   ├── context/
│   │   │   └── AuthContext.js    # Auth state management
│   │   ├── pages/
│   │   │   ├── LoginPage.js      # Inloggning
│   │   │   ├── RegisterPage.js   # Registrering
│   │   │   ├── ClassesPage.js    # Lista träningspass
│   │   │   ├── MyBookingsPage.js # Mina bokningar
│   │   │   └── AdminPage.js      # Admin-panel
│   │   ├── services/
│   │   │   └── api.js            # Axios API-klient
│   │   ├── styles/
│   │   │   └── index.css         # Global styling
│   │   ├── App.js                # App routing
│   │   └── index.js              # Entry point
│   └── package.json
├── database/
│   └── schema.sql                # Databasschema
└── README.md
```

## Säkerhet

- Lösenord hashas med bcrypt
- JWT för sessionshantering
- Input-validering med express-validator
- CORS-konfiguration
- Prepared statements för SQL (skydd mot SQL injection)
- Admin-behörighetskontroll på skyddade endpoints

## Responsiv Design

Applikationen är fullt responsiv och fungerar på:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobil (< 768px)
