# Lynx - Bokningsplattform för Träningspass

En komplett webapplikation för att boka träningspass med stöd för användare och administratörer.

## Funktioner

### Användare
- **Logga in med Microsoft Entra ID (Azure AD)** - Enterprise SSO (enda inloggningsmetoden)
- Se alla tillgängliga träningspass i **list- eller kalendervy**
- Boka pass (om platser finns)
- Se vilka andra användare som har bokat samma pass
- Avboka bokade pass
- **Flerspråksstöd** - Svenska och engelska

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
- **Hantera användare** - Skapa, redigera och ta bort användare

### Kalendervy
- **Månadsvy** - Överblick över alla pass under månaden
- **Veckovy** - Detaljerad vy av veckans pass
- **Dagsvy** - Fokuserad vy på dagens schemalagda pass

## Teknisk Stack

- **Backend**: Node.js med Express
- **Frontend**: React
- **Databas**: PostgreSQL
- **Autentisering**: Microsoft Entra ID (Azure AD) + JWT (JSON Web Tokens)
- **Azure Integration**: MSAL.js (Microsoft Authentication Library)
- **Styling**: Responsiv CSS med CSS Custom Properties
- **Internationalisering**: React Context för flerspråksstöd

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
│ entra_id        │                             │ instructor      │
│ auth_provider   │                             │ created_by (FK) │
│ created_at      │                             │ created_at      │
│ updated_at      │                             │ updated_at      │
└─────────────────┘                             └─────────────────┘
```

**Nya kolumner för Entra ID-stöd:**
- `entra_id` - Unikt ID från Microsoft Entra ID
- `auth_provider` - Inloggningsmetod ('local' eller 'entra')

## Installation & Körning

### Förutsättningar
- Node.js (v18 eller senare)
- PostgreSQL (v14 eller senare)
- npm eller yarn
- Microsoft Entra ID (Azure AD) app-registrering (krävs för inloggning)

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

# Kör migrering för Entra ID-stöd
psql -U postgres -d fitness_booking -f backend/migrations/add_entra_id_columns.sql
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

# Microsoft Entra ID (Azure AD) Configuration
AZURE_TENANT_ID=ditt-tenant-id
AZURE_CLIENT_ID=ditt-client-id
```

### 4. Konfigurera Frontend

```bash
cd ../frontend

# Installera beroenden
npm install

# Skapa .env-fil
cp .env.example .env  # eller skapa manuellt
```

**Frontend .env-konfiguration:**
```env
REACT_APP_API_URL=http://localhost:5000/api

# Microsoft Entra ID (Azure AD) Configuration
REACT_APP_AZURE_CLIENT_ID=ditt-client-id
REACT_APP_AZURE_TENANT_ID=ditt-tenant-id
REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
```

### 4.1 Konfigurera Azure App Registration (för Microsoft-inloggning)

1. Gå till [Azure Portal](https://portal.azure.com) > Microsoft Entra ID > App registrations
2. Skapa en ny app eller använd en befintlig
3. Under **Authentication**:
   - Lägg till plattformen **Single-page application (SPA)**
   - Sätt Redirect URI till `http://localhost:3000`
4. Kopiera **Application (client) ID** och **Directory (tenant) ID**
5. Uppdatera `.env`-filerna i både frontend och backend

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
| POST | `/api/auth/entra-login` | Logga in med Microsoft Entra ID |
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

## Användarhantering

Användare skapas automatiskt vid första inloggningen via Microsoft Entra ID.

### Uppgradera användare till admin

Efter att en användare loggat in första gången kan du uppgradera dem till admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'användare@företag.se';
```

Eller använd superuser-rollen för fullständiga rättigheter:
```sql
UPDATE users SET role = 'superuser' WHERE email = 'användare@företag.se';
```

## Projektstruktur

```
fitness-booking-app/
├── backend/
│   ├── migrations/
│   │   └── add_entra_id_columns.sql  # Migrering för Entra ID
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # Databasanslutning
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT-autentisering
│   │   ├── routes/
│   │   │   ├── auth.js               # Autentisering (inkl. Entra ID)
│   │   │   ├── classes.js            # Träningspass endpoints
│   │   │   ├── bookings.js           # Bokningar endpoints
│   │   │   └── users.js              # Användarhantering (admin)
│   │   └── server.js                 # Express server
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── Lynx_Logo_Color.svg       # Lynx logotyp
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js             # Navigation header
│   │   │   ├── ClassCard.js          # Kort för träningspass
│   │   │   ├── CalendarView.js       # Kalendervy-komponent
│   │   │   └── Modal.js              # Modal-komponent
│   │   ├── config/
│   │   │   └── msalConfig.js         # Microsoft MSAL-konfiguration
│   │   ├── context/
│   │   │   ├── AuthContext.js        # Auth state management
│   │   │   └── LanguageContext.js    # Flerspråksstöd
│   │   ├── pages/
│   │   │   ├── LoginPage.js          # Inloggning (Microsoft Entra ID)
│   │   │   ├── ClassesPage.js        # Lista träningspass + kalender
│   │   │   ├── MyBookingsPage.js     # Mina bokningar
│   │   │   └── AdminPage.js          # Admin-panel
│   │   ├── services/
│   │   │   └── api.js                # Axios API-klient
│   │   ├── styles/
│   │   │   └── index.css             # Global styling (Lynx tema)
│   │   ├── App.js                    # App routing + MSAL Provider
│   │   └── index.js                  # Entry point
│   ├── .env
│   └── package.json
├── database/
│   └── schema.sql                    # Databasschema
└── README.md
```

## SSL/HTTPS-stöd

Backend har inbyggt stöd för HTTPS med SSL-certifikat.

### Aktivera SSL

1. Generera ett självsignerat certifikat (för utveckling):
```bash
cd backend/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt -subj "/CN=localhost"
```

2. Aktivera SSL i `.env`:
```env
SSL_ENABLED=true
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.crt
```

3. Starta om servern - den körs nu på `https://localhost:5000`

**Notera:** För produktion, använd riktiga certifikat från t.ex. Let's Encrypt.

## Säkerhet

- **Microsoft Entra ID** för enterprise SSO (enda inloggningsmetoden)
- **SSL/HTTPS-stöd** för krypterad trafik
- JWT för sessionshantering
- MSAL.js med säker token-hantering (sessionStorage)
- Input-validering med express-validator
- CORS-konfiguration
- Prepared statements för SQL (skydd mot SQL injection)
- Admin-behörighetskontroll på skyddade endpoints

## Responsiv Design

Applikationen är fullt responsiv och fungerar på:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobil (< 768px)
